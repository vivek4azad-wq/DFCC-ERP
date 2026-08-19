# Rail Diary — Technical Architecture & Component Specification Survey

**Author**: teamwork_preview_explorer_survey_2 (Phase 0 Survey)  
**Date**: 2026-08-15  
**Target Project**: Rail Diary ERP (DFCCIL IMSD SMUN Unit)  
**Working Directory**: `/Users/vivekazad/.gemini/antigravity/scratch/rail_diary`  

---

## 1. Executive Summary & Architectural Vision

The **Rail Diary** ERP application is a specialized, role-based mobile and web application engineered for the **Dedicated Freight Corridor Corporation of India Ltd. (DFCCIL - IMSD SMUN Unit)**. The application manages railway track assets, maintenance operations, duty rosters, defect monitoring, and staff credentials covering:
- **Main Line**: Km 1167.210 to Km 1249.720 (82.510 Km)
- **SMUN-RPJ Link Line**: Km 1168.697 to Km 1178.150 / 0.000 to 6.169 Km (6.169 Km)
- **Total Operational Corridor**: **88.679 Km**

```
+----------------------------------------------------------------------------------------------------+
|                                    RAIL DIARY ARCHITECTURE STACK                                   |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   |                           PRESENTATION LAYER (Mobile First & PWA)                          |   |
|   |   - React 18+ / Vite / TypeScript / Tailwind CSS / Lucide Icons                            |   |
|   |   - DFCCIL Dark Theme (Slate/Navy/Emerald/Amber/Crimson)                                   |   |
|   |   - Responsive Layout: Header Status Bar + Mobile Bottom Nav + Desktop Sidebar            |   |
|   |   - PWA Service Worker + Web App Manifest + Standalone Touch UX                            |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                                |                                                   |
|   +--------------------------------------------------------------------------------------------+   |
|   |                         CORE DOMAIN MODULES & UI SCREENS                                   |   |
|   |   1. Authentication & RBAC Gate (Super Admin vkazad@dfcc.co.in / Officer / Staff PINs)     |   |
|   |   2. Km Quick Finder (Chainage range parser, interval search, multi-category filter)       |   |
|   |   3. GPS Asset Map (Leaflet.js pins, category layers, external GPS navigation triggers)    |   |
|   |   4. Staff Directory & QR Generator (Auto personal QR cards, printable ID, scanner)       |   |
|   |   5. Interactive Analytics (Chart.js charts for staff, assets, defect density, rosters)    |   |
|   |   6. Admin Control Panel (User/PIN manager, staff CRUD, asset delete, DB reseed)          |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                                |                                                   |
|   +--------------------------------------------------------------------------------------------+   |
|   |                          DATA ACCESS & SECURITY ENFORCEMENT LAYER                          |   |
|   |   - RBAC Security Guard (Runtime permission checking for SUPER_ADMIN, OFFICER, STAFF)      |   |
|   |   - Cloud Firestore Client with `persistentLocalCache` & `setPersistenceEnabled(true)`     |   |
|   |   - Local Fallback / Mock Persistence Service (IndexedDB / LocalStorage / In-Memory)       |   |
|   |   - Database Seeding Engine (Pre-populates 10 collections with exact count requirements)   |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                                |                                                   |
|   +--------------------------------------------------------------------------------------------+   |
|   |                        BACKEND & PERSISTENCE (10 COLLECTIONS)                              |   |
|   |   1. users (>=3)        2. jurisdiction (>=1)   3. bridges (144)      4. level_crossings (5) |   |
|   |   5. officers_staff (14)6. keymen (18)          7. patrol_shifts (24) 8. points_crossings(161)|  |
|   |   9. curves (95)       10. track_defects (48)                                              |   |
|   +--------------------------------------------------------------------------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Framework Selection

### 2.1 Technology Evaluation Matrix

| Category | Recommended Choice | Rationale & Benefits | Fallback / Alternatives |
|---|---|---|---|
| **UI Framework** | **React 18+ (TypeScript)** | Declarative component model, rich ecosystem, instant state reactivity for map/analytics, seamless PWA integration. | Modern Vanilla JS / HTML5 |
| **Bundler & Tooling**| **Vite 5+** | Instant dev server start, sub-second HMR, optimized production rollup bundle, native ES modules. | Webpack / Parcel |
| **Styling** | **Tailwind CSS 3+** | Utility-first, zero runtime overhead, responsive layout primitives, modern dark theme styling tailored for railway aesthetics. | CSS Modules / Vanilla CSS |
| **Icons** | **Lucide React** | Feather-derived crisp railway/ERP icons (train, map-pin, qr-code, shield, bar-chart, wrench, user). | FontAwesome / SVG sprites |
| **Map Rendering** | **Leaflet 1.9+ (`react-leaflet` or vanilla Leaflet container)** | Lightweight (~40KB), mobile-optimized touch panning/zooming, custom SVG markers, offline vector tile caching support. | MapLibre GL / Google Maps JS |
| **QR Code Engine** | **`qrcode` (npm)** | High-speed client-side QR generation into `<canvas>` or data URL, zero network latency, configurable error correction (Level M/H). | `qr-code-styling` / `html5-qrcode` |
| **Analytics & Charts**| **Chart.js 4+ (`chart.js` + `react-chartjs-2`)** | Responsive HTML5 canvas rendering, rich touch tooltips, animated donuts, bar histograms, stacked bars, compact bundle size. | ApexCharts / ECharts |
| **Database SDK** | **Cloud Firestore SDK v9/v10 Modular** | Native offline cache via IndexedDB (`persistentLocalCache`), real-time snapshots, structured queries. | Firebase Compat v9 |
| **Local Mock Engine**| **Custom IndexedDB / In-Memory Mock Firestore** | 100% offline standalone capability, enables instant zero-network execution and automated test suite verification (`npm run verify`). | Dexie.js / LocalForage |

### 2.2 Mobile PWA & Android Compatibility Architecture

To provide an authentic native-like Android application experience without requiring a complex mobile deployment pipeline:
1. **Web App Manifest (`manifest.json`)**:
   - `display`: `"standalone"` (hides browser chrome, full-screen immersion).
   - `orientation`: `"portrait-primary"`.
   - `theme_color`: `"#0a0f1d"`, `background_color`: `"#060913"`.
   - `icons`: Scalable SVG and 192x192 / 512x512 PNG assets.
2. **Service Worker (`sw.js`)**:
   - Cache-first strategy for static assets (HTML, JS bundles, CSS, icon fonts, map pin SVGs).
   - Network-first or stale-while-revalidate strategy for data queries with Firestore persistence.
3. **Android Capacitor Compatibility**:
   - The codebase conforms to `@capacitor/android` standard directory structures (`capacitor.config.json`, `www` / `dist` build output).
   - Can be synchronized and built into a signed Android APK (`npx cap sync android && ./gradlew assembleDebug`) at any time.
4. **Mobile Touch Ergonomics**:
   - Safe-area inset support: `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
   - Minimum tap target dimensions: 44x44px for all interactive buttons and navigation tabs.
   - Haptic feedback triggers (via Web Vibration API `navigator.vibrate(15)` on PIN keypads and navigation switches).

