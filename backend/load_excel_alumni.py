import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Parse column names from the first cell
column_string = "alumni_id   full_name   gender   gender.1   age   state_us   major   gpa   enrollment_year   grad_year   years_since_grad   ssc_percent   hsc_percent   degree_percent   degree_type   employability_test_score   mba_specialization   mba_percent   workex   workex_years   placement_status   salary   communication   confidence   commitment   general_knowledge   presentation_skills   logical_thinking   punctuality   attitude   leader   data_structures   algorithms   oop   databases   debugging   events_attended   mentorship_interest   donation_last_year   donation_next_year   events_score   mentorship_score   engagement_score   email   location_city   location_country   degree_level   field_of_study   current_company   current_title   industry   employment_type   employment_start_date   employment_end_date   employment_is_current   employment_salary_min   employment_salary_max   mentor_status   mentoring_session_count   mentoring_feedback_score   match_score   consent_type   consent_status   granted_at   channel   profile_completeness   certifications_count   created_at   updated_at   school_name"

# Split the column string into individual columns
columns = [c.strip() for c in column_string.split('   ') if c.strip()]

print(f"Extracted {len(columns)} columns")
print(f"Columns: {columns[:10]}...")

# Read the Excel file
df = pd.read_excel('alumni_data.xlsx')

# Use the first 70 columns and rename them
if len(df.columns) >= len(columns):
    df = df.iloc[:, :len(columns)]
    df.columns = columns
else:
    print(f"Warning: Excel has {len(df.columns)} columns but we have {len(columns)} column names")
    df.columns = columns[:len(df.columns)]

print(f"\nTotal records: {len(df)}")
print(f"Columns after renaming: {df.columns.tolist()[:10]}")
print(f"\nFirst record:")
print(df.iloc[0])

async def load_data():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Drop existing alumni collection
    await db.alumni.drop()
    print("\n✅ Dropped existing alumni collection")
    
    # Convert DataFrame to list of dicts
    records = []
    for idx, row in df.iterrows():
        record = {
            'alumni_id': int(row['alumni_id']),
            'full_name': str(row['full_name']),
            'email': f"{row['full_name'].lower().replace(' ', '_')}@alumni.example.org",
            'gender': str(row['gender']) if pd.notna(row.get('gender')) else str(row.get('gender.1', 'Unknown')),
            'age': int(row['age']) if pd.notna(row['age']) else None,
            'major': str(row['major']) if pd.notna(row['major']) else None,
            'gpa': float(row['gpa']) if pd.notna(row['gpa']) else None,
            'grad_year': int(row['grad_year']) if pd.notna(row['grad_year']) else None,
            'years_since_grad': int(row['years_since_grad']) if pd.notna(row['years_since_grad']) else None,
            'current_company': str(row['current_company']) if pd.notna(row['current_company']) else None,
            'current_title': str(row['current_title']) if pd.notna(row['current_title']) else None,
            'industry': str(row['industry']) if pd.notna(row['industry']) else None,
            'salary': float(row['salary']) if pd.notna(row['salary']) else None,
            'location_city': str(row['location_city']) if pd.notna(row['location_city']) else None,
            'location_country': str(row['location_country']) if pd.notna(row['location_country']) else 'USA',
            'events_attended': int(row['events_attended']) if pd.notna(row['events_attended']) else 0,
            'mentorship_interest': bool(row['mentorship_interest']) if pd.notna(row['mentorship_interest']) else False,
            'donation_last_year': float(row['donation_last_year']) if pd.notna(row['donation_last_year']) else 0.0,
            'engagement_score': float(row['engagement_score']) if pd.notna(row['engagement_score']) else 0.0,
            'match_score': float(row['match_score']) if pd.notna(row['match_score']) else 0.0,
            # Technical skills
            'data_structures': float(row['data_structures']) if pd.notna(row['data_structures']) else 0.0,
            'algorithms': float(row['algorithms']) if pd.notna(row['algorithms']) else 0.0,
            'oop': float(row['oop']) if pd.notna(row['oop']) else 0.0,
            'databases': float(row['databases']) if pd.notna(row['databases']) else 0.0,
            'debugging': float(row['debugging']) if pd.notna(row['debugging']) else 0.0,
            # Soft skills
            'communication': float(row['communication']) if pd.notna(row['communication']) else 0.0,
            'confidence': float(row['confidence']) if pd.notna(row['confidence']) else 0.0,
            'commitment': float(row['commitment']) if pd.notna(row['commitment']) else 0.0,
            'presentation_skills': float(row['presentation_skills']) if pd.notna(row['presentation_skills']) else 0.0,
            'logical_thinking': float(row['logical_thinking']) if pd.notna(row['logical_thinking']) else 0.0,
            # Employment details
            'employment_type': str(row['employment_type']) if pd.notna(row['employment_type']) else None,
            'placement_status': str(row['placement_status']) if pd.notna(row['placement_status']) else None,
            'field_of_study': str(row['field_of_study']) if pd.notna(row['field_of_study']) else str(row['major']),
            'school_name': str(row['school_name']) if pd.notna(row['school_name']) else 'Global Horizon University',
        }
        records.append(record)
        
        if (idx + 1) % 500 == 0:
            print(f"Processed {idx + 1} records...")
    
    # Insert all records
    result = await db.alumni.insert_many(records)
    print(f"\n✅ Successfully loaded {len(result.inserted_ids)} alumni records!")
    
    # Create indexes
    await db.alumni.create_index("alumni_id", unique=True)
    await db.alumni.create_index("email")
    await db.alumni.create_index("major")
    await db.alumni.create_index("industry")
    await db.alumni.create_index("grad_year")
    print("✅ Created indexes")
    
    # Verify
    count = await db.alumni.count_documents({})
    print(f"✅ Verified: {count} alumni in database")
    
    client.close()

# Run the async function
asyncio.run(load_data())
print("\n🎉 Data loading complete!")
