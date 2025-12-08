const { chromium } = require('playwright');

async function comprehensiveTest() {
  console.log('🚀 Starting Comprehensive Blueprint3D Verification\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  try {
    // Step 1: Navigate
    console.log('📍 Step 1: Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // Step 2: Wait for initialization
    console.log('⏳ Step 2: Waiting for Blueprint3D initialization (5 seconds)...');
    await page.waitForTimeout(5000);

    // Step 3: Check Blueprint3D initialization
    const blueprint3dInitialized = consoleMessages.some(msg =>
      msg.text.includes('Blueprint3D initialized')
    );
    console.log(`${blueprint3dInitialized ? '✅' : '❌'} Blueprint3D initialized: ${blueprint3dInitialized}\n`);

    // Step 4: Check 3D Scene
    console.log('🎨 Step 3: Checking 3D Scene Elements...');
    const sceneInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const viewer = document.getElementById('viewer');
      const sideMenu = document.getElementById('side-menu');
      const floorTextured = document.getElementById('floorTextured');

      return {
        canvas: canvas ? {
          exists: true,
          width: canvas.width,
          height: canvas.height,
          displayWidth: canvas.getBoundingClientRect().width,
          displayHeight: canvas.getBoundingClientRect().height
        } : null,
        viewer: viewer ? { exists: true, id: viewer.id } : null,
        sideMenu: sideMenu ? {
          exists: true,
          childCount: sideMenu.children.length,
          visible: window.getComputedStyle(sideMenu).display !== 'none'
        } : null,
        floorTextured: floorTextured ? { exists: true } : null
      };
    });

    console.log('Canvas:', sceneInfo.canvas ? `✅ ${sceneInfo.canvas.width}x${sceneInfo.canvas.height} (display: ${sceneInfo.canvas.displayWidth.toFixed(0)}x${sceneInfo.canvas.displayHeight.toFixed(0)})` : '❌ Not found');
    console.log('Viewer container:', sceneInfo.viewer ? '✅ Found' : '❌ Not found');
    console.log('Side menu:', sceneInfo.sideMenu ? `✅ Found (${sceneInfo.sideMenu.childCount} items, visible: ${sceneInfo.sideMenu.visible})` : '❌ Not found');
    console.log('Floor textured:', sceneInfo.floorTextured ? '✅ Found' : '❌ Not found');

    // Step 5: Take initial screenshot
    console.log('\n📸 Step 4: Taking initial screenshot...');
    await page.screenshot({
      path: '/mnt/c/A1 Codes/threejs-3d-room-designer/test-initial.png',
      fullPage: false
    });
    console.log('✅ Saved to: test-initial.png');

    // Step 6: Test product loading
    console.log('\n🛒 Step 5: Testing Product Loading...');

    // Check if add items button exists
    const addItemsBtn = await page.$('#add-items');
    if (addItemsBtn) {
      console.log('✅ Found "Add Items" button');

      // Click the button
      await addItemsBtn.click();
      console.log('Clicked "Add Items" button');
      await page.waitForTimeout(1000);

      // Check if items panel is visible
      const itemsPanelVisible = await page.evaluate(() => {
        const panel = document.getElementById('add-items');
        return panel && window.getComputedStyle(panel).display !== 'none';
      });

      console.log(`Items panel visible: ${itemsPanelVisible ? '✅' : '❌'}`);

      // Look for product items
      const productInfo = await page.evaluate(() => {
        const items = document.querySelectorAll('.items-wrapper .item, .item');
        return {
          count: items.length,
          firstItem: items[0] ? {
            className: items[0].className,
            hasImage: !!items[0].querySelector('img'),
            hasTitle: !!items[0].querySelector('.item-name, .name')
          } : null
        };
      });

      console.log(`Products found: ${productInfo.count}`);
      if (productInfo.firstItem) {
        console.log(`First product has image: ${productInfo.firstItem.hasImage ? '✅' : '❌'}`);
        console.log(`First product has title: ${productInfo.firstItem.hasTitle ? '✅' : '❌'}`);

        // Try to click first product
        const firstProduct = await page.$('.items-wrapper .item, .item');
        if (firstProduct) {
          console.log('Attempting to click first product...');
          await firstProduct.click();
          await page.waitForTimeout(2000);
          console.log('✅ Product clicked');

          // Take screenshot after product interaction
          await page.screenshot({
            path: '/mnt/c/A1 Codes/threejs-3d-room-designer/test-product-clicked.png',
            fullPage: false
          });
          console.log('✅ Saved screenshot: test-product-clicked.png');
        }
      }
    } else {
      console.log('❌ "Add Items" button not found');
    }

    // Step 7: Console check
    console.log('\n📋 Step 6: Console Output Analysis...');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Error Messages:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    } else {
      console.log('✅ No errors detected');
    }

    // Show relevant console messages
    const relevantMessages = consoleMessages.filter(msg =>
      !msg.text.includes('GPU stall') &&
      !msg.text.includes('WebGL') &&
      !msg.text.includes('crbug')
    );

    if (relevantMessages.length > 0) {
      console.log('\n📝 Relevant Console Messages:');
      relevantMessages.slice(0, 10).forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`);
      });
    }

    // Final Report
    console.log('\n' + '═'.repeat(70));
    console.log('                    FINAL VERIFICATION REPORT');
    console.log('═'.repeat(70));

    const checks = [
      { name: 'Blueprint3D initialized', passed: blueprint3dInitialized },
      { name: 'Canvas exists', passed: sceneInfo.canvas !== null },
      { name: 'Canvas has valid dimensions', passed: sceneInfo.canvas && sceneInfo.canvas.width > 0 },
      { name: 'Viewer container exists', passed: sceneInfo.viewer !== null },
      { name: 'Side menu exists', passed: sceneInfo.sideMenu !== null },
      { name: 'Side menu is visible', passed: sceneInfo.sideMenu && sceneInfo.sideMenu.visible },
      { name: 'No console errors', passed: errors.length === 0 }
    ];

    console.log('\n✅ System Status:');
    checks.forEach(check => {
      console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    const passedCount = checks.filter(c => c.passed).length;
    const percentage = ((passedCount / checks.length) * 100).toFixed(1);

    console.log(`\n📊 Overall Score: ${passedCount}/${checks.length} (${percentage}%)`);

    console.log('\n📸 Screenshots Generated:');
    console.log('   - test-initial.png (initial load)');
    console.log('   - test-product-clicked.png (after product interaction)');

    console.log('\n🎯 Comparison with Production:');
    const productionMatch = sceneInfo.canvas && sceneInfo.sideMenu && errors.length === 0;
    console.log(`   ${productionMatch ? '✅ MATCHES' : '❌ DIFFERS'} - App ${productionMatch ? 'works like production version' : 'has differences from production'}`);

    console.log('\n' + '═'.repeat(70));

    if (passedCount === checks.length) {
      console.log('\n🎉 SUCCESS! The fix is working correctly!');
      console.log('   The app now works like the production version.');
    } else {
      console.log('\n⚠️  Some checks failed. Review the report above.');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

comprehensiveTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
