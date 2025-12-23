/**
 * Debug Tax Authority Website - Manual HTML Inspection
 * 
 * This script opens the Tax Authority website with browser visible
 * to manually inspect HTML selectors and form structure.
 */

import { chromium } from 'playwright';

async function debugTaxWebsite() {
  console.log('🔍 Opening Tax Authority website for inspection...');
  console.log('📝 Task: Find correct selectors for form elements\n');

  const browser = await chromium.launch({
    headless: false, // Browser visible
    timeout: 60000,
  });

  const context = await browser.newContext({
    locale: 'he-IL',
    userAgent: 'TrustCheckBot/1.0 (+https://trustcheck.co.il/about/bot)',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Step 1: Navigate to form
    console.log('1️⃣ Navigating to: https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx');
    await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx', {
      waitUntil: 'networkidle',
    });

    // Wait for manual inspection
    console.log('✅ Page loaded successfully!');
    console.log('\n📋 MANUAL INSPECTION CHECKLIST:');
    console.log('   1. Find radio button for "אישור לישות" (Certificate for Entity)');
    console.log('   2. Find "המשך" (Continue) button selector');
    console.log('   3. Check if button has [value="המשך"] or different attribute');
    console.log('   4. Right-click elements → Inspect → Copy selector');
    console.log('\n⏳ Browser will stay open for 5 minutes...');
    console.log('   Close browser when done inspecting.\n');

    // Keep browser open for inspection
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🔚 Closing browser...');
    await browser.close();
  }
}

debugTaxWebsite();
