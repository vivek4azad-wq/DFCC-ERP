# Rail Diary - Comprehensive Verification & Testing Specification

**Author**: teamwork_preview_explorer_survey_3 (Phase 0 Survey)  
**Date**: 2026-08-15  
**Target Project**: Rail Diary ERP (DFCCIL IMSD SMUN Unit)  
**Verification Entry Point**: `npm run verify` in workspace root  

---

## 1. Executive Summary & Verification Philosophy

The **Rail Diary** ERP application serves mission-critical railway infrastructure management for DFCCIL's IMSD SMUN Unit covering **88.679 Km** (Main Line: Km 1167.210 to Km 1249.720 [82.510 Km] + SMUN-RPJ Link Line [6.169 Km]). Because track safety, asset tracking, duty rosters, and role enforcement govern daily operations, the software requires a deterministic, automated verification harness.

The verification harness must:
1. Be single-command executable via **`npm run verify`** in the project root.
2. Execute completely **offline and deterministically** without requiring live cloud infrastructure or active network connections.
3. Return **exit code `0` on 100% test pass** and **non-zero exit code (`1`) on any failure**.
4. Emit formatted diagnostic summaries and scorecards highlighting pass/fail metrics across all 6 verification domains.

```
+-----------------------------------------------------------------------------------+
|                           RAIL DIARY VERIFICATION HARNESS                         |
|                                  `npm run verify`                                 |
+-----------------------------------------------------------------------------------+
        |
        +---> [1] Schema Integrity & Seeding Suite (10 collections, exact counts)
        |
        +---> [2] RBAC & Security Permission Matrix Suite (SUPER_ADMIN / OFFICER / STAFF)
        |
        +---> [3] Km Quick Finder & Chainage Boundary Suite (88.679 Km bounds, tolerances)
        |
        +---> [4] Personal QR Code Generator & Scanner Suite (Payload schema, vCard/JSON)
        |
        +---> [5] GPS Coordinates & Navigation Route Builder Suite (Geofence, Maps URL)
        |
        +---> [6] Interactive Analytics Data Aggregation Suite (Counts, Buckets, Ratios)
```

---

## 2. Test Architecture & Runner Design

### 2.1 Test Framework Selection

For high performance, zero-config ESM/TypeScript support, and fast in-memory execution, the testing architecture is designed with a dual-layer approach:
1. **Core Test Framework**: **Vitest** (or **Node.js Native Test Runner** `node --test` with custom assertions). Vitest provides native ESM/TypeScript execution, high-speed parallel worker threads, instant feedback, and rich assertion libraries.
2. **Unified Verification CLI Wrapper (`scripts/verify.mjs`)**: A lightweight Node script that coordinates the verification process, executes test suites, performs data integrity checks, formats the terminal scorecard, and enforces clean exit codes.

### 2.2 Package.json Scripts
```json
{
  "name": "rail-diary",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "verify": "node scripts/verify.mjs"
  }
}
```

### 2.3 `scripts/verify.mjs` Orchestration Logic
The verification script:
- Seeds or instantiates the in-memory / local Firestore client.
- Sequentially or concurrently executes all 6 domain test suites.
- Validates that all assertions pass.
- Emits a colored summary table.
- Exits with `process.exit(0)` on total success, or `process.exit(1)` if any assertion fails.

---

## 3. Test Suite 1: Schema Integrity & Seeding Counts

### 3.1 Collection Inventory & Exact Count Targets

The database must initialize **10 distinct Firestore collections** with exact seeded document counts:

| # | Collection Name | Required Count | Description | Primary Key / ID Format |
|---|---|---|---|---|
| 1 | `users` | $\ge 3$ (e.g., 3–5) | User accounts & credentials | `USR-<role>-<id>` / Auth UID |
| 2 | `jurisdiction` | $\ge 1$ (e.g., 1–8) | SMUN Unit Section definitions | `JUR-SMUN-01` / Section ID |
| 3 | `bridges` | **144** | Major, minor, RUB, ROB, FOB, OWG | `BRG-001` to `BRG-144` |
| 4 | `level_crossings` | **5** | LC 151C, 159C, 163spl, 164spl, 167C | `LC-151C`, `LC-159C`, etc. |
| 5 | `officers_staff` | **14** | Officers & staff profiles | `STF-001` to `STF-014` |
| 6 | `keymen` | **18** | Keymen beat rosters & assignments | `KEY-001` to `KEY-018` |
| 7 | `patrol_shifts` | **24** | Night, monsoon, weather patrol shifts | `PAT-001` to `PAT-024` |
| 8 | `points_crossings` | **161** | Points & Crossings across 6 stations | `PC-SMUN-001` .. `PC-CHAN-028` |
| 9 | `curves` | **95** | Curves No. 315 to 409 | `CRV-315` to `CRV-409` |
| 10 | `track_defects` | **48** | Active & historical defect records | `DEF-001` to `DEF-048` |

