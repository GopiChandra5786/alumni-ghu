import pandas as pd
import os

# Read the Excel file with proper header
df = pd.read_excel('alumni_data.xlsx', header=0)

# If the first column has all column names concatenated, try to read without header and set it manually
print("Checking first row...")
print(df.columns[0])

# If columns are concatenated in first column name, we need to split them
if 'alumni_id' in str(df.columns[0]) and 'full_name' in str(df.columns[0]):
    print("\nColumns are concatenated in first cell. Reading without header...")
    # Read the first row to get actual column names
    first_row = pd.read_excel('alumni_data.xlsx', nrows=1, header=None)
    print("First row values:")
    print(first_row.iloc[0].tolist())
    
# Try reading with skiprows
print("\n\nReading with correct approach...")
df = pd.read_excel('alumni_data.xlsx')

print(f"Total records: {len(df)}")
print(f"\nTotal columns: {len(df.columns)}")
print(f"\nFirst 5 column names: {df.columns.tolist()[:5]}")
print(f"\nLast 5 column names: {df.columns.tolist()[-5:]}")
print(f"\nFirst record (row 0):")
for col in df.columns[:10]:
    print(f"  {col}: {df[col].iloc[0]}")
