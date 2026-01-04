import { pool } from './lib/db/postgres';
import { getVATDealerStatus } from './lib/vat_dealer';

async function enrichHP515() {
  console.log('🚀 Enriching HP 515XXXXXX companies (חברות בע"מ)...\n');
  
  const result = await pool.query(`
    SELECT hp_number 
    FROM companies_registry 
    WHERE hp_number >= 515000000 AND hp_number < 516000000 
    ORDER BY hp_number
    LIMIT 100
  `);
  
  console.log(`Found ${result.rows.length} companies with HP 515...\n`);
  
  for (const row of result.rows) {
    const status = await getVATDealerStatus(row.hp_number.toString(), { forceRefresh: true });
    if (status) {
      console.log(`✅ HP ${row.hp_number} → ${status.dealerType}`);
    }
  }
  
  console.log('\n✅ Done! Checking results...\n');
  
  const check = await pool.query(`
    SELECT dealer_type, COUNT(*) 
    FROM vat_dealers 
    WHERE hp_number >= 515000000 AND hp_number < 516000000 
    GROUP BY dealer_type
  `);
  
  console.log('Results:');
  check.rows.forEach(r => console.log(`  ${r.dealer_type}: ${r.count}`));
  
  process.exit(0);
}

enrichHP515().catch(console.error);
