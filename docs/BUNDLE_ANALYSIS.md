# Bundle Composition Analysis

Build-Station 3D is a production-bundled application. This document analyzes the compiled JavaScript bundles to understand the application structure and dependencies.

## Bundle Overview

### Total Bundle Size: 1.3MB (uncompressed)

```
static/js/
├── vendor.bundle.js              901 KB  (Vendor bundle - React + Three.js + Blueprint3D)
├── app.bundle.js                 382 KB  (Application code - Build-Station 3D logic)
├── lazy.bundle.js                4.2 KB  (Lazy-loaded features)
└── webpack-runtime.js            2.3 KB  (Webpack module loader)
```

### Analyzing Bundles

Run the following command to generate a visual bundle analysis:

```bash
npm run analyze
```

This creates `bundle-report.html` with an interactive treemap of bundle contents.

---

## Main Application Bundle (app.bundle.js - 382KB)

### Identified Components

The application bundle contains the Build-Station 3D core logic and UI components.

### Key Application Features

Based on live version testing at https://threejs-room-configurator.netlify.app/:

#### 1. Floor Plan Editor
- **Wall Drawing**: Click and drag to create walls
- **Corner Manipulation**: Move corners to reshape rooms
- **2D Canvas Interaction**: Mouse-based editing tools
- **Grid System**: Snap-to-grid functionality
- **Measurements**: Real-time dimension display

#### 2. 3D Viewer
- **Camera Controls**: OrbitControls for pan/rotate/zoom
- **Lighting Setup**: Ambient + directional lighting
- **Model Loading**: GLB asset loader with progress tracking
- **Shadows**: Real-time shadow rendering
- **Materials**: PBR material system

#### 3. Product Configurator
- **Dimension Controls**: Width, height, depth sliders with morph targets
- **Material Selection**: Texture picker for different model parts
- **Style Variants**: Dropdown for model style selection (e.g., door types)
- **Real-time Preview**: Immediate visual feedback

#### 4. UI Components
- **Sidebar Navigation**: Mode switcher (2D/3D), product categories
- **Product List**: Scrollable grid of available furniture models
- **Property Panels**: Context-sensitive configuration options
- **Toolbar**: Drawing tools, selection mode, delete
- **Status Bar**: Notifications and measurements

### Component Structure (Estimated)

```javascript
// Estimated component hierarchy from bundle analysis
App
├── FloorPlanner (2D Editor)
│   ├── Canvas2D
│   ├── WallEditor
│   ├── CornerEditor
│   └── MeasurementOverlay
├── Viewer3D (Three.js Renderer)
│   ├── Scene
│   ├── Camera
│   ├── Lights
│   ├── ModelManager
│   └── Controls
├── Sidebar
│   ├── ModeSelector
│   ├── CategoryList
│   └── ProductGrid
├── PropertyPanel
│   ├── DimensionControls
│   ├── MaterialPicker
│   └── StyleSelector
└── Toolbar
    ├── DrawingTools
    ├── SelectionMode
    └── Actions
```

---

## Vendor Bundle (vendor.bundle.js - 901KB)

### React Ecosystem (Identified from LICENSE.txt)

```javascript
// React 17.0.1
- react@17.0.1
- react-dom@17.0.1
- react-jsx-runtime@17.0.1
- scheduler@0.20.1
```

### Three.js Components

Based on bundle header analysis, the following Three.js modules are included:

```javascript
// Core Three.js Library
- Vector2, Vector3, Vector4
- Matrix3, Matrix4
- Quaternion
- Euler
- EventDispatcher
- Texture
- WebGLRenderTarget
- WebGLMultisampleRenderTarget

// Geometry & Math
- BufferGeometry
- BufferAttribute
- Raycaster
- Box3, Sphere
- Frustum, Plane

// Materials & Rendering
- MeshBasicMaterial
- MeshPhongMaterial
- MeshStandardMaterial
- ShaderMaterial
- WebGLRenderer
- WebGLState

// Loaders
- GLTFLoader (for .glb models)
- TextureLoader
- ImageLoader

// Controls
- OrbitControls (camera interaction)

// Lights
- AmbientLight
- DirectionalLight
- PointLight
- SpotLight

// Scene Graph
- Scene
- Group
- Object3D
- Mesh
```

### Blueprint3D Integration

**Blueprint3D** is the floor planning library embedded within the vendor bundle.

**Capabilities:**
- Floor plan creation and editing
- Wall/corner geometry management
- Room configuration and validation
- 2D/3D coordinate transformation
- Snap-to-grid and measurement systems

**Integration Pattern:**
```javascript
// Blueprint3D exports (estimated)
Blueprint3D.Core
├── Model (Floor plan data model)
├── Floorplanner (2D editor)
├── View3D (Three.js integration)
└── Configuration (Product config system)
```

**Note:** Blueprint3D is not a public npm package - it's custom-built for this configurator.

---

## Asset Loading Patterns

### GLB Models

Models are loaded from `Blueprint3D-assets/models/glb/` using GLTFLoader:

```javascript
// Example loading pattern (reverse-engineered)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load(
  'Blueprint3D-assets/models/glb/DESK-RCL.glb',
  (gltf) => {
    scene.add(gltf.scene);
    // Apply materials, morphs, etc.
  }
);
```

### Textures

