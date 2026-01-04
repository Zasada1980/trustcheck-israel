/**
 * Download עוסק מורשה Data from data.gov.il
 * 
 * Source: https://data.gov.il
 * Dataset: מאגר עוסקים מורשים (Registered VAT Dealers)
 * Cost: ₪0 (Open Data)
 * Format: CSV
 * 
 * Strategy:
 * 1. Search data.gov.il for VAT-related datasets
 * 2. Download CSV files
 * 3. Filter for HP NOT starting with 5
 * 4. Import to osek_morsheh table
 */

import 'dotenv/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { upsertOsekMorsheh } from '../lib/db/osek_morsheh';
import { pool } from '../lib/db/postgres';

const DATA_GOV_API = 'https://data.gov.il/api/3/action';
const DOWNLOAD_DIR = path.join(__dirname, '../data/osek_morsheh');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

interface DataGovDataset {
  id: string;
  name: string;
  title: string;
  resources: Array<{
    id: string;
    name: string;
    url: string;
    format: string;
    size: number;
    last_modified: string;
  }>;
}

/**
 * Search data.gov.il for relevant datasets
 */
async function searchDatasets(query: string): Promise<DataGovDataset[]> {
  console.log(`\n🔍 Searching data.gov.il for: "${query}"`);
  
  try {
    const response = await axios.get(`${DATA_GOV_API}/package_search`, {
      params: {
        q: query,
        rows: 100,
      },
    });
    
    const datasets = response.data.result.results as DataGovDataset[];
    console.log(`  Found: ${datasets.length} datasets`);
    
    return datasets;
  } catch (error) {
    console.error('  ✗ Search failed:', error);
    return [];
  }
}

/**
 * Download CSV file
 */