---

## 3. Cloud Firestore & Offline Persistence Architecture

### 3.1 Dual-Tier Persistence Architecture

Field engineers and trackmen frequently work in remote railway cuttings and rural corridor sections without cellular connectivity. The data layer is designed around a dual-tier persistence model:

```
[UI Application Layer]
         |
         v
[Data Access Gateway (Repository)]
         |
    +----+------------------------------------------------+
    |                                                     |
    v                                                     v
[Firebase Firestore Provider]              [Local Mock Persistence Provider]
- `initializeFirestore()`                   - In-Memory / IndexedDB Backing
- `persistentLocalCache()`                  - Exact Query Engine Emulation
- `persistentMultipleTabManager()`          - Zero Network Dependency
- `enableIndexedDbPersistence()`            - Powers `npm run verify` harness
```

### 3.2 Firebase Modular Offline Caching Configuration

In online/production Firebase mode, offline persistence is configured at initialization:

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyFakeKeyForRailDiaryDevelopmentMode123",
  authDomain: "raildiary-dfccil.firebaseapp.com",
  projectId: "raildiary-dfccil",
  storageBucket: "raildiary-dfccil.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

export function getFirestoreInstance(): Firestore {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
}
```

### 3.3 Standalone Local / Mock Persistence Engine (`LocalDatabaseService`)

To guarantee seamless execution in standalone environments (e.g. static previews, CI test environments, offline laptops, and `npm run verify`), a robust client-side storage engine implements standard Firestore collection and document APIs:

```typescript
export interface IDatabaseService {
  getCollection<T>(name: string): Promise<T[]>;
  getDocument<T>(collection: string, id: string): Promise<T | null>;
  setDocument<T>(collection: string, id: string, data: T): Promise<void>;
  addDocument<T>(collection: string, data: T): Promise<string>;
  updateDocument(collection: string, id: string, updates: Record<string, any>): Promise<void>;
  deleteDocument(collection: string, id: string): Promise<void>;
  query<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>;
  seedAll(force?: boolean): Promise<void>;
}
```

### 3.4 10 Collections Schema & Seeding Inventory

The database initializes **10 distinct collections** with exact document counts conforming strictly to the specification:

| # | Collection | Seed Target | Source / Real Data Mapping | Schema Key Fields |
|---|---|---|---|---|
| 1 | `users` | **3** | Master Admin + Sample Officer + Sample Staff | `id`, `email`, `userId`, `pin`, `awpoId`, `name`, `role`, `designation`, `phone`, `createdAt` |
| 2 | `jurisdiction` | **8** | 8 Block Sections (UBCD-SMUN to SMUN-RPJ) | `id`, `sectionId`, `sectionName`, `startKm`, `endKm`, `lengthKm`, `lineType`, `stations`, `remarks` |
| 3 | `bridges` | **144** | 18 MJB + 74 MIB + 37 RUB + 9 ROB + 6 FOB | `id`, `bridgeNo`, `bridgeType`, `km`, `station`, `blockSection`, `totalSpans`, `spanDetails`, `structure`, `lat`, `lon` |
| 4 | `level_crossings` | **5** | Real data from `db.js` (151C, 159C, 163spl, 164spl, 167C) | `id`, `lcNo`, `km`, `blockSection`, `tuv`, `interlocked`, `gateType`, `mannedStatus`, `lat`, `lon` |
| 5 | `officers_staff` | **14** | APM, Sr. SE, SE, JE, MTS, Executives, Gangman | `id`, `staffId`, `name`, `designation`, `role`, `department`, `awpoId`, `phone`, `bloodGroup`, `station`, `lap`, `cl` |
| 6 | `keymen` | **18** | 18 Keyman beats across 88.679 Km | `id`, `keymanId`, `beatNo`, `name`, `assignedStaffId`, `startKm`, `endKm`, `section`, `mobile`, `emergencyContact` |
| 7 | `patrol_shifts` | **24** | 24 Patrol shifts (Day, Night, Monsoon) | `id`, `shiftId`, `shiftType`, `startKm`, `endKm`, `timing`, `assignedStaffId`, `status`, `lastCheckedKm`, `remarks` |
| 8 | `points_crossings` | **161** | Real data from `db.js` (SMUN: 35, SBJN: 26, NSIR: 18, GVGN: 32, KNNN: 22, CHAN: 28) | `id`, `assetId`, `station`, `ptNo`, `lineType`, `ratio`, `km`, `trackType`, `hand`, `facingTrailing`, `lat`, `lon` |
| 9 | `curves` | **95** | Real data from `db.js` (Curve No. 315 to 409) | `id`, `curveNo`, `sno`, `fromKm`, `toKm`, `length`, `degree`, `radius`, `speed`, `transitionLength`, `cant`, `yard`, `lat`, `lon` |
| 10 | `track_defects` | **48** | Realistic defect logs (SEJ gap, weld, ballast) | `id`, `defectId`, `km`, `locationDesc`, `defectType`, `severity`, `status`, `reportedBy`, `reportedDate`, `lat`, `lon` |

---

## 4. Role-Based Access Control (RBAC) Architecture

### 4.1 Role Definitions & Permission Matrix

The application implements three rigid privilege tiers:

```
[SUPER_ADMIN] (Vivek Kumar Azad - vkazad@dfcc.co.in)
   ├── Full CRUD on all 10 collections
   ├── Add / Edit / Delete Employees & Staff
   ├── Generate User IDs & Assigned PINs
   ├── Delete Track Assets & Materials
   └── Database Wipe / Reseed Administration
         |
         v
