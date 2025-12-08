const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING WITH EXTENDED WAIT FOR FONT AWESOME ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });

    // Check icon at different time intervals
    for (let wait of [1000, 3000, 5000, 8000]) {
      await page.waitForTimeout(wait === 1000 ? 1000 : wait - 5000);

      const iconCheck = await page.evaluate(() => {
        const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
        if (!icon) return 'NO ICON';

        const beforeComputed = window.getComputedStyle(icon, ':before');
        const svg = icon.querySelector('svg');

        // Check if Font Awesome has updated the DOM
        return {
          beforeContent: beforeComputed.content,
          hasSVG: !!svg,
          innerHTML: icon.innerHTML,
          textContent: icon.textContent,
          // Check actual rendered dimensions
          width: icon.offsetWidth,
          height: icon.offsetHeight,
          display: beforeComputed.display
        };
      });

      console.log(`\n=== After ${wait}ms ===`);
      console.log(JSON.stringify(iconCheck, null, 2));
    }

    // Take final screenshot
    await page.screenshot({ path: '/tmp/local-delayed.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/local-delayed.png');

    // Also check what's actually visible on screen
    const visualCheck = await page.evaluate(() => {
      const icons = document.querySelectorAll('.left-toolbar-button span[class*="fa"]');
      return {
        totalIcons: icons.length,
        firstFewIcons: Array.from(icons).slice(0, 5).map(icon => ({
          classes: icon.className,
          hasContent: icon.textContent.length > 0,
          hasSVG: !!icon.querySelector('svg'),
          innerHTML: icon.innerHTML.substring(0, 100),
          computedWidth: icon.offsetWidth,
          computedHeight: icon.offsetHeight
        }))
      };
    });

    console.log('\n=== Visual Check of All Icons ===');
    console.log(JSON.stringify(visualCheck, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