### 3.2 Schema Validation Rules & Type Invariants

Each collection must be validated against strict property constraints:

```typescript
// 1. users
interface UserSchema {
  id: string;                      // Non-empty string
  email: string;                   // Valid email format (e.g. vkazad@dfcc.co.in)
  name: string;                    // Non-empty string
  role: 'SUPER_ADMIN' | 'OFFICER' | 'STAFF';
  pin: string;                     // 4-6 digit string PIN
  designation: string;             // e.g. "Assistant Project Manager / Civil"
  unit: string;                    // "IMSD SMUN"
  contactNo: string;               // 10-digit Indian phone format
  createdAt: string | number;      // ISO string or epoch timestamp
}

// 2. jurisdiction
interface JurisdictionSchema {
  unitName: string;                // "IMSD SMUN Unit"
  mainLine: {
    startKm: number;               // 1167.210
    endKm: number;                 // 1249.720
    totalKm: number;               // 82.510
  };
  linkLine: {
    name: string;                  // "SMUN-RPJ Link Line"
    startKm: number;               // 1168.697
    endKm: number;                 // 1178.150
    totalKm: number;               // 6.169 (or span length)
  };
  totalCoverageKm: number;         // 88.679
  stations: Array<{
    code: string;                  // e.g. "SMUN", "SBJN", "NSIR", "GVGN", "KNNN", "CHAN", "RPJ"
    name: string;
    chainageKm: number;
  }>;
  blockSections: Array<{
    sectionId: string;
    fromStation: string;
    toStation: string;
    startKm: number;
    endKm: number;
  }>;
}

// 3. bridges (Count = 144)
interface BridgeSchema {
  id: string;                      // Matches /^BRG-\d+$/
  bridgeNo: string;                // e.g. "BR-1172/1"
  type: 'MJB' | 'MIB' | 'RUB' | 'ROB' | 'FOB' | 'OWG' | string;
  category: 'Major Bridge' | 'Minor Bridge' | 'Road Under Bridge' | 'Road Over Bridge' | 'Foot Over Bridge' | 'Rail Over Rail';
  chainageKm: number;              // 1167.210 <= chainageKm <= 1249.720 OR Link Line
  section: string;                 // e.g. "SMUN-SBJN"
  spanConfiguration: string;       // e.g. "1x12.2m", "3x24.4m"
  structureType: string;           // e.g. "RCC Box", "Composite Girder"
  lat: number;                     // 29.5 <= lat <= 31.5
  lon: number;                     // 76.0 <= lon <= 78.0
  inspectionDue: string;           // ISO date format YYYY-MM-DD
  condition: 'Good' | 'Fair' | 'Requires Attention';
}

// 4. level_crossings (Count = 5)
interface LevelCrossingSchema {
  id: string;                      // 'LC-151C' | 'LC-159C' | 'LC-163spl' | 'LC-164spl' | 'LC-167C'
  lcNo: string;
  chainageKm: number;              // 1215.034, 1232.095, 1239.827, 1244.833, 1248.664
  section: string;
  classification: 'Special' | 'Class C';
  tuv: number;                     // > 0
  mannedStatus: 'Manned' | 'Interlocked Manned' | 'Unmanned';
  gateType: string;                // e.g. "Lifting Barrier"
  lat: number;
  lon: number;
}

// 5. officers_staff (Count = 14)
interface OfficerStaffSchema {
  id: string;                      // Matches /^STF-\d+$/
  name: string;
  designation: string;             // 'APM' | 'Sr. Section Engineer' | 'Section Engineer' | 'Jr. Engineer' | 'Executive' | 'MTS' | etc.
  role: 'SUPER_ADMIN' | 'OFFICER' | 'STAFF';
  employmentType: 'Permanent' | 'Outsourced';
  contactNo: string;               // 10 digits
  email: string;
  posting: string;
  qrPayload: string;               // Formatted string or JSON
  leaveBalances: {
    lap: number;                   // >= 0
    lhap: number;                  // >= 0
    cl: number;                    // >= 0
    rh: number;                    // >= 0
  };
}

// 6. keymen (Count = 18)
interface KeymanSchema {
  id: string;                      // Matches /^KEY-\d+$/
  name: string;
  awpoId: string;                  // e.g. "EMP-KY-101"
  beatSection: string;             // e.g. "Km 1167.210 - Km 1172.000 UP"
  beatStartKm: number;
  beatEndKm: number;
  line: 'UP' | 'DOWN' | 'SINGLE' | 'LINK';
  dutyShift: string;               // "06:00 - 14:00"
  contactNo: string;
  supervisorId: string;
  status: 'Active' | 'On Leave' | 'Relieved';
}

// 7. patrol_shifts (Count = 24)
interface PatrolShiftSchema {
  id: string;                      // Matches /^PAT-\d+$/
  patrolmanName: string;
  shiftType: 'Night Patrol' | 'Monsoon Patrol' | 'Hot Weather Patrol' | 'Cold Weather Patrol' | 'Routine Day Patrol';
  timing: string;                  // e.g. "22:00 - 06:00"
  startKm: number;
  endKm: number;
  line: 'UP' | 'DOWN' | 'LINK';
  status: 'Filled' | 'Vacant';
  date: string;                    // ISO date YYYY-MM-DD
  assignedStaffId?: string | null;
  inspectionRemarks?: string;
}

// 8. points_crossings (Count = 161)
interface PointCrossingSchema {
  id: string;                      // Matches /^PC-[A-Z]+-\d+$/ (SMUN: 35, SBJN: 26, NSIR: 18, GVGN: 32, KNNN: 22, CHAN: 28)
  ptNo: string;                    // e.g. "201b", "243a"
  station: 'SMUN' | 'SBJN' | 'NSIR' | 'GVGN' | 'KNNN' | 'CHAN';
  lineType: 'Main Line' | 'Loop' | 'D/S';
  angle: '1/12' | '1/8.5';
  chainageKm: number;
  layoutType: 'Straight' | 'Curve';
  hand: 'LH' | 'RH';
  facingTrailing: 'Facing' | 'Trailing' | 'SL';
  stationsBehindCrossing: string | number;
  lat: number;
  lon: number;
}

// 9. curves (Count = 95)
interface CurveSchema {
  id: string;                      // Matches /^CRV-\d+$/
  curveNo: number;                 // 315 <= curveNo <= 409
  fromKm: number;                  // 1167.210 <= fromKm <= 1249.720
  toKm: number;                    // fromKm < toKm
  lengthMeters: number;            // > 0
  degreeOfCurve: number;           // > 0
  radiusMeters: number;            // > 0
  speedLimitKmph: number;          // > 0
  transitionLengthM: number;
  circularLengthM: number;
  cantMm: number;
  section: string;
  inCharge: string;
  lat: number;
  lon: number;
}

// 10. track_defects (Count = 48)
interface TrackDefectSchema {
  id: string;                      // Matches /^DEF-\d+$/
  defectType: 'Weld Defect / IMR' | 'Rail Fracture' | 'Corrugation' | 'Scabbing' | 'Gauge Variation' | 'Cross Level Defect' | 'Missing Fitting' | 'Ballast Deficiency' | 'Joint Defect';
  chainageKm: number;
  line: 'UP' | 'DOWN' | 'LINK';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  status: 'OPEN' | 'ATTENDED' | 'RECTIFIED' | 'VERIFIED';
  detectedBy: string;
  detectedDate: string;            // ISO Date
  targetRectificationDate: string; // ISO Date
  rectificationDetails: string | null;
  lat: number;
  lon: number;
}
```

