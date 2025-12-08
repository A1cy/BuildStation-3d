const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('\n=== FINAL LOCAL TEST ===\n');

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(5000);

  const analysis = await page.evaluate(() => {
    // Check all navigation elements
    const floatToolbar = document.querySelector('.float-toolbar');
    const controlsSection = document.querySelector('.controls-section');
    const leftToolbar = document.querySelector('.left-toolbar');

    // Get all icons
    const allIcons = document.querySelectorAll('span[class*="fa"], i[class*="fa"]');
    const visibleIcons = Array.from(allIcons).filter(icon =>
      icon.offsetWidth > 0 && icon.offsetHeight > 0
    );

    // Check for bottom arrows (in production screenshot)
    const arrows = document.querySelectorAll('[class*="arrow"], [class*="chevron"]');

    return {
      floatToolbar: {
        found: !!floatToolbar,
        visible: floatToolbar ? floatToolbar.offsetWidth > 0 : false,
        children: floatToolbar ? floatToolbar.children.length : 0
      },
      controlsSection: {
        found: !!controlsSection,
        visible: controlsSection ? controlsSection.offsetWidth > 0 : false,
        children: controlsSection ? controlsSection.children.length : 0
      },
      leftToolbar: {
        found: !!leftToolbar,
        children: leftToolbar ? leftToolbar.children.length : 0
      },
      totalIcons: allIcons.length,
      visibleIcons: visibleIcons.length,
      arrows: arrows.length,
      canvas: {
        width: document.querySelector('canvas')?.width || 0,
        height: document.querySelector('canvas')?.height || 0
      }
    };
  });

  console.log('ANALYSIS:');
  console.log(JSON.stringify(analysis, null, 2));

  await page.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/final-test.png', fullPage: true });
  console.log('\n✓ Screenshot saved: final-test.png');

  await browser.close();
})();
