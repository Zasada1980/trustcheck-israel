import { getVATDealerStatus } from './lib/vat_dealer';

async function test() {
  console.log('\n=== Testing VAT Logic for HP 515000016 (חברה בע"מ) ===\n');
  
  const result = await getVATDealerStatus('515000016', { forceRefresh: true });
  
  if (result) {
    console.log('HP Number:', result.hpNumber);
    console.log('Dealer Type:', result.dealerType);
    console.log('Is VAT Registered:', result.isVATRegistered);
    console.log('Tax Status:', result.taxStatus);
  } else {
    console.log('No result returned');
  }
  
  process.exit(0);
}

test().catch(console.error);
