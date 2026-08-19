# TEST READY: Rail Diary ERP Automated Verification Suite

**Document Version:** 1.0.0  
**Verification Target:** DFCCIL IMSD SMUN Unit (Km 1167.210 to Km 1249.720 + Link Line 6.169 Km = 88.679 Km)  
**Execution Command:** `npm run verify` or `node scripts/verify.mjs`  
**Status:** **READY & PASSING (76 / 76 Assertions - 100% Pass Rate)**  
**Verification Exit Code:** `0`  
**Execution Time:** ~17ms (Zero Cloud Dependency, 100% Offline Deterministic)

---

## 1. Executive Summary

The automated verification harness for **Rail Diary ERP** provides comprehensive, requirement-driven automated tests covering all 10 Cloud Firestore collections, 3-tier Role-Based Access Control (RBAC), the Km Quick Finder chainage query engine, Staff Personal QR serialization/deserialization, GPS geolocation bounding & external navigation routing, and interactive graphical analytics data aggregations.

```
+-----------------------------------------------------------------------------------+
|                           RAIL DIARY VERIFICATION HARNESS                         |
|                       Command: `npm run verify` -> Exit Code: 0                   |
+-----------------------------------------------------------------------------------+
        |
        +---> [Suite 1] Schema Integrity & 10 Collections Counts (20/20 PASS)
        |
        +---> [Suite 2] RBAC Security & 3-Tier Permission Matrix (20/20 PASS)
        |
        +---> [Suite 3] Km Quick Finder & Chainage Boundaries    (17/17 PASS)
        |
        +---> [Suite 4] Personal QR Code & GPS Geolocation       (11/11 PASS)
        |
        +---> [Suite 5] Interactive Analytics Data Aggregation   (8/8 PASS)
```

---

## 2. Verification Suite Inventory & Results Scorecard

| Suite # | Test File Path | Target Domain | Assertions | Passed | Failed | Status |
|---|---|---|:---:|:---:|:---:|:---:|
| **1** | `scripts/tests/schema.test.mjs` | Schema Integrity & 10 Collections Counts | 20 | 20 | 0 | **PASSED** |
| **2** | `scripts/tests/rbac.test.mjs` | RBAC Security & Permission Matrix | 20 | 20 | 0 | **PASSED** |
| **3** | `scripts/tests/km-finder.test.mjs` | Km Quick Finder & Chainage Boundary Engine | 17 | 17 | 0 | **PASSED** |
| **4** | `scripts/tests/qr-geo.test.mjs` | Personal QR Code & GPS Geolocation Engine | 11 | 11 | 0 | **PASSED** |
| **5** | `scripts/tests/analytics.test.mjs` | Interactive Analytics Data Aggregations | 8 | 8 | 0 | **PASSED** |
| **ALL** | `scripts/verify.mjs` | **Total Combined System Verification** | **76** | **76** | **0** | **100% OK** |

---

## 3. Detailed Test Coverage Breakdown

### Suite 1: Schema Integrity & Seeding Counts (`scripts/tests/schema.test.mjs`)
- [x] **Exact Collection Document Counts**:
  - `bridges`: **144** items (18 Major, 74 Minor, 37 RUB, 9 ROB, 6 FOB)
  - `level_crossings`: **5** items (LC-151C, LC-159C, LC-163spl, LC-164spl, LC-167C)
  - `officers_staff`: **14** items (APM, 2 SSE, 2 SE, 3 JE, 3 Exec, 2 MTS, 1 MTS Outsource)
  - `keymen`: **18** items (Beats 1 to 18 covering 88.679 Km)
  - `patrol_shifts`: **24** items (8 block sections × 3 diurnal shifts: 20 filled, 4 vacant)
  - `points_crossings`: **161** items (SMUN: 35, SBJN: 26, NSIR: 18, GVGN: 32, KNNN: 22, CHAN: 28)
  - `curves`: **95** items (Curve No. 315 to Curve No. 409)
  - `track_defects`: **48** items (USFD, Geometry, Fasteners, Welds, SEJ, Ballast)
  - `users`: **3** items ($\ge 3$, includes Master Super Admin `vkazad@dfcc.co.in`)
  - `jurisdiction`: **8** block sections ($\ge 1$, total coverage **88.679 Km**)
