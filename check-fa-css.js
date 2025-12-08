const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING FONT AWESOME CSS RULES ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(5000);

    // Extract key CSS rules from injected styles
    const cssRules = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      const results = {
        faBaseRule: null,
        faBeforeRule: null,
        faBorderAllRule: null,
        fasRule: null
      };

      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);

          for (const rule of rules) {
            if (!rule.selectorText) continue;

            // Check for .fa base rule
            if (rule.selectorText.includes('.fa,') || rule.selectorText === '.fa') {
              results.faBaseRule = {
                selector: rule.selectorText,
                display: rule.style.display,
                fontFamily: rule.style.fontFamily,
                fontWeight: rule.style.fontWeight,
                allStyles: rule.cssText.substring(0, 500)
              };
            }

            // Check for .fa:before rule
            if (rule.selectorText.includes('.fa:before') || rule.selectorText.includes('.fa::before')) {
              results.faBeforeRule = {
                selector: rule.selectorText,
                display: rule.style.display,
                content: rule.style.content,
                fontFamily: rule.style.fontFamily,
                allStyles: rule.cssText.substring(0, 500)
              };
            }

            // Check for .fa-border-all:before
            if (rule.selectorText.includes('.fa-border-all:before') || rule.selectorText.includes('.fa-border-all::before')) {
              results.faBorderAllRule = {
                selector: rule.selectorText,
                content: rule.style.content,
                allStyles: rule.cssText.substring(0, 300)
              };
            }

            // Check for .fas
            if (rule.selectorText.includes('.fas')) {
              results.fasRule = {
                selector: rule.selectorText,
                fontFamily: rule.style.fontFamily,
                fontWeight: rule.style.fontWeight,
                allStyles: rule.cssText.substring(0, 300)
              };
            }
          }
        } catch (e) {
          // CORS or other error
        }
      }

      return results;
    });

    console.log('\n=== CSS Rules Found ===');
    console.log(JSON.stringify(cssRules, null, 2));

    // Also check what styles are being computed on the actual icon element
    const computedStyles = await page.evaluate(() => {
      const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
      if (!icon) return 'NO ICON';

      const computed = window.getComputedStyle(icon);
      const beforeComputed = window.getComputedStyle(icon, ':before');

      return {
        element: {
          display: computed.display,
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          width: computed.width,
          height: computed.height
        },
        before: {
          display: beforeComputed.display,
          content: beforeComputed.content,
          fontFamily: beforeComputed.fontFamily,
          fontWeight: beforeComputed.fontWeight,
          fontSize: beforeComputed.fontSize,
          width: beforeComputed.width,
          height: beforeComputed.height
        }
      };
    });

    console.log('\n=== Computed Styles on Icon ===');
    console.log(JSON.stringify(computedStyles, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
