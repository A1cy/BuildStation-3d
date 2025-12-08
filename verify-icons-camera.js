const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n=== CHECKING LOCAL VERSION (http://localhost:3000) ===\n');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check if Font Awesome Kit script loaded
    const faKitLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const faScript = scripts.find(s => s.src.includes('fontawesome'));
      return faScript ? faScript.src : 'NOT FOUND';
    });
    console.log('Font Awesome Kit Script:', faKitLoaded);

    // Check if FontAwesome object exists in window
    const faObjectExists = await page.evaluate(() => {
      return typeof window.FontAwesome !== 'undefined';
    });
    console.log('FontAwesome object in window:', faObjectExists);

    // Check icon elements
    const iconInfo = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.left-toolbar-button span[class*="fa"]'));
      return icons.map(icon => ({
        classes: icon.className,
        hasSVG: icon.querySelector('svg') !== null,
        innerHTML: icon.innerHTML.substring(0, 100)
      }));
    });
    console.log('\nIcon Elements Found:', iconInfo.length);
    console.log('Sample Icons:');
    iconInfo.slice(0, 3).forEach((icon, i) => {
      console.log(`  Icon ${i + 1}:`, JSON.stringify(icon, null, 2));
    });

    // Check camera position via Three.js
    const cameraInfo = await page.evaluate(() => {
      // Try to access camera through window or global scope
      if (window.THREE && window.scene) {
        const camera = window.scene.camera;
        return camera ? {
          position: camera.position,
          lookAt: 'unknown'
        } : 'Camera not accessible';
      }
      return 'THREE.js not in window scope';
    });
    console.log('\nCamera Info:', JSON.stringify(cameraInfo, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/tmp/local-current.png', fullPage: true });
    console.log('\nScreenshot saved: /tmp/local-current.png');

  } catch (error) {
    console.error('Error checking local version:', error.message);
  }

  console.log('\n=== CHECKING PRODUCTION VERSION (https://threejs-room-configurator.netlify.app/) ===\n');

  try {
    const prodPage = await context.newPage();
    await prodPage.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 10000 });
    await prodPage.waitForTimeout(2000);

    // Check icon elements in production
    const prodIconInfo = await prodPage.evaluate(() => {
      const icons = Array.from(document.querySelectorAll('.left-toolbar-button span[class*="fa"]'));
      return icons.map(icon => ({
        classes: icon.className,
        hasSVG: icon.querySelector('svg') !== null,
        innerHTML: icon.innerHTML.substring(0, 100)
      }));
    });
    console.log('Production Icon Elements Found:', prodIconInfo.length);
    console.log('Production Sample Icons:');
    prodIconInfo.slice(0, 3).forEach((icon, i) => {
      console.log(`  Icon ${i + 1}:`, JSON.stringify(icon, null, 2));
    });

    // Take screenshot
    await prodPage.screenshot({ path: '/tmp/production-current.png', fullPage: true });
    console.log('\nProduction screenshot saved: /tmp/production-current.png');

    await prodPage.close();
  } catch (error) {
    console.error('Error checking production version:', error.message);
  }

  await browser.close();

  console.log('\n=== ANALYSIS COMPLETE ===');
  console.log('Compare screenshots at:');
  console.log('  Local: /tmp/local-current.png');
  console.log('  Production: /tmp/production-current.png');
})();
