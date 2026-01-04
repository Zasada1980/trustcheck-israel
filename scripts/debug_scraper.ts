/**
 * Debug scraper - saves page HTML and screenshot
 * Use this to inspect actual page structure
 */

import 'dotenv/config';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const HP_NUMBER = 345033898; // TrustCheck Israel
const URL = `https://ica.justice.gov.il/GenericCorporarionInfo/SearchCorporation?unit=8&corporationNumber=${HP_NUMBER}`;

async function debugScrape() {
  console.log(`\n🔍 Debug Scraper for HP ${HP_NUMBER}\n`);
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  console.log(`📄 Navigating to: ${URL}`);
  
  await page.goto(URL, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  
  console.log('⏳ Waiting 5 seconds for page to load...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Save HTML
  const html = await page.content();
  const htmlPath = path.join(__dirname, `debug_hp_${HP_NUMBER}.html`);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`✅ HTML saved: ${htmlPath}`);
  
  // Save screenshot
  const screenshotPath = path.join(__dirname, `debug_hp_${HP_NUMBER}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ Screenshot saved: ${screenshotPath}`);
  
  // Extract all text from page
  const allText = await page.evaluate(() => document.body.innerText);
  const textPath = path.join(__dirname, `debug_hp_${HP_NUMBER}_text.txt`);
  fs.writeFileSync(textPath, allText, 'utf-8');
  console.log(`✅ Text content saved: ${textPath}`);
  
  // List all headings
  const headings = await page.evaluate(() => {
    const h = [];
    for (let i = 1; i <= 6; i++) {
      const elements = document.querySelectorAll(`h${i}`);
      elements.forEach(el => {
        h.push(`h${i}: ${el.textContent?.trim()}`);
      });
    }
    return h;
  });
  
  console.log('\n📋 Headings found:');
  headings.forEach(h => console.log(`  ${h}`));
  
  // List all tables
  const tables = await page.evaluate(() => {
    const t = [];
    document.querySelectorAll('table').forEach((table, i) => {
      const rows = table.querySelectorAll('tr');
      t.push(`Table ${i + 1}: ${rows.length} rows`);
    });
    return t;
  });
  
  console.log('\n📊 Tables found:');
  tables.forEach(t => console.log(`  ${t}`));
  
  console.log('\n✅ Debug complete! Check the saved files.');
  console.log('   Press Ctrl+C to close browser...');
  
  // Keep browser open for manual inspection
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  await browser.close();
}

debugScrape()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
