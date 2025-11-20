import pandas as pd
import os

# Read the Excel file
df = pd.read_excel('alumni_data.xlsx')

print(f"Total records: {len(df)}")
print(f"\nColumn names:")
print(df.columns.tolist())
print(f"\nFirst 3 rows:")
print(df.head(3))
print(f"\nData types:")
print(df.dtypes)
print(f"\nNull counts:")
print(df.isnull().sum())
