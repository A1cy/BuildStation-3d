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

const PRODUCT_CATALOG = [
  {
    category: 'Bathroom',
    styles: [
      {
        name: 'Cabinet BSC-2DH-GD',
        image: '/Blueprint3D-assets/furniture/bathroom/thumbnails/BSC-2DH-GD.jpg',
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-2DH-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      },
      {
        name: 'Cabinet BSC-2DL-GD',
        image: '/Blueprint3D-assets/furniture/bathroom/thumbnails/BSC-2DL-GD.jpg',
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-2DL-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      },
      {
        name: 'Cabinet BSC-LDH-GD',
        image: '/Blueprint3D-assets/furniture/bathroom/thumbnails/BSC-LDH-GD.jpg',
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-LDH-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet'
      },
      {
        name: 'Cabinet BSC-OP',
        image: '/Blueprint3D-assets/furniture/bathroom/thumbnails/BSC-OP.jpg',
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
        name: 'Bed Frame',
        image: '/Blueprint3D-assets/furniture/bedroom/thumbnails/bed.jpg',
        model: '/Blueprint3D-assets/furniture/bedroom/bed.glb',
        type: 'furniture',
        subtype: 'bed'
      },
      {
        name: 'Nightstand',
        image: '/Blueprint3D-assets/furniture/bedroom/thumbnails/nightstand.jpg',
        model: '/Blueprint3D-assets/furniture/bedroom/nightstand.glb',
        type: 'furniture',
        subtype: 'nightstand'
      },
      {
        name: 'Dresser',
        image: '/Blueprint3D-assets/furniture/bedroom/thumbnails/dresser.jpg',
        model: '/Blueprint3D-assets/furniture/bedroom/dresser.glb',
        type: 'furniture',
        subtype: 'dresser'
      },
      {
        name: 'Wardrobe',
        image: '/Blueprint3D-assets/furniture/bedroom/thumbnails/wardrobe.jpg',
        model: '/Blueprint3D-assets/furniture/bedroom/wardrobe.glb',
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
