const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Collect all network requests
  const fontRequests = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('fontawesome') || url.includes('webfonts') || url.includes('.woff') || url.includes('.ttf')) {
      fontRequests.push({
        url,
        status: response.status(),
        contentType: response.headers()['content-type']
      });
    }
  });

  console.log('\n=== CHECKING FONT FILE LOADING ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(3000);

    // Check what font files were requested
    console.log('\n=== Font Files Requested ===');
    fontRequests.forEach(req => {
      console.log(`[${req.status}] ${req.url}`);
      console.log(`    Content-Type: ${req.contentType || 'N/A'}`);
    });

    // Check the @font-face rules in the loaded stylesheet
    const fontFaceInfo = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      const faSheet = sheets.find(sheet => {
        try {
          return sheet.href && sheet.href.includes('fontawesome');
        } catch (e) {
          return false;
        }
      });

      if (!faSheet) return 'No Font Awesome stylesheet found';

      try {
        const rules = Array.from(faSheet.cssRules || faSheet.rules || []);
        const fontFaceRules = rules.filter(rule => rule.type === 5); // CSSFontFaceRule

        return fontFaceRules.map(rule => {
          const src = rule.style.src;
          return {
            family: rule.style.fontFamily,
            weight: rule.style.fontWeight,
            src: src ? src.substring(0, 200) : 'N/A' // Truncate long src
          };
        });
      } catch (e) {
        return `Error reading rules: ${e.message}`;
      }
    });

    console.log('\n=== @font-face Rules in Loaded CSS ===');
    console.log(JSON.stringify(fontFaceInfo, null, 2));

    // Check computed style of icon element including :before
    const iconDebug = await page.evaluate(() => {
      const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
      if (!icon) return 'NO ICON ELEMENT FOUND';

      const computed = window.getComputedStyle(icon);
      const beforeComputed = window.getComputedStyle(icon, ':before');

      // Also try to get the CSS rule directly
      const sheets = Array.from(document.styleSheets);
      let cssRuleContent = null;

      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes('.fa-border-all:before')) {
              cssRuleContent = rule.style.content;
              break;
            }
          }
        } catch (e) {
          // CORS or other error
        }
      }

      return {
        elementClasses: icon.className,
        elementFontFamily: computed.fontFamily,
        elementFontWeight: computed.fontWeight,
        beforeContent: beforeComputed.content,
        beforeFontFamily: beforeComputed.fontFamily,
        beforeFontWeight: beforeComputed.fontWeight,
        beforeDisplay: beforeComputed.display,
        cssRuleContent: cssRuleContent || 'Could not read CSS rule'
      };
    });

    console.log('\n=== Icon Element Debug ===');
    console.log(JSON.stringify(iconDebug, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/tmp/font-path-debug.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/font-path-debug.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
