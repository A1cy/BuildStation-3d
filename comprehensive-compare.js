const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  console.log('\n========================================');
  console.log('COMPREHENSIVE LOCAL vs PRODUCTION COMPARISON');
  console.log('========================================\n');

  // Test LOCAL
  console.log('=== TESTING LOCAL VERSION ===\n');
  const localPage = await browser.newPage();
  await localPage.setViewportSize({ width: 1280, height: 720 });

  // Collect console messages and errors
  const localConsole = [];
  const localErrors = [];
  localPage.on('console', msg => localConsole.push(`[${msg.type()}] ${msg.text()}`));
  localPage.on('pageerror', err => localErrors.push(err.message));

  await localPage.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
  await localPage.waitForTimeout(5000);

  const localAnalysis = await localPage.evaluate(() => {
    // 1. Check bottom navigation icons
    const bottomNav = document.querySelector('.bottom-toolbar') ||
                      document.querySelector('[class*="bottom"]') ||
                      document.querySelector('.navigation-controls');

    let bottomIcons = [];
    if (bottomNav) {
      const icons = bottomNav.querySelectorAll('span[class*="fa"], i[class*="fa"], button');
      bottomIcons = Array.from(icons).map(icon => ({
        classes: icon.className,
        visible: icon.offsetWidth > 0 && icon.offsetHeight > 0,
        dimensions: `${icon.offsetWidth}x${icon.offsetHeight}`,
        innerHTML: icon.innerHTML.substring(0, 50)
      }));
    }

    // 2. Check for Three.js canvas
    const canvas = document.querySelector('canvas');
    const canvasInfo = canvas ? {
      exists: true,
      width: canvas.width,
      height: canvas.height,
      className: canvas.className,
      parent: canvas.parentElement?.className
    } : { exists: false };

    // 3. Check for texture/material panels
    const texturePanel = document.querySelector('.styles-section') ||
                         document.querySelector('[class*="texture"]') ||
                         document.querySelector('[class*="material"]');

    const texturePanelInfo = texturePanel ? {
      exists: true,
      className: texturePanel.className,
      children: texturePanel.children.length,
      visible: texturePanel.offsetWidth > 0
    } : { exists: false };

    // 4. Check all script tags
    const scripts = Array.from(document.scripts).map(s => ({
      src: s.src || 'inline',
      type: s.type,
      crossOrigin: s.crossOrigin
    }));

    // 5. Check stylesheets
    const stylesheets = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href || 'inline',
      rulesCount: sheet.cssRules ? sheet.cssRules.length : 'blocked'
    }));

    // 6. Look for bottom navigation in HTML structure
    const body = document.body;
    const allElements = body.querySelectorAll('*');
    const bottomElements = [];
    for (let el of allElements) {
      const className = el.className;
      if (typeof className === 'string' &&
          (className.includes('bottom') ||
           className.includes('navigation') ||
           className.includes('controls') ||
           className.includes('toolbar'))) {
        bottomElements.push({
          tag: el.tagName,
          className: className,
          children: el.children.length,
          visible: el.offsetWidth > 0 && el.offsetHeight > 0,
          position: window.getComputedStyle(el).position
        });
      }
    }

    return {
      bottomNav: {
        found: !!bottomNav,
        className: bottomNav?.className || 'NOT FOUND',
        icons: bottomIcons
      },
      canvas: canvasInfo,
      texturePanel: texturePanelInfo,
      scripts: scripts.filter(s => s.src !== 'inline'),
      stylesheets: stylesheets.filter(s => s.href !== 'inline'),
      bottomElements: bottomElements,
      url: window.location.href
    };
  });

  console.log('LOCAL ANALYSIS:');
  console.log(JSON.stringify(localAnalysis, null, 2));
  console.log('\nLOCAL CONSOLE MESSAGES:');
  localConsole.slice(0, 20).forEach(msg => console.log(msg));
  if (localErrors.length > 0) {
    console.log('\nLOCAL ERRORS:');
    localErrors.forEach(err => console.log(err));
  }

  await localPage.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/local-full-analysis.png', fullPage: true });

  // Test PRODUCTION
  console.log('\n\n=== TESTING PRODUCTION VERSION ===\n');
  const prodPage = await browser.newPage();
  await prodPage.setViewportSize({ width: 1280, height: 720 });

  const prodConsole = [];
  const prodErrors = [];
  prodPage.on('console', msg => prodConsole.push(`[${msg.type()}] ${msg.text()}`));
  prodPage.on('pageerror', err => prodErrors.push(err.message));

  await prodPage.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await prodPage.waitForTimeout(5000);

  const prodAnalysis = await prodPage.evaluate(() => {
    // Same checks as local
    const bottomNav = document.querySelector('.bottom-toolbar') ||
                      document.querySelector('[class*="bottom"]') ||
                      document.querySelector('.navigation-controls');

    let bottomIcons = [];
    if (bottomNav) {
      const icons = bottomNav.querySelectorAll('span[class*="fa"], i[class*="fa"], button');
      bottomIcons = Array.from(icons).map(icon => ({
        classes: icon.className,
        visible: icon.offsetWidth > 0 && icon.offsetHeight > 0,
        dimensions: `${icon.offsetWidth}x${icon.offsetHeight}`,
        innerHTML: icon.innerHTML.substring(0, 50)
      }));
    }

    const canvas = document.querySelector('canvas');
    const canvasInfo = canvas ? {
      exists: true,
      width: canvas.width,
      height: canvas.height,
      className: canvas.className,
      parent: canvas.parentElement?.className
    } : { exists: false };

    const texturePanel = document.querySelector('.styles-section') ||
                         document.querySelector('[class*="texture"]') ||
                         document.querySelector('[class*="material"]');

    const texturePanelInfo = texturePanel ? {
      exists: true,
      className: texturePanel.className,
      children: texturePanel.children.length,
      visible: texturePanel.offsetWidth > 0
    } : { exists: false };

    const scripts = Array.from(document.scripts).map(s => ({
      src: s.src || 'inline',
      type: s.type,
      crossOrigin: s.crossOrigin
    }));

    const stylesheets = Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href || 'inline',
      rulesCount: sheet.cssRules ? sheet.cssRules.length : 'blocked'
    }));

    const body = document.body;
    const allElements = body.querySelectorAll('*');
    const bottomElements = [];
    for (let el of allElements) {
      const className = el.className;
      if (typeof className === 'string' &&
          (className.includes('bottom') ||
           className.includes('navigation') ||
           className.includes('controls') ||
           className.includes('toolbar'))) {
        bottomElements.push({
          tag: el.tagName,
          className: className,
          children: el.children.length,
          visible: el.offsetWidth > 0 && el.offsetHeight > 0,
          position: window.getComputedStyle(el).position
        });
      }
    }

    return {
      bottomNav: {
        found: !!bottomNav,
        className: bottomNav?.className || 'NOT FOUND',
        icons: bottomIcons
      },
      canvas: canvasInfo,
      texturePanel: texturePanelInfo,
      scripts: scripts.filter(s => s.src !== 'inline'),
      stylesheets: stylesheets.filter(s => s.href !== 'inline'),
      bottomElements: bottomElements,
      url: window.location.href
    };
  });

  console.log('PRODUCTION ANALYSIS:');
  console.log(JSON.stringify(prodAnalysis, null, 2));
  console.log('\nPRODUCTION CONSOLE MESSAGES:');
  prodConsole.slice(0, 20).forEach(msg => console.log(msg));
  if (prodErrors.length > 0) {
    console.log('\nPRODUCTION ERRORS:');
    prodErrors.forEach(err => console.log(err));
  }

  await prodPage.screenshot({ path: '/mnt/c/A1 Codes/threejs-3d-room-designer/production-full-analysis.png', fullPage: true });

  console.log('\n\n========================================');
  console.log('KEY DIFFERENCES:');
  console.log('========================================\n');

  console.log('1. BOTTOM NAVIGATION:');
  console.log(`   Local: ${localAnalysis.bottomNav.found ? 'FOUND' : 'NOT FOUND'} (${localAnalysis.bottomNav.icons.length} icons)`);
  console.log(`   Production: ${prodAnalysis.bottomNav.found ? 'FOUND' : 'NOT FOUND'} (${prodAnalysis.bottomNav.icons.length} icons)`);

  console.log('\n2. CANVAS:');
  console.log(`   Local: ${localAnalysis.canvas.exists ? 'EXISTS' : 'MISSING'}`);
  console.log(`   Production: ${prodAnalysis.canvas.exists ? 'EXISTS' : 'MISSING'}`);

  console.log('\n3. TEXTURE PANEL:');
  console.log(`   Local: ${localAnalysis.texturePanel.exists ? 'EXISTS' : 'MISSING'}`);
  console.log(`   Production: ${prodAnalysis.texturePanel.exists ? 'EXISTS' : 'MISSING'}`);

  console.log('\n4. SCRIPTS:');
  console.log(`   Local: ${localAnalysis.scripts.length} external scripts`);
  console.log(`   Production: ${prodAnalysis.scripts.length} external scripts`);

  console.log('\n5. BOTTOM ELEMENTS FOUND:');
  console.log(`   Local: ${localAnalysis.bottomElements.length} elements with "bottom"/"navigation"/"controls"`);
  console.log(`   Production: ${prodAnalysis.bottomElements.length} elements with "bottom"/"navigation"/"controls"`);

  await browser.close();
})();
