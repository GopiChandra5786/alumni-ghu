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
        # Define correct headers manually
        headers = [
            'alumni_id', 'full_name', 'gender', 'gender_code', 'age', 'state_us', 
            'major', 'gpa', 'enrollment_year', 'grad_year', 'years_since_grad',
            'ssc_percent', 'hsc_percent', 'degree_percent', 'degree_type',
            'employability_test_score', 'mba_specialization', 'mba_percent',
            'workex', 'workex_years', 'placement_status', 'salary',
            'communication', 'confidence', 'commitment', 'general_knowledge',
            'presentation_skills', 'logical_thinking', 'punctuality', 'attitude',
            'leader', 'data_structures', 'algorithms', 'oop', 'databases',
            'debugging', 'events_attended', 'mentorship_interest',
            'donation_last_year', 'donation_next_year', 'events_score',
            'mentorship_score', 'engagement_score', 'email', 'location_city',
            'location_country', 'degree_level', 'field_of_study',
            'current_company', 'current_title', 'industry', 'employment_type',
            'employment_start_date', 'employment_end_date', 'employment_is_current',
            'employment_salary_min', 'employment_salary_max', 'mentor_status',
            'mentoring_session_count', 'mentoring_feedback_score', 'match_score',
            'consent_type', 'consent_status', 'granted_at', 'channel',
            'profile_completeness', 'certifications_count', 'created_at',
            'updated_at', 'school_name'
        ]
        
        # Read CSV skipping the malformed header
        df = pd.read_csv('/app/backend/alumni_data.csv', skiprows=1, header=None, names=headers)
        
        print(f"Loaded {len(df)} rows")
        print(f"Columns: {list(df.columns)}")
        print(f"Sample:\n{df.head(1)}")
        
        # Convert to dict and clean data
        alumni_records = []
        for idx, row in df.iterrows():
            record = {}
            for col in df.columns:
                val = row[col]
                # Handle empty/null values
                if pd.isna(val) or (isinstance(val, str) and val.strip() == ''):
                    record[col] = None
                # Try to convert to appropriate type
                elif col in ['alumni_id', 'age', 'enrollment_year', 'grad_year', 'years_since_grad', 
                            'events_attended', 'mentoring_session_count', 'certifications_count']:
                    try:
                        record[col] = int(float(val)) if val is not None else None
                    except:
                        record[col] = val
                elif col in ['gpa', 'ssc_percent', 'hsc_percent', 'degree_percent', 'employability_test_score',
                            'mba_percent', 'salary', 'donation_last_year', 'donation_next_year',
                            'events_score', 'mentorship_score', 'engagement_score', 'employment_salary_min',
                            'employment_salary_max', 'mentoring_feedback_score', 'match_score', 'profile_completeness']:
                    try:
                        record[col] = float(val) if val is not None else None
                    except:
                        record[col] = val
                elif col in ['mentorship_interest', 'employment_is_current', 'consent_status']:
                    record[col] = str(val).upper() in ['YES', 'TRUE', '1', 'Y', 'T']
                elif col in ['communication', 'confidence', 'commitment', 'general_knowledge',
                             'presentation_skills', 'logical_thinking', 'punctuality', 'attitude', 'leader',
                             'data_structures', 'algorithms', 'oop', 'databases', 'debugging']:
                    try:
                        record[col] = int(float(val)) if val is not None else None
                    except:
                        record[col] = val
                else:
                    record[col] = val
            
            alumni_records.append(record)
        
        # Clear existing data
        await db.alumni.delete_many({})
        
        # Insert into MongoDB
        if alumni_records:
            result = await db.alumni.insert_many(alumni_records)
            print(f"✓ Loaded {len(result.inserted_ids)} alumni records into MongoDB")
            print(f"Sample record keys: {list(alumni_records[0].keys())}")
            print(f"Sample alumni_id: {alumni_records[0].get('alumni_id')}")
            print(f"Sample name: {alumni_records[0].get('full_name')}")
            print(f"Sample email: {alumni_records[0].get('email')}")
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
