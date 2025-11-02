import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def load_alumni_data():
    try:
        # Read CSV - the headers are comma-separated in first column
        with open('/app/backend/alumni_data.csv', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Parse header from first line
        header_line = lines[0].strip()
        headers = [h.strip() for h in header_line.split(',')]
        
        # Parse data
        data_rows = []
        for line in lines[1:]:
            if line.strip():
                values = [v.strip() for v in line.split(',')]
                # Pad or trim to match header length
                if len(values) < len(headers):
                    values.extend([''] * (len(headers) - len(values)))
                elif len(values) > len(headers):
                    values = values[:len(headers)]
                data_rows.append(values)
        
        # Create DataFrame
        df = pd.DataFrame(data_rows, columns=headers)
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Convert to dict and clean data
        alumni_records = []
        for idx, row in df.iterrows():
            record = {}
            for col in df.columns:
                val = row[col]
                # Handle empty/null values
                if pd.isna(val) or val == '' or val == 'nan':
                    record[col] = None
                # Try to convert to appropriate type
                elif col in ['alumni_id', 'age', 'enrollment_year', 'grad_year', 'years_since_grad', 
                            'events_attended', 'mentoring_session_count', 'certifications_count']:
                    try:
                        record[col] = int(float(val)) if val else None
                    except:
                        record[col] = val
                elif col in ['gpa', 'ssc_percent', 'hsc_percent', 'degree_percent', 'employability_test_score',
                            'mba_percent', 'salary', 'donation_last_year', 'donation_next_year',
                            'events_score', 'mentorship_score', 'engagement_score', 'employment_salary_min',
                            'employment_salary_max', 'mentoring_feedback_score', 'match_score', 'profile_completeness']:
                    try:
                        record[col] = float(val) if val else None
                    except:
                        record[col] = val
                elif col in ['mentorship_interest', 'employment_is_current', 'consent_status']:
                    record[col] = str(val).upper() in ['YES', 'TRUE', '1', 'Y']
                else:
                    record[col] = val
            
            alumni_records.append(record)
        
        # Clear existing data
        await db.alumni.delete_many({})
        
        # Insert into MongoDB
        if alumni_records:
            result = await db.alumni.insert_many(alumni_records)
            print(f"✓ Loaded {len(result.inserted_ids)} alumni records into MongoDB")
            print(f"Sample record: {alumni_records[0]}")
        else:
            print("No records to insert")
        
        # Create indexes
        await db.alumni.create_index([('alumni_id', 1)], unique=True)
        await db.alumni.create_index([('email', 1)])
        await db.alumni.create_index([('major', 1)])
        await db.alumni.create_index([('industry', 1)])
        
        return len(alumni_records)
        
    except Exception as e:
        print(f"Error loading data: {e}")
        import traceback
        traceback.print_exc()
        return 0

if __name__ == "__main__":
    count = asyncio.run(load_alumni_data())
    print(f"Data load complete: {count} records")
    sys.exit(0)
