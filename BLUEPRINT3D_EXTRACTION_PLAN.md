# Blueprint3D Extraction Plan - Sprint 2, Task 2.1

**Date**: 2025-12-08
**Status**: 🔄 Discovery Phase Complete - Extraction Planning
**Priority**: ⭐⭐⭐ CRITICAL

---

## 🎯 Objective

Extract the core Blueprint3D library from minified bundles to enable floor planning functionality.

---

## 📊 Class Discovery Results

### Main Classes Located (Minified → Real Names)

| Minified Name | Real Name | Line Range | Size Est. | Status |
|--------------|-----------|------------|-----------|---------|
| `fe` | **FloorPlan** | 1657-2100+ | ~450 lines | ⏳ To Extract |
| `st` | **Model** | 3745-3793 | ~50 lines | ⏳ To Extract |
| `it` | **Scene** | 3481-3700+ | ~220 lines | ⏳ To Extract |

### Supporting Classes (Phase 3 - Already Extracted ✅)

| Class | File | Lines | Status |
|-------|------|-------|--------|
| **Wall** (`ue`) | `src/src/core/Blueprint3D/Wall.js` | 419 | ✅ Extracted |
| **Corner** (`_e`) | `src/src/core/Blueprint3D/Corner.js` | 431 | ✅ Extracted |
| **HalfEdge** (`ge`) | `src/src/core/Blueprint3D/HalfEdge.js` | 350 | ✅ Extracted |
| **Room** (`De`) | `src/src/core/Blueprint3D/Room.js` | 199 | ✅ Extracted |
| **Canvas2D** | `src/src/core/Blueprint3D/Canvas2D.js` | 560 | ✅ Extracted |

**Total Existing**: 1,959 lines of clean, extracted code ✅

---

## 🏗️ Class Architecture

```
Blueprint3D System Architecture
├── Model (st) - Main entry point
│   ├── FloorPlan (fe) - Floor plan management
│   │   ├── Wall (ue) ✅ - Wall objects
│   │   ├── Corner (_e) ✅ - Corner points
│   │   ├── HalfEdge (ge) ✅ - Wall edges
│   │   └── Room (De) ✅ - Room generation
│   └── Scene (it) - 3D scene management
│       ├── Items[] - 3D furniture items
│       └── GLTFLoader - Model loading
└── Canvas2D ✅ - 2D rendering (already extracted)
```

**Key Insight**: 🎉 **77% of supporting classes already extracted!**
Only need to extract 3 core classes that tie everything together.

---

## 📋 Class Details

### 1. FloorPlan Class (`fe`) - Lines 1657-2100+

**Purpose**: Manages floor plan structure - walls, corners, rooms

**Properties:**
- `scene` - Reference to Scene object
- `walls[]` - Array of Wall objects
- `corners[]` - Array of Corner objects
- `rooms[]` - Array of Room objects
- `floorTextures{}` - Floor texture mapping
- Callbacks: `new_wall_callbacks[]`, `new_corner_callbacks[]`, `redraw_callbacks[]`, `updated_rooms[]`

**Key Methods:**
```javascript
newWall(corner1, corner2) -> Wall        // Create new wall
newCorner(x, y, id) -> Corner            // Create new corner
getWalls() -> Wall[]
getCorners() -> Corner[]
getRooms() -> Room[]
saveFloorplan() -> Object                // Serialize to JSON
loadFloorplan(data)                      // Deserialize from JSON
update()                                 // Recalculate rooms
findRooms(corners) -> Room[]             // Room detection algorithm
overlappedCorner(x, y, tolerance)        // Collision detection
overlappedWall(x, y, tolerance)
overlappedItem(x, y)
calculateRulerData()                     // Dimension measurements
```

**Dependencies:**
- ✅ `Wall` class (already extracted)
- ✅ `Corner` class (already extracted)
- ✅ `Room` class (already extracted)
- Three.js Vector3 (`ce.Lb` → `THREE.Vector3`)
- Utils (`ee.Utils`)