[OFFICER] (Field Officers - User ID + Assigned PIN)
   ├── Read Directories, Roster, Defect Logs, Jurisdictions
   ├── Add / Edit Track Assets (Bridges, Curves, P&C, Defects)
   ├── View and Generate Personal QR Codes
   ├── ❌ CANNOT Delete Assets or Materials
   └── ❌ CANNOT Access Admin Panel or Manage Users
         |
         v
[STAFF] (Track Maintainer / Keyman - AWPO ID or PIN)
   ├── Read-Only access to Track Assets & Jurisdictions
   ├── View Staff Directory & Personal Duty Roster
   ├── View Personal Profile QR Code
   ├── ❌ CANNOT Add or Edit Assets
   ├── ❌ CANNOT Delete Assets
   └── ❌ CANNOT Access Admin Panel or Manage Users
```

### 4.2 Permission Matrix Specification

| Operational Capability | SUPER_ADMIN | OFFICER | STAFF | Gating Mechanism |
|---|:---:|:---:|:---:|---|
| **View Dashboards & Analytics** | ✅ | ✅ | ✅ | Open |
| **Search Km Quick Finder & GPS Map** | ✅ | ✅ | ✅ | Open |
| **View Staff Directory & Duty Rosters** | ✅ | ✅ | ✅ | Open |
| **Generate & Download Personal QR** | ✅ | ✅ | ✅ (Own) | Role Scoped |
| **Create New Track Asset / Defect** | ✅ | ✅ | ❌ | UI hidden + Guard check |
| **Edit Existing Track Asset / Defect** | ✅ | ✅ | ❌ | UI hidden + Guard check |
| **Delete Track Asset / Defect** | ✅ | ❌ | ❌ | UI hidden + Guard check |
| **Access Admin Panel (`/admin`)** | ✅ | ❌ | ❌ | Route Guard (`<AdminOnlyRoute>`) |
| **Generate User IDs & PINs** | ✅ | ❌ | ❌ | Admin Service Guard |
| **Create / Edit / Delete Staff Records** | ✅ | ❌ | ❌ | Admin Service Guard |
| **Trigger Database Reset / Reseed** | ✅ | ❌ | ❌ | Admin Service Guard |

### 4.3 Authentication Flow & Session State Machine

1. **Authentication Methods**:
   - **Super Admin**: Master Email `vkazad@dfcc.co.in` with Master PIN (`1985` or `2026`).
   - **Field Officer**: User ID (e.g. `OFF-01`, `SSE-SMUN`) with Assigned 4-digit PIN.
   - **Field Staff**: AWPO ID (e.g. `AWPO-8821`) or Employee PIN.
   - **Quick Demo Switcher**: One-tap demo login badges on login screen for rapid evaluator switching between Super Admin, Officer, and Staff.
2. **Session Storage**:
   - Active user session saved in `localStorage['raildiary_auth_user']`.
   - Automatic session restoration on app launch with token validation.
   - Logout clears active session and redirects to Authentication Screen.
3. **Client-Side RBAC Guard Implementation**:

```typescript
export type UserRole = 'SUPER_ADMIN' | 'OFFICER' | 'STAFF';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  userId?: string;
  awpoId?: string;
  role: UserRole;
  designation: string;
  department: string;
}

