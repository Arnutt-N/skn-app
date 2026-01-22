import pandas as pd
import os

file_path = r"D:\genAI\skn-app\examples\moj-skn-bot-examples.xlsx"

try:
    # Read sheet names
    xl = pd.ExcelFile(file_path)
    print(f"Sheets found: {xl.sheet_names}")

    # Read first sheet sample
    df = xl.parse(xl.sheet_names[0])
    print(f"\nSample data from '{xl.sheet_names[0]}':")
    print(df.head().to_string())
    print("\nColumns:", df.columns.tolist())

except Exception as e:
    print(f"Error reading Excel: {e}")
