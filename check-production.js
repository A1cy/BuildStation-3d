const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING PRODUCTION VERSION ===\n');

  try {
    await page.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check icon element structure and styling
    const productionIconInfo = await page.evaluate(() => {
      const icon = document.querySelector('.left-toolbar-button span[class*="fa"]');
      if (!icon) return 'NO ICON ELEMENT FOUND';

      const computed = window.getComputedStyle(icon);
      const beforeComputed = window.getComputedStyle(icon, ':before');

      // Check for any Font Awesome stylesheets
      const sheets = Array.from(document.styleSheets);
      const faSheets = sheets.filter(sheet => {
        try {
          return sheet.href && (sheet.href.includes('fontawesome') || sheet.href.includes('font-awesome'));
        } catch (e) {
          return false;
        }
      });

      // Try to find the CSS rule
      let cssRuleInfo = null;
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          const matchingRule = rules.find(rule =>
            rule.selectorText && rule.selectorText.includes('.fa-border-all:before')
          );
          if (matchingRule) {
            cssRuleInfo = {
              selectorText: matchingRule.selectorText,
              content: matchingRule.style.content,
              fontFamily: matchingRule.style.fontFamily,
              sheetHref: sheet.href
            };
            break;
          }
        } catch (e) {
          // CORS error
        }
      }

      return {
        elementHTML: icon.outerHTML,
        elementClasses: icon.className,
        elementFontFamily: computed.fontFamily,
        elementFontWeight: computed.fontWeight,
        beforeContent: beforeComputed.content,
        beforeFontFamily: beforeComputed.fontFamily,
        beforeFontWeight: beforeComputed.fontWeight,
        beforeDisplay: beforeComputed.display,
        faStylesheets: faSheets.map(s => s.href),
        cssRuleInfo: cssRuleInfo
      };
    });

    console.log('\n=== Production Icon Info ===');
    console.log(JSON.stringify(productionIconInfo, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/tmp/production-icons-debug.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/production-icons-debug.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