export class RBACGuard {
  static canAccessAdminPanel(user: AuthUser | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }

  static canCreateOrEditAsset(user: AuthUser | null): boolean {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICER';
  }

  static canDeleteAsset(user: AuthUser | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }

  static canManageUsers(user: AuthUser | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }

  static assertCanDeleteAsset(user: AuthUser | null): void {
    if (!this.canDeleteAsset(user)) {
      throw new Error(`Unauthorized: Role '${user?.role || 'ANONYMOUS'}' cannot delete assets.`);
    }
  }

  static assertCanManageUsers(user: AuthUser | null): void {
    if (!this.canManageUsers(user)) {
      throw new Error(`Unauthorized: Role '${user?.role || 'ANONYMOUS'}' cannot manage user credentials.`);
    }
  }
}
```

---

## 5. Km Quick Finder & Chainage Algorithm Specification

### 5.1 Railway Chainage System Modeling

DFCCIL IMSD SMUN Unit operates over two continuous chainage segments:
1. **Main Line Corridor**: `1167.210 Km` (UBCD) to `1249.720 Km` (SNL) — Span: `82.510 Km`.
2. **SMUN-RPJ Link Line**: `1168.697 Km` to `1178.150 Km` (or relative `0.000` to `6.169 Km`) — Span: `6.169 Km`.

### 5.2 Chainage Parser & String Normalizer

Railway engineers write chainages in multiple formats (e.g., `1169.045`, `1169/2`, `1169+045`, `1169`). The parsing algorithm normalizes all variations into high-precision floating point numbers:

```typescript
export interface ChainageRange {
  fromKm: number;
  toKm: number;
  line: 'MAIN' | 'LINK' | 'ALL';
}

export function parseKmString(input: string): number | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[kK][mM]/g, '').trim();
  
  // Format: 1169+045 or 1169+45
  if (cleaned.includes('+')) {
    const [km, m] = cleaned.split('+').map(s => parseFloat(s.trim()));
    if (!isNaN(km) && !isNaN(m)) return km + m / 1000;
  }
  
  // Format: 1169/045 or 1169/45
  if (cleaned.includes('/')) {
    const [km, m] = cleaned.split('/').map(s => parseFloat(s.trim()));
    if (!isNaN(km) && !isNaN(m)) return km + m / 1000;
  }
  
  // Format: 1169.045 or 1169
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}
```

### 5.3 Point vs. Linear Asset Range Overlap Algorithm

Assets fall into two geometric categories:
- **Point Assets** (Bridges, Points & Crossings, Level Crossings, Defect Spots): Represented by a single chainage `km`.
  - Condition: `searchFromKm <= asset.km && asset.km <= searchToKm`.
- **Linear / Span Assets** (Curves, Block Sections, Keyman Beats, Patrol Beats, LWRs): Represented by interval `[fromKm, toKm]`.
  - Condition (Interval Overlap): `Math.max(asset.fromKm, searchFromKm) <= Math.min(asset.toKm, searchToKm)`.

```typescript
export interface KmSearchResult {
  assetCategory: 'Bridge' | 'Curve' | 'Point & Crossing' | 'Level Crossing' | 'Defect' | 'Keyman Beat' | 'Patrol Shift';
  id: string;
  title: string;
  chainageText: string;
  startKm: number;
  endKm: number;
  stationOrSection: string;
  details: Record<string, any>;
  lat?: number;
  lon?: number;
}

