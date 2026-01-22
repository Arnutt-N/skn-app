import pandas as pd
import sys

# Set encoding to utf-8-sig to handle BOM if present, fallback to utf-8
file_path = r"D:\genAI\skn-app\examples\moj-skn-bot-examples.csv"

try:
    # Try reading with pandas
    df = pd.read_csv(file_path, encoding='utf-8-sig')
    
    print(f"✅ Successfully read CSV file.")
    print(f"Columns: {df.columns.tolist()}")
    print("\nSample Data (First 5 rows):")
    print(df.head().to_string())
    
    # Check for specific message types mentioned by user
    if 'type' in df.columns or 'message_type' in df.columns:
        type_col = 'type' if 'type' in df.columns else 'message_type'
        print(f"\nMessage Types found: {df[type_col].unique().tolist()}")

except Exception as e:
    print(f"❌ Error reading CSV with pandas: {e}")
    # Fallback: Read raw lines to see structure if pandas fails
    try:
        print("\nAttempting raw read...")
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            for i, line in enumerate(f):
                if i < 5:
                    print(line.strip())
                else:
                    break
    except Exception as raw_e:
        print(f"❌ Error reading raw file: {raw_e}")