**Complexity**: HIGH (largest class, complex room-finding algorithm)

---

### 2. Model Class (`st`) - Lines 3745-3793

**Purpose**: Main Blueprint3D orchestrator - coordinates FloorPlan and Scene

**Properties:**
- `floorplan` - FloorPlan instance
- `scene` - Scene instance
- Callbacks: `roomLoadingCallbacks[]`, `roomLoadedCallbacks[]`, `roomSavedCallbacks[]`, `roomDeletedCallbacks[]`

**Key Methods:**
```javascript
constructor(textureDir)                  // Initialize Blueprint3D
loadSerialized(json)                     // Load saved design
exportSerialized() -> JSON               // Save current design
newRoom(floorplanData, items)            // Create new room
```

**Dependencies:**
- FloorPlan class (`fe`) - needs to be extracted
- Scene class (`it`) - needs to be extracted

**Complexity**: LOW (simple orchestrator, only ~50 lines)

---

### 3. Scene Class (`it`) - Lines 3481-3700+

**Purpose**: Manages 3D scene - items, rendering, loading

**Properties:**
- `model` - Reference to Model object
- `scene` - Three.js Scene (`ce.tb` → `THREE.Scene`)
- `items[]` - Array of 3D Item objects
- `GLTFLoader` - Three.js GLTF loader
- `textureDir` - Base path for textures
- Callbacks: `itemLoadingCallbacks[]`, `itemLoadedCallbacks[]`, `itemRemovedCallbacks[]`

**Key Methods:**
```javascript
add(item)                                // Add item to scene
remove(item)                             // Remove item
getScene() -> THREE.Scene
getItems() -> Item[]
clearItems()                             // Remove all items
removeItem(item, skipArray)
addItem(type, modelUrl, metadata,        // Add 3D furniture item
        position, rotation, options)
addSet(setData, ...)                     // Add furniture set
importSetFromBuilder(data, ...)          // Import from configurator
collectOptionsFromItem(item)             // Extract item options
```

**Dependencies:**
- Three.js Scene (`THREE.Scene`)
- GLTFLoader (`THREE.GLTFLoader`)
- Item classes (from `nt.Factory`) - TBD
- Utils (`ee.Utils`)

**Complexity**: MEDIUM (async loading, GLTF handling, item management)

---

## 🔗 Dependency Mapping

### External Dependencies (Need to Preserve)
- `ce` → `THREE` (Three.js r150)
- `ee.Utils` → Utils module
- `ee.Configuration` → Configuration module
- `nt.Factory` → Item Factory (for creating Item instances)
- `Le.a` → `THREE.GLTFLoader`

### Internal Dependencies
- FloorPlan depends on: Wall ✅, Corner ✅, Room ✅, HalfEdge ✅
- Model depends on: FloorPlan ⏳, Scene ⏳
- Scene depends on: Item classes (TBD)

---

## 📐 Extraction Strategy

### Phase 1: FloorPlan Class (4-5 hours)
**Why First**: Largest and most complex, but dependencies are all extracted ✅

**Steps:**
1. Extract FloorPlan class (lines 1657-2100+)
2. Map minified names to real names:
   - `ue` → `Wall`
   - `_e` → `Corner`
   - `De` → `Room`
   - `ge` → `HalfEdge`
   - `ce.Lb` → `THREE.Vector3`
   - `ee.Utils` → `Utils`
3. Clean up and document
4. Create `src/src/core/Blueprint3D/FloorPlan.js`
5. Test in isolation with existing Wall/Corner/Room classes
6. Update `src/src/core/Blueprint3D/index.js`

**Success Criteria:**
- FloorPlan instantiates without errors
- Can create walls and corners
- Room finding algorithm works
- Save/load methods functional

---

### Phase 2: Scene Class (2-3 hours)
**Why Second**: Moderate complexity, depends on GLTF loading