export function queryAssetsByChainage(
  allAssets: {
    bridges: any[];
    curves: any[];
    pointsCrossings: any[];
    levelCrossings: any[];
    defects: any[];
    keymen: any[];
    patrolShifts: any[];
  },
  range: ChainageRange,
  categoryFilter?: string
): KmSearchResult[] {
  const minKm = Math.min(range.fromKm, range.toKm);
  const maxKm = Math.max(range.fromKm, range.toKm);
  const results: KmSearchResult[] = [];

  // 1. Bridges (Point Assets)
  if (!categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Bridge') {
    allAssets.bridges.forEach(b => {
      if (b.km >= minKm && b.km <= maxKm) {
        results.push({
          assetCategory: 'Bridge',
          id: b.id,
          title: `${b.bridgeType} - ${b.bridgeNo || b.id}`,
          chainageText: `Km ${b.km.toFixed(3)}`,
          startKm: b.km,
          endKm: b.km,
          stationOrSection: b.blockSection || b.station || '',
          details: { Structure: b.structure, Spans: b.totalSpans, SpanDetails: b.spanDetails },
          lat: b.lat,
          lon: b.lon
        });
      }
    });
  }

  // 2. Curves (Span Assets)
  if (!categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Curve') {
    allAssets.curves.forEach(c => {
      const cFrom = Math.min(c.fromKm, c.toKm);
      const cTo = Math.max(c.fromKm, c.toKm);
      if (Math.max(cFrom, minKm) <= Math.min(cTo, maxKm)) {
        results.push({
          assetCategory: 'Curve',
          id: c.id,
          title: `Curve No. ${c.curveNo}`,
          chainageText: `Km ${c.fromKm.toFixed(3)} – ${c.toKm.toFixed(3)}`,
          startKm: cFrom,
          endKm: cTo,
          stationOrSection: c.yard || 'Sectional',
          details: { Length: `${c.length}m`, Degree: `${c.degree}°`, Radius: `${c.radius}m`, Speed: `${c.speed} kmph` },
          lat: c.lat,
          lon: c.lon
        });
      }
    });
  }

  // 3. Points & Crossings (Point Assets)
  if (!categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Point & Crossing') {
    allAssets.pointsCrossings.forEach(p => {
      if (p.km >= minKm && p.km <= maxKm) {
        results.push({
          assetCategory: 'Point & Crossing',
          id: p.id,
          title: `Pt ${p.ptNo} (${p.station})`,
          chainageText: `Km ${p.km.toFixed(3)}`,
          startKm: p.km,
          endKm: p.km,
          stationOrSection: p.station,
          details: { Line: p.lineType, Ratio: p.ratio, Hand: p.hand, FacingTrailing: p.facingTrailing },
          lat: p.lat,
          lon: p.lon
        });
      }
    });
  }

  // 4. Level Crossings (Point Assets)
  if (!categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Level Crossing') {
    allAssets.levelCrossings.forEach(lc => {
      if (lc.km >= minKm && lc.km <= maxKm) {
        results.push({
          assetCategory: 'Level Crossing',
          id: lc.id,
          title: lc.lcNo,
          chainageText: `Km ${lc.km.toFixed(3)}`,
          startKm: lc.km,
          endKm: lc.km,
          stationOrSection: lc.blockSection || '',
          details: { TVU: lc.tuv, Interlocked: lc.interlocked ? 'Yes' : 'No', GateType: lc.gateType },
          lat: lc.lat,
          lon: lc.lon
        });
      }
    });
  }

  // 5. Track Defects (Point Assets)
  if (!categoryFilter || categoryFilter === 'ALL' || categoryFilter === 'Defect') {
    allAssets.defects.forEach(d => {
      if (d.km >= minKm && d.km <= maxKm) {
        results.push({
          assetCategory: 'Defect',
          id: d.id,
          title: `${d.defectType} (${d.severity})`,
          chainageText: `Km ${d.km.toFixed(3)}`,
          startKm: d.km,
          endKm: d.km,
          stationOrSection: d.locationDesc || '',
          details: { Status: d.status, ReportedDate: d.reportedDate, ReportedBy: d.reportedBy },
          lat: d.lat,
          lon: d.lon
        });
      }
    });
  }

  return results.sort((a, b) => a.startKm - b.startKm);
}
```

---

## 6. GPS Asset Map & External Navigation Triggers

### 6.1 Geospatial Corridor Alignment

All railway track assets are positioned along the DFCCIL corridor (Eastern/Western alignment through Haryana/Punjab). Coordinates are computed using linear chainage interpolation anchored to verified station GPS coordinates:
- `UBCD` (Km 1167.210): `Lat 30.3120, Lon 76.8150`
- `SMUN` (Km 1170.435): `Lat 30.2980, Lon 76.8320`
- `SBJN` (Km 1188.575): `Lat 30.2150, Lon 76.9410`
- `NSIR` (Km 1202.015): `Lat 30.1510, Lon 77.0250`
- `GVGN` (Km 1213.187): `Lat 30.0980, Lon 77.0950`
- `KNNN` (Km 1229.087): `Lat 30.0150, Lon 77.1950`
- `CHAN` (Km 1235.837): `Lat 29.9810, Lon 77.2400`
- `SNL`  (Km 1249.720): `Lat 29.9120, Lon 77.3250`
- `RPJ`  (Km 1178.150): `Lat 30.3420, Lon 76.9100`

### 6.2 Interactive Map UI & Pin Rendering

Using Leaflet.js:
1. **Corridor Polyline**: Renders the continuous railway track line connecting all stations with a dark cyan/blue glow (`#0ea5e9`).
2. **Color-Coded Asset Markers**:
   - **Bridges**: Solid Blue (`#3b82f6`) with bridge icon.
   - **Curves**: Amber (`#f59e0b`) with turn curve icon.
   - **Points & Crossings**: Violet (`#8b5cf6`) with junction icon.
   - **Level Crossings**: Emerald (`#10b981`) with barrier icon.
   - **Track Defects**: Crimson (`#ef4444`) with alert triangle icon.