### 3.3 Test Assertions for Schema Integrity
1. `expect(db.collection('bridges').count()).toBe(144)`
2. `expect(db.collection('level_crossings').count()).toBe(5)`
3. `expect(db.collection('officers_staff').count()).toBe(14)`
4. `expect(db.collection('keymen').count()).toBe(18)`
5. `expect(db.collection('patrol_shifts').count()).toBe(24)`
6. `expect(db.collection('points_crossings').count()).toBe(161)`
   - Breakdown: SMUN (35), SBJN (26), NSIR (18), GVGN (32), KNNN (22), CHAN (28) -> $\sum = 161$.
7. `expect(db.collection('curves').count()).toBe(95)`
   - Curve numbers span from `315` to `409` inclusive (exact sequence 315..409 = 95 items).
8. `expect(db.collection('track_defects').count()).toBe(48)`
9. `expect(db.collection('users').count()).toBeGreaterThanOrEqual(3)`
   - Must contain Master Admin `vkazad@dfcc.co.in` with role `SUPER_ADMIN`.
10. `expect(db.collection('jurisdiction').count()).toBeGreaterThanOrEqual(1)`
    - Validates Main Line total (82.510 km) + Link Line (6.169 km) = 88.679 km.

---

## 4. Test Suite 2: Role-Based Access Control (RBAC) & Security Matrix

