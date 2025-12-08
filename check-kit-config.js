const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING FONT AWESOME KIT CONFIGURATION ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(5000);

    // Check Font Awesome Kit config object
    const kitConfig = await page.evaluate(() => {
      if (typeof window.FontAwesomeKitConfig === 'undefined') {
        return 'No FontAwesomeKitConfig found';
      }

      return {
        kitConfig: window.FontAwesomeKitConfig,
        // Also check if there's a FontAwesome object
        hasFontAwesomeGlobal: typeof window.FontAwesome !== 'undefined',
        fontAwesomeConfig: typeof window.FontAwesome !== 'undefined' ? {
          autoReplaceSvg: window.FontAwesome.config?.autoReplaceSvg,
          observeMutations: window.FontAwesome.config?.observeMutations,
          autoA11y: window.FontAwesome.config?.autoA11y
        } : null
      };
    });

    console.log('\n=== Font Awesome Kit Config ===');
    console.log(JSON.stringify(kitConfig, null, 2));

    // Also check production config for comparison
    console.log('\n\n=== CHECKING PRODUCTION CONFIG ===\n');

    await page.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);

    const productionConfig = await page.evaluate(() => {
      if (typeof window.FontAwesomeKitConfig === 'undefined') {
        return 'No FontAwesomeKitConfig found';
      }

      return {
        kitConfig: window.FontAwesomeKitConfig,
        hasFontAwesomeGlobal: typeof window.FontAwesome !== 'undefined',
        fontAwesomeConfig: typeof window.FontAwesome !== 'undefined' ? {
          autoReplaceSvg: window.FontAwesome.config?.autoReplaceSvg,
          observeMutations: window.FontAwesome.config?.observeMutations,
          autoA11y: window.FontAwesome.config?.autoA11y
        } : null
      };
    });

    console.log('\n=== Production Font Awesome Kit Config ===');
    console.log(JSON.stringify(productionConfig, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