async function downloadCSV(url: string, filename: string): Promise<string> {
  const filepath = path.join(DOWNLOAD_DIR, filename);
  
  console.log(`\n📥 Downloading: ${filename}`);
  console.log(`  URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 second timeout
    });
    
    fs.writeFileSync(filepath, response.data);
    
    const sizeKB = (response.data.length / 1024).toFixed(2);
    console.log(`  ✓ Downloaded: ${sizeKB} KB`);
    
    return filepath;
  } catch (error) {
    console.error('  ✗ Download failed:', error);
    throw error;
  }
}

/**
 * Parse CSV and filter for עוסק מורשה
 */
function parseCSVForOsek(filepath: string): Array<{
  hp_number: number;
  business_name: string;
  dealer_type: string;
  city?: string;
  [key: string]: any;
}> {
  console.log(`\n📊 Parsing CSV: ${path.basename(filepath)}`);
  
  const content = fs.readFileSync(filepath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    encoding: 'utf8',
  });
  
  console.log(`  Total records: ${records.length}`);
  
  // Filter for HP NOT starting with 5
  const osekRecords = records
    .filter((r: any) => {
      const hp = r['מספר_עוסק'] || r['hp_number'] || r['מספר_תעודת_זהות'] || r['מספר_ח_פ'];
      if (!hp) return false;
      
      const hpStr = hp.toString().trim();
      if (hpStr.length !== 9) return false;
      
      return hpStr.charAt(0) !== '5'; // NOT starting with 5
    })
    .map((r: any) => {
      const hp = r['מספר_עוסק'] || r['hp_number'] || r['מספר_תעודת_זהות'] || r['מספר_ח_פ'];
      const name = r['שם_עסק'] || r['business_name'] || r['שם'] || 'Unknown';
      const type = r['סוג_עוסק'] || r['dealer_type'] || 'עוסק מורשה';
      const city = r['עיר'] || r['city'] || r['ישוב'];
      
      return {
        hp_number: parseInt(hp.toString().trim()),
        business_name: name.toString().trim(),
        dealer_type: type.toString().trim(),
        city: city?.toString().trim(),
        raw: r, // Keep raw data for debugging
      };
    });
  
  console.log(`  Filtered: ${osekRecords.length} עוסק מורשה records (HP NOT starting with 5)`);
  
  return osekRecords;
}

/**
 * Import records to database
 */
async function importToDatabase(records: any[]): Promise<{
  imported: number;
  skipped: number;
  errors: number;
}> {
  console.log(`\n💾 Importing ${records.length} records to database...`);
  
  const stats = { imported: 0, skipped: 0, errors: 0 };
  
  for (const record of records) {
    try {
      // Check if already exists
      const existing = await pool.query(
        'SELECT 1 FROM osek_morsheh WHERE hp_number = $1',
        [record.hp_number]
      );
      
      if (existing.rowCount > 0) {
        stats.skipped++;
        continue;
      }
      
      // Insert new record
      await upsertOsekMorsheh({
        hp_number: record.hp_number,
        business_name: record.business_name,
        dealer_type: record.dealer_type,
        is_vat_registered: true,
        city: record.city,
        data_source: 'data.gov.il',
        verification_status: 'pending',
        last_verified_at: new Date(),
      });
      
      stats.imported++;
      
      // Progress update every 100 records
      if ((stats.imported + stats.skipped) % 100 === 0) {
        console.log(`  Progress: ${stats.imported + stats.skipped}/${records.length}`);
      }
      
    } catch (error) {
      stats.errors++;
      console.error(`  ✗ Error importing HP ${record.hp_number}:`, error);
    }
  }
  
  console.log(`\n✅ Import completed:`);
  console.log(`  Imported: ${stats.imported}`);
  console.log(`  Skipped: ${stats.skipped} (already exist)`);
  console.log(`  Errors: ${stats.errors}`);
  
  return stats;
}

/**
 * Main function
 */
async function downloadOsekMorshehData() {
  console.log('=== Download עוסק מורשה Data from data.gov.il ===\n');
  
  const startTime = Date.now();
  
  // Step 1: Search for VAT-related datasets
  const searchTerms = [
    'עוסק מורשה',
    'מע"מ',
    'VAT',
    'dealer',
    'תעודת עוסק',
  ];
  
  const allDatasets: DataGovDataset[] = [];
  
  for (const term of searchTerms) {
    const datasets = await searchDatasets(term);
    allDatasets.push(...datasets);
  }
  
  // Deduplicate by ID
  const uniqueDatasets = Array.from(
    new Map(allDatasets.map(d => [d.id, d])).values()
  );
  
  console.log(`\n📦 Total unique datasets found: ${uniqueDatasets.length}`);
  
  if (uniqueDatasets.length === 0) {
    console.log('\n⚠️  No datasets found. Possible reasons:');
    console.log('  1. Tax Authority data not published on data.gov.il');
    console.log('  2. Need to register for API access');
    console.log('  3. Data available only through direct API (not Open Data)');
    console.log('\n💡 Alternative: Use Tax Authority API (registration required)');
    console.log('     See: DIRECT_GOVERNMENT_ACCESS_LEGAL_GUIDE.md');
    return;
  }
  
  // Step 2: Display datasets for review
  console.log('\n📋 Available datasets:');
  uniqueDatasets.forEach((dataset, i) => {
    console.log(`\n  ${i + 1}. ${dataset.title}`);
    console.log(`     ID: ${dataset.id}`);
    console.log(`     Resources: ${dataset.resources.length} files`);
    
    dataset.resources.forEach((resource, j) => {
      console.log(`       ${j + 1}) ${resource.name} (${resource.format}, ${(resource.size / 1024).toFixed(2)} KB)`);
    });
  });
  
  // Step 3: Download CSV files
  console.log('\n\n📥 Downloading CSV files...');
  
  const allRecords: any[] = [];
  
  for (const dataset of uniqueDatasets) {
    const csvResources = dataset.resources.filter(r => 
      r.format.toLowerCase() === 'csv'
    );
    
    for (const resource of csvResources) {
      try {
        const filename = `${dataset.id}_${resource.id}.csv`;
        const filepath = await downloadCSV(resource.url, filename);
        
        const records = parseCSVForOsek(filepath);
        allRecords.push(...records);
        
      } catch (error) {
        console.error(`  ✗ Failed to process ${resource.name}`);
      }
    }
  }
  
  console.log(`\n📊 Total records collected: ${allRecords.length}`);
  
  if (allRecords.length === 0) {
    console.log('\n⚠️  No עוסק מורשה records found in datasets');
    return;
  }
  
  // Step 4: Import to database
  const importStats = await importToDatabase(allRecords);
  
  // Step 5: Summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  
  console.log('\n=== Download Summary ===');
  console.log(`Duration: ${duration} minutes`);
  console.log(`Datasets processed: ${uniqueDatasets.length}`);
  console.log(`Records found: ${allRecords.length}`);
  console.log(`Imported: ${importStats.imported}`);
  console.log(`Skipped: ${importStats.skipped}`);
  console.log(`Errors: ${importStats.errors}`);
  
  // Step 6: Database statistics
  const countResult = await pool.query('SELECT COUNT(*) FROM osek_morsheh');
  console.log(`\nTotal in database: ${countResult.rows[0].count} records`);
}

// Run download
downloadOsekMorshehData()
  .then(() => {
    console.log('\n✅ Download completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Download failed:', error);
    process.exit(1);
  });