### 4.1 Access Control Matrix

The authorization layer enforces the following matrix across both client-side route guards / action dispatchers and backend Firestore security rules:

| Operation / Resource | SUPER_ADMIN (`vkazad@dfcc.co.in`) | OFFICER (Assigned PIN) | STAFF (AWPO / PIN) |
|---|---|---|---|
| **View Directories & Rosters** | Allowed (`true`) | Allowed (`true`) | Allowed (`true`) |
| **View Track Assets (Bridges, Curves, etc.)** | Allowed (`true`) | Allowed (`true`) | Allowed (`true`) |
| **Add / Edit Track Assets & Defects** | Allowed (`true`) | Allowed (`true`) | **BLOCKED (`false`)** |
| **Delete Track Assets & Materials** | Allowed (`true`) | **BLOCKED (`false`)** | **BLOCKED (`false`)** |
| **Generate Personal QR Code** | Allowed (`true`) | Allowed (`true`) | **BLOCKED / Read-Only** |
| **Access Admin Panel UI** | Allowed (`true`) | **BLOCKED (`false`)** | **BLOCKED (`false`)** |
| **Add / Edit / Delete Employees** | Allowed (`true`) | **BLOCKED (`false`)** | **BLOCKED (`false`)** |
| **Generate / Reset User IDs & PINs** | Allowed (`true`) | **BLOCKED (`false`)** | **BLOCKED (`false`)** |

### 4.2 Security Test Cases

```typescript
describe('RBAC Security & Permission Matrix Suite', () => {
  const superAdminContext = { role: 'SUPER_ADMIN', email: 'vkazad@dfcc.co.in', id: 'USR-SA-01' };
  const officerContext = { role: 'OFFICER', id: 'USR-OFF-01', designation: 'Section Engineer' };
  const staffContext = { role: 'STAFF', id: 'USR-STF-01', designation: 'Track Maintainer' };

  describe('STAFF Access Restrictions', () => {
    test('STAFF can read track assets and directory', () => {
      expect(canRead('bridges', staffContext)).toBe(true);
      expect(canRead('officers_staff', staffContext)).toBe(true);
    });

    test('STAFF cannot create or update track assets', () => {
      expect(canCreate('bridges', { ...mockBridge }, staffContext)).toBe(false);
      expect(canUpdate('track_defects', 'DEF-001', { status: 'RECTIFIED' }, staffContext)).toBe(false);
    });

    test('STAFF cannot delete any asset or employee', () => {
      expect(canDelete('bridges', 'BRG-001', staffContext)).toBe(false);
      expect(canDelete('officers_staff', 'STF-001', staffContext)).toBe(false);
    });

    test('STAFF is forbidden from Admin Panel route and capabilities', () => {
      expect(canAccessRoute('/admin', staffContext)).toBe(false);
      expect(canManageUsers(staffContext)).toBe(false);
      expect(canGeneratePins(staffContext)).toBe(false);
    });
  });

  describe('OFFICER Access Restrictions & Privileges', () => {
    test('OFFICER can read all directories, rosters, and assets', () => {
      expect(canRead('bridges', officerContext)).toBe(true);
      expect(canRead('keymen', officerContext)).toBe(true);
      expect(canRead('patrol_shifts', officerContext)).toBe(true);
    });

    test('OFFICER can create and update track defects and assets', () => {
      expect(canCreate('track_defects', { ...mockDefect }, officerContext)).toBe(true);
      expect(canUpdate('track_defects', 'DEF-001', { status: 'ATTENDED' }, officerContext)).toBe(true);
    });

    test('OFFICER CANNOT delete assets or materials', () => {
      expect(canDelete('bridges', 'BRG-001', officerContext)).toBe(false);
      expect(canDelete('points_crossings', 'PC-SMUN-001', officerContext)).toBe(false);
      expect(canDelete('curves', 'CRV-315', officerContext)).toBe(false);
    });

    test('OFFICER CANNOT manage users or access Admin Panel', () => {
      expect(canAccessRoute('/admin', officerContext)).toBe(false);
      expect(canManageUsers(officerContext)).toBe(false);
      expect(canDelete('officers_staff', 'STF-001', officerContext)).toBe(false);
    });

    test('OFFICER can generate personal QR codes', () => {
      expect(canGeneratePersonalQR(officerContext)).toBe(true);
    });
  });

  describe('SUPER_ADMIN Access Privileges', () => {
    test('SUPER_ADMIN has full CRUD on all 10 collections', () => {
      expect(canCreate('officers_staff', { ...mockStaff }, superAdminContext)).toBe(true);
      expect(canUpdate('officers_staff', 'STF-001', { name: 'Updated' }, superAdminContext)).toBe(true);
      expect(canDelete('officers_staff', 'STF-001', superAdminContext)).toBe(true);
      expect(canDelete('bridges', 'BRG-001', superAdminContext)).toBe(true);
      expect(canDelete('curves', 'CRV-315', superAdminContext)).toBe(true);
    });

    test('SUPER_ADMIN can access Admin Panel, generate PINs, and manage credentials', () => {
      expect(canAccessRoute('/admin', superAdminContext)).toBe(true);
      expect(canManageUsers(superAdminContext)).toBe(true);
      expect(canGeneratePins(superAdminContext)).toBe(true);
    });
  });
});
```

