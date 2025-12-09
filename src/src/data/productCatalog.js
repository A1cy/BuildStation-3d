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
 *     materials: [{   // Texture/material options for mesh parts
 *       label: string,
 *       name_in_model: string,  // Mesh name in GLTF
 *       types: Array  // Available texture options
 *     }],
 *     ...otherProperties
 *   }]
 * }]
 */

import { WOOD_TEXTURES, GLASS_TEXTURES, METAL_TEXTURES } from './texturePalettes.js';

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
        subtype: 'bathroom-cabinet',
        materials: [
          {
            label: 'Cabinet Finish',
            name_in_model: 'cabinet',
            types: WOOD_TEXTURES
          },
          {
            label: 'Glass Doors',
            name_in_model: 'glass',
            types: GLASS_TEXTURES
          }
        ]
      },
      {
        name: 'Cabinet BSC-2DL-GD',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-2DL-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet',
        materials: [
          {
            label: 'Cabinet Finish',
            name_in_model: 'cabinet',
            types: WOOD_TEXTURES
          },
          {
            label: 'Glass Doors',
            name_in_model: 'glass',
            types: GLASS_TEXTURES
          }
        ]
      },
      {
        name: 'Cabinet BSC-LDH-GD',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-LDH-GD.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet',
        materials: [
          {
            label: 'Cabinet Finish',
            name_in_model: 'cabinet',
            types: WOOD_TEXTURES
          },
          {
            label: 'Glass Doors',
            name_in_model: 'glass',
            types: GLASS_TEXTURES
          }
        ]
      },
      {
        name: 'Cabinet BSC-OP',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bathroom/BSC-OP.glb',
        type: 'furniture',
        subtype: 'bathroom-cabinet',
        materials: [
          {
            label: 'Cabinet Finish',
            name_in_model: 'cabinet',
            types: WOOD_TEXTURES
          }
        ]
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
        subtype: 'bed',
        materials: [
          {
            label: 'Bed Frame',
            name_in_model: 'bed',
            types: WOOD_TEXTURES
          }
        ]
      },
      {
        name: 'Bed BC-RC',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BC-RC.glb',
        type: 'furniture',
        subtype: 'bed',
        materials: [
          {
            label: 'Bed Frame',
            name_in_model: 'bed',
            types: WOOD_TEXTURES
          }
        ]
      },
      {
        name: 'Bed BC-SB',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BC-SB.glb',
        type: 'furniture',
        subtype: 'bed',
        materials: [
          {
            label: 'Bed Frame',
            name_in_model: 'bed',
            types: WOOD_TEXTURES
          }
        ]
      },
      {
        name: 'Rack BR-BML',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/bedroom/BR-BML.glb',
        type: 'furniture',
        subtype: 'wardrobe',
        materials: [
          {
            label: 'Wardrobe Finish',
            name_in_model: 'wardrobe',
            types: WOOD_TEXTURES
          }
        ]
      }
    ]
  },
  {
    category: 'Office',
    styles: [
      {
        name: 'Executive Desk',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/desk/DESK-BF.glb',
        type: 'furniture',
        subtype: 'desk',
        materials: [
          {
            label: 'Desk Top',
            name_in_model: 'desk-top',
            types: WOOD_TEXTURES
          },
          {
            label: 'Desk Modesty',
            name_in_model: 'desk-modesty',
            types: WOOD_TEXTURES
          },
          {
            label: 'Desk Gable (Left)',
            name_in_model: 'desk-gable-side-left',
            types: WOOD_TEXTURES
          },
          {
            label: 'Desk Gable (Right)',
            name_in_model: 'desk-gable-side-right',
            types: WOOD_TEXTURES
          }
        ]
      },
      {
        name: 'Corner Desk Left',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/desk/DESK-ECUL24C24E.glb',
        type: 'furniture',
        subtype: 'desk',
        materials: [
          {
            label: 'Desktop Surface',
            name_in_model: 'desk',
            types: WOOD_TEXTURES
          }
        ]
      },
      {
        name: 'File Cabinet Mobile',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/desk/DESK-FMB.glb',
        type: 'furniture',
        subtype: 'storage',
        materials: [
          {
            label: 'Cabinet Body',
            name_in_model: 'cabinet',
            types: METAL_TEXTURES
          }
        ]
      },
      {
        name: 'Rolling Chair Left',
        image: PLACEHOLDER_IMG,
        model: '/Blueprint3D-assets/furniture/desk/DESK-RCL.glb',
        type: 'furniture',
        subtype: 'chair',
        materials: [
          {
            label: 'Chair Fabric',
            name_in_model: 'chair',
            types: WOOD_TEXTURES
          }
        ]
      }
    ]
  }
];

export default PRODUCT_CATALOG;
