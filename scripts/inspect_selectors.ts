/**
 * Automatic Selector Detection for Tax Authority Website
 * Captures screenshots and HTML structure for analysis
 */

import { chromium } from 'playwright';
import * as fs from 'fs';

async function inspectSelectors() {
  console.log('🔍 Starting automatic selector inspection...\n');

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000,
  });

  const context = await browser.newContext({
    locale: 'he-IL',
    userAgent: 'TrustCheckBot/1.0 (+https://trustcheck.co.il/about/bot)',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // Navigate to form
    console.log('1️⃣ Loading page...');
    await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx', {
      waitUntil: 'networkidle',
    });

    // Screenshot 1: Initial page
    await page.screenshot({ path: 'logs/tax_page_initial.png', fullPage: true });
    console.log('   ✅ Screenshot saved: logs/tax_page_initial.png');

    // Extract HTML of form
    const htmlContent = await page.content();
    fs.writeFileSync('logs/tax_page_html.html', htmlContent);
    console.log('   ✅ HTML saved: logs/tax_page_html.html\n');

    // Find all buttons
    console.log('2️⃣ Analyzing buttons...');
    const buttons = await page.$$('input[type="button"], button');
    console.log(`   Found ${buttons.length} buttons on page:`);
    
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const id = await btn.getAttribute('id');
      const value = await btn.getAttribute('value');
      const name = await btn.getAttribute('name');
      const text = await btn.textContent();
      console.log(`   Button ${i + 1}: id="${id}", value="${value}", name="${name}", text="${text}"`);
    }

    // Find all radio buttons
    console.log('\n3️⃣ Analyzing radio buttons...');
    const radios = await page.$$('input[type="radio"]');
    console.log(`   Found ${radios.length} radio buttons:`);
    
    for (let i = 0; i < radios.length; i++) {
      const radio = radios[i];
      const id = await radio.getAttribute('id');
      const value = await radio.getAttribute('value');
      const name = await radio.getAttribute('name');
      const checked = await radio.isChecked();
      console.log(`   Radio ${i + 1}: id="${id}", value="${value}", name="${name}", checked=${checked}`);
    }

    // Try to find "אישור לישות" option
    console.log('\n4️⃣ Looking for "אישור לישות" option...');
    const labels = await page.$$('label');
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const text = await label.textContent();
      if (text?.includes('אישור') || text?.includes('מקבל')) {
        const forAttr = await label.getAttribute('for');
        console.log(`   Label found: "${text}" (for="${forAttr}")`);
      }
    }

    // Try clicking radio button (if found)
    console.log('\n5️⃣ Attempting to select certificate type...');
    const rbMekabel = await page.$('#rbMekabel');
    if (rbMekabel) {
      console.log('   ✅ Found #rbMekabel');
      await rbMekabel.click();
      await page.waitForTimeout(2000);
      
      // Screenshot 2: After radio selection
      await page.screenshot({ path: 'logs/tax_page_radio_selected.png', fullPage: true });
      console.log('   ✅ Screenshot saved: logs/tax_page_radio_selected.png');
    } else {
      console.log('   ❌ #rbMekabel not found, trying alternatives...');
      
      // Try any radio with "מקבל" in nearby text
      const allRadios = await page.$$('input[type="radio"]');
      for (const radio of allRadios) {
        const id = await radio.getAttribute('id');
        if (id?.includes('Mekabel') || id?.includes('mekabel')) {
          console.log(`   🔄 Trying radio: ${id}`);
          await radio.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    }

    // Check for continue button again
    console.log('\n6️⃣ Searching for continue button...');
    const allButtons = await page.$$('input[type="button"], button');
    console.log(`   Checking ${allButtons.length} buttons for "המשך"...`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const btn = allButtons[i];
      const value = await btn.getAttribute('value');
      const text = await btn.textContent();
      const id = await btn.getAttribute('id');
      const visible = await btn.isVisible();
      const enabled = await btn.isEnabled();
      
      if (value?.includes('המשך') || text?.includes('המשך') || value === 'המשך') {
        console.log(`   ✅ FOUND CONTINUE BUTTON:`);
        console.log(`      ID: ${id}`);
        console.log(`      Value: ${value}`);
        console.log(`      Text: ${text}`);
        console.log(`      Visible: ${visible}`);
        console.log(`      Enabled: ${enabled}`);
      }
    }

    console.log('\n✅ Inspection complete! Check logs/ directory for results.');

  } catch (error) {
    console.error('❌ Error during inspection:', error);
  } finally {
    await browser.close();
  }
}

inspectSelectors();
