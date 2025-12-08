const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Non-headless to see rendering

  console.log('\n=== VISUAL COMPARISON: LOCAL VS PRODUCTION ===\n');

  // Test LOCAL
  console.log('Opening LOCAL version...');
  const localPage = await browser.newPage();
  await localPage.setViewportSize({ width: 1280, height: 720 });
  await localPage.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
  await localPage.waitForTimeout(8000); // Wait longer for Font Awesome

  await localPage.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/local-visual.png', fullPage: false });
  console.log('✓ Local screenshot saved: local-visual.png');

  // Check if icons are visible on screen
  const localIconsVisible = await localPage.evaluate(() => {
    const toolbar = document.querySelector('.left-toolbar');
    if (!toolbar) return { found: false };

    const buttons = toolbar.querySelectorAll('.left-toolbar-button');
    const iconInfo = Array.from(buttons).slice(0, 5).map(btn => {
      const span = btn.querySelector('span[class*="fa"]');
      if (!span) return { found: false };

      const rect = span.getBoundingClientRect();
      const computed = window.getComputedStyle(span);
      const beforeComputed = window.getComputedStyle(span, ':before');

      return {
        classes: span.className,
        visible: rect.width > 0 && rect.height > 0,
        dimensions: `${rect.width}x${rect.height}`,
        beforeContent: beforeComputed.content,
        opacity: computed.opacity,
        display: computed.display
      };
    });

    return { found: true, icons: iconInfo };
  });

  console.log('\n=== Local Icons Status ===');
  console.log(JSON.stringify(localIconsVisible, null, 2));

  // Test PRODUCTION
  console.log('\nOpening PRODUCTION version...');
  const prodPage = await browser.newPage();
  await prodPage.setViewportSize({ width: 1280, height: 720 });
  await prodPage.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await prodPage.waitForTimeout(8000); // Wait longer for Font Awesome

  await prodPage.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/production-visual.png', fullPage: false });
  console.log('✓ Production screenshot saved: production-visual.png');

  // Check if icons are visible on screen
  const prodIconsVisible = await prodPage.evaluate(() => {
    const toolbar = document.querySelector('.left-toolbar');
    if (!toolbar) return { found: false };

    const buttons = toolbar.querySelectorAll('.left-toolbar-button');
    const iconInfo = Array.from(buttons).slice(0, 5).map(btn => {
      const span = btn.querySelector('span[class*="fa"]');
      if (!span) return { found: false };

      const rect = span.getBoundingClientRect();
      const computed = window.getComputedStyle(span);
      const beforeComputed = window.getComputedStyle(span, ':before');

      return {
        classes: span.className,
        visible: rect.width > 0 && rect.height > 0,
        dimensions: `${rect.width}x${rect.height}`,
        beforeContent: beforeComputed.content,
        opacity: computed.opacity,
        display: computed.display
      };
    });

    return { found: true, icons: iconInfo };
  });

  console.log('\n=== Production Icons Status ===');
  console.log(JSON.stringify(prodIconsVisible, null, 2));

  console.log('\n=== COMPARISON COMPLETE ===');
  console.log('Check the screenshots:');
  console.log('  - local-visual.png');
  console.log('  - production-visual.png');
  console.log('  - production-version.png (reference from user)');

  await browser.close();
})();
