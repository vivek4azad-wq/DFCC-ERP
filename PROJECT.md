# Project: Rail Diary ERP

Role-based Enterprise Resource Planning (ERP) Android / Mobile Web application designed for DFCCIL IMSD SMUN Unit (Km 1167.210 to Km 1249.720 + SMUN-RPJ Link Line 6.169 Km — Total 88.679 Km).

## Architecture

- **Platform & UI Layer**: React 18+ / TypeScript / Vite / Tailwind CSS / Lucide Icons. Mobile-responsive, touch-optimized, PWA ready for Android field use.
- **Data & Persistence Layer**: Cloud Firestore with `persistentLocalCache` & `persistentMultipleTabManager` (`setPersistenceEnabled(true)`). Dual-tier local fallback (`LocalDatabaseService` / mock Firestore) supporting 100% offline standalone operation and deterministic automated test verification.
- **Security & RBAC Layer**: 3-tier Role-Based Access Control (`SUPER_ADMIN`, `OFFICER`, `STAFF`) enforced across UI components, routing, and database service access guards.
- **Geospatial & Search Engine**: Km Quick Finder chainage boundary query engine (point-in-range & interval overlap) and Leaflet GPS Asset Map with external navigation link generators (`geo:lat,lon` and Google Maps URI).
- **Identity & QR Engine**: Automated client-side QR generation for staff profiles (scannable QR ID badges) + built-in camera QR scanner.
- **Visual Analytics**: Interactive Chart.js visual analytics (staff distribution, asset counts, defect density per 10km block, patrol shift status).
- **Verification Harness**: Standalone test runner and verification suite executable via `npm run verify` in project root with exit code 0 on pass.

## Feature Inventory

| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | Firestore Schemas & Seeding | Seed exact counts for all 10 collections (bridges: 144, level_crossings: 5, officers_staff: 14, keymen: 18, patrol_shifts: 24, points_crossings: 161, curves: 95, track_defects: 48, users, jurisdiction) using reference data from `db.js` | M1 | DONE | ORIGINAL_REQUEST §R2 |
| 2 | Offline Persistence Layer | Firestore offline cache `setPersistenceEnabled(true)` + `LocalDatabaseService` fallback | M1 | DONE | ORIGINAL_REQUEST §R2 |
| 3 | RBAC Security & Auth Matrix | Login with SUPER_ADMIN (`vkazad@dfcc.co.in`), OFFICER PIN, STAFF PIN. UI and service privilege enforcement | M2 | DONE | ORIGINAL_REQUEST §R1 |
| 4 | Super Admin Control Panel | Admin panel restricted to SUPER_ADMIN for user/PIN generation, employee CRUD, asset deletion, and system diagnostics | M2 | DONE | ORIGINAL_REQUEST §R1 |
| 5 | Km Quick Finder | Query assets across chainage ranges on Main Line (1167.210–1249.720) and Link Line (6.169 Km) | M3 | DONE | ORIGINAL_REQUEST §R3 |
| 6 | GPS Asset Map & Navigation | Leaflet map with colored pins and external navigation triggers (`geo:lat,lon` / Google Maps URI) | M3 | DONE | ORIGINAL_REQUEST §R3 |
| 7 | Personal QR Code Generation | Automatic scannable QR badge for staff profiles + QR scanner | M4 | DONE | ORIGINAL_REQUEST §R4 |
| 8 | Interactive Graphical Analytics | Chart.js visual dashboards for staff, assets, defect density per km, patrol shifts | M4 | DONE | ORIGINAL_REQUEST §R5 |
| 9 | Verification Test Suite | Automated verification script `npm run verify` testing Schema Integrity, RBAC Rules, Km Quick Finder | Test | DONE | ORIGINAL_REQUEST §Verification |
| 10 | Final E2E Integration & Verification | 100% passing E2E test suite and adversarial coverage hardening | M5 | DONE | ORIGINAL_REQUEST §Verification |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| Test | E2E Testing Suite (`npm run verify`) | Develop test runner, 6 verification suites, and publish `TEST_READY.md` | none | DONE |
| M1 | Data Models, Seeding & Offline Persistence | TypeScript schemas, 10 collections seed data (144 bridges, 161 PCs, 95 curves, 5 LCs, 14 staff, 18 keymen, 24 shifts, 48 defects), Firestore + LocalDatabaseService | none | DONE |
| M2 | Authentication, RBAC & Admin Panel | Auth provider, role gating, SUPER_ADMIN panel, employee management, PIN generator, asset deletion guards | M1 | DONE |
| M3 | Km Quick Finder & GPS Asset Map | Chainage parser, range search engine, Leaflet interactive map, GPS navigation triggers | M1 | DONE |
| M4 | Staff QR & Interactive Analytics | Profile QR generator, camera scanner, Chart.js visual dashboards | M1, M2 | DONE |
| M5 | Final E2E Integration & Verification | Pass 100% of E2E test suite via `npm run verify` + Adversarial coverage hardening | M1, M2, M3, M4, Test | DONE |

