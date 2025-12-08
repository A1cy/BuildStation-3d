const { chromium } = require('playwright');

async function inspectDOM() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  const domStructure = await page.evaluate(() => {
    function getElementInfo(el, depth = 0) {
      if (depth > 3) return null;

      const info = {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: el.className ? Array.from(el.classList) : [],
        childCount: el.children.length,
        children: []
      };

      if (depth < 3) {
        for (let child of el.children) {
          const childInfo = getElementInfo(child, depth + 1);
          if (childInfo) info.children.push(childInfo);
        }
      }

      return info;
    }

    const root = document.getElementById('root');
    return root ? getElementInfo(root) : null;
  });

  console.log('DOM Structure:');
  console.log(JSON.stringify(domStructure, null, 2));

  // Also get all elements with IDs
  const elementsWithIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[id]');
    return Array.from(elements).map(el => ({
      id: el.id,
      tag: el.tagName.toLowerCase(),
      classes: el.className ? Array.from(el.classList) : []
    }));
  });

  console.log('\n\nAll elements with IDs:');
  elementsWithIds.forEach(el => {
    console.log(`  - #${el.id} <${el.tag}> ${el.classes.length ? `[${el.classes.join(', ')}]` : ''}`);
  });

  await browser.close();
}

inspectDOM().catch(console.error);
