/**
 * Quick test to capture console logs from local app
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  console.log('Opening http://localhost:3000...\n');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });

  console.log('\nWaiting 5 seconds for initialization...\n');
  await page.waitForTimeout(5000);

  console.log('\n✅ Capture complete. Check logs above.');
  console.log('Browser will stay open for 30 seconds...\n');

  await page.waitForTimeout(30000);
  await browser.close();
})();
