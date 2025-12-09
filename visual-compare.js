/**
 * Visual comparison - Take screenshots of both versions
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function visualCompare() {
  console.log('📸 Taking comparison screenshots...\n');

  const browser = await chromium.launch({ headless: false });

  // Production
  const pageProd = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pageProd.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle' });
  await pageProd.waitForTimeout(3000);
  await pageProd.screenshot({ path: 'bundle-analysis/production-screenshot.png' });
  console.log('✅ Production screenshot saved');

  // Get production scene details
  const prodDetails = await pageProd.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'no canvas',
      backgroundColor: canvas ? window.getComputedStyle(canvas).backgroundColor : 'unknown',
      allElements: document.querySelectorAll('*').length,
      controls: document.querySelectorAll('.control-button, .float-toolbar-button').length
    };
  });

  console.log('\n🎨 Production Details:');
  console.log('  Canvas:', prodDetails.canvasSize);
  console.log('  Background:', prodDetails.backgroundColor);
  console.log('  Total elements:', prodDetails.allElements);
  console.log('  Control buttons:', prodDetails.controls);

  // Local
  const pageLocal = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pageLocal.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await pageLocal.waitForTimeout(3000);
  await pageLocal.screenshot({ path: 'bundle-analysis/local-screenshot.png' });
  console.log('\n✅ Local screenshot saved');

  // Get local scene details
  const localDetails = await pageLocal.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'no canvas',
      backgroundColor: canvas ? window.getComputedStyle(canvas).backgroundColor : 'unknown',
      allElements: document.querySelectorAll('*').length,
      controls: document.querySelectorAll('.control-button, .float-toolbar-button').length
    };
  });

  console.log('\n🎨 Local Details:');
  console.log('  Canvas:', localDetails.canvasSize);
  console.log('  Background:', localDetails.backgroundColor);
  console.log('  Total elements:', localDetails.allElements);
  console.log('  Control buttons:', localDetails.controls);

  console.log('\n📊 COMPARISON:');
  console.log('==================');
  console.log(`Canvas size: ${prodDetails.canvasSize === localDetails.canvasSize ? '✅ MATCH' : '❌ DIFFERENT'}`);
  console.log(`Controls: ${prodDetails.controls === localDetails.controls ? '✅ MATCH' : `❌ DIFFERENT (prod: ${prodDetails.controls}, local: ${localDetails.controls})`}`);

  console.log('\n📁 Screenshots saved to bundle-analysis/');
  console.log('   - production-screenshot.png');
  console.log('   - local-screenshot.png');
  console.log('\n⏸️  Compare them visually!');

  // Don't close - let user inspect
  // await browser.close();
}

visualCompare().catch(console.error);
