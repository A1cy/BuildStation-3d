const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING LOCAL WITH FONT AWESOME KIT ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });

    // Wait for Font Awesome Kit to inject styles
    await page.waitForTimeout(5000);

    // Check for Font Awesome Kit  initialization
    const kitInfo = await page.evaluate(() => {
      // Check for Font Awesome Kit config
      const hasFontAwesomeKitConfig = typeof window.FontAwesomeKitConfig !== 'undefined';

      // Check for injected styles in head
      const headStyles = Array.from(document.head.children).filter(el => {
        return el.tagName === 'STYLE';
      });

      const fontAwesomeStyles = headStyles.filter(style => {
        const text = style.textContent || '';
        return text.includes('Font Awesome') || text.includes('@font-face');
      });

      // Check icon element
      const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
      let iconInfo = null;
      if (icon) {
        const computed = window.getComputedStyle(icon);
        const beforeComputed = window.getComputedStyle(icon, ':before');
        const svg = icon.querySelector('svg');

        iconInfo = {
          classes: icon.className,
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          beforeContent: beforeComputed.content,
          beforeFontFamily: beforeComputed.fontFamily,
          beforeFontWeight: beforeComputed.fontWeight,
          beforeDisplay: beforeComputed.display,
          hasSVG: !!svg,
          innerHTML: icon.innerHTML.substring(0, 200)
        };
      }

      return {
        hasFontAwesomeKitConfig,
        totalHeadStyles: headStyles.length,
        fontAwesomeStylesCount: fontAwesomeStyles.length,
        fontAwesomeStylesPreview: fontAwesomeStyles.map(s => ({
          length: s.textContent.length,
          preview: s.textContent.substring(0, 150)
        })),
        iconInfo
      };
    });

    console.log('\n=== Local with Font Awesome Kit ===');
    console.log(JSON.stringify(kitInfo, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/tmp/local-with-kit.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/local-with-kit.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
