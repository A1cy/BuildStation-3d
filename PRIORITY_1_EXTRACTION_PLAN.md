# Priority 1 Extraction Plan: 3D View Mode

## 🎯 Mission: Switch from 2D Blueprint View to 3D Perspective View

**Impact**: +25% visual parity (most visible improvement)
**Estimated Time**: 2-3 days
**Files to Modify**: Blueprint3D.jsx, Scene.js, Floorplan.js

---

## 📋 Feature Breakdown

### **Feature #15: Perspective Camera System** (~200 lines)

**Bundle Location**: Lines 3937-4904
**Target File**: `/src/src/components/Blueprint3D/Blueprint3D.jsx`
**Status**: ⏳ PENDING

**What to Extract**:
```javascript
// 1. Camera initialization with perspective view
const camera = new THREE.PerspectiveCamera(
  45,                              // FOV
  canvasWidth / canvasHeight,      // Aspect ratio
  0.1,                             // Near plane
  10000                            // Far plane
);

// 2. Camera positioning for 3D angled view
camera.position.set(
  roomCenter.x + 15,    // X offset for angle
  12,                   // Y height for top-down angle
  roomCenter.z + 15     // Z offset for angle
);

// 3. Camera lookAt target (room center)
camera.lookAt(roomCenter.x, 0, roomCenter.z);

// 4. Camera update on room changes
const updateCameraPosition = (floorplan) => {
  const center = floorplan.getCenter();
  const size = floorplan.getSize();
  const distance = Math.max(size.x, size.z) * 1.5;

  camera.position.set(
    center.x + distance * 0.7,
    distance * 0.8,
    center.z + distance * 0.7
  );
  camera.lookAt(center.x, 0, center.z);
};

// 5. View mode switching (2D ↔ 3D)
const setViewMode = (mode) => {
  if (mode === '3D') {
    // Perspective camera for 3D view
    camera.fov = 45;
    camera.position.set(x + 15, 12, z + 15);
  } else {
    // Orthographic for 2D blueprint view
    camera = new THREE.OrthographicCamera(...);
    camera.position.set(x, 100, z);
    camera.lookAt(x, 0, z);
  }
  camera.updateProjectionMatrix();
};
```

**Implementation Steps**:
1. Read bundle lines 3937-4904 for camera setup code
2. Add perspective camera initialization to Blueprint3D.jsx constructor
3. Add camera positioning logic based on room center/size
4. Add updateCameraPosition method called on floorplan changes
5. Add view mode switching method (prepare for 2D/3D toggle)
6. Update camera on window resize
7. Test 3D perspective view renders correctly

**Expected Result**: Camera shows room from angled 3D perspective instead of flat top-down

---

### **Feature #16: Textured Floor Rendering** (~100 lines)

**Bundle Location**: Scattered across Scene/Floorplan code
**Target File**: `/src/src/core/Blueprint3D/Scene.js`
**Status**: ⏳ PENDING

**What to Extract**:
```javascript
// 1. Floor texture loading
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/textures/hardwood.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(10, 10);  // Tile texture

// 2. PBR floor material
const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
  roughness: 0.8,      // Not too shiny
  metalness: 0.2,      // Slight metallic
  side: THREE.DoubleSide
});

// 3. Floor geometry (plane)
const roomCorners = floorplan.getCorners();
const floorShape = new THREE.Shape();
floorShape.moveTo(roomCorners[0].x, roomCorners[0].y);
for (let i = 1; i < roomCorners.length; i++) {
  floorShape.lineTo(roomCorners[i].x, roomCorners[i].y);
}
floorShape.closePath();

const floorGeometry = new THREE.ShapeGeometry(floorShape);

// 4. Floor mesh
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;  // Horizontal
floorMesh.position.y = 0.01;          // Slightly above 0 to avoid z-fighting
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// 5. Update floor on room changes
const updateFloor = () => {
  scene.remove(floorMesh);
  floorMesh = createFloorMesh(floorplan);
  scene.add(floorMesh);
};
```

**Implementation Steps**:
1. Search bundle for floor texture loading code
2. Add textureLoader to Scene.js constructor
3. Add createFloorMesh method to Scene.js
4. Load hardwood texture from /textures/ directory
5. Create ShapeGeometry from room corners
6. Apply MeshStandardMaterial with PBR properties
7. Add floor mesh to scene with proper rotation/position
8. Enable shadow receiving on floor
9. Add updateFloor method called on floorplan changes
10. Test floor appears with wood texture

**Expected Result**: Wooden floor texture visible instead of gray background

---

### **Feature #17: 3D Wall Rendering** (~200 lines)

**Bundle Location**: Scattered across Floorplan/Wall code
**Target Files**: `/src/src/core/Blueprint3D/Floorplan.js`, `/src/src/core/Blueprint3D/Scene.js`
**Status**: ⏳ PENDING

