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
        # Read CSV properly using pandas
        df = pd.read_csv('/app/backend/alumni_data.csv')
        
        # The first column contains all the header namesS
        # We need to extract the actual headers from the first column name
        first_col_name = df.columns[0]
        headers = [h.strip() for h in first_col_name.split()][:71]  # Take actual header names
        
        # The actual column names should be extracted from first column
        # Let's manually set the correct headers based on the data structure
        correct_headers = [
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
        
        # Assign proper headers - the data is in remaining columns
        data_cols = [col for col in df.columns if col != df.columns[0] or 'Unnamed' in col]
        
        # Extract just the values from the non-header columns
        values_only = []
        for idx in range(len(df)):
            row_values = df.iloc[idx, 1:len(correct_headers)+1].tolist()
            if len(row_values) < len(correct_headers):
                row_values.extend([None] * (len(correct_headers) - len(row_values)))
            values_only.append(row_values)
        
        # Create DataFrame with proper headers
        df_clean = pd.DataFrame(values_only, columns=correct_headers)
        
        # Clean column names
        df_clean.columns = df_clean.columns.str.strip()
        
        # Convert to dict and clean data
        alumni_records = []
        for idx, row in df_clean.iterrows():
            record = {}
            for col in df_clean.columns:
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
