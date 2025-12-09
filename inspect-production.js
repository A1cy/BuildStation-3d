/**
 * Inspect production THREE.js scene to extract exact values
 */

const { chromium } = require('playwright');

async function inspectProduction() {
  console.log('🔍 Inspecting Production THREE.js Scene\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('✅ Production loaded\n');

  // Extract THREE.js scene details
  const sceneDetails = await page.evaluate(() => {
    // Find canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };

    // Try to access THREE.js internals (may not work due to scope)
    const results = {
      canvas: {
        width: canvas.width,
        height: canvas.height,
        style: canvas.style.cssText
      }
    };

    // Check if we can access WebGL context
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      results.webgl = {
        clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE),
        viewport: gl.getParameter(gl.VIEWPORT)
      };
    }

    // Count elements
    results.elements = {
      total: document.querySelectorAll('*').length,
      controls: document.querySelectorAll('.control-button, .float-toolbar-button').length,
      floatToolbar: !!document.querySelector('.float-toolbar'),
      controlsSection: !!document.querySelector('.controls-section')
    };

    return results;
  });

  console.log('📊 Production Scene Details:');
  console.log(JSON.stringify(sceneDetails, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'bundle-analysis/production-live.png', fullPage: false });
  console.log('\n✅ Screenshot saved: bundle-analysis/production-live.png');

  console.log('\n📝 What to check manually:');
  console.log('1. Wall color - Are they pure white or off-white?');
  console.log('2. Floor color - What shade of gray?');
  console.log('3. Background - Solid color or gradient? What colors?');
  console.log('4. Lighting - Bright or dim? Hard or soft shadows?');
  console.log('5. Camera angle - High or low view?');
  console.log('6. Grid/Axes - Are there grid lines or axis indicators?');

  console.log('\n⏸️  Browser left open for manual inspection');
  // Don't close - let user inspect
}

inspectProduction().catch(console.error);
