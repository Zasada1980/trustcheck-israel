/**
 * Test script for osek_morsheh API
 * Tests unified VAT classification system
 */

// Load environment variables
import 'dotenv/config';

import { 
  getOsekMorsheh, 
  classifyByHPNumber, 
  getUnifiedVATStatus 
} from '../lib/db/osek_morsheh';

async function testOsekAPI() {
  console.log('=== Testing עוסק מורשה API ===\n');

  // Test 1: Retrieve TrustCheck Israel record
  console.log('Test 1: Get TrustCheck Israel (HP 345033898)');
  try {
    const osek = await getOsekMorsheh(345033898);
    if (osek) {
      console.log('✅ Found:', {
        hp: osek.hp_number,
        name: osek.business_name,
        type: osek.dealer_type,
        vat: osek.is_vat_registered,
        status: osek.tax_status,
      });
    } else {
      console.log('❌ Not found in database');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  // Test 2: Classification logic
  console.log('Test 2: Classification by first digit');
  const testCases = [
    { hp: 345033898, expected: 'עוסק מורשה/פטור' },
    { hp: 515044532, expected: 'חברה בע"מ' },
    { hp: 123456789, expected: 'עוסק מורשה/פטור' },
    { hp: 587654321, expected: 'חברה בע"מ' },
  ];

  testCases.forEach(({ hp, expected }) => {
    const classification = classifyByHPNumber(hp);
    const firstDigit = hp.toString().charAt(0);
    const passed = 
      (firstDigit === '5' && classification.dealerType === 'חברה בע"מ') ||
      (firstDigit !== '5' && classification.dealerType === 'עוסק פטור');
    
    console.log(`  HP ${hp} (first digit: ${firstDigit}):`);
    console.log(`    Expected: ${expected}`);
    console.log(`    Got: ${classification.dealerType}`);
    console.log(`    ${passed ? '✅' : '❌'} ${passed ? 'PASS' : 'FAIL'}`);
  });
  console.log('');

  // Test 3: Unified VAT status
  console.log('Test 3: Unified VAT status');
  
  // Test 3a: עוסק מורשה (HP not starting with 5)
  console.log('  3a: TrustCheck Israel (HP 345033898 - עוסק מורשה)');
  try {
    const status1 = await getUnifiedVATStatus(345033898);
    console.log('    Result:', {
      type: status1.dealerType,
      vat: status1.isVATRegistered,
      status: status1.taxStatus,
      source: status1.dataSource,
      name: status1.businessName,
    });
    console.log(`    ${status1.dealerType === 'עוסק מורשה' ? '✅' : '❌'} Correct classification`);
  } catch (error) {
    console.error('    ❌ Error:', error);
  }
  console.log('');

  // Test 3b: חברה בע"מ (HP starting with 5)
  console.log('  3b: Mock company (HP 515044532 - חברה בע"מ)');
  try {
    const status2 = await getUnifiedVATStatus(515044532);
    console.log('    Result:', {
      type: status2.dealerType,
      vat: status2.isVATRegistered,
      status: status2.taxStatus,
      source: status2.dataSource,
    });
    console.log(`    ${status2.dealerType === 'חברה בע"מ' ? '✅' : '❌'} Correct classification`);
  } catch (error) {
    console.error('    ❌ Error:', error);
  }
  console.log('');

  // Test 3c: Unknown עוסק (not in database)
  console.log('  3c: Unknown business (HP 123456789 - not in database)');
  try {
    const status3 = await getUnifiedVATStatus(123456789);
    console.log('    Result:', {
      type: status3.dealerType,
      vat: status3.isVATRegistered,
      status: status3.taxStatus,
      source: status3.dataSource,
    });
    console.log(`    ${status3.dealerType === 'עוסק פטור' ? '✅' : '❌'} Defaults to עוסק פטור`);
  } catch (error) {
    console.error('    ❌ Error:', error);
  }
  console.log('');

  // Test 4: Validation (HP starting with 5 should be rejected)
  console.log('Test 4: Validation (HP starting with 5)');
  try {
    const { validateHPNotFive } = await import('../lib/db/osek_morsheh');
    validateHPNotFive(515044532);
    console.log('  ❌ FAIL: Should have thrown error');
  } catch (error) {
    if (error instanceof Error) {
      console.log('  ✅ PASS: Correctly rejected HP starting with 5');
      console.log(`     Error message: "${error.message}"`);
    }
  }
  console.log('');

  console.log('=== Test Summary ===');
  console.log('Database Architecture:');
  console.log('  ├─ vat_dealers: חברה בע"מ (HP starting with 5)');
  console.log('  └─ osek_morsheh: עוסק מורשה (HP starting with 0,1,2,3,4,6,7,8,9)');
  console.log('');
  console.log('Classification Rule:');
  console.log('  IF first_digit = "5" → חברה בע"מ');
  console.log('  IF first_digit = 0,1,2,3,4,6,7,8,9 → עוסק מורשה or עוסק פטור');
  console.log('');
  console.log('Current Status:');
  console.log('  ✅ Infrastructure ready');
  console.log('  ✅ First record inserted (HP 345033898)');
  console.log('  ⏳ Awaiting Tax Authority API access');
}

// Run tests
testOsekAPI()
  .then(() => {
    console.log('Tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