---

## 5. Test Suite 3: Km Quick Finder & Chainage Boundary Searches

### 5.1 Geographic & Chainage Domain Boundaries
- **Main Line**: `Km 1167.210` to `Km 1249.720` (Total length: `82.510 Km`)
- **Link Line (SMUN-RPJ)**: `Km 1168.697` to `Km 1178.150` (Section length: `6.169 Km` / `9.453 Km` span)
- **Total Combined Section**: `88.679 Km`

### 5.2 Test Scenarios & Edge Cases

```typescript
describe('Km Quick Finder & Chainage Search Suite', () => {
  // 1. Exact Point Match
  test('Exact chainage query returns matching assets at that location', () => {
    const results = queryKmRange({ startKm: 1215.034, endKm: 1215.034, isLinkLine: false });
    expect(results.some(a => a.id === 'LC-151C')).toBe(true);
  });

  // 2. Window Range Query
  test('Window range query (Km 1170.000 to Km 1172.000) returns all assets within chainage window', () => {
    const results = queryKmRange({ startKm: 1170.000, endKm: 1172.000, isLinkLine: false });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(asset => {
      const km = asset.chainageKm ?? asset.fromKm ?? asset.beatStartKm;
      expect(km).toBeGreaterThanOrEqual(1170.000 - 0.001);
      expect(km).toBeLessThanOrEqual(1172.000 + 0.001);
    });
  });

  // 3. Station Section Search (SMUN to SBJN: 1170.435 to 1188.575)
  test('Section filter returns correct subset for SMUN-SBJN block', () => {
    const results = queryKmRange({ startKm: 1170.435, endKm: 1188.575, isLinkLine: false });
    const pcResults = results.filter(a => a.type === 'points_crossings' || a.id?.startsWith('PC-'));
    expect(pcResults.length).toBeGreaterThan(0);
  });

  // 4. Boundary Values
  test('Lower bound boundary check at Km 1167.210', () => {
    const results = queryKmRange({ startKm: 1167.210, endKm: 1168.000, isLinkLine: false });
    expect(results.length).toBeGreaterThan(0);
  });

  test('Upper bound boundary check at Km 1249.720', () => {
    const results = queryKmRange({ startKm: 1249.000, endKm: 1249.720, isLinkLine: false });
    expect(results.length).toBeGreaterThan(0);
  });

  // 5. Link Line vs Main Line Disambiguation
  test('Link line queries isolate link line assets without leaking main line assets', () => {
    const mainResults = queryKmRange({ startKm: 1172.000, endKm: 1175.000, isLinkLine: false });
    const linkResults = queryKmRange({ startKm: 1172.000, endKm: 1175.000, isLinkLine: true });
    
    // Verify results are appropriately segregated by line
    expect(linkResults.every(a => a.line === 'LINK' || a.section?.includes('RPJ'))).toBe(true);
  });

  // 6. Inverted Range Auto-Correction or Handling
  test('Inverted range query (1200.000 to 1180.000) is normalized or handled gracefully', () => {
    const results = queryKmRange({ startKm: 1200.000, endKm: 1180.000, isLinkLine: false });
    expect(results.length).toBeGreaterThan(0);
  });

  // 7. Out of Range Queries
  test('Out of bounds query (e.g. Km 1000.000 to 1100.000) returns empty list without error', () => {
    const results = queryKmRange({ startKm: 1000.000, endKm: 1100.000, isLinkLine: false });
    expect(results).toEqual([]);
  });

  // 8. Multi-Asset Type Filtering
  test('Quick Finder supports filtering by specific asset categories', () => {
    const bridgesOnly = queryKmRange({ startKm: 1167.210, endKm: 1249.720, assetTypes: ['bridges'] });
    expect(bridgesOnly.length).toBe(144);
    expect(bridgesOnly.every(a => a.category?.includes('Bridge') || a.id.startsWith('BRG-'))).toBe(true);
  });
});
```

