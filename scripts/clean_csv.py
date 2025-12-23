#!/usr/bin/env python3
"""
CSV Cleaner for companies_registry.csv
Fixes malformed CSV with unescaped commas inside fields
"""

import csv
import sys

def clean_csv(input_file, output_file):
    """Clean CSV and ensure exactly 29 columns per row"""
    
    rows_processed = 0
    rows_written = 0
    rows_skipped = 0
    
    print(f"Reading from: {input_file}")
    print(f"Writing to: {output_file}")
    print()
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        
        reader = csv.reader(infile, delimiter=',', quotechar='"')
        writer = csv.writer(outfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        
        # Read header
        header = next(reader)
        expected_cols = len(header)
        print(f"Expected columns: {expected_cols}")
        print(f"Header: {', '.join(header[:5])}...")
        print()
        
        # Write header (29 columns)
        writer.writerow(header[:29])
        
        # Process rows
        for row_num, row in enumerate(reader, start=2):
            rows_processed += 1
            
            if rows_processed % 50000 == 0:
                print(f"Processed {rows_processed:,} rows, written {rows_written:,}, skipped {rows_skipped:,}")
            
            # Check column count
            col_count = len(row)
            
            if col_count == 29:
                # Perfect row
                writer.writerow(row)
                rows_written += 1
            elif col_count > 29:
                # Too many columns - trim extras
                writer.writerow(row[:29])
                rows_written += 1
            else:
                # Too few columns - pad with empty strings
                padded_row = row + [''] * (29 - col_count)
                writer.writerow(padded_row)
                rows_written += 1
    
    print()
    print("=" * 60)
    print(f"✅ Cleaning complete!")
    print(f"Total rows processed: {rows_processed:,}")
    print(f"Rows written: {rows_written:,}")
    print(f"Rows skipped: {rows_skipped:,}")
    print("=" * 60)

if __name__ == "__main__":
    input_csv = "E:/SBF/data/government/companies_registry.csv"
    output_csv = "E:/SBF/data/government/companies_registry_fixed.csv"
    
    try:
        clean_csv(input_csv, output_csv)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
