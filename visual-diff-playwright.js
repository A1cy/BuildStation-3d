/**
 * Playwright Visual Comparison Script
 * Compares production (buildstation-3d.com) with local build (localhost:3000)
 * Captures screenshots and identifies visual differences
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const PRODUCTION_URL = 'https://threejs-room-configurator.netlify.app/';
const LOCAL_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './visual-comparison';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function captureScreenshots(page, name, actions = []) {
  console.log(`\n📸 Capturing: ${name}`);

  const screenshots = [];

  // Initial state
  await page.waitForTimeout(2000);
  const initialPath = path.join(SCREENSHOTS_DIR, `${name}-initial.png`);
  await page.screenshot({ path: initialPath, fullPage: false });
  screenshots.push({ name: 'initial', path: initialPath });
  console.log(`  ✓ Initial state captured`);

  // Custom actions
  for (const action of actions) {
    try {
      await action.fn(page);
      await page.waitForTimeout(1000);
      const actionPath = path.join(SCREENSHOTS_DIR, `${name}-${action.name}.png`);
      await page.screenshot({ path: actionPath, fullPage: false });
      screenshots.push({ name: action.name, path: actionPath });
      console.log(`  ✓ ${action.name} captured`);
    } catch (error) {
      console.log(`  ✗ ${action.name} failed: ${error.message}`);
    }
  }

  return screenshots;
}

async function compareVersions() {
  console.log('🚀 Starting Playwright Visual Comparison...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  try {
    // Create contexts for production and local
    const prodContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const localContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const prodPage = await prodContext.newPage();
    const localPage = await localContext.newPage();

    console.log('🌐 Loading production site...');
    await prodPage.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });

    console.log('🏠 Loading local build...');
    await localPage.goto(LOCAL_URL, { waitUntil: 'networkidle' });

    // Define test scenarios
    const scenarios = [
      {
        name: 'empty-canvas',
        description: 'Empty canvas state',
        actions: []
      },
      {
        name: 'with-item',
        description: 'After adding an item',
        actions: [
          {
            name: 'add-item',
            fn: async (page) => {
              // Click on a product in the catalog
              const chair = await page.locator('button[data-product="modern-chair"]').first();
              if (await chair.isVisible()) {
                await chair.click();
                await page.waitForTimeout(500);
              }
            }
          }
        ]
      },
      {
        name: 'item-selected',
        description: 'With item selected',
        actions: [
          {
            name: 'add-item',
            fn: async (page) => {
              const chair = await page.locator('button[data-product="modern-chair"]').first();
              if (await chair.isVisible()) {
                await chair.click();
                await page.waitForTimeout(500);
              }
            }
          },
          {
            name: 'select-item',
            fn: async (page) => {
              // Click in the center of the canvas to select the item
              const canvas = await page.locator('canvas').first();
              const box = await canvas.boundingBox();
              if (box) {
                await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
              }
            }
          }
        ]
      },
      {
        name: 'floating-toolbar',
        description: 'Floating toolbar visible',
        actions: [
          {
            name: 'add-and-select',
            fn: async (page) => {
              const chair = await page.locator('button[data-product="modern-chair"]').first();
              if (await chair.isVisible()) {
                await chair.click();
                await page.waitForTimeout(500);
                const canvas = await page.locator('canvas').first();
                const box = await canvas.boundingBox();
                if (box) {
                  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                }
              }
            }
          }
        ]
      }
    ];

    // Capture screenshots for each scenario
    const results = {
      production: {},
      local: {},
      timestamp: new Date().toISOString()
    };

    for (const scenario of scenarios) {
      console.log(`\n📋 Scenario: ${scenario.description}`);

      // Production screenshots
      await prodPage.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      results.production[scenario.name] = await captureScreenshots(
        prodPage,
        `prod-${scenario.name}`,
        scenario.actions
      );

      // Local screenshots
      await localPage.goto(LOCAL_URL, { waitUntil: 'networkidle' });
      results.local[scenario.name] = await captureScreenshots(
        localPage,
        `local-${scenario.name}`,
        scenario.actions
      );
    }

    // Console inspection
    console.log('\n🔍 Checking console errors...');

    prodPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  PROD ERROR: ${msg.text()}`);
      }
    });

    localPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  LOCAL ERROR: ${msg.text()}`);
      }
    });

    // Reload to capture any console errors
    await prodPage.reload({ waitUntil: 'networkidle' });
    await localPage.reload({ waitUntil: 'networkidle' });
    await prodPage.waitForTimeout(3000);
    await localPage.waitForTimeout(3000);

    // Save results
    const resultsPath = path.join(SCREENSHOTS_DIR, 'comparison-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Results saved to: ${resultsPath}`);

    // Generate comparison report
    console.log('\n📊 VISUAL COMPARISON REPORT');
    console.log('='.repeat(60));
    console.log(`Production: ${PRODUCTION_URL}`);
    console.log(`Local:      ${LOCAL_URL}`);
    console.log(`\nScreenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Review screenshots in visual-comparison/ directory');
    console.log('2. Identify missing visual elements');
    console.log('3. Extract corresponding features from production bundle');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during comparison:', error);
  } finally {
    await browser.close();
  }
}

// Run comparison
compareVersions().catch(console.error);
