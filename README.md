# Build-Station 3D

Interactive 3D room configurator with floor planning and product placement capabilities.

![Build-Station 3D](./screenshots/1.JPG)

## Features

### 1. Floor Plan Designer
Users can edit floor plans in 2D view mode. Move, draw, and delete walls & corners by mouse to design custom floor layouts.

### 2. Room Configuration
Add products (3D models) from the extensive product library and configure their position and orientation in both 3D and 2D view modes.

### 3. Product Configuration
Select products and customize them with advanced configuration options:

**Configuration Properties:**
- **Dimensions** - Dynamic sizing using morph targets (not simple scaling)
- **Materials** - Apply different textures to separate model parts
- **Styles** - Choose from product style variants (e.g., door types, finishes)

*Note: Configuration properties are defined in the 3D model files*

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
npm start            # Start local development server (port 3000)
npm run dev          # Alias for npm start
npm run serve        # Start server and open browser automatically
npm run analyze      # Analyze bundle composition (generates bundle-report.html)
npm run deploy       # Deploy to Vercel (production)
npm run preview      # Deploy preview to Vercel
npm run check-assets # Count total asset files
```

## Project Structure

```
BuildStation-3d/
├── public/                  # Static public files
│   ├── index.html          # Application entry point
│   ├── manifest.json       # PWA manifest
│   ├── favicon.ico         # Site favicon
│   ├── logo192.png         # PWA icon 192x192
│   ├── logo512.png         # PWA icon 512x512
│   ├── robots.txt          # SEO robots
│   └── assets/             # Public assets
│       └── models/         # 3D models & textures
│           ├── furniture/  # Organized by category
│           │   ├── bedroom/   # 8 bedroom models
│           │   ├── bathroom/  # 21 bathroom models
│           │   └── desk/      # 20 desk models
│           ├── textures/   # 23 material textures
│           └── rooms/      # 2 room presets
├── dist/                   # Compiled bundles (build output)
│   ├── js/                # JavaScript bundles
│   │   ├── vendor.bundle.js         (901KB) - React + Three.js + Blueprint3D
│   │   ├── app.bundle.js            (382KB) - Application code
│   │   ├── lazy.bundle.js           (4.2KB) - Lazy-loaded features
│   │   └── webpack-runtime.js       (2.3KB) - Webpack module loader
│   ├── css/               # CSS bundles
│   │   ├── vendor.bundle.css        (12KB) - Third-party styles
│   │   └── app.bundle.css           (6.2KB) - Application styles
│   └── asset-manifest.json # Asset mapping
├── docs/                   # Documentation
│   └── BUNDLE_ANALYSIS.md # Bundle composition analysis
├── scripts/               # Utility scripts
│   └── serve.sh          # Development server script
├── src/                   # Source code (reverse-engineered)
│   └── src/              # Application source
│       ├── core/         # Core systems (Configuration, Utils, Blueprint3D)
│       └── components/   # React components
├── beautified/          # Beautified bundles for analysis
├── .vscode/             # VSCode settings
├── .editorconfig        # Editor configuration
├── .gitignore          # Git ignore rules
├── LICENSE             # MIT License
├── vercel.json         # Vercel deployment configuration
├── package.json        # Dependencies & scripts
└── README.md          # Project documentation
```

## Technology Stack

- **React 17.0.1** - UI framework
- **Three.js** - 3D rendering engine (WebGL)
- **Blueprint3D** - Floor planner library
- **GLB Models** - 3D furniture assets
- **FontAwesome** - Icon library

## Asset Library

### Furniture Categories

- **Bedroom (BR-)**: Beds, mirrors, wardrobes
- **Bedroom Cabinets (BC-)**: Multi-drawer units, storage
- **Bathroom Storage (BSC-)**: Cabinets with various door styles
- **Desks (DESK-)**: Corner desks, executive desks, modular desks
- **100+ GLB models** with configurable dimensions and materials

### Model Naming Convention

- `BC-*` - Bedroom Cabinets
- `BR-*` - Bedroom items (Beds, Mirrors, Wardrobes)
- `BSC-*` - Bathroom Storage Cabinets
- `DESK-*` - Desk variants
- **Suffixes**:
  - `-GD` = Glass Door
  - `-PD` = Panel Door
  - `-L` / `-R` = Left / Right orientation
  - `-H` = High version
  - `-L` = Low version

## Deployment

### Vercel Deployment

The project is configured for seamless Vercel deployment with:
- SPA routing (all routes rewrite to `index.html`)
- CORS enabled for asset loading
- Optimized cache headers for static assets (1-year caching for bundles/models)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

#### Deploy to Vercel

```bash
# Install Vercel CLI globally (one-time)
npm install -g vercel

# Deploy to production
npm run deploy

# Deploy preview (staging)
npm run preview
```

Or use the [Vercel Dashboard](https://vercel.com/new) to import this repository directly.

### Live Demo

Deployment URL will be provided after first Vercel deployment.

## Development Notes

### Bundle Composition

This is a **production-bundled** application. The source code has been compiled into optimized chunks:

- **Vendor Bundle** (901KB): Three.js, Blueprint3D, React ecosystem
- **Application Bundle** (382KB): Room configurator logic and UI components
- **Lazy Chunks** (4.2KB): On-demand loaded features

For detailed bundle analysis, run `npm run analyze` and open `bundle-report.html`.

### Why No Build Process?

The application is already compiled and optimized. We serve the production bundles directly using `http-server`, which provides:
- Fast local development (no compilation wait)
- Exact feature parity with production
- Simplified setup (no webpack/babel configuration)

### Development Progress

**Phase 3 (Reverse Engineering): COMPLETE ✅**

We've successfully reverse-engineered the production bundles into clean, modular source code:
- ✅ 18 components extracted (~4,500 lines)
- ✅ 100% JSDoc documentation coverage
- ✅ ES6 modernization (classes, arrow functions, const/let)
- ✅ Modular architecture with clean separation of concerns

**Extracted Components:**
- Core systems: Configuration, Dimensioning, Utils
- Blueprint3D entities: Wall, Corner, HalfEdge, Room, Canvas2D
- React components: App, Blueprint3D, PropertyPanel, ProductControls, FloorPlanView, Controls

See `PHASE_3_PROGRESS.md` for detailed extraction documentation.

**Next Steps:**
- Phase 4: Resolve dependencies and integrate Three.js
- Phase 5: Test extracted code against original functionality
- Phase 7: Complete documentation and development guide

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- WebGL-capable browsers

## License

MIT

## Contributing

This is a rebranded version of the Three.js Room Configurator. For questions or collaboration, please open an issue.

---

**Build-Station 3D** - Professional room configurator for interior design and space planning.
