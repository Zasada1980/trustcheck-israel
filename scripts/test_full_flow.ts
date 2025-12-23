/**
 * Test full workflow with visible browser
 */

import 'dotenv/config';
import { chromium } from 'playwright';

async function testFullFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000  // Slow down for visibility
  });
  
  const context = await browser.newContext({ locale: 'he-IL' });
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to form');
    await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx');
    
    console.log('Step 2: Select אישור לישות');
    await page.click('#rbMekabel');
    
    console.log('Step 3: Click המשך');
    await page.click('#btnNext');
    
    console.log('Step 4: Wait for input form');
    await page.waitForURL(/frmInputMekabel\.aspx/);
    console.log('✅ URL:', page.url());
    
    console.log('Step 5: Fill HP number');
    await page.fill('#txtMisTik', '515972651'); // Known company
    
    console.log('Step 6: Click submit');
    await page.click('#btnNext');
    
    console.log('Step 7: Waiting for results...');
    await page.waitForTimeout(10000); // Wait 10 seconds
    
    console.log('✅ Final URL:', page.url());
    
    // Take screenshot
    await page.screenshot({ path: 'logs/results_page.png', fullPage: true });
    console.log('✅ Screenshot saved');
    
    console.log('\n⏳ Browser stays open for 2 minutes...');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'logs/error_page.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testFullFlow();
