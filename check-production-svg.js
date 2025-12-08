const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('\n=== CHECKING PRODUCTION FOR SVG MODE ===\n');

  try {
    await page.goto('https://threejs-room-configurator.netlify.app/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check if icons are rendered as SVG
    const iconStructure = await page.evaluate(() => {
      const iconContainer = document.querySelector('.left-toolbar-button');
      if (!iconContainer) return 'NO ICON CONTAINER FOUND';

      const span = iconContainer.querySelector('span[class*="fa"]');
      if (!span) return 'NO ICON SPAN FOUND';

      // Check if SVG exists inside the span
      const svg = span.querySelector('svg');
      const hasSVG = !!svg;

      return {
        spanOuterHTML: span.outerHTML.substring(0, 300),
        hasSVG: hasSVG,
        svgInfo: hasSVG ? {
          tagName: svg.tagName,
          classList: Array.from(svg.classList),
          innerHTML: svg.innerHTML.substring(0, 200)
        } : null,
        iconContainerHTML: iconContainer.outerHTML.substring(0, 500)
      };
    });

    console.log('\n=== Production Icon Structure ===');
    console.log(JSON.stringify(iconStructure, null, 2));

    // Check all toolbar buttons
    const allIcons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.left-toolbar-button');
      return Array.from(buttons).slice(0, 5).map(button => {
        const span = button.querySelector('span[class*="fa"]');
        if (!span) return 'NO SPAN';

        const svg = span.querySelector('svg');
        return {
          classes: span.className,
          hasSVG: !!svg,
          svgClasses: svg ? Array.from(svg.classList) : null
        };
      });
    });

    console.log('\n=== All Icons (first 5) ===');
    console.log(JSON.stringify(allIcons, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();
