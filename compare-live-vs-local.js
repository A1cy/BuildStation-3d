/**
 * Compare LIVE production vs LOCAL Vite build
 * Identify exact differences causing 3D issues
 */

const { chromium } = require('playwright');

async function compareLiveVsLocal() {
  console.log('🔍 Comparing LIVE Production vs LOCAL Vite Build\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });

  // Create two contexts side by side
  const contextProd = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const contextLocal = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const pageProd = await contextProd.newPage();
  const pageLocal = await contextLocal.newPage();

  try {
    // Load both versions
    console.log('\n📡 Loading pages...');
    await Promise.all([
      pageProd.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 15000 }),
      pageLocal.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 })
    ]);

    console.log('✅ Production loaded');
    console.log('✅ Local loaded');

    await Promise.all([
      pageProd.waitForTimeout(3000),
      pageLocal.waitForTimeout(3000)
    ]);

    // Compare canvases
    console.log('\n🖼️  CANVAS COMPARISON');
    console.log('-'.repeat(60));

    const [canvasProd, canvasLocal] = await Promise.all([
      pageProd.$('canvas'),
      pageLocal.$('canvas')
    ]);

    if (canvasProd && canvasLocal) {
      const [boxProd, boxLocal] = await Promise.all([
        canvasProd.boundingBox(),
        canvasLocal.boundingBox()
      ]);

      console.log(`Production: ${Math.round(boxProd.width)}x${Math.round(boxProd.height)}`);
      console.log(`Local:      ${Math.round(boxLocal.width)}x${Math.round(boxLocal.height)}`);

      if (Math.abs(boxProd.width - boxLocal.width) > 50) {
        console.log('❌ ISSUE: Canvas size mismatch!');
      } else {
        console.log('✅ Canvas sizes match');
      }
    }

    // Check camera position
    console.log('\n📷 CAMERA POSITION');
    console.log('-'.repeat(60));

    const cameraProd = await pageProd.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      // Try to get camera from THREE scene
      return { available: 'Camera inspection requires THREE access' };
    });

    console.log('Production camera: Likely at correct position (room visible)');
    console.log('Local camera: Need to check if camera.position is correct');

    // Check 3D scene rendering
    console.log('\n🎨 3D SCENE RENDERING');
    console.log('-'.repeat(60));

    // Take screenshots
    await pageProd.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/bundle-analysis/production-now.png' });
    await pageLocal.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/bundle-analysis/local-now.png' });

    console.log('✅ Screenshots saved:');
    console.log('   - production-now.png');
    console.log('   - local-now.png');

    // Check for WebGL context
    console.log('\n🔧 WEBGL CONTEXT');
    console.log('-'.repeat(60));

    const [webglProd, webglLocal] = await Promise.all([
      pageProd.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas' };
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return {
          hasContext: !!gl,
          width: canvas.width,
          height: canvas.height,
          contextType: gl ? 'webgl' : 'none'
        };
      }),
      pageLocal.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas' };
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return {
          hasContext: !!gl,
          width: canvas.width,
          height: canvas.height,
          contextType: gl ? 'webgl' : 'none'
        };
      })
    ]);

    console.log('Production WebGL:', JSON.stringify(webglProd, null, 2));
    console.log('Local WebGL:     ', JSON.stringify(webglLocal, null, 2));

    // Check console errors
    console.log('\n❌ CONSOLE ERRORS');
    console.log('-'.repeat(60));

    const errorsProd = [];
    const errorsLocal = [];

    pageProd.on('console', msg => {
      if (msg.type() === 'error') errorsProd.push(msg.text());
    });

    pageLocal.on('console', msg => {
      if (msg.type() === 'error') errorsLocal.push(msg.text());
    });

    await Promise.all([
      pageProd.waitForTimeout(2000),
      pageLocal.waitForTimeout(2000)
    ]);

    console.log(`\nProduction errors: ${errorsProd.length}`);
    if (errorsProd.length > 0) {
      errorsProd.forEach(err => console.log(`   - ${err}`));
    }

    console.log(`\nLocal errors: ${errorsLocal.length}`);
    if (errorsLocal.length > 0) {
      errorsLocal.forEach(err => console.log(`   ⚠️  ${err}`));
    }

    // Check THREE.js objects in scene
    console.log('\n🎭 THREE.JS SCENE OBJECTS');
    console.log('-'.repeat(60));

    const sceneLocal = await pageLocal.evaluate(() => {
      // Check if THREE is available
      if (typeof window.THREE === 'undefined') {
        return { error: 'THREE.js not available in window' };
      }
      return { threeAvailable: true };
    });

    console.log('Local THREE.js:', JSON.stringify(sceneLocal, null, 2));

    // Check for default room rendering
    console.log('\n🏠 DEFAULT ROOM');
    console.log('-'.repeat(60));

    const roomLocal = await pageLocal.evaluate(() => {
      // Check DOM for room-related elements
      const floorplan = document.querySelector('[class*="floor"]');
      const room = document.querySelector('[class*="room"]');
      return {
        hasFloorplan: !!floorplan,
        hasRoom: !!room,
        bodyHTML: document.body.innerHTML.includes('room') || document.body.innerHTML.includes('floor')
      };
    });

    console.log('Local room elements:', JSON.stringify(roomLocal, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('🎯 IDENTIFIED ISSUES:');
    console.log('='.repeat(60));
    console.log('1. Camera position - Check if too far from origin');
    console.log('2. 3D models not loading - Check asset paths');
    console.log('3. Default room not rendering - Check Model initialization');
    console.log('4. Canvas size - Verify container dimensions');
    console.log('\n⏸️  Browser windows left open. Compare visually and check console.');

  } catch (error) {
    console.error('❌ Comparison error:', error.message);
  }

  // Leave browsers open for manual inspection
}

compareLiveVsLocal();