Textures loaded from `Blueprint3D-assets/textures/`:

```javascript
// Example texture loading (reverse-engineered)
import { TextureLoader } from 'three';

const textureLoader = new TextureLoader();
const texture = textureLoader.load('Blueprint3D-assets/textures/Mahogany-w365.jpg');
```

### Room Presets

Room configurations stored in `Blueprint3D-assets/rooms/`:
- JSON files defining wall positions, products, materials
- Loaded on room template selection

---

## Furniture Model Naming Conventions

### Categories

| Prefix | Category | Examples |
|--------|----------|----------|
| `BC-`  | Bedroom Cabinets | `BC-MB`, `BC-RC`, `BC-SB` |
| `BR-`  | Bedroom (Beds, Wardrobes) | `BR-BML`, `BR-BMR`, `BR-RB`, `BR-WL`, `BR-WR` |
| `BSC-` | Bathroom Storage Cabinets | `BSC-2DH-GD`, `BSC-LDL-PD` |
| `DESK-`| Desks | `DESK-BF`, `DESK-RCL`, `DESK-RCR` |

### Suffixes

| Suffix | Meaning | Description |
|--------|---------|-------------|
| `-GD`  | Glass Door | Transparent glass door variant |
| `-PD`  | Panel Door | Solid panel door variant |
| `-L`   | Left | Left-handed orientation |
| `-R`   | Right | Right-handed orientation |
| `-H`   | High | Taller variant |
| `-L`   | Low | Shorter variant |
| `-2D`  | 2 Drawer | Two drawer configuration |
| `-LD`  | Left Drawer | Left-side drawer |
| `-RD`  | Right Drawer | Right-side drawer |

### Example Breakdown

**`BSC-2DH-GD.glb`**
- `BSC` = Bathroom Storage Cabinet
- `2D` = 2 Drawer configuration
- `H` = High (taller)
- `GD` = Glass Door

**`DESK-ECUL24C24E.glb`**
- `DESK` = Desk category
- `ECUL` = Executive Corner Unit Left
- `24C24E` = Dimensions: 24" corner, 24" extension

---

## Configuration Properties

### 1. Dimensions (Morph Targets)

Models use **morph targets** for dimension changes, not simple scaling:

```javascript
// Morph target animation (estimated)
model.morphTargetInfluences[0] = widthFactor;  // 0.0 to 1.0
model.morphTargetInfluences[1] = heightFactor;
model.morphTargetInfluences[2] = depthFactor;
```

**Why Morph Targets?**
- Maintains proper proportions (e.g., door frame thickness stays constant)
- Realistic dimensional changes
- Defined by 3D artist in modeling software

### 2. Materials (Texture Mapping)

Models support **per-part material assignment**:

```javascript
// Material application (estimated)
model.traverse((child) => {
  if (child.isMesh && child.name === 'door') {
    child.material = woodTexture;
  }
  if (child.isMesh && child.name === 'handle') {
    child.material = metalTexture;
  }
});
```

### 3. Styles (Model Variants)

Style variants are **separate GLB files**:

```javascript
// Style switching (estimated)
const styles = [
  'BSC-2DH-GD.glb',  // Glass door
  'BSC-2DH-PD.glb'   // Panel door
];

loadModel(styles[selectedStyleIndex]);
```

---

## Performance Considerations

### Bundle Loading

1. **Initial Load**: webpack-runtime.js → vendor.bundle.js (React + Three.js + Blueprint3D)
2. **Application Load**: app.bundle.js (Build-Station 3D logic)
3. **Lazy Load**: lazy.bundle.js (on-demand features)

### Asset Loading Strategy

- **Models**: Loaded on-demand when placed in scene
- **Textures**: Preloaded for common materials, lazy-loaded for others
- **Room Presets**: Loaded when template selected

### Optimization Opportunities

1. **Code Splitting**: Further split application bundle by route/feature
2. **Asset Compression**: Draco compression for GLB models
3. **Texture Atlasing**: Combine textures to reduce HTTP requests
4. **Progressive Loading**: Load low-poly models first, upgrade to high-poly

---

## Reverse Engineering Notes

### To Recreate Source Files

If you need to modify the application logic:

1. **Install Tools**:
   ```bash
   npm install -g webpack-bundle-analyzer
   npm install -g js-beautify
   ```

2. **Beautify Bundles**:
   ```bash
   js-beautify static/js/app.bundle.js > app.beautified.js
   ```

3. **Identify Component Boundaries**:
   - Search for `function Component(props)` patterns
   - Look for React.createElement calls
   - Identify useState/useEffect hooks

4. **Extract Components**:
   - Copy component functions to separate files
   - Add proper imports
   - Test incrementally

5. **Rebuild with Modern Stack**:
   ```bash
   npm create vite@latest build-station-3d -- --template react
   # Copy extracted components
   # Add Three.js dependencies
   # Configure build
   ```

**Complexity**: HIGH (several days of work)
**Recommendation**: Only undertake if you need to modify core logic

---

## References

- **Live Version**: https://threejs-room-configurator.netlify.app/
- **Three.js Docs**: https://threejs.org/docs/
- **React Docs**: https://react.dev/
- **GLTF Spec**: https://github.com/KhronosGroup/glTF

---

**Last Updated**: 2025-12-07
**Bundle Version**: Production build (CRA-based)
