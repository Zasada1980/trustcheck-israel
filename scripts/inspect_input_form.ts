/**
 * Inspect Input Form Selectors
 */

import 'dotenv/config';
import { chromium } from 'playwright';

async function inspectInputForm() {
  console.log('🔍 Inspecting input form page...\n');

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000,
  });

  const context = await browser.newContext({
    locale: 'he-IL',
    userAgent: 'TrustCheckBot/1.0',
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate
    await page.goto('https://taxinfo.taxes.gov.il/gmishurim/firstPage.aspx');
    
    // Step 2: Click radio
    await page.click('#rbMekabel');
    
    // Step 3: Click continue
    await page.click('#btnNext');
    
    // Step 4: Wait for input form
    await page.waitForURL(/frmInputMekabel\.aspx/);
    console.log('✅ Input form loaded\n');
    
    // Screenshot
    await page.screenshot({ path: 'logs/input_form.png', fullPage: true });
    
    // Find all input fields
    console.log('📝 Input fields on page:');
    const inputs = await page.$$('input[type="text"], input[type="number"]');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const visible = await input.isVisible();
      console.log(`   Input ${i + 1}: id="${id}", name="${name}", placeholder="${placeholder}", visible=${visible}`);
    }
    
    // Find submit button
    console.log('\n🔍 Submit buttons:');
    const buttons = await page.$$('input[type="button"], input[type="submit"], button');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const id = await btn.getAttribute('id');
      const value = await btn.getAttribute('value');
      const text = await btn.textContent();
      console.log(`   Button ${i + 1}: id="${id}", value="${value}", text="${text?.trim()}"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

inspectInputForm();