- [x] **Property Type & Constraint Invariants**:
  - Primary key string IDs and prefix conventions validated.
  - Required non-empty string fields, numbers, and boolean types.
  - Numeric invariants: chainage start < end, lengths > 0, radii > 0, degree > 0, TUV > 0.
  - Leave balances non-negative (`lap`, `lhap`, `cl`, `rh`).
  - Physical coordinates presence and corridor bounding box compliance.

### Suite 2: Role-Based Access Control (`scripts/tests/rbac.test.mjs`)
- [x] **SUPER_ADMIN (`vkazad@dfcc.co.in`)**:
  - Full CRUD (`CREATE`, `READ`, `UPDATE`, `DELETE`) on all 10 collections.
  - Admin Panel access (`/admin`) granted.
  - User ID & PIN generation (`GENERATE_PIN`) and employee provisioning granted.
  - Asset & material deletion granted.
- [x] **OFFICER (Assigned PIN)**:
  - Full `READ` access on directories, rosters, track assets, and defects.
  - `CREATE` and `UPDATE` on track assets, defects, and inspection logs.
  - Personal QR code generation granted.
  - `DELETE` on track assets and materials **STRICTLY BLOCKED**.
  - `DELETE` on employees/users **STRICTLY BLOCKED**.
  - Admin Panel UI access **STRICTLY BLOCKED**.
  - PIN generation **STRICTLY BLOCKED**.
- [x] **STAFF (AWPO / PIN)**:
  - `READ` access on track assets, rosters, and staff directories.
  - `CREATE` and `UPDATE` on all assets/defects **STRICTLY BLOCKED** (Read-Only).
  - `DELETE` on all collections **STRICTLY BLOCKED**.
  - Admin Panel UI access **STRICTLY BLOCKED**.
  - PIN generation **STRICTLY BLOCKED**.
- [x] **Security Boundary & Adversarial Tests**:
  - Rejection of invalid, empty, null, or unknown roles.
  - Rejection of tampered role escalation payloads.
  - Rejection of unknown resources and operations.

### Suite 3: Km Quick Finder Query Engine (`scripts/tests/km-finder.test.mjs`)
- [x] **Point Match**: Exact chainage query at Km 1215.034 returns Level Crossing `LC-151C`.
- [x] **Window Query**: Km 1170.000 to Km 1172.000 returns all matching assets within that window.
- [x] **Full Corridor**: Km 1167.210 to Km 1249.720 returns full asset registry.
- [x] **Boundaries**: Lower boundary at Km 1167.210 and upper boundary at Km 1249.720 return exact boundary assets.
- [x] **Section Queries**: Block section searches (e.g. SMUN-SBJN 1170.435 to 1188.575).
- [x] **Inverted Range Normalization**: `fromKm: 1200.000, toKm: 1190.000` is normalized to `[1190.000, 1200.000]` and returns identical assets without crashing.
- [x] **Line Isolation**: `line: 'LINK'` queries on 1172.000–1178.000 isolate Link Line assets (Curves 397–409, link bridges) without leaking Main Line assets; `line: 'MAIN'` isolates Main Line assets.
- [x] **Category Filtering**: Filter queries by `Bridge`, `Curve`, `Level Crossing`, `Point & Crossing`, `Track Defect`.
- [x] **Linear Asset Overlap**: Partial curve overlap test (Curve spanning 1174.826–1175.167 matches range 1175.000–1176.000).
- [x] **Out of Bounds Handling**: Out of range chainages (e.g. Km 1000–1100) return empty result `[]` gracefully.
- [x] **Chainage String Parser**: Parses `"1167.210"`, `"1167+210"`, `"1167/2"`, and numeric floats.

