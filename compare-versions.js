const { chromium } = require('playwright');

async function compareVersions() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  console.log('=== COMPARING LOCAL VS PRODUCTION ===\n');

  // Test production version
  console.log('1. Testing PRODUCTION version...');
  const prodPage = await context.newPage();
  const prodErrors = [];
  const prodLogs = [];

  prodPage.on('console', msg => {
    prodLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      prodErrors.push(msg.text());
    }
  });

  prodPage.on('pageerror', error => {
    prodErrors.push(`Page error: ${error.message}`);
  });

  try {
    await prodPage.goto('https://threejs-room-configurator.netlify.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await prodPage.waitForTimeout(3000);

    const prodCanvas = await prodPage.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        displayWidth: rect.width,
        displayHeight: rect.height,
        visible: rect.width > 0 && rect.height > 0
      };
    });

    await prodPage.screenshot({
      path: '/mnt/c/A1 Codes/threejs-3d-room-designer/production-version.png'
    });

    console.log('   Production Canvas:', prodCanvas ? '✓ Found' : '✗ Not found');
    if (prodCanvas) {
      console.log(`   - Dimensions: ${prodCanvas.width}x${prodCanvas.height}`);
      console.log(`   - Display: ${prodCanvas.displayWidth.toFixed(0)}x${prodCanvas.displayHeight.toFixed(0)}`);
    }
    console.log(`   - Errors: ${prodErrors.length}`);
    if (prodErrors.length > 0) {
      console.log('   Error details:');
      prodErrors.forEach((err, i) => console.log(`     ${i + 1}. ${err}`));
    }
    console.log('   - Screenshot: production-version.png');

  } catch (error) {
    console.log(`   ✗ Failed to load production: ${error.message}`);
  }

  await prodPage.close();

  // Test local version
  console.log('\n2. Testing LOCAL version...');
  const localPage = await context.newPage();
  const localErrors = [];
  const localLogs = [];

  localPage.on('console', msg => {
    localLogs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      localErrors.push(msg.text());
    }
  });

  localPage.on('pageerror', error => {
    localErrors.push(`Page error: ${error.message}`);
  });

  try {
    await localPage.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await localPage.waitForTimeout(3000);

    const localCanvas = await localPage.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        displayWidth: rect.width,
        displayHeight: rect.height,
        visible: rect.width > 0 && rect.height > 0
      };
    });

    await localPage.screenshot({
      path: '/mnt/c/A1 Codes/threejs-3d-room-designer/local-version.png'
    });

    console.log('   Local Canvas:', localCanvas ? '✓ Found' : '✗ Not found');
    if (localCanvas) {
      console.log(`   - Dimensions: ${localCanvas.width}x${localCanvas.height}`);
      console.log(`   - Display: ${localCanvas.displayWidth.toFixed(0)}x${localCanvas.displayHeight.toFixed(0)}`);
    }
    console.log(`   - Errors: ${localErrors.length}`);
    if (localErrors.length > 0) {
      console.log('   Error details:');
      localErrors.slice(0, 5).forEach((err, i) => console.log(`     ${i + 1}. ${err.substring(0, 200)}`));
    }
    console.log('   - Screenshot: local-version.png');

  } catch (error) {
    console.log(`   ✗ Failed to load local: ${error.message}`);
  }

  await localPage.close();

  console.log('\n=== COMPARISON SUMMARY ===');
  console.log(`Production: ${prodErrors.length === 0 ? '✓' : '✗'} Working`);
  console.log(`Local:      ${localErrors.length === 0 ? '✓' : '✗'} Working`);

  if (localErrors.length > 0) {
    console.log('\n⚠️  Local version has errors that need to be fixed');
  }

  await browser.close();
}

compareVersions().catch(error => {
  console.error('Comparison failed:', error);
  process.exit(1);
});
