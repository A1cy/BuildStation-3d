const { chromium } = require('playwright');

async function verifyFix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Store console messages
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

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Wait a bit for Three.js to initialize
  console.log('Waiting for initialization...');
  await page.waitForTimeout(3000);

  // Check for Blueprint3D initialization message
  const blueprint3dInitialized = consoleMessages.some(msg =>
    msg.text.includes('Blueprint3D initialized')
  );

  // Get canvas element info
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
      top: computedStyle.top,
      left: computedStyle.left,
      zIndex: computedStyle.zIndex,
      visibility: computedStyle.visibility,
      display: computedStyle.display
    };
  });

  // Check if sidebar is visible
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

  // Check for any elements that might be blocking the canvas
  const blockingElements = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return [];

    const canvasRect = canvas.getBoundingClientRect();
    const centerX = canvasRect.left + canvasRect.width / 2;
    const centerY = canvasRect.top + canvasRect.height / 2;

    const elementAtCenter = document.elementFromPoint(centerX, centerY);

    return {
      elementAtCenter: elementAtCenter ? {
        tagName: elementAtCenter.tagName,
        className: elementAtCenter.className,
        id: elementAtCenter.id
      } : null,
      isCanvas: elementAtCenter && elementAtCenter.tagName === 'CANVAS'
    };
  });

  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({
    path: '/mnt/c/A1 Codes/threejs-3d-room-designer/local-verification.png',
    fullPage: false
  });

  // Get viewport info
  const viewportInfo = await page.evaluate(() => {
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  });

  // Print results
  console.log('\n=== VERIFICATION RESULTS ===\n');

  console.log('1. Blueprint3D Initialization:');
  console.log(`   ${blueprint3dInitialized ? '✓' : '✗'} Blueprint3D initialized message found`);

  console.log('\n2. Canvas Element:');
  if (canvasInfo) {
    console.log(`   ✓ Canvas exists`);
    console.log(`   - Canvas dimensions: ${canvasInfo.width}x${canvasInfo.height}`);
    console.log(`   - Display dimensions: ${canvasInfo.displayWidth.toFixed(2)}x${canvasInfo.displayHeight.toFixed(2)}`);
    console.log(`   - Position: ${canvasInfo.position}`);
    console.log(`   - Top: ${canvasInfo.top}, Left: ${canvasInfo.left}`);
    console.log(`   - Z-index: ${canvasInfo.zIndex}`);
    console.log(`   - Visibility: ${canvasInfo.visibility}`);
    console.log(`   - Display: ${canvasInfo.display}`);
  } else {
    console.log(`   ✗ Canvas not found`);
  }

  console.log('\n3. Sidebar:');
  if (sidebarInfo) {
    console.log(`   ✓ Sidebar exists`);
    console.log(`   - Dimensions: ${sidebarInfo.width.toFixed(2)}x${sidebarInfo.height.toFixed(2)}`);
    console.log(`   - Visible: ${sidebarInfo.visible ? 'Yes' : 'No'}`);
  } else {
    console.log(`   ✗ Sidebar not found`);
  }

  console.log('\n4. Canvas Accessibility:');
  if (blockingElements.elementAtCenter) {
    console.log(`   - Element at canvas center: <${blockingElements.elementAtCenter.tagName}>`);
    if (blockingElements.elementAtCenter.className) {
      console.log(`     Class: ${blockingElements.elementAtCenter.className}`);
    }
    if (blockingElements.elementAtCenter.id) {
      console.log(`     ID: ${blockingElements.elementAtCenter.id}`);
    }
    console.log(`   ${blockingElements.isCanvas ? '✓' : '✗'} Canvas is accessible at center point`);
  }

  console.log('\n5. Viewport:');
  console.log(`   - Window size: ${viewportInfo.innerWidth}x${viewportInfo.innerHeight}`);
  console.log(`   - Scroll position: (${viewportInfo.scrollX}, ${viewportInfo.scrollY})`);

  console.log('\n6. Console Messages:');
  console.log(`   - Total messages: ${consoleMessages.length}`);
  console.log(`   - Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n   Error messages:');
    errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }

  // Show recent console messages
  console.log('\n   Recent console messages:');
  consoleMessages.slice(-10).forEach(msg => {
    const prefix = msg.type === 'error' ? '   [ERROR]' : '   [LOG]  ';
    console.log(`${prefix} ${msg.text}`);
  });

  console.log('\n7. Screenshot:');
  console.log('   ✓ Screenshot saved to: local-verification.png');

  console.log('\n=== SUMMARY ===');
  const allChecks = [
    { name: 'Blueprint3D initialized', passed: blueprint3dInitialized },
    { name: 'Canvas exists', passed: canvasInfo !== null },
    { name: 'Canvas has dimensions', passed: canvasInfo && canvasInfo.width > 0 && canvasInfo.height > 0 },
    { name: 'Sidebar exists', passed: sidebarInfo !== null },
    { name: 'Canvas accessible', passed: blockingElements.isCanvas },
    { name: 'No errors', passed: errors.length === 0 }
  ];

  allChecks.forEach(check => {
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
  });

  const passedCount = allChecks.filter(c => c.passed).length;
  console.log(`\nPassed: ${passedCount}/${allChecks.length} checks`);

  await browser.close();

  // Exit with error code if critical checks failed
  if (!canvasInfo || !blockingElements.isCanvas || errors.length > 0) {
    process.exit(1);
  }
}

verifyFix().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
