const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING PRODUCTION FONT AWESOME KIT ===\n');

  try {
    await page.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait longer for Font Awesome Kit to fully initialize
    await page.waitForTimeout(5000);

    // Check for Font Awesome Kit script and global objects
    const kitInfo = await page.evaluate(() => {
      // Check for Font Awesome Kit script
      const scripts = Array.from(document.scripts);
      const kitScript = scripts.find(s => s.src && s.src.includes('fontawesome.com'));

      // Check for Font Awesome global objects
      const hasFontAwesomeConfig = typeof window.FontAwesomeConfig !== 'undefined';
      const hasFontAwesomeKitConfig = typeof window.FontAwesomeKitConfig !== 'undefined';

      // Check head for any injected styles
      const headStyles = Array.from(document.head.children).filter(el => {
        return el.tagName === 'STYLE' || (el.tagName === 'LINK' && el.rel === 'stylesheet');
      }).map(el => ({
        tag: el.tagName,
        href: el.href || null,
        textContent: el.textContent ? el.textContent.substring(0, 200) : null
      }));

      // Now check the icon again after waiting
      const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
      let iconInfo = null;
      if (icon) {
        const beforeComputed = window.getComputedStyle(icon, ':before');
        const svg = icon.querySelector('svg');
        iconInfo = {
          hasClasses: icon.className,
          beforeContent: beforeComputed.content,
          hasSVG: !!svg,
          innerHTML: icon.innerHTML.substring(0, 200)
        };
      }

      return {
        kitScript: kitScript ? {
          src: kitScript.src,
          crossOrigin: kitScript.crossOrigin
        } : null,
        hasFontAwesomeConfig: hasFontAwesomeConfig,
        hasFontAwesomeKitConfig: hasFontAwesomeKitConfig,
        headStylesCount: headStyles.length,
        fontAwesomeStyles: headStyles.filter(s =>
          (s.textContent && s.textContent.includes('Font Awesome')) ||
          (s.href && s.href.includes('fontawesome'))
        ),
        iconInfo: iconInfo
      };
    });

    console.log('\n=== Production Font Awesome Kit Info ===');
    console.log(JSON.stringify(kitInfo, null, 2));

    // Take final screenshot
    await page.screenshot({ path: '/tmp/production-final-check.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/production-final-check.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