**What to Extract**:
```javascript
// 1. Wall 3D material
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,      // White walls
  roughness: 0.9,       // Matte finish
  metalness: 0.1,       // Non-metallic
  side: THREE.DoubleSide
});

// 2. Wall mesh creation (for each wall)
const createWallMesh = (wall) => {
  const start = wall.getStart();
  const end = wall.getEnd();
  const length = wall.length();
  const height = wall.height || 2.5;  // Default 2.5m
  const thickness = wall.thickness || 0.1;

  // Box geometry for wall with thickness
  const wallGeometry = new THREE.BoxGeometry(length, height, thickness);
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

  // Position wall between start and end points
  const center = {
    x: (start.x + end.x) / 2,
    y: height / 2,
    z: (start.y + end.y) / 2
  };
  wallMesh.position.set(center.x, center.y, center.z);

  // Rotate wall to align with edge
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  wallMesh.rotation.y = angle;

  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;

  return wallMesh;
};

// 3. Wall edge indicators (black lines)
const createWallEdges = (wallMesh) => {
  const edgesGeometry = new THREE.EdgesGeometry(wallMesh.geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2
  });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  wallMesh.add(edges);
};

// 4. Render all walls
const renderWalls = () => {
  // Remove old wall meshes
  wallMeshes.forEach(mesh => scene.remove(mesh));
  wallMeshes = [];

  // Create new wall meshes
  floorplan.getWalls().forEach(wall => {
    const wallMesh = createWallMesh(wall);
    createWallEdges(wallMesh);
    scene.add(wallMesh);
    wallMeshes.push(wallMesh);
  });
};
```

**Implementation Steps**:
1. Search bundle for wall 3D rendering code
2. Add wall material to Scene.js
3. Add createWallMesh method to Scene.js
4. Calculate wall position/rotation from start/end points
5. Create BoxGeometry with proper dimensions (length × height × thickness)
6. Add EdgeGeometry for black edge indicators
7. Add renderWalls method to Scene.js
8. Call renderWalls on floorplan changes
9. Enable shadow casting/receiving on walls
10. Test walls appear as 3D meshes with edges

**Expected Result**: Walls appear as 3D white meshes with black edges instead of 2D wireframes

---

### **Feature #18: Lighting System** (~100 lines)

**Bundle Location**: Scattered across Scene code
**Target File**: `/src/src/components/Blueprint3D/Blueprint3D.jsx` and `/src/src/core/Blueprint3D/Scene.js`
**Status**: ⏳ PENDING

**What to Extract**:
```javascript
// 1. Ambient light (overall illumination)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// 2. Directional light (sun-like, creates shadows)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
directionalLight.position.set(10, 20, 10);

// 3. Shadow configuration
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.0001;

scene.add(directionalLight);

// 4. Renderer shadow settings
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Soft shadows

// 5. Optional: Hemisphere light (sky/ground gradient)
const hemisphereLight = new THREE.HemisphereLight(
  0xffffff,  // Sky color
  0x444444,  // Ground color
  0.3        // Intensity
);
scene.add(hemisphereLight);

// 6. Update light position with camera
const updateLightPosition = () => {
  const cameraDirection = camera.position.clone().normalize();
  directionalLight.position.set(
    camera.position.x + 10,
    20,
    camera.position.z + 10
  );
  directionalLight.target.position.set(0, 0, 0);
  directionalLight.target.updateMatrixWorld();
};
```

**Implementation Steps**:
1. Search bundle for lighting setup code
2. Add ambientLight to Scene.js constructor (0.6 intensity)
3. Add directionalLight to Scene.js constructor (0.4 intensity)
4. Configure shadow camera bounds and map size
5. Enable shadowMap on renderer in Blueprint3D.jsx
6. Set shadowMap type to PCFSoftShadowMap
7. Add hemisphere light for subtle gradient
8. Add updateLightPosition method (optional)
9. Test shadows appear on floor and walls
10. Verify overall scene brightness looks realistic

**Expected Result**: Scene has proper lighting with shadows creating depth

---

## 🔄 Integration Steps

After extracting all 4 features:

1. **Test camera view** - Verify 3D perspective angle
2. **Test floor texture** - Verify wood texture loads and tiles correctly
3. **Test wall rendering** - Verify walls are 3D meshes with edges
4. **Test lighting** - Verify shadows appear on floor
5. **Run Playwright comparison** - Capture new screenshots
6. **Compare visual parity** - Should be significantly closer to production
7. **Update SESSION_PROGRESS.md** - Document completion %
8. **Identify next visual gaps** - Based on new screenshots

---

## 📊 Expected Results

### **Before (Current)**:
- 2D flat top-down view
- Gray background
- White wireframe outlines
- No depth or shadows
- Visual parity: ~5%

### **After (Priority 1 Complete)**:
- 3D angled perspective view ✅
- Wooden floor texture ✅
- 3D white walls with black edges ✅
- Ambient + directional lighting with shadows ✅
- Visual parity: **~30%** (+25%)

---

## 🚀 Next Steps

1. **Begin Feature #15** - Extract camera system from bundle
2. **Continue to Feature #16** - Extract floor rendering
3. **Continue to Feature #17** - Extract wall 3D rendering
4. **Complete Feature #18** - Extract lighting system
5. **Test and validate** - Run visual comparison
6. **Reassess gaps** - Capture new Playwright screenshots

---

**Status**: Extraction plan ready. Ready to begin Feature #15 (Camera System).