---

## 6. Test Suite 4: Personal QR Code Generation Specification

### 6.1 QR Code Payload Schema

Every staff member profile must generate an encoded payload (formatted as standardized JSON string or vCard/URI format):

```json
{
  "app": "RailDiary-DFCCIL",
  "version": "1.0",
  "staffId": "STF-001",
  "name": "Shri Vivek Kumar Azad",
  "designation": "Assistant Project Manager / Civil",
  "unit": "IMSD SMUN",
  "contactNo": "9876543210",
  "role": "SUPER_ADMIN",
  "employmentType": "Permanent",
  "qrCodeId": "AG-STAFF-STF-001"
}
```

### 6.2 Test Assertions for QR Generation & Decoding
1. **Payload Integrity**: Assert that `generateStaffQRPayload(staffMember)` returns a valid string containing all required employee attributes.
2. **Deterministic Hash / ID**: Assert that `qrCodeId` matches standard pattern `AG-STAFF-${staffId}`.
3. **Parse Resilience**: Assert that parsing the generated QR string restores the exact original staff object without data loss.
4. **Special Character Handling**: Verify names with brackets or designations with slashes (e.g. `MTS (Outsource)`, `APM / Civil`) encode and decode without corruption.
5. **Offline Scalability**: Verify QR code generation executes instantaneously in-memory without network calls.

---

## 7. Test Suite 5: GPS Geolocation & Navigation Routing Specification

### 7.1 Coordinate Validity & Bounds Checking
All asset geographic coordinates must fall within the physical corridor of DFCCIL IMSD SMUN section (Northern Railway / EDFC corridor, Haryana/Punjab region):
- **Latitude Range**: `29.5000° N` to `31.5000° N`
- **Longitude Range**: `76.0000° E` to `78.0000° E`

