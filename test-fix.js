const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('\n=== TESTING ICON FIX ===\n');

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(5000);

  const iconStatus = await page.evaluate(() => {
    const buttons = document.querySelectorAll('.left-toolbar-button');
    return Array.from(buttons).slice(0, 10).map(btn => {
      const span = btn.querySelector('span[class*="fa"]');
      if (!span) return { found: false };

      const rect = span.getBoundingClientRect();
      const computed = window.getComputedStyle(span);
      const beforeComputed = window.getComputedStyle(span, ':before');

      return {
        classes: span.className,
        visible: rect.width > 0 && rect.height > 0,
        dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        beforeContent: beforeComputed.content.substring(0, 20),
        display: computed.display
      };
    });
  });

  console.log('=== Icon Status ===');
  iconStatus.forEach((icon, i) => {
    if (icon.found === false) return;
    const status = icon.visible ? '✓ VISIBLE' : '✗ HIDDEN';
    console.log(`${status} | ${icon.classes.padEnd(25)} | ${icon.dimensions.padEnd(8)} | ${icon.beforeContent}`);
  });

  await page.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/test-fix.png', fullPage: false });
  console.log('\n✓ Screenshot saved: test-fix.png');

  await browser.close();
})();
