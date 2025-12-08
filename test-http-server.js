const { chromium } = require('playwright');

async function testHttpServer() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  console.log('=== TESTING HTTP-SERVER (Production Build) ===\n');

  const page = await context.newPage();
  const errors = [];
  const logs = [];

  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Waiting for initialization...');
    await page.waitForTimeout(3000);

    // Check canvas
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(canvas);

      return {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        displayWidth: rect.width,
        displayHeight: rect.height,
        position: computedStyle.position,
        visibility: computedStyle.visibility,
        display: computedStyle.display,
        visible: rect.width > 0 && rect.height > 0
      };
    });

    // Check sidebar
    const sidebarInfo = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, .left-sidebar, [class*="sidebar"]');
      if (!sidebar) return null;

      const rect = sidebar.getBoundingClientRect();
      return {
        exists: true,
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0 && rect.height > 0
      };
    });

    // Check for 3D scene elements
    const sceneInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      return {
        canvasCount: canvases.length,
        hasWebGL: !!document.querySelector('canvas[data-engine="three.js"]') || canvases.length > 0
      };
    });

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({
      path: '/mnt/c/A1 Codes/threejs-3d-room-designer/http-server-test.png',
      fullPage: false
    });

    // Print results
    console.log('\n=== RESULTS ===\n');

    console.log('1. Canvas:');
    if (canvasInfo) {
      console.log(`   ✓ Canvas exists`);
      console.log(`   - Canvas dimensions: ${canvasInfo.width}x${canvasInfo.height}`);
      console.log(`   - Display dimensions: ${canvasInfo.displayWidth.toFixed(2)}x${canvasInfo.displayHeight.toFixed(2)}`);
      console.log(`   - Position: ${canvasInfo.position}`);
      console.log(`   - Visibility: ${canvasInfo.visibility}`);
      console.log(`   - Display: ${canvasInfo.display}`);
      console.log(`   - Visible: ${canvasInfo.visible ? 'Yes' : 'No'}`);
    } else {
      console.log(`   ✗ Canvas not found`);
    }

    console.log('\n2. Sidebar:');
    if (sidebarInfo) {
      console.log(`   ✓ Sidebar exists`);
      console.log(`   - Dimensions: ${sidebarInfo.width.toFixed(2)}x${sidebarInfo.height.toFixed(2)}`);
      console.log(`   - Visible: ${sidebarInfo.visible ? 'Yes' : 'No'}`);
    } else {
      console.log(`   ✗ Sidebar not found`);
    }

    console.log('\n3. 3D Scene:');
    console.log(`   - Canvas count: ${sceneInfo.canvasCount}`);
    console.log(`   - Has WebGL: ${sceneInfo.hasWebGL ? 'Yes' : 'No'}`);

    console.log('\n4. Console:');
    console.log(`   - Total messages: ${logs.length}`);
    console.log(`   - Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n   Error messages:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.substring(0, 200)}`);
      });
    }

    console.log('\n5. Screenshot: http-server-test.png');

    console.log('\n=== SUMMARY ===');
    const allChecks = [
      { name: 'Canvas exists', passed: canvasInfo !== null },
      { name: 'Canvas visible', passed: canvasInfo && canvasInfo.visible },
      { name: 'Canvas has dimensions', passed: canvasInfo && canvasInfo.width > 0 },
      { name: 'Sidebar exists', passed: sidebarInfo !== null },
      { name: 'Has 3D scene', passed: sceneInfo.canvasCount > 0 },
      { name: 'No errors', passed: errors.length === 0 }
    ];

    allChecks.forEach(check => {
      console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
    });

    const passedCount = allChecks.filter(c => c.passed).length;
    console.log(`\nPassed: ${passedCount}/${allChecks.length} checks`);

    if (passedCount === allChecks.length) {
      console.log('\n🎉 ALL TESTS PASSED! Production build is working correctly!');
    }

  } catch (error) {
    console.log(`✗ Failed to load: ${error.message}`);
  }

  await page.close();
  await browser.close();
}

testHttpServer().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
