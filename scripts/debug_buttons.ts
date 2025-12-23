/**
 * Debug button visibility
 */

import 'dotenv/config';
import { chromium } from 'playwright';

async function debugButtons() {
  const browser = await chromium.launch({ headless: false });
  const page = await (await browser.newContext({ locale: 'he-IL' })).newPage();

  try {
    await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx');
    await page.click('#rbMekabel');
    await page.click('#btnNext');
    await page.waitForURL(/frmInputMekabel\.aspx/);
    
    console.log('✅ On input form page\n');
    
    // Check both buttons
    const btnNext = await page.$('#btnNext');
    const btnNextSpecial = await page.$('#btnNextSpecial');
    
    console.log('Button #btnNext:');
    console.log('  Exists:', !!btnNext);
    if (btnNext) {
      console.log('  Visible:', await btnNext.isVisible());
      console.log('  Enabled:', await btnNext.isEnabled());
    }
    
    console.log('\nButton #btnNextSpecial:');
    console.log('  Exists:', !!btnNextSpecial);
    if (btnNextSpecial) {
      console.log('  Visible:', await btnNextSpecial.isVisible());
      console.log('  Enabled:', await btnNextSpecial.isEnabled());
    }
    
    // Try filling field
    console.log('\n📝 Filling HP number...');
    await page.fill('#txtMisTik', '510000334');
    
    await page.waitForTimeout(2000);
    
    console.log('\n✅ After filling:');
    if (btnNext) {
      console.log('  #btnNext visible:', await btnNext.isVisible());
      console.log('  #btnNext enabled:', await btnNext.isEnabled());
    }
    if (btnNextSpecial) {
      console.log('  #btnNextSpecial visible:', await btnNextSpecial.isVisible());
      console.log('  #btnNextSpecial enabled:', await btnNextSpecial.isEnabled());
    }
    
    console.log('\n⏳ Browser will stay open for inspection...');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugButtons();