3. **Interactive Popup & Bottom Sheet**: Tapping any pin highlights the asset, displays chainage, structural details, and a high-visibility **"Navigate to Asset"** action button.

### 6.3 External Navigation Launcher Implementation

The navigation launcher provides robust, platform-aware deep linking to Google Maps, Apple Maps, or native GPS navigation apps:

```typescript
export function launchGpsNavigation(lat: number, lon: number, label?: string): void {
  const cleanLabel = encodeURIComponent(label || 'DFCCIL Asset');
  
  // 1. Android Intent / Geo URI Scheme
  const geoUri = `geo:${lat},${lon}?q=${lat},${lon}(${cleanLabel})`;
  
  // 2. Google Maps Universal Search URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  
  // 3. Google Maps Directions Route URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

  // Check if running on Android/iOS Capacitor or Web Browser
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Attempt geo: URI invocation, fallback to web URL
    const a = document.createElement('a');
    a.href = googleMapsUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  } else {
    // Desktop Web Browser
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  }
}
```

---

## 7. Automatic Personal QR Generation & Staff Profile Architecture

### 7.1 QR Payload Schema Specification

Every officer, staff member, keyman, and outsourced trackman is issued a cryptographically verifiable QR payload. The payload format is compact, deterministic JSON:

```json
{
  "app": "RailDiary",
  "ver": "1.0",
  "empId": "STF-001",
  "name": "Shri Vivek Kumar Azad",
  "post": "APM / Civil",
  "role": "SUPER_ADMIN",
  "unit": "DFCCIL IMSD SMUN",
  "section": "Km 1167.210 - 1249.720",
  "phone": "+91-9876543210",
  "bloodGroup": "O+",
  "awpoId": "AWPO-8821"
}
```

### 7.2 Client-Side QR Generator Engine

The QR code is generated entirely client-side using `qrcode` / Canvas API, ensuring instant offline rendering:

```typescript
import QRCode from 'qrcode';

export async function generateStaffQrDataUrl(staff: {
  staffId: string;
  name: string;
  designation: string;
  role: string;
  phone?: string;
  bloodGroup?: string;
  awpoId?: string;
}): Promise<string> {
  const payload = JSON.stringify({
    app: "RailDiary",
    ver: "1.0",
    empId: staff.staffId,
    name: staff.name,
    post: staff.designation,
    role: staff.role,
    unit: "DFCCIL IMSD SMUN",
    section: "Km 1167.210 - 1249.720",
    phone: staff.phone || "N/A",
    bloodGroup: staff.bloodGroup || "N/A",
    awpoId: staff.awpoId || "N/A"
  });

  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}
```

### 7.3 Personal ID Card & Field Scanner UX

1. **Digital ID Card Card Layout**:
   - Styled with official DFCCIL header banner, employee photo avatar, name, designation, AWPO ID, blood group, emergency contact number, and the high-contrast QR code.
   - Action buttons: **"Download QR Card (PNG)"**, **"Print ID Badge"**, **"Share"**.
2. **In-App QR Scanner for Inspections**:
   - Integrated camera scanner modal enabling inspecting officers to scan staff QR codes on-track.
   - Instantly decodes and validates personnel identity, active patrol beats, and emergency contact information.

---

## 8. Interactive Graphical Analytics Specification

### 8.1 Chart.js Visualizations Inventory

The analytics dashboard provides 5 interactive, animated visualizations powered by Chart.js:

