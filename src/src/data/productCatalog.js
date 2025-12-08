/**
 * Product Catalog
 *
 * Sample product catalog for testing ProductList component.
 * In production, this would be loaded from an API or JSON file.
 *
 * Format:
 * [{
 *   category: string,
 *   styles: [{
 *     name: string,
 *     image: string,
 *     model: string,  // Path to 3D model file
 *     ...otherProperties
 *   }]
 * }]
 */

// Placeholder image data URL (1x1 gray pixel)
const PLACEHOLDER_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89+7dfwAJQwPNonQ0pQAAAABJRU5ErkJggg==';

const PRODUCT_CATALOG = [
  {
    category: 'Bathroom',
    styles: [
      {
        name: 'Cabinet BSC-2DH-GD',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-2DH-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      },
      {
        name: 'Cabinet BSC-2DL-GD',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-2DL-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      },
      {
        name: 'Cabinet BSC-LDH-GD',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-LDH-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      },
      {
        name: 'Cabinet BSC-OP',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-OP.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      }
    ]
  },
  {
    category: 'Bedroom',
    styles: [
      {
        name: 'Bed BC-MB',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BC-MB.glb',
        type: 'furniture',
        subtype: 'bed'
      },
      {
        name: 'Bed BC-RC',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BC-RC.glb',
        type: 'furniture',
        subtype: 'bed'
      },
      {
        name: 'Bed BC-SB',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BC-SB.glb',
        type: 'furniture',
        subtype: 'bed'
      },
      {
        name: 'Rack BR-BML',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BR-BML.glb',
        type: 'furniture',
        subtype: 'wardrobe'
      }
    ]
  },
  {
    category: 'Office',
    styles: [
      {
        name: 'Desk',
        image: '/Blueprint3D-assets/furniture/desk/thumbnails/desk.jpg',
        model: '/Blueprint3D-assets/furniture/desk/desk.glb',
        type: 'furniture',
        subtype: 'desk'
      },
      {
        name: 'Office Chair',
        image: '/Blueprint3D-assets/furniture/desk/thumbnails/chair.jpg',
        model: '/Blueprint3D-assets/furniture/desk/chair.glb',
        type: 'furniture',
        subtype: 'chair'
      },
      {
        name: 'Bookshelf',
        image: '/Blueprint3D-assets/furniture/desk/thumbnails/bookshelf.jpg',
        model: '/Blueprint3D-assets/furniture/desk/bookshelf.glb',
        type: 'furniture',
        subtype: 'storage'
      },
      {
        name: 'File Cabinet',
        image: '/Blueprint3D-assets/furniture/desk/thumbnails/file-cabinet.jpg',
        model: '/Blueprint3D-assets/furniture/desk/file-cabinet.glb',
        type: 'furniture',
        subtype: 'storage'
      }
    ]
  }
];

export default PRODUCT_CATALOG;