### 7.2 Navigation Route URL Builder Specification
When a user taps an asset pin or navigation action, the app must construct a valid external GPS launch URI:
```typescript
export function buildNavigationUri(lat: number, lon: number, title?: string): string {
  const encodedTitle = title ? encodeURIComponent(title) : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}${title ? `&destination_place_id=${encodedTitle}` : ''}`;
}
```

### 7.3 Test Assertions
1. **Coordinates Exists**: 100% of `bridges`, `level_crossings`, `points_crossings`, `curves`, and `track_defects` have valid finite numeric `lat` and `lon`.
2. **Corridor Geofence**: All coordinates pass `lat >= 29.5 && lat <= 31.5 && lon >= 76.0 && lon <= 78.0`.
3. **Valid URI Scheme**: `buildNavigationUri(asset.lat, asset.lon, asset.name)` produces valid HTTPS URL matching `^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=\d+\.\d+,\d+\.\d+`.
4. **Native Android Intent URI Compatibility**: Assert compatibility with `geo:lat,lon?q=lat,lon(label)`.

---

## 8. Test Suite 6: Interactive Analytics Data Aggregation Specification

### 8.1 Metric Aggregations & Formulas

The analytics engine produces 4 primary visual aggregations:

#### A. Staff Distribution by Designation
- Input: `officers_staff` (14 items)
- Aggregation: Group by `designation` -> `{ APM: 1, 'Sr. Section Engineer': 1, 'Section Engineer': 1, 'Jr. Engineer': 1, MTS: 2, 'MTS (Outsource)': 1, Keyman: 1, Patrolman: 2, 'Sr. Executive': 1, Executive: 1, Gangman: 2, 'Track Maintainer': 1 }`
- Invariant: Sum of counts must equal `14`.

#### B. Asset Counts by Category
- Input: `bridges` (144), `curves` (95), `level_crossings` (5), `points_crossings` (161)
- Aggregation: `{ bridges: 144, curves: 95, levelCrossings: 5, pointsCrossings: 161, totalAssets: 405 }`
- Invariant: `totalAssets === 405`.

#### C. Defects Counted per 10-Km Block Section
- Input: `track_defects` (48 items)
- Buckets:
  - `Km 1167.210 - 1180.000`
  - `Km 1180.001 - 1190.000`
  - `Km 1190.001 - 1200.000`
  - `Km 1200.001 - 1210.000`
  - `Km 1210.001 - 1220.000`
  - `Km 1220.001 - 1230.000`
  - `Km 1230.001 - 1240.000`
  - `Km 1240.001 - 1249.720`
  - `Link Line (SMUN-RPJ)`
- Invariant: Sum of defect counts across all buckets must equal `48`.

#### D. Patrol Shift Occupancy (Filled vs Vacant)
- Input: `patrol_shifts` (24 items)
- Invariant: `filledShifts + vacantShifts === 24`.

### 8.2 Test Assertions for Analytics
```typescript
describe('Interactive Analytics Aggregation Suite', () => {
  test('Staff designation aggregation sums exactly to 14', () => {
    const summary = aggregateStaffByDesignation(mockStaffCollection);
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    expect(total).toBe(14);
  });

  test('Infrastructure asset inventory aggregation sums exactly to 405', () => {
    const summary = aggregateAssetCounts({
      bridges: mockBridges,
      curves: mockCurves,
      levelCrossings: mockLCs,
      pointsCrossings: mockPCs
    });
    expect(summary.bridges).toBe(144);
    expect(summary.curves).toBe(95);
    expect(summary.levelCrossings).toBe(5);
    expect(summary.pointsCrossings).toBe(161);
    expect(summary.totalAssets).toBe(405);
  });

  test('Track defects 10-km section distribution sums to 48', () => {
    const buckets = aggregateDefectsByKmBlock(mockDefects);
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(48);
  });

  test('Patrol shift status counts sum to 24', () => {
    const stats = aggregatePatrolShiftStatus(mockPatrolShifts);
    expect(stats.filled + stats.vacant).toBe(24);
  });
});
```

---

## 9. Dependency Requirements & Package Architecture

### 9.1 Recommended Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "qrcode.react": "^3.1.0",
    "chart.js": "^4.4.3",
    "react-chartjs-2": "^5.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.3.4",
    "vitest": "^2.0.4"
  }
}
```

### 9.2 Zero-Dependency Fallback Verification Script
To guarantee that `npm run verify` runs even prior to full node_modules installation or in lightweight environments, `scripts/verify.mjs` can leverage standard Node.js built-ins (`node:assert`, `node:test`, `node:fs`, `node:path`), making the verification runner 100% self-contained.

---

## 10. Mocking & Offline Firestore Persistence Strategy

### 10.1 Offline Persistence Architecture
As specified in R2 (`setPersistenceEnabled(true)`), the client must enable local offline persistence. For automated testing:
1. **Mock Firestore Client (`src/db/mockFirestore.ts` or `src/db/inMemoryDb.ts`)**:
   - Implements Firestore collection and document references (`collection()`, `doc()`, `getDocs()`, `setDoc()`, `updateDoc()`, `deleteDoc()`).
   - Implements query filtering (`where()`, `orderBy()`, `limit()`).
   - Seeds all 10 collections on initialization with exact reference data.
   - Retains state in-memory or persists to `localStorage` / `indexedDB` mock.
2. **Offline Mode Switch**:
   - Allows simulation of network disconnects to verify offline read capability.

---

## 11. Test Directory Structure & File Layout

```
rail_diary/
├── scripts/
│   └── verify.mjs                     # Top-level verification runner (`npm run verify`)
├── src/
│   ├── data/
│   │   ├── seedData.ts                # Real & realistic seed data for all 10 collections
│   │   └── referenceAssets.ts         # Curves (95), PCs (161), LCs (5) reference records
│   ├── db/
│   │   ├── firestore.ts               # Production Firestore config with offline persistence
│   │   └── inMemoryDb.ts              # In-memory mock Firestore for testing/dev
│   ├── auth/
│   │   ├── rbac.ts                    # RBAC rules & permission checker functions
│   │   └── authContext.tsx            # Auth provider with SUPER_ADMIN / OFFICER / STAFF state
│   ├── utils/
│   │   ├── quickFinder.ts             # Km chainage range query algorithm
│   │   ├── qrGenerator.ts             # Personal QR generator & payload serializer
│   │   ├── geoUtils.ts                # GPS bounds & Google Maps navigation URL builder
│   │   └── analyticsAggregator.ts     # Data aggregation functions for charts & KPIs
│   └── tests/
│       ├── schema.test.ts             # Suite 1: 10 collections, exact counts & schemas
│       ├── rbac.test.ts               # Suite 2: RBAC permissions matrix
│       ├── quickFinder.test.ts        # Suite 3: Km Quick Finder boundary & range tests
│       ├── qr.test.ts                 # Suite 4: QR payload & format tests
│       ├── gps.test.ts                # Suite 5: GPS navigation & coordinates tests
│       └── analytics.test.ts          # Suite 6: Aggregations & chart metrics tests
├── package.json
└── vite.config.ts
```

