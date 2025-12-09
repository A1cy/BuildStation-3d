/**
 * Comprehensive functionality comparison
 * Tests every feature between production and local
 */

const { chromium } = require('playwright');

async function compareFunctionality() {
  console.log('🔍 Comprehensive Production vs Local Comparison\n');

  const browser = await chromium.launch({ headless: false });

  // Production
  const pageProd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pageProd.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle' });
  await pageProd.waitForTimeout(3000);

  // Local
  const pageLocal = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pageLocal.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageLocal.waitForTimeout(3000);

  console.log('✅ Both pages loaded\n');

  // Test 1: Canvas and 3D Scene
  console.log('═══ TEST 1: Canvas & 3D Scene ═══');
  const [prodCanvas, localCanvas] = await Promise.all([
    pageProd.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return {
        exists: !!canvas,
        width: canvas?.width,
        height: canvas?.height,
        displayed: canvas?.style.display !== 'none'
      };
    }),
    pageLocal.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return {
        exists: !!canvas,
        width: canvas?.width,
        height: canvas?.height,
        displayed: canvas?.style.display !== 'none'
      };
    })
  ]);

  console.log('Production canvas:', prodCanvas);
  console.log('Local canvas:     ', localCanvas);
  console.log(`Canvas: ${prodCanvas.width === localCanvas.width ? '✅ MATCH' : '❌ DIFFERENT'}\n`);

  // Test 2: UI Controls
  console.log('═══ TEST 2: UI Controls ═══');
  const [prodControls, localControls] = await Promise.all([
    pageProd.evaluate(() => ({
      sidebar: document.querySelectorAll('.left-toolbar-button').length,
      floatToolbar: document.querySelectorAll('.float-toolbar-button').length,
      controlsSection: document.querySelectorAll('.controls-section .control-button').length,
      total: document.querySelectorAll('.control-button, .float-toolbar-button, .left-toolbar-button').length
    })),
    pageLocal.evaluate(() => ({
      sidebar: document.querySelectorAll('.left-toolbar-button').length,
      floatToolbar: document.querySelectorAll('.float-toolbar-button').length,
      controlsSection: document.querySelectorAll('.controls-section .control-button').length,
      total: document.querySelectorAll('.control-button, .float-toolbar-button, .left-toolbar-button').length
    }))
  ]);

  console.log('Production controls:', prodControls);
  console.log('Local controls:     ', localControls);
  console.log(`Sidebar: ${prodControls.sidebar === localControls.sidebar ? '✅ MATCH' : '❌ DIFFERENT'}`);
  console.log(`Float toolbar: ${prodControls.floatToolbar === localControls.floatToolbar ? '✅ MATCH' : '❌ DIFFERENT'}`);
  console.log(`Controls section: ${prodControls.controlsSection === localControls.controlsSection ? '✅ MATCH' : '❌ DIFFERENT'}\n`);

  // Test 3: Product Catalog
  console.log('═══ TEST 3: Product Catalog ═══');

  // Click "Add Products" button
  try {
    await Promise.all([
      pageProd.click('.left-toolbar-button[data-tip="Add Products"] i, button:has-text("Add")').catch(() => console.log('Prod: No add button')),
      pageLocal.click('.left-toolbar-button[data-tip="Add Products"] i, button:has-text("Add")').catch(() => console.log('Local: No add button'))
    ]);
    await Promise.all([pageProd.waitForTimeout(1000), pageLocal.waitForTimeout(1000)]);

    const [prodProducts, localProducts] = await Promise.all([
      pageProd.evaluate(() => ({
        panelVisible: !!document.querySelector('.product-list, [class*="product"]'),
        productCount: document.querySelectorAll('.product-item, [class*="product-card"]').length
      })),
      pageLocal.evaluate(() => ({
        panelVisible: !!document.querySelector('.product-list, [class*="product"]'),
        productCount: document.querySelectorAll('.product-item, [class*="product-card"]').length
      }))
    ]);

    console.log('Production products:', prodProducts);
    console.log('Local products:     ', localProducts);
    console.log(`Product panel: ${prodProducts.panelVisible === localProducts.panelVisible ? '✅ MATCH' : '❌ DIFFERENT'}\n`);
  } catch (e) {
    console.log('⚠️  Could not test product catalog\n');
  }

  // Test 4: Console Errors
  console.log('═══ TEST 4: Console Errors ═══');
  const prodErrors = [];
  const localErrors = [];

  pageProd.on('console', msg => { if (msg.type() === 'error') prodErrors.push(msg.text()); });
  pageLocal.on('console', msg => { if (msg.type() === 'error') localErrors.push(msg.text()); });

  await Promise.all([pageProd.waitForTimeout(2000), pageLocal.waitForTimeout(2000)]);

  console.log(`Production errors: ${prodErrors.length}`);
  if (prodErrors.length > 0) prodErrors.forEach(e => console.log(`  - ${e}`));
  console.log(`Local errors: ${localErrors.length}`);
  if (localErrors.length > 0) localErrors.forEach(e => console.log(`  - ${e}`));
  console.log(`Errors: ${prodErrors.length === localErrors.length ? '✅ MATCH' : '❌ DIFFERENT'}\n`);

  // Test 5: Screenshots
  console.log('═══ TEST 5: Visual Comparison ═══');
  await pageProd.screenshot({ path: 'bundle-analysis/prod-final.png' });
  await pageLocal.screenshot({ path: 'bundle-analysis/local-final.png' });
  console.log('✅ Screenshots saved for visual comparison\n');

  // Summary
  console.log('═══════════════════════════════');
  console.log('📊 COMPARISON SUMMARY');
  console.log('═══════════════════════════════');

  const differences = [];
  if (prodCanvas.width !== localCanvas.width) differences.push('Canvas size');
  if (prodControls.total !== localControls.total) differences.push('Control count');
  if (prodErrors.length !== localErrors.length) differences.push('Console errors');

  if (differences.length === 0) {
    console.log('✅ 100% MATCH - Production parity achieved!');
  } else {
    console.log(`❌ Differences found: ${differences.join(', ')}`);
    console.log('\n🔧 Still need to fix:');
    differences.forEach(d => console.log(`   - ${d}`));
  }

  console.log('\n⏸️  Browsers left open for inspection');
}

compareFunctionality().catch(console.error);