## Interface Contracts

### Data Layer ↔ Feature Modules
- `db.getCollection(name: CollectionName): Promise<T[]>`
- `db.getDocument(collection: CollectionName, id: string): Promise<T | null>`
- `db.addDocument(collection: CollectionName, data: T, user: UserSession): Promise<string>`
- `db.updateDocument(collection: CollectionName, id: string, data: Partial<T>, user: UserSession): Promise<void>`
- `db.deleteDocument(collection: CollectionName, id: string, user: UserSession): Promise<void>`
- `db.queryKmRange(options: KmQueryOptions): Promise<AssetRecord[]>`

### RBAC Layer ↔ UI & Services
- `canPerform(role: UserRole, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ADMIN_PANEL' | 'GENERATE_PIN', resource: string): boolean`
- `SUPER_ADMIN`: All actions allowed across all resources.
- `OFFICER`: READ on all, UPDATE on track assets, CREATE on QR/reports. DELETE blocked. ADMIN_PANEL blocked.
- `STAFF`: READ-only on assets/rosters/directories. All mutations blocked.

### Km Quick Finder ↔ Consumers
- `searchKmRange(startKm: number, endKm: number, line?: 'MAIN' | 'LINK' | 'ALL'): AssetSearchResult`
- Parsing support: `1167.210`, `1167/2`, `1167+210`, floats.

### QR Code Generator ↔ Staff Profile
- `generateStaffQRPayload(staff: OfficerStaffRecord): string` (Formatted JSON / VCard with verification hash).

## Code Layout

```
rail_diary/
├── package.json               # Scripts (dev, build, test, verify) & dependencies
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind styling
├── index.html                 # Main entry HTML
├── public/                    # Static assets & PWA manifest
├── scripts/
│   ├── seed-data.json         # Complete 10 collections seed data
│   ├── verify.mjs             # Main entry point for npm run verify
│   └── tests/                 # Verification test suites
│       ├── schema.test.mjs    # Suite 1: Schema Integrity & 10 Collections count
│       ├── rbac.test.mjs      # Suite 2: RBAC permissions matrix
│       ├── km-finder.test.mjs # Suite 3: Km Quick Finder range queries
│       ├── qr-geo.test.mjs    # Suite 4: QR & GPS navigation builder
│       └── analytics.test.mjs # Suite 5: Analytics data aggregations
└── src/
    ├── types/                 # TypeScript interfaces for all 10 collections & RBAC
    ├── services/              # Firestore, LocalDatabaseService, RBACGuard, KmFinder
    ├── data/                  # Embedded seed data & constants
    ├── context/               # AuthContext & DatabaseContext
    ├── components/            # UI components (Navbar, Sidebar, Admin, Finder, Map, QR, Charts)
    └── App.tsx                # Main App with role-based routing
```