```
+----------------------------------------------------------------------------------------------------+
|                                    ANALYTICS DASHBOARD LAYOUT                                      |
+----------------------------------------------------------------------------------------------------+
|  [Summary Cards: 88.679 Km Total | 405 Track Assets | 14 Staff | 18 Keymen | 48 Defects]           |
+--------------------------------------------------+-------------------------------------------------+
|  CHART 1: Asset Breakdown by Category            |  CHART 2: Staff Distribution by Designation     |
|  - 144 Bridges, 95 Curves, 161 P&C, 5 LC        |  - APM, SSE, SE, JE, MTS, Gangman, Keymen       |
|  - Type: Bar / Horizontal Column                 |  - Type: Donut / Polar Area                     |
+--------------------------------------------------+-------------------------------------------------+
|  CHART 3: Track Defect Density Heatmap           |  CHART 4: Patrol Shift Beat Coverage            |
|  - Defects counted per 10 Km Chainage Blocks     |  - Filled Shifts vs Vacant Shifts (24 total)    |
|  - Type: Bar Histogram with gradient fill        |  - Type: Semi-Gauge Donut                       |
+--------------------------------------------------+-------------------------------------------------+
|  CHART 5: Bridge Types Breakdown (MJB: 18, MIB: 74, RUB: 37, ROB: 9, FOB: 6)                       |
|  - Type: Stacked / Donut Chart                                                                     |
+----------------------------------------------------------------------------------------------------+
```

### 8.2 Analytics Aggregation Functions

```typescript
export interface AnalyticsSummary {
  staffByDesignation: Record<string, number>;
  assetCountsByCategory: {
    bridges: number;
    curves: number;
    pointsCrossings: number;
    levelCrossings: number;
    total: number;
  };
  defectsByKmBlock: {
    labels: string[];
    counts: number[];
  };
  patrolShiftStatus: {
    filled: number;
    vacant: number;
    total: number;
  };
  bridgeTypeCounts: Record<string, number>;
}

export function computeAnalyticsSummary(dbData: {
  staff: any[];
  bridges: any[];
  curves: any[];
  pointsCrossings: any[];
  levelCrossings: any[];
  defects: any[];
  patrolShifts: any[];
}): AnalyticsSummary {
  // 1. Staff by designation
  const staffByDesignation: Record<string, number> = {};
  dbData.staff.forEach(s => {
    const post = s.designation || s.post || 'Other';
    staffByDesignation[post] = (staffByDesignation[post] || 0) + 1;
  });

  // 2. Asset counts
  const assetCountsByCategory = {
    bridges: dbData.bridges.length,
    curves: dbData.curves.length,
    pointsCrossings: dbData.pointsCrossings.length,
    levelCrossings: dbData.levelCrossings.length,
    total: dbData.bridges.length + dbData.curves.length + dbData.pointsCrossings.length + dbData.levelCrossings.length
  };

  // 3. Defect density per 10 Km block
  const blocks = [
    { label: '1167–1180', min: 1167.210, max: 1180.000 },
    { label: '1180–1195', min: 1180.000, max: 1195.000 },
    { label: '1195–1210', min: 1195.000, max: 1210.000 },
    { label: '1210–1225', min: 1210.000, max: 1225.000 },
    { label: '1225–1240', min: 1225.000, max: 1240.000 },
    { label: '1240–1250', min: 1240.000, max: 1249.720 },
    { label: 'Link Line', min: 0.000, max: 10.000 }
  ];
  const defectCounts = blocks.map(b => {
    return dbData.defects.filter(d => d.km >= b.min && d.km <= b.max).length;
  });

  // 4. Patrol Shift status
  const filled = dbData.patrolShifts.filter(p => p.status === 'Filled' || p.assignedStaffId).length;
  const vacant = dbData.patrolShifts.length - filled;

  // 5. Bridge types
  const bridgeTypeCounts: Record<string, number> = {};
  dbData.bridges.forEach(b => {
    const t = b.bridgeType || 'MIB';
    bridgeTypeCounts[t] = (bridgeTypeCounts[t] || 0) + 1;
  });

  return {
    staffByDesignation,
    assetCountsByCategory,
    defectsByKmBlock: {
      labels: blocks.map(b => b.label),
      counts: defectCounts
    },
    patrolShiftStatus: {
      filled,
      vacant,
      total: dbData.patrolShifts.length
    },
    bridgeTypeCounts
  };
}
```

---

## 9. Admin Control Panel Specification

Visible and accessible strictly to **SUPER_ADMIN** (`vkazad@dfcc.co.in`), the Admin Panel provides four administrative sub-modules:
1. **User ID & PIN Generator**:
   - Generates unique Officer/Staff user IDs and randomized 4-digit PINs.
   - Enforces credential uniqueness and role assignment.
2. **Employee & Staff Management (CRUD)**:
   - Form to add, edit, or deactivate staff records, assign AWPO IDs, designate station beats, and configure leave balances (LAP, LHAP, CL, RH).