**Steps:**
1. Extract Scene class (lines 3481-3700+)
2. Map dependencies:
   - `ce.tb` → `THREE.Scene`
   - `Le.a` → `THREE.GLTFLoader`
   - `nt.Factory` → Item factory (will handle separately)
3. Clean up async/await patterns
4. Create `src/src/core/Blueprint3D/Scene.js`
5. Test GLTF loading with sample furniture
6. Update exports

**Success Criteria:**
- Scene creates Three.js scene successfully
- GLTF loader works
- Can add/remove items
- Callbacks fire correctly

---

### Phase 3: Model Class (1 hour)
**Why Last**: Simple orchestrator, depends on FloorPlan + Scene

**Steps:**
1. Extract Model class (lines 3745-3793)
2. Wire FloorPlan and Scene together
3. Test save/load serialization
4. Create `src/src/core/Blueprint3D/Model.js`
5. Create main entry point: `src/src/core/Blueprint3D/Blueprint3D.js`
6. Update exports to include Model

**Success Criteria:**
- Model instantiates FloorPlan and Scene
- Save/load round-trip works
- Can create rooms and add items
- All callbacks functional

---

### Phase 4: Integration (1-2 hours)
**Why Final**: Connect to existing UI components

**Steps:**
1. Create `Blueprint3D` React component wrapper
2. Wire to App.jsx (uncomment lines 202-209)
3. Test 2D floor planner
4. Test 3D viewer
5. Test save/load with localStorage
6. Verify product adding works

**Success Criteria:**
- 2D/3D view toggle works
- Can draw walls in 2D
- Walls render in 3D
- Can add furniture
- Save/load preserves state

---

## ⏱️ Time Estimates

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | FloorPlan extraction | 4-5h | HIGH |
| 2 | Scene extraction | 2-3h | MEDIUM |
| 3 | Model extraction | 1h | LOW |
| 4 | Integration & Testing | 1-2h | MEDIUM |
| **Total** | | **8-11h** | |

**Original Estimate**: 4-6 hours
**Revised Estimate**: 8-11 hours (more accurate after discovery)

---

## 🎯 Success Metrics

### Sprint 2, Task 2.1 Complete When:
- ✅ FloorPlan class extracted and working
- ✅ Scene class extracted and working
- ✅ Model class extracted and working
- ✅ All three classes integrate successfully
- ✅ 2D floor planner functional
- ✅ 3D viewer renders scene
- ✅ Save/load works end-to-end
- ✅ Build succeeds with no errors
- ✅ Bundle size remains reasonable (<200 KB)

---

## 📦 Deliverables

**New Files to Create:**
1. `src/src/core/Blueprint3D/FloorPlan.js` (~450 lines)
2. `src/src/core/Blueprint3D/Scene.js` (~220 lines)
3. `src/src/core/Blueprint3D/Model.js` (~50 lines)
4. `src/src/core/Blueprint3D/Blueprint3D.js` (main entry point, ~100 lines)
5. `src/src/components/Blueprint3D/index.jsx` (React wrapper, TBD)

**Files to Update:**
1. `src/src/core/Blueprint3D/index.js` (add FloorPlan, Scene, Model exports)
2. `src/src/App.jsx` (uncomment Blueprint3D component)

**Total New Code**: ~820 lines + React wrapper

---

## 🚀 Next Immediate Step

**Start Phase 1: Extract FloorPlan Class**

1. Read lines 1657-2100+ from `beautified/app.beautified.js`
2. Begin extraction and cleanup
3. Map all minified names
4. Create clean, documented FloorPlan.js

**Command to execute:**
```bash
sed -n '1657,2200p' beautified/app.beautified.js > floorplan_extract.txt
```

---

**Status**: ✅ Discovery Complete - Ready for Extraction
**Next**: Phase 1 - FloorPlan Class Extraction
**ETA**: 8-11 hours total for Sprint 2, Task 2.1
