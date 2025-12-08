const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('\n=== CHECKING LOCAL VERSION WITH ERROR DETECTION ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for Font Awesome to load

    // Check if Font Awesome CSS is loaded
    const fontAwesomeCSSLoaded = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      return styles.some(sheet => {
        try {
          return sheet.href && sheet.href.includes('fontawesome');
        } catch (e) {
          return false;
        }
      });
    });
    console.log('Font Awesome CSS loaded:', fontAwesomeCSSLoaded);

    // Check computed style of an icon
    const iconStyle = await page.evaluate(() => {
      const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
      if (!icon) return 'NO ICON ELEMENT FOUND';

      const computed = window.getComputedStyle(icon);
      return {
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        content: computed.content,
        display: computed.display,
        classes: icon.className
      };
    });
    console.log('\nIcon Computed Style:', JSON.stringify(iconStyle, null, 2));

    // Check if icon fonts are loaded
    const fontsLoaded = await page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
        const fonts = [];
        document.fonts.forEach(font => {
          if (font.family.toLowerCase().includes('awesome')) {
            fonts.push({
              family: font.family,
              status: font.status
            });
          }
        });
        return fonts;
      }
      return 'document.fonts not available';
    });
    console.log('\nFont Awesome Fonts:', JSON.stringify(fontsLoaded, null, 2));

    // Print console messages
    if (consoleMessages.length > 0) {
      console.log('\n=== Console Messages ===');
      consoleMessages.forEach(msg => console.log(msg));
    }

    // Print page errors
    if (pageErrors.length > 0) {
      console.log('\n=== Page Errors ===');
      pageErrors.forEach(err => console.log(err));
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/local-icons-debug.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/local-icons-debug.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