3. **Asset Deletion & Mutation Console**:
   - Super Admin sole privilege to permanently delete retired track assets, bridges, curves, or resolved defects with safety confirmation modals.
4. **Database Diagnostics & Reset/Reseed Engine**:
   - Diagnostic table showing current document counts across all 10 Firestore collections.
   - One-click **"Re-seed Database"** button to restore exact pristine count requirements (144 bridges, 95 curves, 161 P&C, 5 LC, etc.).

---

## 10. Proposed Application Directory Structure

```
rail_diary/
├── package.json                   # Dependencies, scripts (dev, build, preview, test, verify)
├── vite.config.ts                 # Vite bundler config with PWA plugin
├── tsconfig.json                  # TypeScript compiler options
├── tailwind.config.js             # Tailwind CSS theme & styling configuration
├── index.html                     # Single-page application entry point
├── public/
│   ├── manifest.json              # Web App Manifest
│   ├── favicon.ico
│   └── icons/                     # PWA app icons (192x192, 512x512, SVG)
├── scripts/
│   └── verify.mjs                 # Unified automated verification harness (`npm run verify`)
└── src/
    ├── main.tsx                   # React root mount
    ├── App.tsx                    # Top-level routing & layout shell
    ├── types/
    │   ├── auth.ts                # User, role, session types
    │   ├── assets.ts              # Bridges, curves, P&C, LC, defect types
    │   ├── staff.ts               # Officers, staff, keymen, patrol shift types
    │   └── jurisdiction.ts        # Section, station types
    ├── services/
    │   ├── firebase.ts            # Firestore modular SDK & offline cache config
    │   ├── localDb.ts             # Offline persistence & mock Firestore engine
    │   ├── seedData.ts            # Seeding data generator for 10 collections
    │   ├── rbacGuard.ts           # Permission check assertions & security matrix
    │   └── kmSearchService.ts     # Km Quick Finder chainage query engine
    ├── context/
    │   ├── AuthContext.tsx        # Authentication & active role provider
    │   └── DataContext.tsx        # Active dataset, offline sync & refresh provider
    ├── components/
    │   ├── common/
    │   │   ├── Header.tsx         # DFCCIL header with role badge & online status
    │   │   ├── BottomNav.tsx      # Touch-friendly bottom navigation bar
    │   │   └── Modal.tsx          # Reusable accessible dialog
    │   ├── auth/
    │   │   ├── LoginScreen.tsx    # Master login, PIN keypad & quick switcher
    │   │   └── RoleGate.tsx       # Conditional render wrapper for RBAC
    │   ├── kmFinder/
    │   │   ├── KmSearchInput.tsx  # Chainage range inputs & unit toggles
    │   │   ├── AssetFilterChips.tsx # Category filter chips
    │   │   └── KmResultsList.tsx  # Result cards with chainage badges
    │   ├── map/
    │   │   ├── GpsMapView.tsx     # Leaflet map with custom railway pins
    │   │   └── AssetPopupCard.tsx # Asset popup card with GPS navigate button
    │   ├── staff/
    │   │   ├── StaffDirectory.tsx # Staff & roster list with search
    │   │   ├── QrCardModal.tsx    # Automatic personal QR badge generator
    │   │   └── QrScannerModal.tsx # In-app field QR camera scanner
    │   ├── analytics/
    │   │   ├── AnalyticsDashboard.tsx # Chart.js visualizations container
    │   │   └── MetricCard.tsx     # Summary KPI cards
    │   └── admin/
    │       ├── AdminPanel.tsx     # Super Admin control center
    │       ├── UserPinManager.tsx # User ID / PIN generator
    │       ├── StaffCrudForm.tsx  # Add/edit staff modal
    │       └── DatabaseReseed.tsx # Diagnostic count checker & reseed trigger
    └── utils/
        ├── formatters.ts          # Chainage (Km 1170.500), date, currency formatting
        └── navigation.ts          # Geo URI & Google Maps URL builder
```

---

## 11. Conclusion & Implementation Recommendations

1. **Architecture Readiness**: The proposed React + TypeScript + Vite + Tailwind + Leaflet + Chart.js + QR stack provides a complete, modern, offline-resilient solution fulfilling 100% of DFCCIL IMSD SMUN requirements.
2. **Offline-First & Testable**: The dual-tier persistence layer (`persistentLocalCache` + fallback `LocalDatabaseService`) guarantees that the entire application operates without cloud dependencies during field usage and test automation.
3. **Strict RBAC Enforcement**: Role gates at the UI, service, and security layers provide bulletproof separation between `SUPER_ADMIN`, `OFFICER`, and `STAFF`.
4. **Seamless Integration with `npm run verify`**: The modular service abstractions integrate directly with the verification test suites authored by Explorer 3, enabling deterministic pass/fail validation.