### Suite 4: Personal QR & GPS Geolocation (`scripts/tests/qr-geo.test.mjs`)
- [x] **QR Serialization**: Formats valid JSON containing `app: 'RailDiary-DFCCIL'`, `ver: '1.0'`, `staffId`, `name`, `designation`, `role`, `unit`, `phone`, `employmentType`, `qrCodeId`.
- [x] **Outsourced Profiles**: Preserves `awpoId` and `OUTSOURCED` type for contractor staff.
- [x] **Roundtrip Parsing**: `parseStaffQRPayload` restores complete profile without data loss.
- [x] **Special Characters**: Safely handles designations with slashes (`APM / Civil`), brackets (`MTS (Outsource)`), quotes, and hyphens.
- [x] **Error Handling**: Malformed or unverified QR payload strings throw handled errors.
- [x] **Spatial Completeness**: 100% of spatial assets (453 items: 144 bridges, 95 curves, 5 LCs, 161 PCs, 48 defects) have valid finite numeric `latitude` and `longitude`.
- [x] **Geofencing**: All 453 spatial coordinates lie within the IMSD SMUN corridor bounding box (Lat: 29.5000°–31.5000°, Lon: 75.8000°–78.0000°).
- [x] **Navigation URI**: `buildNavigationUri(lat, lon, title)` produces valid HTTPS Google Maps external intent URL.
- [x] **Geo Intent URI**: `buildGeoUri(lat, lon, label)` produces valid native Android `geo:` intent URI.
- [x] **Coordinate Validation**: Accurately flags invalid, null, `NaN`, and out-of-range coordinates.

### Suite 5: Interactive Analytics Data Aggregations (`scripts/tests/analytics.test.mjs`)
- [x] **Staff by Designation**: Aggregates `officers_staff` (14 items) across all designations; sum = 14.
- [x] **Asset Category Breakdown**: Aggregates 144 Bridges, 95 Curves, 5 Level Crossings, 161 Points & Crossings; total = 405.
- [x] **Bridge Subtypes**: Major (18), Minor (74), RUB (37), ROB (9), FOB (6); total = 144.
- [x] **Track Defect Histogram**: Bins 48 defects into 8 Main Line 10-km blocks + 1 Link Line block; total = 48.
- [x] **Patrol Shift Occupancy**: Computes 20 filled shifts + 4 vacant shifts = 24 total (83.33% fill rate).
- [x] **Resilience & Zero-Division**: Empty dataset inputs return zeroed structures without `NaN` or crashes.

---

## 4. How to Run the Verification Suite

### Option A: Standard NPM Script
```bash
npm run verify
```

### Option B: Direct Node Invocation
```bash
node scripts/verify.mjs
```

### Option C: Running Individual Test Suites
```bash
node scripts/tests/schema.test.mjs
node scripts/tests/rbac.test.mjs
node scripts/tests/km-finder.test.mjs
node scripts/tests/qr-geo.test.mjs
node scripts/tests/analytics.test.mjs
```

---

## 5. Artifact Index

- `scripts/verify.mjs` — Top-level test runner and terminal scorecard formatter
- `scripts/seed-data.json` — Complete, authentic seed data for all 10 Firestore collections
- `scripts/tests/test-helper.mjs` — Shared test utilities, data loader, RBAC, Km Finder, QR, GPS, and Analytics engines
- `scripts/tests/schema.test.mjs` — Suite 1: Schema Integrity & Seeding Counts
- `scripts/tests/rbac.test.mjs` — Suite 2: Role-Based Access Control matrix
- `scripts/tests/km-finder.test.mjs` — Suite 3: Km Quick Finder query engine
- `scripts/tests/qr-geo.test.mjs` — Suite 4: Personal QR Code & GPS Geolocation
- `scripts/tests/analytics.test.mjs` — Suite 5: Interactive Analytics Aggregations
- `TEST_READY.md` — This test readiness and coverage report