---

## 12. Verification Scorecard Format & Output Sample

When a developer or CI runs `npm run verify`, the terminal will display the following structured scorecard:

```text
================================================================================
                     RAIL DIARY ERP - SYSTEM VERIFICATION SUITE
================================================================================

[✓] 1. SCHEMA INTEGRITY & SEEDING COUNTS
    • bridges:             144 / 144 items (PASS)
    • level_crossings:       5 /   5 items (PASS)
    • officers_staff:       14 /  14 items (PASS)
    • keymen:               18 /  18 items (PASS)
    • patrol_shifts:        24 /  24 items (PASS)
    • points_crossings:    161 / 161 items (PASS - SMUN:35, SBJN:26, NSIR:18, GVGN:32, KNNN:22, CHAN:28)
    • curves:               95 /  95 items (PASS - Curve No. 315 to 409)
    • track_defects:        48 /  48 items (PASS)
    • users:                 3 /   3 items (PASS - Master ID vkazad@dfcc.co.in present)
    • jurisdiction:          1 /   1 items (PASS - 88.679 Km total coverage verified)

[✓] 2. RBAC SECURITY & PERMISSION RULES
    • STAFF write/create blocked (PASS)
    • STAFF delete blocked (PASS)
    • STAFF admin panel access forbidden (PASS)
    • OFFICER asset create/edit allowed (PASS)
    • OFFICER asset delete blocked (PASS)
    • OFFICER user management blocked (PASS)
    • SUPER_ADMIN full CRUD permissions (PASS)
    • SUPER_ADMIN admin panel & PIN generation granted (PASS)

[✓] 3. KM QUICK FINDER & CHAINAGE BOUNDARIES
    • Main line boundaries (Km 1167.210 to Km 1249.720) verified (PASS)
    • Link line segment (SMUN-RPJ 6.169 Km) isolation verified (PASS)
    • Exact point query at Km 1215.034 (LC-151C) verified (PASS)
    • Window query (Km 1170.000 - 1172.000) verified (PASS)
    • Inverted range normalization verified (PASS)
    • Out-of-bounds queries handling verified (PASS)

[✓] 4. PERSONAL QR CODE GENERATION
    • Staff payload serialization & parsing verified (PASS)
    • AG-STAFF-STF-xxx identifier pattern verified (PASS)
    • Special characters & designations resilience verified (PASS)

[✓] 5. GPS GEOLOCATION & NAVIGATION ROUTING
    • 100% asset coordinates present and valid (PASS)
    • Corridor bounding box (Lat 29.5-31.5, Lon 76.0-78.0) verified (PASS)
    • Google Maps intent/directions URI builder verified (PASS)

[✓] 6. INTERACTIVE ANALYTICS AGGREGATION
    • Staff designation distribution sum = 14 (PASS)
    • Asset category counts sum = 405 (PASS)
    • Defect 10-km block distribution sum = 48 (PASS)
    • Patrol shift occupancy sum = 24 (PASS)

================================================================================
VERIFICATION SUMMARY: ALL 6 SUITES PASSED (64/64 ASSERTIONS) - EXIT CODE: 0
================================================================================
```

---

## 13. Summary & Recommendations for Implementation Track

1. **Deterministic Seeding First**: Implement `src/data/seedData.ts` adhering strictly to reference numbers (144 bridges, 5 LCs, 14 staff, 18 keymen, 24 patrol shifts, 161 points & crossings, 95 curves, 48 track defects).
2. **Implement Core Logic with Co-Located Tests**: Co-locate unit tests alongside their respective utilities (`quickFinder.ts` -> `quickFinder.test.ts`).
3. **Verify Early and Often**: Run `npm run verify` as the ultimate quality gate before milestone signoffs.
