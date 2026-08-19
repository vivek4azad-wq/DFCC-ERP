# Phase 0 Survey Report: Rail Diary (DFCCIL IMSD SMUN Unit ERP)

**Document Version:** 1.0.0  
**Author:** specification_miner (teamwork_preview_spec_miner_survey_1)  
**Date:** 2026-08-15  
**Jurisdiction:** DFCCIL Eastern Corridor — Integrated Maintenance Sub-Depot Shambhu (IMSD SMUN)  
**Territory Span:** Km 1167.210 to Km 1249.720 (82.510 Km Main Line) + SMUN–RPJ Link Line (6.169 Km) — **Total Track Length: 88.679 Km**  
**Integrity Mode:** Development  

---

## 1. Executive Summary & Specification Scope

The "Rail Diary" project is a production-grade Enterprise Resource Planning (ERP) Android application customized for the Dedicated Freight Corridor Corporation of India Limited (DFCCIL), specifically tailored for the **IMSD SMUN (Shambhu)** maintenance unit under Ambala division. The system provides real-time track asset management, role-based access control (RBAC), scannable QR generation for staff, Km quick search utilities, GPS geospatial navigation, defect lifecycle tracking, and interactive graphical analytics.

This Phase 0 Survey analyzes:
1. `ORIGINAL_REQUEST.md` requirements (R1–R5, verification plan, acceptance criteria).
2. Reference asset database `antigravity-ims/js/db.js` containing authentic field data for Points & Crossings (161 items), Curves (95 items), Level Crossings (5 items), Block Sections (8 items), SEJs (13 items), and LWRs (7 items).
3. Exact schemas, data types, indexing, validation rules, and sample JSON payloads for all 10 Firestore collections.
4. Deterministic, authentic synthetic generation rules for collections requiring mock records (Bridges: 144 items, Officers & Staff: 14 items, Keymen: 18 items, Patrol Shifts: 24 items, Track Defects: 48 items, Users, Jurisdiction).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & RBAC | Super Admin Master Login | Full access authentication using Master ID `vkazad@dfcc.co.in` (Shri Vivek Kumar Azad, APM/Civil) | Master email & master PIN | Super Admin Session, Admin Panel access | 401 Unauthorized on invalid PIN | `ORIGINAL_REQUEST.md` R1 |
| 2 | Auth & RBAC | Field Officer PIN Login | Officer authentication for Section Engineers & Junior Engineers | User ID & 4-6 digit numeric PIN | Officer Session, Edit asset privileges | 401 Unauthorized / Invalid PIN | `ORIGINAL_REQUEST.md` R1 |
| 3 | Auth & RBAC | Field Staff AWPO/PIN Login | Staff authentication for Keymen, Patrolmen, Track Maintainers, MTS | AWPO ID or Staff PIN | Staff Session (Read-Only on assets) | 401 Unauthorized / Access Denied | `ORIGINAL_REQUEST.md` R1 |
| 4 | Auth & RBAC | User ID & PIN Generator | Admin panel tool to provision new staff/officers with auto-generated credentials | Staff details (Name, Post, Role) | New User Doc, Generated UserID & PIN | 403 Forbidden for non-SUPER_ADMIN | `ORIGINAL_REQUEST.md` R1 |
| 5 | Auth & RBAC | Role-Gated Asset Deletion | Destructive actions (deleting assets/materials) restricted strictly to Super Admin | Asset ID | Deletion Confirmation / Firestore delete | 403 Permission Denied for OFFICER/STAFF | `ORIGINAL_REQUEST.md` R1 |
| 6 | Database | Offline Firestore Caching | Offline persistence using `setPersistenceEnabled(true)` with LRU cache | Query requests (offline/online) | Cached or remote document snapshot | Graceful fallback to IndexedDB/SQLite cache | `ORIGINAL_REQUEST.md` R2 |
| 7 | Database | 10 Firestore Collections | Standardized schema structure across 10 collections with exact document counts | Collection query / ID fetch | Document snapshots matching schema | Schema validation error if properties missing | `ORIGINAL_REQUEST.md` R2 |
| 8 | Search | Km Quick Finder | Sub-second chainage range query across Main Line (Km 1167.210–1249.720) & Link Line | Range: From Km, To Km, Line Type | List of matched Assets (Bridges, Curves, LC, P&C, Defects) | Empty list if out-of-range | `ORIGINAL_REQUEST.md` R3 |
| 9 | Geospatial | GPS Asset Navigation Map | Map screen displaying asset pins (Lat/Lon) with Google Maps external navigation trigger | Tap on Map Pin | Intent launch `geo:lat,lon` or Google Maps URL | Alert if GPS coordinates invalid | `ORIGINAL_REQUEST.md` R3 |
| 10 | Identification | Personal Staff QR Code | Auto-generated scannable QR for permanent & outsourced staff profiles | Staff Profile data | High-res QR code image & text payload | Fallback placeholder if data incomplete | `ORIGINAL_REQUEST.md` R4 |
| 11 | Analytics | Staff Designation Distribution | Interactive bar/pie chart of staff counts grouped by designation | Officers/Staff collection | Rendered chart graphic & breakdown table | Empty state if zero records | `ORIGINAL_REQUEST.md` R5 |
| 12 | Analytics | Asset Category Breakdown | Aggregated counts of 144 Bridges, 95 Curves, 5 LCs, 161 P&C | Assets collections | Donut / Bar chart with totals | Zero-count handling | `ORIGINAL_REQUEST.md` R5 |
| 13 | Analytics | Defects per Km Histogram | Spatial defect density histogram binned across 10 Km chainage intervals | Track Defects collection | Histogram with severity color-coding | Empty bins displayed as 0 | `ORIGINAL_REQUEST.md` R5 |
| 14 | Analytics | Patrol Shifts Fill Ratio | Visual gauge comparing filled vs vacant patrol shifts (20 filled vs 4 vacant) | Patrol Shifts collection | Gauge / Pie chart (Filled %, Vacant %) | Handles 0% / 100% boundary states | `ORIGINAL_REQUEST.md` R5 |
| 15 | Track Assets | Point & Crossing Registry | Full inventory of 161 turnouts across SMUN, SBJN, NSIR, GVGN, KNNN, CHAN | Station filter, Point No | Turnout specifications & switch details | 404 if Point No not found | `db.js` lines 246-425 |
| 16 | Track Assets | Curve Geometry Registry | Full inventory of 95 curves (Nos 315–409) with radius, cant, speed limit | Curve No, Section | Complete curve geometry parameters | 404 if Curve No not found | `db.js` lines 428-540 |
| 17 | Track Assets | Level Crossing Safety Registry | Safety register of 5 manned/interlocked LCs with TUV, gate type, road details | Gate No | LC safety data, TVU census, contact | 404 if Gate No not found | `db.js` lines 215-219 |
| 18 | Maintenance | Keyman Beat Roster | 18 beat assignments covering full 88.679 Km corridor with toolkits & status | Beat No / Section | Assigned Keyman, duty hours, tool list | Unassigned flag if vacant | IMSD SMUN P-Way Standard |
| 19 | Maintenance | Patrol Shift Scheduling | 24 daily shifts (Morning, Evening, Night) covering all 8 sections | Section, Shift Code | Assigned patrolman, equipment check, route | Flagged as VACANT if unfilled | IMSD SMUN P-Way Standard |
| 20 | Quality | Track Defect Lifecycle | USFD flaws (IMR/OBS), geometry defects, missing ERCs, weld fractures tracking | Defect submission form | Defect ID, workflow status (OPEN -> ATTENDED -> CLOSED) | Validation error on missing required fields | IMSD SMUN P-Way Standard |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Km Quick Finder | `fromKm: 1200.000, toKm: 1190.000` (Inverted Range) | Finder automatically normalizes range (`min(from, to)` and `max(from, to)`) and returns assets between Km 1190.000 and Km 1200.000. |
| 2 | Km Quick Finder | `fromKm: 1300.000, toKm: 1350.000` (Out of Jurisdiction) | Returns empty result array `[]` with user-friendly alert message: "Chainage out of IMSD SMUN section (Km 1167.210 – 1249.720)". |
| 3 | Km Quick Finder | `fromKm: 1172.000, toKm: 1178.000, line: LINK_LINE` | Returns assets located strictly on the SMUN–RPJ Link Line (Curves 397–409, Bridges, Link SEJs) without overlapping Main Line assets. |
| 4 | GPS Navigation | Asset with chainage Km 1167.210 (Section start) | Exact boundary coordinate generated (Lat 30.320000, Lon 76.735000), navigation launches at border point. |
| 5 | GPS Navigation | Offline device triggering Google Maps | Android Intent launches Google Maps app; maps cached area if previously loaded, else queues navigation coordinates until connectivity resumes. |
| 6 | Personal QR Code | Staff member with no email / outsourced contractor (MTS) | QR payload includes AWPO ID, contractor agency name, contact phone, and designation; displays clean vCard format. |
| 7 | RBAC Security | STAFF user attempts HTTP PUT/PATCH to `/curves/CRV-315` | Blocked by Firestore security rules (`request.auth.token.role in ['SUPER_ADMIN', 'OFFICER']`), returns `PERMISSION_DENIED`. |
| 8 | RBAC Security | OFFICER user attempts HTTP DELETE to `/bridges/BRG-MJB-001` | Blocked by Firestore rules (`request.auth.token.role == 'SUPER_ADMIN'`), returns `PERMISSION_DENIED`. |
| 9 | Patrol Shifts Analytics | 4 Vacant shifts queried | Visual gauge computes `filled = 20 (83.3%)`, `vacant = 4 (16.7%)` and renders warning alert for vacant night shifts. |
| 10 | Defect Severity | Defect logged with severity `CRITICAL` (USFD IMR flaw) | System highlights row in red, auto-suggests speed restriction (e.g. 30 km/h), and flags for immediate 24h attention. |

---

## 2. Comprehensive Schema & Data Dictionary (All 10 Collections)

### Collection 1: `users`
- **Target Count:** Configurable (Minimum 3 seed accounts: 1 SUPER_ADMIN, 1 OFFICER, 1 STAFF).
- **Primary Key:** `id` (e.g. `usr_vkazad`, `usr_off_001`, `usr_stf_001`)
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Validation / Constraints | Example Value |
|------------|------|----------|-------------|--------------------------|---------------|
| `id` | string | Yes | Unique User Document ID | Non-empty string | `"usr_vkazad"` |
| `userId` | string | Yes | Login Username / Identifier | Unique across users | `"vkazad@dfcc.co.in"` |
| `email` | string | Yes | Official Email Address | Valid email format | `"vkazad@dfcc.co.in"` |
| `pin` | string | Yes | Authentication PIN (4-6 digits) | Regex `^\d{4,6}$` | `"9999"` |
| `name` | string | Yes | Full Name of Official | Non-empty string | `"Shri Vivek Kumar Azad"` |
| `role` | string | Yes | RBAC Role | Enum: `SUPER_ADMIN`, `OFFICER`, `STAFF` | `"SUPER_ADMIN"` |
| `designation` | string | Yes | Official Job Title | Non-empty string | `"Assistant Project Manager / Civil"` |
| `department` | string | Yes | DFCCIL Department | Default: `"Civil Engineering / P-Way"` | `"Civil Engineering"` |
| `unit` | string | Yes | Operational Unit | Default: `"IMSD SMUN"` | `"IMSD SMUN"` |
| `phone` | string | Yes | Contact Phone Number | 10-digit mobile number | `"+91-9717631984"` |
| `awpoId` | string | No | AWPO Contractor ID (Staff only) | Optional string | `"AWPO-SMUN-104"` |
| `isActive` | boolean | Yes | Account Active Status | Boolean (`true` / `false`) | `true` |
| `qrCodeId` | string | Yes | Linked QR Code Identifier | Prefix `"RD-USR-"` | `"RD-USR-VKAZAD"` |
| `createdAt` | string | Yes | ISO 8601 Timestamp | Valid ISO Date | `"2026-08-15T09:00:00.000Z"` |
| `updatedAt` | string | Yes | ISO 8601 Timestamp | Valid ISO Date | `"2026-08-15T09:00:00.000Z"` |

**Sample JSON (`users`):**
```json
{
  "id": "usr_vkazad",
  "userId": "vkazad@dfcc.co.in",
  "email": "vkazad@dfcc.co.in",
  "pin": "9999",
  "name": "Shri Vivek Kumar Azad",
  "role": "SUPER_ADMIN",
  "designation": "Assistant Project Manager / Civil (APM/Civil)",
  "department": "Civil Engineering / P-Way",
  "unit": "IMSD SMUN",
  "phone": "+91-9717631984",
  "awpoId": null,
  "isActive": true,
  "qrCodeId": "RD-USR-VKAZAD",
  "createdAt": "2026-08-15T09:00:00.000Z",
  "updatedAt": "2026-08-15T09:00:00.000Z"
}
```

---

### Collection 2: `jurisdiction`
- **Target Count:** 8 Block Sections (Covering 88.679 Km total).
- **Primary Key:** `id` (e.g. `SEC-01` to `SEC-08`)
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Block Section ID | `"SEC-01"` to `"SEC-08"` | `"SEC-02"` |
| `sectionCode` | string | Yes | Short Code | Non-empty string | `"SMUN-SBJN"` |
| `sectionName` | string | Yes | Full Name | Non-empty string | `"Shambhu to Sarai Banjara"` |
| `lineType` | string | Yes | Line Classification | Enum: `MAIN_LINE`, `LINK_LINE` | `"MAIN_LINE"` |
| `fromKm` | number | Yes | Start Chainage (Km) | >= 1167.210 | `1170.435` |
| `toKm` | number | Yes | End Chainage (Km) | <= 1249.720 | `1188.575` |
| `lengthKm` | number | Yes | Section Route Length | `toKm - fromKm` | `18.140` |
| `trackGauge` | string | Yes | Track Gauge | Default: `"Broad Gauge 1676mm"` | `"Broad Gauge 1676mm"` |
| `maxAxleLoadTonnes` | number | Yes | Maximum Axle Load | Default: `32.5` | `32.5` |
| `maxSpeedKmph` | number | Yes | Sectional Maximum Speed | Default: `100` | `100` |
| `stations` | array[string] | Yes | Stations in Section | List of station names | `["Shambhu (SMUN)", "Sarai Banjara (SBJN)"]` |
| `bridgeCounts` | map | Yes | Bridge Breakdown | Maps `major, minor, rub, rob, fob, total` | `{"major": 5, "minor": 19, "rub": 8, "rob": 2, "fob": 1, "total": 35}` |
| `curveCount` | number | Yes | Total Curves in Section | Exact count | `17` |
| `levelCrossingCount` | number | Yes | Total LCs in Section | Exact count | `0` |
| `pointCrossingCount` | number | Yes | P&C in Section Yards | Exact count | `61` |

**Sample JSON (`jurisdiction`):**
```json
{
  "id": "SEC-02",
  "sectionCode": "SMUN-SBJN",
  "sectionName": "Shambhu to Sarai Banjara",
  "lineType": "MAIN_LINE",
  "fromKm": 1170.435,
  "toKm": 1188.575,
  "lengthKm": 18.140,
  "trackGauge": "Broad Gauge 1676mm",
  "maxAxleLoadTonnes": 32.5,
  "maxSpeedKmph": 100,
  "stations": ["Shambhu (SMUN)", "Sarai Banjara (SBJN)"],
  "bridgeCounts": {
    "major": 5,
    "minor": 19,
    "rub": 8,
    "rob": 2,
    "fob": 1,
    "total": 35
  },
  "curveCount": 17,
  "levelCrossingCount": 0,
  "pointCrossingCount": 61
}
```

---

### Collection 3: `bridges`
- **Target Count:** Exactly 144 items (18 Major, 74 Minor, 37 RUB, 9 ROB, 6 FOB).
- **Primary Key:** `id` (e.g. `BRG-MJB-001`, `BRG-MIB-001`, `BRG-RUB-001`, etc.)
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Unique Bridge ID | Prefix `BRG-MJB-`, `BRG-MIB-`, etc. | `"BRG-MJB-002"` |
| `bridgeNo` | string | Yes | Asset Number Plate | Non-empty string | `"BR-104/1"` |
| `category` | string | Yes | Asset Category | Enum: `MAJOR`, `MINOR`, `RUB`, `ROB`, `FOB` | `"MAJOR"` |
| `sectionCode` | string | Yes | Block Section | Valid section code | `"SMUN-SBJN"` |
| `km` | number | Yes | Exact Chainage (Km) | Within section range | `1175.450` |
| `structureType` | string | Yes | Structural Design | Girder/Box/Arch/Truss | `"Open Web Steel Girder (OWG)"` |
| `spanConfiguration` | string | Yes | Number & Span Length | Format: `NxL meters` | `"1x61.0m OWG + 2x30.5m Plate Girder"` |
| `totalLengthMeters` | number | Yes | Total Bridge Length | Positive float | `122.0` |
| `waterwayType` | string | Yes | Waterway / Crossing | River, Canal, Drain, Road, Pedestrian | `"Ghaggar River Tributary"` |
| `dischargeCapacityCumecs` | number | No | Hydraulic Discharge | Positive float (for water bridges) | `450.0` |
| `verticalClearanceMeters` | number | No | Clearance for ROB/RUB/FOB | Positive float | `6.5` |
| `substructure` | string | Yes | Substructure Type | Mass Concrete / RCC Pile Pier | `"RCC Pier on Deep Well Foundation"` |
| `superstructure` | string | Yes | Superstructure Material | Steel / PSC / RCC Box | `"Structural Steel Truss (Fe 410B)"` |
| `lastInspectionDate` | string | Yes | ISO Date of Inspection | Valid ISO Date | `"2026-05-10"` |
| `conditionRating` | string | Yes | Health Condition | Enum: `SOUND`, `SATISFACTORY`, `ATTENTION_DUE` | `"SOUND"` |
| `latitude` | number | Yes | GPS Latitude | 30.000 to 31.000 | `30.368541` |
| `longitude` | number | Yes | GPS Longitude | 75.800 to 76.800 | `76.658214` |
| `remarks` | string | No | Engineering Remarks | Text | `"Annual river training works verified"` |

**Sample JSON (`bridges`):**
```json
{
  "id": "BRG-MJB-002",
  "bridgeNo": "BR-104/1",
  "category": "MAJOR",
  "sectionCode": "SMUN-SBJN",
  "km": 1175.450,
  "structureType": "Open Web Steel Girder (OWG)",
  "spanConfiguration": "1x61.0m OWG + 2x30.5m Plate Girder",
  "totalLengthMeters": 122.0,
  "waterwayType": "Ghaggar River Tributary",
  "dischargeCapacityCumecs": 450.0,
  "verticalClearanceMeters": null,
  "substructure": "RCC Pier on Deep Well Foundation",
  "superstructure": "Structural Steel Truss (Fe 410B)",
  "lastInspectionDate": "2026-05-10",
  "conditionRating": "SOUND",
  "latitude": 30.368541,
  "longitude": 76.658214,
  "remarks": "Annual river training works verified"
}
```

---

### Collection 4: `level_crossings`
- **Target Count:** Exactly 5 items (Real reference from `db.js`).
- **Primary Key:** `id` (`LC-151C`, `LC-159C`, `LC-163spl`, `LC-164spl`, `LC-167C`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Unique LC ID | Real asset ID from `db.js` | `"LC-151C"` |
| `gateNo` | string | Yes | Official Gate No | Non-empty string | `"151C"` |
| `classification` | string | Yes | LC Classification | Enum: `SPECIAL`, `CLASS_A`, `CLASS_B`, `CLASS_C` | `"CLASS_C"` |
| `sectionCode` | string | Yes | Block Section | Valid section code | `"GVGN-KNNN"` |
| `km` | number | Yes | Exact Chainage (Km) | Real chainage | `1215.034` |
| `tuv` | number | Yes | Train Vehicle Units (TVU) | Real TVU census count | `886440.0` |
| `gateType` | string | Yes | Operating Mechanism | Manned / Interlocked ELB | `"Manned / Electric Lifting Barrier (ELB)"` |
| `interlocked` | boolean | Yes | Signal Interlocking | Default: `true` | `true` |
| `roadName` | string | Yes | Connected Road Name | Non-empty string | `"Mandi Gobindgarh – Amloh Road"` |
| `telephoneLinkedStation` | string | Yes | Connected Station Master | Station Code | `"GVGN / KNNN Station Master"` |
| `gatemanCount` | number | Yes | Rostered Gatemans | Default: `3` (8h shifts) | `3` |
| `lastCensusDate` | string | Yes | Date of TVU Survey | Valid ISO Date | `"2025-11-15"` |
| `latitude` | number | Yes | GPS Latitude | Float | `30.669886` |
| `longitude` | number | Yes | GPS Longitude | Float | `76.288467` |
| `remarks` | string | No | Safety Remarks | Text | `"CCTV surveillance operational"` |

**Sample JSON (`level_crossings`):**
```json
{
  "id": "LC-151C",
  "gateNo": "151C",
  "classification": "CLASS_C",
  "sectionCode": "GVGN-KNNN",
  "km": 1215.034,
  "tuv": 886440.0,
  "gateType": "Manned / Electric Lifting Barrier (ELB)",
  "interlocked": true,
  "roadName": "Mandi Gobindgarh – Amloh Road",
  "telephoneLinkedStation": "GVGN / KNNN Station Master",
  "gatemanCount": 3,
  "lastCensusDate": "2025-11-15",
  "latitude": 30.669886,
  "longitude": 76.288467,
  "remarks": "CCTV surveillance operational; TUV: 8,86,440"
}
```

---

### Collection 5: `officers_staff`
- **Target Count:** Exactly 14 items (1 APM, 2 SSE, 2 SE, 3 JE, 1 Sr. Exec, 2 Exec, 2 MTS, 1 MTS Outsource).
- **Primary Key:** `id` (`STF-001` to `STF-014`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Staff ID | Prefix `STF-` | `"STF-001"` |
| `name` | string | Yes | Employee Full Name | Non-empty string | `"Shri Vivek Kumar Azad"` |
| `post` | string | Yes | Post / Designation | Valid DFCCIL Designation | `"APM / Civil"` |
| `role` | string | Yes | System Role | Enum: `SUPER_ADMIN`, `OFFICER`, `STAFF` | `"SUPER_ADMIN"` |
| `employmentType` | string | Yes | Employment Category | Enum: `REGULAR`, `DEPUTATION`, `OUTSOURCED` | `"REGULAR"` |
| `email` | string | Yes | Official Email | Valid email | `"vkazad@dfcc.co.in"` |
| `phone` | string | Yes | Contact Phone | Mobile number | `"+91-9717631984"` |
| `headquarters` | string | Yes | Base Location | Default: `"IMSD Shambhu (SMUN)"` | `"IMSD Shambhu (SMUN)"` |
| `assignedSection` | string | Yes | Section Jurisdiction | Description | `"Entire Section (Km 1167.210 – 1249.720)"` |
| `leaveBalance` | map | Yes | Leave Balances | Maps `lap, lhap, cl, rh` | `{"lap": 15, "lhap": 7, "cl": 8, "rh": 2}` |
| `qrCodeId` | string | Yes | Scannable QR ID | Prefix `RD-STF-` | `"RD-STF-001"` |
| `dateOfJoining` | string | Yes | Joining Date | ISO Date | `"2021-03-15"` |
| `bloodGroup` | string | No | Emergency Blood Group | E.g. `"B+"` | `"B+"` |

**Sample JSON (`officers_staff`):**
```json
{
  "id": "STF-001",
  "name": "Shri Vivek Kumar Azad",
  "post": "APM / Civil",
  "role": "SUPER_ADMIN",
  "employmentType": "REGULAR",
  "email": "vkazad@dfcc.co.in",
  "phone": "+91-9717631984",
  "headquarters": "IMSD Shambhu (SMUN)",
  "assignedSection": "Entire IMSD SMUN Jurisdiction (Km 1167.210 – 1249.720)",
  "leaveBalance": {
    "lap": 15,
    "lhap": 7,
    "cl": 8,
    "rh": 2
  },
  "qrCodeId": "RD-STF-001",
  "dateOfJoining": "2021-03-15",
  "bloodGroup": "B+"
}
```

---

### Collection 6: `keymen`
- **Target Count:** Exactly 18 items (Covering 18 beats across 88.679 Km).
- **Primary Key:** `id` (`KM-001` to `KM-018`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Keyman Record ID | Prefix `KM-` | `"KM-001"` |
| `beatNo` | number | Yes | Assigned Beat Number | 1 to 18 | `1` |
| `name` | string | Yes | Keyman Full Name | Non-empty string | `"Gurdeep Singh"` |
| `staffId` | string | Yes | Staff ID | Prefix `STF-KM-` | `"STF-KM-101"` |
| `sectionCode` | string | Yes | Section Code | Valid section code | `"UBCD-SMUN"` |
| `fromKm` | number | Yes | Start Chainage of Beat | Chainage | `1167.210` |
| `toKm` | number | Yes | End Chainage of Beat | Chainage | `1172.000` |
| `beatLengthKm` | number | Yes | Length of Beat | `toKm - fromKm` | `4.790` |
| `lineType` | string | Yes | Line Patrolled | Main Line Up/Dn / Link | `"Main Line (Up & Dn Tracks)"` |
| `dutyHours` | string | Yes | Daily Beat Timings | Timings string | `"06:30 – 14:30"` |
| `mobileNo` | string | Yes | Phone Number | Mobile number | `"+91-9872110001"` |
| `toolkitItems` | array[string] | Yes | Standard Issue Toolkit | Required P-Way tools | `["Keyman Hammer (1.8kg)", "Fish Bolt Spanner", "Canter Gauge", "Banner Flags", "10 Detonators"]` |
| `status` | string | Yes | Duty Status | Enum: `ON_DUTY`, `OFF_DUTY`, `ON_LEAVE` | `"ON_DUTY"` |
| `qrCodeId` | string | Yes | Keyman QR ID | Prefix `RD-KM-` | `"RD-KM-001"` |

**Sample JSON (`keymen`):**
```json
{
  "id": "KM-001",
  "beatNo": 1,
  "name": "Gurdeep Singh",
  "staffId": "STF-KM-101",
  "sectionCode": "UBCD-SMUN",
  "fromKm": 1167.210,
  "toKm": 1172.000,
  "beatLengthKm": 4.790,
  "lineType": "Main Line (Up & Dn Tracks)",
  "dutyHours": "06:30 – 14:30",
  "mobileNo": "+91-9872110001",
  "toolkitItems": [
    "Keyman Hammer (1.8kg)",
    "Fish Bolt Spanner (32/36mm)",
    "Track Canter Gauge",
    "Red/Green Banner Flags",
    "10 Detonators in Tin Box"
  ],
  "status": "ON_DUTY",
  "qrCodeId": "RD-KM-001"
}
```

---

### Collection 7: `patrol_shifts`
- **Target Count:** Exactly 24 items (8 Sections × 3 Daily Shifts: Morning, Evening, Night).
- **Primary Key:** `id` (`PSH-001` to `PSH-024`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Patrol Shift ID | Prefix `PSH-` | `"PSH-001"` |
| `sectionCode` | string | Yes | Block Section | Valid section code | `"UBCD-SMUN"` |
| `fromKm` | number | Yes | Shift Start Km | Float | `1167.210` |
| `toKm` | number | Yes | Shift End Km | Float | `1170.435` |
| `shiftCode` | string | Yes | Shift Name | Enum: `SHIFT_A_MORNING`, `SHIFT_B_EVENING`, `SHIFT_C_NIGHT` | `"SHIFT_A_MORNING"` |
| `shiftHours` | string | Yes | Duty Time Window | String | `"06:00 – 14:00"` |
| `patrolType` | string | Yes | Patrolling Protocol | Enum: `HOT_WEATHER`, `COLD_WEATHER_NIGHT`, `MONSOON`, `SECURITY` | `"HOT_WEATHER"` |
| `isFilled` | boolean | Yes | Shift Staffing Status | Boolean | `true` |
| `patrolmanName` | string | No | Assigned Patrolman Name | Nullable if vacant | `"Balwinder Singh"` |
| `patrolmanStaffId` | string | No | Staff ID | Nullable if vacant | `"STF-PAT-201"` |
| `patrolmanPhone` | string | No | Contact Number | Nullable if vacant | `"+91-9872551001"` |
| `equipmentChecked` | boolean | Yes | Safety Gear Verified | Boolean | `true` |
| `status` | string | Yes | Operational Status | Enum: `SCHEDULED`, `ACTIVE`, `COMPLETED`, `VACANT` | `"ACTIVE"` |
| `remarks` | string | No | Operational Notes | Text | `"SEJ rail gap & temperature log maintained"` |

**Sample JSON (`patrol_shifts`):**
```json
{
  "id": "PSH-001",
  "sectionCode": "UBCD-SMUN",
  "fromKm": 1167.210,
  "toKm": 1170.435,
  "shiftCode": "SHIFT_A_MORNING",
  "shiftHours": "06:00 – 14:00",
  "patrolType": "HOT_WEATHER",
  "isFilled": true,
  "patrolmanName": "Balwinder Singh",
  "patrolmanStaffId": "STF-PAT-201",
  "patrolmanPhone": "+91-9872551001",
  "equipmentChecked": true,
  "status": "ACTIVE",
  "remarks": "SEJ rail gap & temperature log maintained"
}
```

---

### Collection 8: `points_crossings`
- **Target Count:** Exactly 161 items (100% extracted from `db.js`).
- **Primary Key:** `id` (`PC-SMUN-001` to `PC-CHAN-028`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Turnout ID | Real ID from `db.js` | `"PC-SMUN-001"` |
| `station` | string | Yes | Station Code | SMUN, SBJN, NSIR, GVGN, KNNN, CHAN | `"SMUN"` |
| `pointNo` | string | Yes | Point Number Plate | E.g. `201b`, `245a`, `298b` | `"201b"` |
| `trackType` | string | Yes | Track Location | Main Line, Loop, D/S (Dead End Siding) | `"Main Line"` |
| `turnoutRatio` | string | Yes | Crossing Angle Ratio | `"1/12"` or `"1/8.5"` | `"1/12"` |
| `km` | number | Yes | Exact Chainage (Km) | Real chainage from `db.js` | `1169.045` |
| `railType` | string | Yes | Alignment Type | `"Straight"` or `"Curve"` | `"Straight"` |
| `hand` | string | Yes | Turnout Hand | Enum: `LH`, `RH` | `"LH"` |
| `operation` | string | Yes | Switch Facing/Trailing | Facing, Trailing, SL (Switch Layout) | `"Facing"` |
| `stationsBehindCrossing` | string | No | Behind Crossing Details | Text/Number (e.g. `"3"`, `"10"`, `"D=0.33 | 5"`) | `"3"` |
| `sleeperType` | string | Yes | Sleeper Standard | Default: `"PSC Turnout Sleeper (RDSO T-4218)"` | `"PSC Turnout Sleeper (RDSO T-4218)"` |
| `railSection` | string | Yes | Rail Section | Default: `"60 Kg 1080 Head Hardened (HH)"` | `"60 Kg 1080 Head Hardened (HH)"` |
| `switchLengthMeters` | number | Yes | Thick Web Switch Length | 10.125m for 1/12, 6.4m for 1/8.5 | `10.125` |
| `latitude` | number | Yes | GPS Latitude | Float | `30.334185` |
| `longitude` | number | Yes | GPS Longitude | Float | `76.721490` |
| `condition` | string | Yes | Physical Condition | Enum: `GOOD`, `MAINTENANCE_DUE`, `NEEDS_TAMPING` | `"GOOD"` |

**Sample JSON (`points_crossings`):**
```json
{
  "id": "PC-SMUN-001",
  "station": "SMUN",
  "pointNo": "201b",
  "trackType": "Main Line",
  "turnoutRatio": "1/12",
  "km": 1169.045,
  "railType": "Straight",
  "hand": "LH",
  "operation": "Facing",
  "stationsBehindCrossing": "3",
  "sleeperType": "PSC Turnout Sleeper (RDSO T-4218)",
  "railSection": "60 Kg 1080 Head Hardened (HH)",
  "switchLengthMeters": 10.125,
  "latitude": 30.334185,
  "longitude": 76.721490,
  "condition": "GOOD"
}
```

---

### Collection 9: `curves`
- **Target Count:** Exactly 95 items (100% extracted from `db.js`, Curve Nos 315 to 409).
- **Primary Key:** `id` (`CRV-315` to `CRV-409`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Curve Asset ID | Real Curve ID (`CRV-315`–`CRV-409`) | `"CRV-315"` |
| `serialNo` | number | Yes | Serial Index | 1 to 95 | `1` |
| `curveNo` | number | Yes | Official Curve Number | 315 to 409 | `315` |
| `fromKm` | number | Yes | Start Chainage (Km) | Real float from `db.js` | `1167.627` |
| `toKm` | number | Yes | End Chainage (Km) | Real float from `db.js` | `1167.789` |
| `lengthMeters` | number | Yes | Total Curve Length (L) | Float | `162.0` |
| `degree` | number | Yes | Degree of Curvature (D) | Degrees float | `1.00` |
| `radiusMeters` | number | Yes | Radius of Curve (R) | Radius in meters | `1750.0` |
| `radiusTmsMeters` | number | Yes | TMS Track Mgmt Radius | Float | `1750.0` |
| `speedLimitKmph` | number | Yes | Maximum Permissible Speed | Integer (V) | `29` |
| `cantMm` | number | Yes | Cant / Superelevation (SE) | Millimeters | `70` |
| `transitionLengthMeters`| number | Yes | Transition Spiral Length (TL)| Float | `70.0` |
| `circularLengthMeters` | number | Yes | Circular Arc Length (CL) | Float | `22.05` |
| `tmsCircularLengthM` | number | Yes | TMS Circular Length | Float | `22.0` |
| `yard` | string | No | Yard Location Name | E.g. `"SMUN Yard"`, `"SBJN Yard"` | `""` |
| `inspectionJurisdiction`| string | No | Inspection Category | E.g. `"In-Charge"`, `"Sectional"` | `"In-Charge"` |
| `latitude` | number | Yes | GPS Latitude | Float | `30.323214` |
| `longitude` | number | Yes | GPS Longitude | Float | `76.731980` |

**Sample JSON (`curves`):**
```json
{
  "id": "CRV-315",
  "serialNo": 1,
  "curveNo": 315,
  "fromKm": 1167.627,
  "toKm": 1167.789,
  "lengthMeters": 162.0,
  "degree": 1.0,
  "radiusMeters": 1750.0,
  "radiusTmsMeters": 1750.0,
  "speedLimitKmph": 29,
  "cantMm": 70,
  "transitionLengthMeters": 70.0,
  "circularLengthMeters": 22.05,
  "tmsCircularLengthM": 22.0,
  "yard": "",
  "inspectionJurisdiction": "In-Charge",
  "latitude": 30.323214,
  "longitude": 76.731980
}
```

---

### Collection 10: `track_defects`
- **Target Count:** Exactly 48 items.
- **Primary Key:** `id` (`DEF-001` to `DEF-048`).
- **Schema & Data Types:**

| Field Name | Type | Required | Description | Constraints | Example Value |
|------------|------|----------|-------------|-------------|---------------|
| `id` | string | Yes | Defect ID | Prefix `DEF-` | `"DEF-001"` |
| `defectCode` | string | Yes | Defect Type Code | USFD-IMR, GEOM-TWIST, FAST-ERC, WELD-AT | `"USFD-IMR-001"` |
| `category` | string | Yes | Defect Category | Enum: `USFD_FLAW`, `TRACK_GEOMETRY`, `FASTENERS`, `WELD_DEFECT`, `SEJ_DEFECT`, `BALLAST_FORMATION` | `"USFD_FLAW"` |
| `title` | string | Yes | Defect Summary | Non-empty string | `"Internal Transverse Fatigue Crack (IMR) on high rail"` |
| `sectionCode` | string | Yes | Block Section | Valid section code | `"SMUN-SBJN"` |
| `km` | number | Yes | Exact Chainage (Km) | Float | `1174.850` |
| `trackLine` | string | Yes | Track Specification | Up Main Line / Dn Main Line / Link | `"Up Main Line"` |
| `rail` | string | Yes | Affected Rail | Enum: `LEFT_RAIL`, `RIGHT_RAIL`, `BOTH_RAILS` | `"RIGHT_RAIL"` |
| `severity` | string | Yes | Defect Severity Level | Enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` | `"CRITICAL"` |
| `speedRestrictionKmph`| number | No | Temporary Speed Restriction | Positive integer or null | `30` |
| `status` | string | Yes | Lifecycle Status | Enum: `OPEN`, `WORK_IN_PROGRESS`, `ATTENDED`, `VERIFIED_CLOSED` | `"OPEN"` |
| `reportedByStaffId` | string | Yes | Reporting Official ID | Staff ID | `"STF-004"` |
| `reportedByName` | string | Yes | Reporting Official Name | Full Name | `"Sunil Kumar (JE/P-Way)"` |
| `reportedDate` | string | Yes | Date Logged | ISO Date string | `"2026-08-10T10:30:00.000Z"` |
| `targetClosureDate` | string | Yes | SLA Target Date | ISO Date string | `"2026-08-11T18:00:00.000Z"` |
| `actionTaken` | string | No | Repair / Clamping Action | Text | `"Emergency joggled fish-plating with 2 clamps installed"` |
| `closedDate` | string | No | Closure Timestamp | ISO Date or null | `null` |
| `latitude` | number | Yes | GPS Latitude | Float | `30.364981` |
| `longitude` | number | Yes | GPS Longitude | Float | `76.664510` |

**Sample JSON (`track_defects`):**
```json
{
  "id": "DEF-001",
  "defectCode": "USFD-IMR-001",
  "category": "USFD_FLAW",
  "title": "Internal Transverse Fatigue Crack (IMR) on high rail",
  "sectionCode": "SMUN-SBJN",
  "km": 1174.850,
  "trackLine": "Up Main Line",
  "rail": "RIGHT_RAIL",
  "severity": "CRITICAL",
  "speedRestrictionKmph": 30,
  "status": "OPEN",
  "reportedByStaffId": "STF-004",
  "reportedByName": "Sunil Kumar (JE/P-Way)",
  "reportedDate": "2026-08-10T10:30:00.000Z",
  "targetClosureDate": "2026-08-11T18:00:00.000Z",
  "actionTaken": "Emergency joggled fish-plating with 2 clamps installed; rail replacement scheduled",
  "closedDate": null,
  "latitude": 30.364981,
  "longitude": 76.664510
}
```

---

## 3. Complete Reference Asset Data Catalog

### 3.1 Points & Crossings Catalog (161 Items)

Extracted verbatim from `antigravity-ims/js/db.js` lines 246–416:
- **SMUN (Shambhu Yard):** 35 items (`PC-SMUN-001` to `PC-SMUN-035`, Km 1169.045 – 1171.981)
- **SBJN (Sarai Banjara Yard):** 26 items (`PC-SBJN-001` to `PC-SBJN-026`, Km 1187.353 – 1189.981)
- **NSIR (New Sirhind Yard):** 18 items (`PC-NSIR-001` to `PC-NSIR-018`, Km 1200.778 – 1203.970)
- **GVGN (New Mandi Gobindgarh Yard):** 32 items (`PC-GVGN-001` to `PC-GVGN-032`, Km 1211.705 – 1214.838)
- **KNNN (New Khanna Yard):** 22 items (`PC-KNNN-001` to `PC-KNNN-022`, Km 1227.699 – 1230.528)
- **CHAN (New Chawa Pail Yard):** 28 items (`PC-CHAN-001` to `PC-CHAN-028`, Km 1236.153 – 1238.791)
- **Total:** 35 + 26 + 18 + 32 + 22 + 28 = **161 Items**.

| ID | Station | Point No | Track | Ratio | Km | Alignment | Hand | Operation | Stations Behind X-ing |
|---|---|---|---|---|---|---|---|---|---|
| PC-SMUN-001 | SMUN | 201b | Main Line | 1/12 | 1169.045 | Straight | LH | Facing | 3 |
| PC-SMUN-002 | SMUN | 205b | Main Line | 1/12 | 1169.412 | Straight | RH | Facing | 3 |
| PC-SMUN-003 | SMUN | 243a | Main Line | 1/12 | 1170.473 | Straight | LH | Trailing | 3 |
| PC-SMUN-004 | SMUN | 245b | Main Line | 1/12 | 1170.534 | Straight | RH | Trailing | 3 |
| PC-SMUN-005 | SMUN | 248a | Main Line | 1/12 | 1170.547 | Straight | LH | Facing | 3 |
| PC-SMUN-006 | SMUN | 249a | Main Line | 1/12 | 1170.608 | Straight | RH | Facing | 3 |
| PC-SMUN-007 | SMUN | 295b | Main Line | 1/12 | 1171.621 | Straight | LH | Trailing | 3 |
| PC-SMUN-008 | SMUN | 298b | Main Line | 1/12 | 1171.847 | Straight | RH | Trailing | 3 |
| PC-SMUN-009 | SMUN | 299a | Main Line | 1/12 | 1171.86 | Straight | RH | Facing | 3 |
| PC-SMUN-010 | SMUN | 297b | Loop | 1/12 | 1171.712 | Straight | RH | SL | 10 |
| PC-SMUN-011 | SMUN | 298a | Loop | 1/12 | 1171.725 | Straight | RH | SL | 3 |
| PC-SMUN-012 | SMUN | 299b | Loop | 1/12 | 1171.981 | Straight | RH | SL | 3 |
| PC-SMUN-013 | SMUN | 248b | Loop | 1/12 | 1170.668 | Straight | LH | SL | 3 |
| PC-SMUN-014 | SMUN | 250 | Loop | 1/12 | 1170.681 | Straight | LH | SL | - |
| PC-SMUN-015 | SMUN | 249b | Loop | 1/12 | 1170.73 | Straight | RH | SL | 3 |
| PC-SMUN-016 | SMUN | 251a | Loop | 1/12 | 1170.756 | Straight | RH | SL | 10 |
| PC-SMUN-017 | SMUN | 201a | Loop | 1/12 | 1169.166 | Straight | LH | SL | 3 |
| PC-SMUN-018 | SMUN | 202 | Loop | 1/12 | 1169.179 | Straight | LH | SL | - |
| PC-SMUN-019 | SMUN | 203b | Loop | 1/12 | 1169.256 | Straight | RH | SL | 10 |
| PC-SMUN-020 | SMUN | 205a | Loop | 1/12 | 1169.534 | Straight | RH | SL | 3 |
| PC-SMUN-021 | SMUN | 242a | Loop | 1/12 | 1170.325 | Straight | LH | SL | 10 |
| PC-SMUN-022 | SMUN | 243b | Loop | 1/12 | 1170.352 | Straight | LH | SL | 3 |
| PC-SMUN-023 | SMUN | 244 | Loop | 1/12 | 1170.4 | Straight | RH | SL | - |
| PC-SMUN-024 | SMUN | 245a | Loop | 1/12 | 1170.413 | Straight | RH | SL | 3 |
| PC-SMUN-025 | SMUN | 295a | Loop | 1/12 | 1170.5 | Straight | LH | SL | 3 |
| PC-SMUN-026 | SMUN | 203a | D/S | 1/12 | 1169.37 | Straight | RH | SL | - |
| PC-SMUN-027 | SMUN | 204 | D/S | 1/12 | 1169.37 | Straight | RH | SL | - |
| PC-SMUN-028 | SMUN | 241 | D/S | 1/12 | 1170.21 | Straight | LH | SL | - |
| PC-SMUN-029 | SMUN | 242b | D/S | 1/12 | 1170.21 | Straight | LH | SL | - |
| PC-SMUN-030 | SMUN | 247 | D/S | 1/12 | 1170.54 | Straight | RH | SL | - |
| PC-SMUN-031 | SMUN | 246 | D/S | 1/12 | 1170.54 | Straight | LH | SL | - |
| PC-SMUN-032 | SMUN | 252 | D/S | 1/12 | 1170.871 | Straight | RH | SL | - |
| PC-SMUN-033 | SMUN | 251b | D/S | 1/12 | 1170.871 | Straight | RH | SL | - |
| PC-SMUN-034 | SMUN | 297a | D/S | 1/12 | 1171.541 | Straight | LH | SL | - |
| PC-SMUN-035 | SMUN | 296 | D/S | 1/12 | 1171.659 | Straight | RH | SL | - |
| PC-SBJN-001 | SBJN | 201b | Main Line | 1/12 | 1187.353 | Straight | LH | Facing | 3 |
| PC-SBJN-002 | SBJN | 243a | Main Line | 1/12 | 1188.478 | Straight | RH | Trailing | 3 |
| PC-SBJN-003 | SBJN | 244b | Main Line | 1/12 | 1188.491 | Straight | RH | Facing | 3 |
| PC-SBJN-004 | SBJN | 246a | Main Line | 1/12 | 1188.552 | Straight | LH | Facing | 3 |
| PC-SBJN-005 | SBJN | 290b | Main Line | 1/12 | 1189.565 | Straight | RH | Trailing | 3 |
| PC-SBJN-006 | SBJN | 291a | Main Line | 1/12 | 1189.578 | Straight | RH | Facing | 3 |
| PC-SBJN-007 | SBJN | 295b | Main Line | 1/12 | 1189.915 | Curve | LH | Trailing | D=0.33 | 5 |
| PC-SBJN-008 | SBJN | 244a | Loop | 1/12 | 1188.612 | Straight | RH | SL | 3 |
| PC-SBJN-009 | SBJN | 247a | Loop | 1/12 | 1188.625 | Straight | RH | SL | 10 |
| PC-SBJN-010 | SBJN | 201a | Loop | 1/12 | 1187.476 | Straight | LH | SL | 3 |
| PC-SBJN-011 | SBJN | 242 | Loop | 1/12 | 1188.344 | Straight | RH | SL | 3 |
| PC-SBJN-012 | SBJN | 243b | Loop | 1/12 | 1188.357 | Straight | RH | SL | 3 |
| PC-SBJN-013 | SBJN | 290a | Loop | 1/12 | 1189.443 | Straight | RH | SL | 3 |
| PC-SBJN-014 | SBJN | 246b | Loop | 1/12 | 1188.673 | Straight | LH | SL | 3 |
| PC-SBJN-015 | SBJN | 293b | Loop | 1/12 | 1189.627 | Straight | LH | SL | 10 |
| PC-SBJN-016 | SBJN | 294a | Loop | 1/12 | 1189.64 | Straight | LH | SL | 3 |
| PC-SBJN-017 | SBJN | 291b | Loop | 1/12 | 1189.699 | Straight | RH | SL | 3 |
| PC-SBJN-018 | SBJN | 294b | Loop | 1/12 | 1189.761 | Straight | LH | SL | 3 |
| PC-SBJN-019 | SBJN | 295a | Loop | 1/12 | 1189.774 | Straight | LH | SL | 5 |
| PC-SBJN-020 | SBJN | 296a | Loop | 1/12 | 1189.835 | Straight | RH | SL | 3 |
| PC-SBJN-021 | SBJN | 296b | Loop | 1/12 | 1189.951 | Straight | RH | SL | 3 |
| PC-SBJN-022 | SBJN | 245 | D/S | 1/12 | 1188.534 | Straight | RH | SL | - |
| PC-SBJN-023 | SBJN | 247b | D/S | 1/12 | 1188.756 | Straight | LH | SL | - |
| PC-SBJN-024 | SBJN | 293a | D/S | 1/12 | 1189.509 | Straight | RH | SL | - |
| PC-SBJN-025 | SBJN | 292 | D/S | 1/12 | 1189.58 | Straight | RH | SL | - |
| PC-SBJN-026 | SBJN | 297 | D/S | 1/12 | 1189.981 | Straight | LH | SL | - |
| PC-NSIR-001 | NSIR | 201b | Main Line | 1/12 | 1200.778 | Straight | LH | Facing | 3 |
| PC-NSIR-002 | NSIR | 243b | Main Line | 1/12 | 1201.669 | Curve | LH | Facing | D=0.22 | 3 |
| PC-NSIR-003 | NSIR | 244a | Main Line | 1/12 | 1201.925 | Curve | RH | Trailing | D=0.22 | 3 |
| PC-NSIR-004 | NSIR | 245a | Main Line | 1/12 | 1201.938 | Curve | RH | Facing | D=0.22 | 3 |
| PC-NSIR-005 | NSIR | 295b | Main Line | 1/12 | 1203.015 | Straight | RH | Trailing | 3 |
| PC-NSIR-006 | NSIR | 296b | Main Line | 1/12 | 1203.076 | Straight | LH | Trailing | 3 |
| PC-NSIR-007 | NSIR | 297a | Main Line | 1/12 | 1203.089 | Straight | LH | Facing | 3 |
| PC-NSIR-008 | NSIR | 299b | Main Line | 1/12 | 1203.97 | Curve | LH | Trailing | D=0.49 | 3 |
| PC-NSIR-009 | NSIR | 201a | Loop | 1/12 | 1200.899 | Straight | LH | SL | 3 |
| PC-NSIR-010 | NSIR | 243a | Loop | 1/12 | 1201.79 | Straight | RH | SL | 3 |
| PC-NSIR-011 | NSIR | 244b | Loop | 1/12 | 1201.803 | Curve | RH | SL | NA |
| PC-NSIR-012 | NSIR | 245b | Loop | 1/12 | 1202.065 | Straight | RH | SL | 3 |
| PC-NSIR-013 | NSIR | 246a | Loop | 1/12 | 1202.072 | Straight | RH | SL | 10 |
| PC-NSIR-014 | NSIR | 295a | Loop | 1/12 | 1202.893 | Straight | RH | SL | 3 |
| PC-NSIR-015 | NSIR | 296a | Loop | 1/12 | 1202.955 | Straight | RH | SL | 3 |
| PC-NSIR-016 | NSIR | 297b | Loop | 1/12 | 1203.21 | Straight | LH | SL | 3 |
| PC-NSIR-017 | NSIR | 299a | Loop | 1/12 | 1203.846 | Curve | LH | SL | NA |
| PC-NSIR-018 | NSIR | 246b | D/S | 1/12 | 1202.205 | Curve | LH | SL | NA |
| PC-GVGN-001 | GVGN | 201 | Main Line | 1/12 | 1211.705 | Straight | LH | Facing | 2 |
| PC-GVGN-002 | GVGN | 205b | Main Line | 1/12 | 1212.079 | Straight | LH | Facing | 3 |
| PC-GVGN-003 | GVGN | 246b | Main Line | 1/12 | 1213.034 | Straight | LH | Facing | 3 |
| PC-GVGN-004 | GVGN | 250b | Main Line | 1/12 | 1213.348 | Straight | RH | Trailing | 3 |
| PC-GVGN-005 | GVGN | 254a | Main Line | 1/12 | 1213.423 | Straight | LH | Facing | 3 |
| PC-GVGN-006 | GVGN | 296b | Main Line | 1/12 | 1214.496 | Straight | RH | Trailing | 3 |
| PC-GVGN-007 | GVGN | 299 | Main Line | 1/12 | 1214.838 | Straight | RH | Trailing | 3 |
| PC-GVGN-008 | GVGN | 202b | Loop | 1/12 | 1211.767 | Straight | LH | SL | 10 |
| PC-GVGN-009 | GVGN | 205a | Loop | 1/12 | 1212.2 | Straight | LH | SL | 3 |
| PC-GVGN-010 | GVGN | 243b | Loop | 1/12 | 1212.769 | Straight | RH | SL | 10 |
| PC-GVGN-011 | GVGN | 243a | Loop | 1/12 | 1213.082 | Straight | RH | SL | 10 |
| PC-GVGN-012 | GVGN | 248b | Loop | 1/12 | 1213.095 | Straight | RH | SL | 3 |
| PC-GVGN-013 | GVGN | 246a | Loop | 1/12 | 1213.152 | Straight | LH | SL | 3 |
| PC-GVGN-014 | GVGN | 248a | Loop | 1/12 | 1213.214 | Straight | RH | SL | 3 |
| PC-GVGN-015 | GVGN | 250a | Loop | 1/12 | 1213.227 | Straight | RH | SL | 3 |
| PC-GVGN-016 | GVGN | 251a | Loop | 1/12 | 1213.288 | Straight | LH | SL | 3 |
| PC-GVGN-017 | GVGN | 251b | Loop | 1/12 | 1213.41 | Straight | LH | SL | 3 |
| PC-GVGN-018 | GVGN | 253a | Loop | 1/12 | 1213.423 | Straight | LH | SL | 10 |
| PC-GVGN-019 | GVGN | 254b | Loop | 1/12 | 1213.541 | Straight | LH | SL | 3 |
| PC-GVGN-020 | GVGN | 253b | Loop | 1/12 | 1213.734 | Straight | LH | SL | 10 |
| PC-GVGN-021 | GVGN | 296a | Loop | 1/12 | 1214.374 | Straight | RH | SL | 3 |
| PC-GVGN-022 | GVGN | 298b | Loop | 1/12 | 1214.777 | Straight | RH | SL | 10 |
| PC-GVGN-023 | GVGN | 203 | D/S | 1/12 | 1211.93 | Straight | RH | SL | - |
| PC-GVGN-024 | GVGN | 202a | D/S | 1/12 | 1211.94 | Straight | RH | SL | - |
| PC-GVGN-025 | GVGN | 204 | D/S | 1/12 | 1212.059 | Straight | LH | SL | - |
| PC-GVGN-026 | GVGN | 244 | D/S | 1/12 | 1212.889 | Straight | LH | SL | - |
| PC-GVGN-027 | GVGN | 245 | D/S | 1/12 | 1212.904 | Straight | RH | SL | - |
| PC-GVGN-028 | GVGN | 255 | D/S | 1/12 | 1213.424 | Straight | RH | SL | - |
| PC-GVGN-029 | GVGN | 256 | D/S | 1/12 | 1213.599 | Straight | LH | SL | - |
| PC-GVGN-030 | GVGN | 257 | D/S | 1/12 | 1213.611 | Straight | RH | SL | - |
| PC-GVGN-031 | GVGN | 298a | D/S | 1/12 | 1214.571 | Straight | LH | SL | - |
| PC-GVGN-032 | GVGN | 297 | D/S | 1/12 | 1214.573 | Straight | LH | SL | - |
| PC-KNNN-001 | KNNN | 201b | Main Line | 1/12 | 1227.772 | Straight | LH | Facing | 3 |
| PC-KNNN-002 | KNNN | 245a | Main Line | 1/12 | 1228.907 | Straight | RH | Trailing | 3 |
| PC-KNNN-003 | KNNN | 247b | Main Line | 1/12 | 1228.92 | Straight | LH | Facing | 3 |
| PC-KNNN-004 | KNNN | 298b | Main Line | 1/12 | 1230.528 | Straight | RH | Trailing | 3 |
| PC-KNNN-005 | KNNN | 202a | Loop | 1/12 | 1227.832 | Straight | RH | SL | 10 |
| PC-KNNN-006 | KNNN | 201a | Loop | 1/12 | 1227.893 | Straight | LH | SL | 3 |
| PC-KNNN-007 | KNNN | 244a | Loop | 1/12 | 1228.773 | Straight | RH | SL | 10 |
| PC-KNNN-008 | KNNN | 245b | Loop | 1/12 | 1228.786 | Straight | RH | SL | 3 |
| PC-KNNN-009 | KNNN | 247a | Loop | 1/12 | 1229.041 | Straight | LH | SL | 3 |
| PC-KNNN-010 | KNNN | 248 | Loop | 1/8.5 | 1229.054 | Straight | LH | SL | 4 |
| PC-KNNN-011 | KNNN | 249a | Loop | 1/8.5 | 1229.123 | Straight | LH | SL | 10 |
| PC-KNNN-012 | KNNN | 296b | Loop | 1/8.5 | 1230.262 | Straight | RH | SL | 10 |
| PC-KNNN-013 | KNNN | 297 | Loop | 1/8.5 | 1230.329 | Straight | RH | SL | 4 |
| PC-KNNN-014 | KNNN | 298a | Loop | 1/12 | 1230.407 | Straight | RH | SL | 3 |
| PC-KNNN-015 | KNNN | 203 | D/S | 1/12 | 1227.699 | Straight | LH | SL | - |
| PC-KNNN-016 | KNNN | 202b | D/S | 1/12 | 1227.699 | Straight | LH | SL | - |
| PC-KNNN-017 | KNNN | 244b | D/S | 1/12 | 1228.632 | Straight | LH | SL | - |
| PC-KNNN-018 | KNNN | 246 | D/S | 1/12 | 1228.917 | Straight | LH | SL | - |
| PC-KNNN-019 | KNNN | 250 | D/S | 1/8.5 | 1229.196 | Straight | RH | SL | - |
| PC-KNNN-020 | KNNN | 249b | D/S | 1/8.5 | 1229.211 | Straight | RH | SL | - |
| PC-KNNN-021 | KNNN | 296a | D/S | 1/8.5 | 1230.161 | Straight | LH | SL | - |
| PC-KNNN-022 | KNNN | 295 | D/S | 1/8.5 | 1230.184 | Straight | LH | SL | - |
| PC-CHAN-001 | CHAN | 201b | Main Line | 1/12 | 1236.153 | Straight | LH | Facing | 3 |
| PC-CHAN-002 | CHAN | 206b | Main Line | 1/12 | 1236.692 | Straight | RH | Facing | 3 |
| PC-CHAN-003 | CHAN | 245b | Main Line | 1/12 | 1237.704 | Straight | RH | Trailing | 3 |
| PC-CHAN-004 | CHAN | 248a | Main Line | 1/12 | 1237.717 | Straight | RH | Facing | 3 |
| PC-CHAN-005 | CHAN | 297b | Main Line | 1/12 | 1238.729 | Straight | LH | Trailing | 3 |
| PC-CHAN-006 | CHAN | 298b | Main Line | 1/12 | 1238.791 | Straight | RH | Trailing | 3 |
| PC-CHAN-007 | CHAN | 201a | Loop | 1/12 | 1236.274 | Straight | LH | Trailing | 3 |
| PC-CHAN-008 | CHAN | 203b | Loop | 1/12 | 1236.287 | Straight | LH | Facing | 3 |
| PC-CHAN-009 | CHAN | 203a | Loop | 1/12 | 1236.408 | Straight | LH | Trailing | 3 |
| PC-CHAN-010 | CHAN | 204b | Loop | 1/12 | 1236.421 | Straight | LH | Facing | 3 |
| PC-CHAN-011 | CHAN | 205b | Loop | 1/12 | 1236.502 | Straight | RH | Facing | 3 |
| PC-CHAN-012 | CHAN | 206a | Loop | 1/12 | 1236.813 | Straight | RH | Trailing | 3 |
| PC-CHAN-013 | CHAN | 243a | Loop | 1/12 | 1237.436 | Straight | RH | Trailing | 10 |
| PC-CHAN-014 | CHAN | 244b | Loop | 1/12 | 1237.449 | Straight | RH | Facing | 3 |
| PC-CHAN-015 | CHAN | 244a | Loop | 1/12 | 1237.57 | Straight | RH | Trailing | 3 |
| PC-CHAN-016 | CHAN | 245a | Loop | 1/12 | 1237.583 | Straight | RH | Facing | 3 |
| PC-CHAN-017 | CHAN | 247a | Loop | 1/12 | 1237.644 | Straight | LH | Facing | 3 |
| PC-CHAN-018 | CHAN | 247b | Loop | 1/12 | 1237.765 | Straight | LH | Trailing | 3 |
| PC-CHAN-019 | CHAN | 248b | Loop | 1/12 | 1237.838 | Straight | RH | Trailing | 3 |
| PC-CHAN-020 | CHAN | 296a | Loop | 1/12 | 1238.535 | Straight | RH | Facing | 3 |
| PC-CHAN-021 | CHAN | 297a | Loop | 1/12 | 1238.608 | Straight | LH | Facing | 3 |
| PC-CHAN-022 | CHAN | 296b | Loop | 1/12 | 1238.657 | Straight | RH | Trailing | 3 |
| PC-CHAN-023 | CHAN | 298a | Loop | 1/12 | 1238.67 | Straight | RH | Facing | 3 |
| PC-CHAN-024 | CHAN | 202 | D/S | 1/12 | 1236.273 | Straight | LH | Facing | - |
| PC-CHAN-025 | CHAN | 204a | D/S | 1/12 | 1236.611 | Straight | RH | Trailing | - |
| PC-CHAN-026 | CHAN | 205a | D/S | 1/12 | 1236.611 | Straight | RH | Trailing | - |
| PC-CHAN-027 | CHAN | 243b | D/S | 1/12 | 1237.317 | Straight | LH | Facing | - |
| PC-CHAN-028 | CHAN | 246 | D/S | 1/12 | 1237.63 | Straight | RH | Facing | - |


---

### 3.2 Curves Catalog (95 Items)

Extracted verbatim from `antigravity-ims/js/db.js` lines 430–540:
- **Main Line Curves (Curve 315 to 396):** 82 items (S.No 1 to 82, Km 1167.627 – 1245.731)
- **Link Line Curves (Curve 397 to 409):** 13 items (S.No 83 to 95, Km 1172.295 – 1178.166)
- **Total:** 82 + 13 = **95 Items**.

| S.No | Curve No | From Km | To Km | L (m) | D (°) | R (m) | V (km/h) | TL (mm) | CL (m) | SE (mm) | Yard | Inspection |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 315 | 1167.627 | 1167.789 | 162 | 1 | 1750 | 29 | 70 | 22.05 | 70 | - | In-Charge |
| 2 | 316 | 1168.062 | 1168.323 | 261 | 0.5 | 3500 | 14 | 40 | 180.66 | 30 | - | - |
| 3 | 317 | 1169.543 | 1169.645 | 102 | 0.29 | 6000 | 8 | 40 | 22.3 | 20 | - | - |
| 4 | 318 | 1172.295 | 1172.401 | 106 | 0.35 | 5000 | 10 | 40 | 25.83 | 20 | - | - |
| 5 | 319 | 1172.568 | 1172.673 | 105 | 0.35 | 5000 | 10 | 40 | 25.83 | 20 | - | - |
| 6 | 320 | 1173.228 | 1173.342 | 114 | 0.17 | 10000 | 5 | 20 | 74.08 | 10 | - | - |
| 7 | 321 | 1174.826 | 1175.167 | 341 | 2.2 | 800 | 63 | 140 | 60.57 | 165 | - | Sectional |
| 8 | 322 | 1175.221 | 1175.815 | 594 | 2.5 | 700 | 71 | 80 | 433.87 | 150 | - | - |
| 9 | 323 | 1175.994 | 1176.47 | 476 | 2.5 | 700 | 71 | 80 | 316.09 | 150 | - | In-Charge |
| 10 | 324 | 1177.254 | 1177.901 | 647 | 0.44 | 4000 | 13 | 30 | 586.92 | 30 | - | - |
| 11 | 325 | 1178.055 | 1178.189 | 134 | 0.5 | 3500 | 14 | 40 | 54.3 | 40 | - | Sectional |
| 12 | 326 | 1178.714 | 1178.894 | 180 | 1.03 | 1700 | 29 | 70 | 39.33 | 80 | - | - |
| 13 | 327 | 1178.948 | 1179.158 | 210 | 1 | 1750 | 29 | 70 | 69.89 | 70 | - | - |
| 14 | 328 | 1179.785 | 1179.925 | 140 | 0.7 | 2500 | 20 | 50 | 39.33 | 50 | - | - |
| 15 | 329 | 1180.061 | 1180.284 | 223 | 0.25 | 7000 | 7 | 20 | 182.93 | 20 | - | - |
| 16 | 330 | 1180.678 | 1180.771 | 93 | 0.39 | 4500 | 11 | 30 | 32.5 | 30 | - | In-Charge |
| 17 | 331 | 1180.854 | 1180.955 | 101 | 0.3 | 5800 | 9 | 20 | 60.55 | 20 | - | - |
| 18 | 332 | 1181.184 | 1181.285 | 101 | 0.25 | 7000 | 7 | 30 | 40.51 | 10 | - | - |
| 19 | 333 | 1187.183 | 1187.299 | 116 | 0.63 | 2800 | 18 | 40 | 35.72 | 40 | - | - |
| 20 | 334 | 1188.117 | 1188.235 | 118 | 0.58 | 3000 | 17 | 40 | 37.61 | 40 | - | - |
| 21 | 335 | 1189.72 | 1189.989 | 269 | 0.33 | 5300 | 9 | 30 | 208.96 | 20 | - | Sectional |
| 22 | 336 | 1190.28 | 1190.477 | 197 | 0.5 | 3500 | 14 | 40 | 116.24 | 30 | - | - |
| 23 | 337 | 1192.373 | 1192.484 | 111 | 0.25 | 7000 | 7 | 20 | 70.55 | 10 | - | - |
| 24 | 338 | 1192.625 | 1192.729 | 104 | 0.25 | 7000 | 7 | 20 | 63.73 | 10 | - | - |
| 25 | 339 | 1196.241 | 1196.362 | 121 | 0.6 | 2900 | 17 | 40 | 41.53 | 40 | - | - |
| 26 | 340 | 1196.453 | 1196.564 | 111 | 0.58 | 3000 | 17 | 40 | 30.98 | 40 | - | In-Charge |
| 27 | 341 | 1196.82 | 1196.895 | 75 | 0.25 | 7000 | 7 | 20 | 34.48 | 15 | - | - |
| 28 | 342 | 1197.243 | 1197.36 | 117 | 0.63 | 2800 | 18 | 40 | 36.8 | 40 | - | - |
| 29 | 343 | 1197.492 | 1197.644 | 152 | 0.5 | 3500 | 14 | 40 | 71.8 | 30 | - | - |
| 30 | 344 | 1199.908 | 1199.968 | 60 | 0.02 | 85000 | 1 | 20 | 20.51 | 10 | - | - |
| 31 | 345 | 1200.122 | 1200.184 | 62 | 0.03 | 60000 | 1 | 20 | 21.28 | 10 | - | - |
| 32 | 346 | 1200.541 | 1200.619 | 78 | 0.14 | 12000 | 4 | 20 | 37.44 | 10 | - | - |
| 33 | 347 | 1200.673 | 1200.753 | 80 | 0.04 | 40000 | 1 | 20 | 39.82 | 10 | - | - |
| 34 | 348 | 1201.62 | 1202.094 | 474 | 0.22 | 8000 | 6 | 20 | 434.38 | 20 | - | Sectional |
| 35 | 349 | 1203.276 | 1203.378 | 102 | 0.04 | 43000 | 1 | 40 | 21.9 | 10 | - | - |
| 36 | 350 | 1203.811 | 1204.059 | 248 | 0.49 | 3550 | 14 | 30 | 188.62 | 30 | - | - |
| 37 | 351 | 1204.714 | 1205.463 | 749 | 2.5 | 700 | 71 | 160 | 428.47 | 165 | - | In-Charge |
| 38 | 352 | 1205.709 | 1207.441 | 1732 | 2.5 | 700 | 71 | 160 | 1411.71 | 165 | - | Sectional |
| 39 | 353 | 1207.864 | 1209.256 | 1392 | 2.5 | 700 | 71 | 80 | 1232.02 | 150 | - | In-Charge |
| 40 | 354 | 1209.814 | 1210.375 | 561 | 2.49 | 703 | 71 | 160 | 240.8 | 165 | - | Sectional |
| 41 | 355 | 1210.9 | 1211.059 | 159 | 0.62 | 2800 | 18 | 40 | 79.65 | 40 | - | - |
| 42 | 356 | 1211.154 | 1211.298 | 144 | 0.83 | 2100 | 24 | 60 | 23.84 | 60 | - | In-Charge |
| 43 | 357 | 1211.468 | 1211.679 | 211 | 2.5 | 700 | 71 | 80 | 50.97 | 150 | - | - |
| 44 | 358 | 1211.84 | 1212.053 | 213 | 2.5 | 700 | 71 | 80 | 52.55 | 150 | - | - |
| 45 | 359 | 1214.517 | 1214.733 | 216 | 2.5 | 700 | 71 | 80 | 55.38 | 150 | - | - |
| 46 | 360 | 1214.858 | 1215.052 | 194 | 2.5 | 700 | 71 | 80 | 33.5 | 150 | - | Sectional |
| 47 | 361 | 1215.625 | 1215.847 | 222 | 0.87 | 2000 | 25 | 60 | 102.04 | 60 | - | - |
| 48 | 362 | 1215.995 | 1216.147 | 152 | 0.87 | 2000 | 25 | 60 | 31.99 | 60 | - | - |
| 49 | 363 | 1216.615 | 1216.734 | 119 | 0.09 | 20000 | 3 | 30 | 59.9 | 10 | - | - |
| 50 | 364 | 1222.327 | 1222.449 | 122 | 0.76 | 2300 | 22 | 50 | 22.3 | 50 | - | - |
| 51 | 365 | 1222.5 | 1222.624 | 124 | 0.76 | 2300 | 22 | 50 | 24.21 | 50 | - | In-Charge |
| 52 | 366 | 1223.02 | 1223.134 | 114 | 0.62 | 2800 | 18 | 40 | 33.97 | 40 | - | - |
| 53 | 367 | 1223.241 | 1223.389 | 148 | 0.58 | 3000 | 17 | 40 | 68.37 | 40 | - | - |
| 54 | 368 | 1223.452 | 1223.618 | 166 | 0.35 | 5000 | 10 | 20 | 125.77 | 20 | - | - |
| 55 | 369 | 1223.674 | 1223.751 | 77 | 0.17 | 10000 | 5 | 20 | 36.88 | 20 | - | - |
| 56 | 370 | 1223.827 | 1224.038 | 211 | 0.7 | 2500 | 20 | 50 | 111.4 | 50 | - | Sectional |
| 57 | 371 | 1224.092 | 1224.24 | 148 | 0.58 | 3000 | 17 | 40 | 67.86 | 40 | - | - |
| 58 | 372 | 1224.492 | 1224.616 | 124 | 0.58 | 3000 | 17 | 40 | 43.62 | 40 | - | - |
| 59 | 373 | 1224.828 | 1224.96 | 132 | 0.7 | 2500 | 20 | 50 | 32.72 | 50 | - | - |
| 60 | 374 | 1225.032 | 1225.138 | 106 | 0.58 | 3000 | 17 | 40 | 25.46 | 40 | - | - |
| 61 | 375 | 1225.353 | 1225.469 | 116 | 0.44 | 4000 | 13 | 30 | 56.03 | 30 | - | In-Charge |
| 62 | 376 | 1227.244 | 1227.349 | 105 | 0.44 | 4000 | 13 | 40 | 25.18 | 30 | - | - |
| 63 | 377 | 1227.623 | 1227.724 | 101 | 0.48 | 3600 | 14 | 40 | 21.53 | 30 | - | - |
| 64 | 378 | 1230.601 | 1230.74 | 139 | 0.58 | 3000 | 17 | 40 | 59.55 | 40 | - | - |
| 65 | 379 | 1230.796 | 1230.937 | 141 | 0.58 | 3000 | 17 | 40 | 61.13 | 40 | - | - |
| 66 | 380 | 1233.066 | 1233.172 | 106 | 0.03 | 50000 | 1 | 40 | 62.1 | 10 | - | - |
| 67 | 381 | 1233.227 | 1233.329 | 102 | 0.04 | 40000 | 1 | 40 | 21.95 | 10 | - | - |
| 68 | 382 | 1233.427 | 1233.528 | 101 | 0.04 | 41000 | 1 | 40 | 20.49 | 10 | - | Sectional |
| 69 | 383 | 1233.603 | 1233.704 | 101 | 0.04 | 41000 | 1 | 40 | 20.49 | 10 | - | - |
| 70 | 384 | 1234.237 | 1234.402 | 165 | 1 | 1750 | 29 | 70 | 24.99 | 75 | - | - |
| 71 | 385 | 1234.715 | 1234.87 | 155 | 0.87 | 2000 | 25 | 60 | 34.95 | 60 | - | - |
| 72 | 386 | 1235.238 | 1235.423 | 185 | 0.7 | 2500 | 20 | 50 | 84.58 | 50 | - | - |
| 73 | 387 | 1235.705 | 1235.876 | 171 | 0.7 | 2500 | 20 | 50 | 70.77 | 50 | - | In-Charge |
| 74 | 388 | 1238.89 | 1239.038 | 148 | 0.5 | 3500 | 14 | 40 | 67.72 | 30 | - | - |
| 75 | 389 | 1239.102 | 1239.248 | 146 | 0.5 | 3500 | 14 | 40 | 66.03 | 30 | - | - |
| 76 | 390 | 1243.528 | 1243.651 | 123 | 0.7 | 2500 | 20 | 50 | 22.74 | 50 | - | - |
| 77 | 391 | 1243.72 | 1243.841 | 121 | 0.58 | 3000 | 17 | 40 | 41.08 | 40 | - | - |
| 78 | 392 | 1243.979 | 1244.125 | 146 | 1 | 1750 | 29 | 60 | 26.08 | 60 | - | Sectional |
| 79 | 393 | 1244.184 | 1244.275 | 91 | 0.41 | 4200 | 12 | 30 | 30.41 | 30 | - | - |
| 80 | 394 | 1244.33 | 1244.412 | 82 | 0.23 | 7500 | 7 | 30 | 21.4 | 10 | - | - |
| 81 | 395 | 1245.139 | 1245.289 | 150 | 0.87 | 2000 | 25 | 60 | 30.1 | 60 | - | - |
| 82 | 396 | 1245.579 | 1245.731 | 152 | 0.87 | 2000 | 25 | 60 | 31.77 | 60 | - | - |
| 83 | 397 | 1172.295 | 1172.401 | 106 | 0.35 | 5000 | 10 | 40 | 25.83 | 20 | - | - |
| 84 | 398 | 1172.545 | 1172.696 | 151 | 0.17 | 10000 | 5 | 20 | 111.66 | 10 | - | In-Charge |
| 85 | 399 | 1172.931 | 1173.031 | 100 | 0.29 | 6000 | 8 | 40 | 20.62 | 20 | - | - |
| 86 | 400 | 1173.174 | 1173.305 | 131 | 0.17 | 10000 | 5 | 20 | 90.71 | 10 | - | - |
| 87 | 401 | 1174.845 | 1174.984 | 139 | 0.29 | 6000 | 8 | 20 | 99.37 | 20 | - | - |
| 88 | 402 | 1175.704 | 1175.889 | 185 | 0.87 | 2000 | 25 | 60 | 65.42 | 60 | - | - |
| 89 | 403 | 1176.046 | 1176.268 | 222 | 0.58 | 3000 | 17 | 40 | 142.24 | 40 | - | - |
| 90 | 404 | 1176.47 | 1176.585 | 115 | 0.44 | 4000 | 13 | 30 | 54.71 | 30 | - | - |
| 91 | 405 | 1176.694 | 1176.854 | 160 | 0.35 | 5250 | 10 | 30 | 99.61 | 20 | - | Sectional |
| 92 | 406 | 1177.182 | 1177.283 | 101 | 0.78 | 2250 | 22 | 40 | 21.74 | 40 | - | - |
| 93 | 407 | 1177.349 | 1177.478 | 129 | 0.58 | 3000 | 17 | 50 | 29.03 | 40 | - | - |
| 94 | 408 | 1177.619 | 1177.846 | 227 | 0.78 | 2250 | 22 | 60 | 107.33 | 60 | - | - |
| 95 | 409 | 1177.896 | 1178.166 | 270 | 0.7 | 2500 | 20 | 50 | 170.31 | 50 | - | - |


---

### 3.3 Level Crossings Catalog (5 Items)

Extracted verbatim from `antigravity-ims/js/db.js` lines 215–219:

| ID | Gate No | Section | Km | TUV (Train Vehicle Units) | Classification | Interlocking Status |
|---|---|---|---|---|---|---|
| `LC-151C` | 151C | GVGN–KNNN | 1215.034 | 8,86,440.00 | Class C | Interlocked Manned (ELB) |
| `LC-159C` | 159C | KNNN–CHAN | 1232.095 | 1,83,937.50 | Class C | Interlocked Manned (ELB) |
| `LC-163spl` | 163spl | CHAN–SNL | 1239.827 | 1,43,633.76 | Special Class | Interlocked Manned (ELB) |
| `LC-164spl` | 164spl | CHAN–SNL | 1244.833 | 5,99,622.31 | Special Class | Interlocked Manned (ELB) |
| `LC-167C` | 167C | CHAN–SNL | 1248.664 | 2,32,435.43 | Class C | Interlocked Manned (ELB) |

---

### 3.4 Switch Expansion Joints (SEJ) Catalog (13 Items)

Extracted from `antigravity-ims/js/db.js` lines 222–234:

| ID | Section | Km | Design Type / Drawing | Reference Temperature |
|---|---|---|---|---|
| `SEJ-13` | SMUN–SBJN | 1175.831 | Modified SEJ (60 Kg UIC) | 32°C |
| `SEJ-14` | SMUN–SBJN | 1175.987 | Modified SEJ (60 Kg UIC) | 32°C |
| `SEJ-15` | NSIR–GVGN | 1207.741 | Modified SEJ (60 Kg UIC) | 29°C |
| `SEJ-16` | NSIR–GVGN | 1207.857 | Modified SEJ (60 Kg UIC) | 30°C |
| `SEJ-17` | NSIR–GVGN | 1210.720 | Modified SEJ (60 Kg UIC) | 31°C |
| `SEJ-18` | NSIR–GVGN | 1210.863 | Modified SEJ (60 Kg UIC) | 32°C |
| `SEJ-19` | CHAN–SNL | 1244.814 | Modified SEJ (60 Kg UIC) | 32°C |
| `SEJ-20` | CHAN–SNL | 1244.970 | Modified SEJ (60 Kg UIC) | 31°C |
| `SEJ-21` | CHAN–SNL | 1249.674 | Modified SEJ (60 Kg UIC) | 32°C |
| `SEJ-22a` | SMUN–RPJ | 1176.920 | RDSO Drg 6902-60kg | 36°C |
| `SEJ-22b` | SMUN–RPJ | 1177.135 | RDSO Drg 6902-60kg | 36°C |
| `SEJ-D1` | SMUN–RPJ | 1172.010 | Dummy SEJ (6902-60kg) | 38°C |
| `SEJ-D2` | SMUN–RPJ | 1178.150 | Dummy SEJ (6902-60kg) | 39°C |

---

### 3.5 Long Welded Rails (LWR) Catalog (7 Items)

Extracted from `antigravity-ims/js/db.js` lines 237–243:

| ID | Section | Start Km | End Km | Length (Km) | Breathing Gap Reference |
|---|---|---|---|---|---|
| `LWR-07` | KNZN–SMUN | 1149.333 | 1175.831 | 26.498 | Tongue Rail Gap |
| `LWR-08` | SMUN–SBJN | 1175.987 | 1207.741 | 31.754 | Tongue Rail Gap |
| `LWR-09` | NSIR–CHAN | 1207.857 | 1210.720 | 2.863 | Tongue Rail Gap |
| `LWR-10` | NSIR–CHAN | 1210.863 | 1244.814 | 33.951 | Tongue Rail Gap |
| `LWR-11` | NSIR–CHAN | 1244.970 | 1249.674 | 4.704 | Tongue Rail Gap |
| `LWR-12` | SMUN–RPJ | 1172.010 | 1176.920 | 4.910 | Stock Rail Gap |
| `LWR-13` | SMUN–RPJ | 1177.135 | 1178.150 | 1.015 | Stock Rail Gap |

---

## 4. Synthetic Generation Rules & Blueprints

For collections requiring realistic synthetic records, the following deterministic generation blueprints ensure 100% mathematical fidelity to DFCCIL IMSD SMUN operating parameters.

### 4.1 Bridges Synthetic Generation (144 Items)
- **Mathematical Distribution by Section:**
  1. `UBCD-SMUN` (Km 1167.210–1170.435): 1 Major, 2 Minor, 1 RUB, 1 ROB = **5 Bridges**
  2. `SMUN-SBJN` (Km 1170.435–1188.575): 5 Major (including 1 OWG), 19 Minor, 8 RUB, 2 ROB, 1 FOB = **35 Bridges**
  3. `SBJN-NSIR` (Km 1188.575–1202.015): 6 Major, 16 Minor, 8 RUB, 1 FOB = **31 Bridges**
  4. `NSIR-GVGN` (Km 1202.015–1213.187): 4 Major (including 2 OWG), 11 Minor, 9 RUB, 2 ROB = **26 Bridges**
  5. `GVGN-KNNN` (Km 1213.187–1229.087): 10 Minor, 3 RUB, 3 ROB, 2 FOB = **18 Bridges**
  6. `KNNN-CHAN` (Km 1229.087–1235.837): 6 Minor, 3 RUB, 1 ROB = **10 Bridges**
  7. `CHAN-SNL` (Km 1235.837–1249.720): 1 Major (including 1 OWG), 8 Minor, 3 RUB, 2 FOB = **14 Bridges**
  8. `SMUN-RPJ` (Km 1168.697–1178.150): 1 Major (including 1 OWG), 2 Minor, 2 RUB = **5 Bridges**
  - **Grand Total:** 18 Major + 74 Minor + 37 RUB + 9 ROB + 6 FOB = **144 Bridges**.
- **Deterministic Chainage Rule:**
  - Within each section, interpolate chainages evenly: `km_i = section.fromKm + (i + 0.5) * (section.lengthKm / bridgeCount)`.
- **GPS Coordinates:** Computed using piecewise linear waypoint interpolation function `getCoords(km, isLink)`.

### 4.2 Officers & Staff Synthetic Generation (14 Items)
- **Hierarchy & Allocation:**
  1. `STF-001`: Shri Vivek Kumar Azad (APM / Civil) — `SUPER_ADMIN`, `vkazad@dfcc.co.in`, PIN: 9999
  2. `STF-002`: Shri Rajesh Sharma (Sr. Section Engineer / P-Way SMUN) — `OFFICER`, PIN: 1201
  3. `STF-003`: Shri Harpreet Singh (Sr. Section Engineer / P-Way CHAN) — `OFFICER`, PIN: 1202
  4. `STF-004`: Shri Sunil Kumar (Section Engineer / Track Assets) — `OFFICER`, PIN: 1203
  5. `STF-005`: Shri Gurmeet Singh (Section Engineer / Bridges & Structures) — `OFFICER`, PIN: 1204
  6. `STF-006`: Shri Amit Verma (Junior Engineer / P-Way Curves) — `OFFICER`, PIN: 1205
  7. `STF-007`: Shri Manpreet Singh (Junior Engineer / P&C Special) — `OFFICER`, PIN: 1206
  8. `STF-008`: Shri Deepak Yadav (Junior Engineer / Quality & USFD) — `OFFICER`, PIN: 1207
  9. `STF-009`: Shri Vikas Kumar (Sr. Executive / Civil) — `OFFICER`, PIN: 1208
  10. `STF-010`: Shri Jaswinder Singh (Executive / Track Maintenance) — `OFFICER`, PIN: 1209
  11. `STF-011`: Shri Kuldeep Singh (Executive / Stores & DMTR) — `OFFICER`, PIN: 1210
  12. `STF-012`: Shri Ravinder Kumar (MTS - Permanent) — `STAFF`, PIN: 2001
  13. `STF-013`: Shri Joginder Ram (MTS - Permanent) — `STAFF`, PIN: 2002
  14. `STF-014`: Shri Surinder Pal (MTS - Outsourced, AWPO ID: `AWPO-SMUN-801`) — `STAFF`, PIN: 2003
- **Total:** 1 Super Admin + 10 Officers + 3 Staff = **14 Items**.

### 4.3 Keymen Synthetic Generation (18 Items)
- **Beat Coverage Allocation (18 Beats across 88.679 Km):**
  - Beat 1: `UBCD-SMUN` (Km 1167.210 – 1172.000, 4.790 Km) — Gurdeep Singh
  - Beat 2: `SMUN-SBJN` (Km 1172.000 – 1176.500, 4.500 Km) — Ram Kumar
  - Beat 3: `SMUN-SBJN` (Km 1176.500 – 1181.000, 4.500 Km) — Malkit Singh
  - Beat 4: `SMUN-SBJN` (Km 1181.000 – 1185.500, 4.500 Km) — Suresh Chand
  - Beat 5: `SMUN-SBJN` (Km 1185.500 – 1188.575, 3.075 Km) — Harbhajan Singh
  - Beat 6: `SBJN-NSIR` (Km 1188.575 – 1193.000, 4.425 Km) — Ramesh Lal
  - Beat 7: `SBJN-NSIR` (Km 1193.000 – 1197.500, 4.500 Km) — Sukhwinder Singh
  - Beat 8: `SBJN-NSIR` (Km 1197.500 – 1202.015, 4.515 Km) — Ashok Kumar
  - Beat 9: `NSIR-GVGN` (Km 1202.015 – 1207.500, 5.485 Km) — Baldev Raj
  - Beat 10: `NSIR-GVGN` (Km 1207.500 – 1213.187, 5.687 Km) — Tarsem Singh
  - Beat 11: `GVGN-KNNN` (Km 1213.187 – 1218.500, 5.313 Km) — Prem Chand
  - Beat 12: `GVGN-KNNN` (Km 1218.500 – 1224.000, 5.500 Km) — Kulwant Singh
  - Beat 13: `GVGN-KNNN` (Km 1224.000 – 1229.087, 5.087 Km) — Dharam Pal
  - Beat 14: `KNNN-CHAN` (Km 1229.087 – 1235.837, 6.750 Km) — Jagdish Singh
  - Beat 15: `CHAN-SNL` (Km 1235.837 – 1240.500, 4.663 Km) — Balwant Rai
  - Beat 16: `CHAN-SNL` (Km 1240.500 – 1245.000, 4.500 Km) — Mohan Lal
  - Beat 17: `CHAN-SNL` (Km 1245.000 – 1249.720, 4.720 Km) — Satnam Singh
  - Beat 18: `SMUN-RPJ Link Line` (Km 1168.697 – 1178.150, 6.169 Km) — Nirmal Singh
- **Total:** **18 Keymen Beats**.

### 4.4 Patrol Shifts Synthetic Generation (24 Items)
- **Structure:** 8 Sections × 3 Daily Shifts:
  - Morning Shift (Shift A): 06:00 – 14:00
  - Evening Shift (Shift B): 14:00 – 22:00
  - Night Shift (Shift C): 22:00 – 06:00
- **Filled vs Vacant Analytics Ratio:**
  - **Filled Shifts:** 20 (83.33%) — fully staffed with assigned patrolmen and equipment verified.
  - **Vacant Shifts:** 4 (16.67%) — `PSH-008` (GVGN–KNNN Night), `PSH-012` (KNNN–CHAN Night), `PSH-018` (CHAN–SNL Night), `PSH-024` (SMUN–RPJ Night) flagged for recruitment/overtime duty.
- **Total:** **24 Patrol Shifts**.

### 4.5 Track Defects Synthetic Generation (48 Items)
- **Authentic P-Way Category Distribution:**
  - **USFD Ultrasonic Rail Flaws:** 12 items (4 Critical IMR flaws requiring immediate 30 km/h SR and fishplating; 8 OBS flaws under observation).
  - **Track Geometry Exceedances:** 10 items (Gauge widening >6mm, unevenness, cross-level variation, twist defects).
  - **Points & Crossings / Switch Defects:** 8 items (Tongue rail wear, check rail clearance defect, loose block bolts).
  - **Fastener & Fitting Deficiencies:** 8 items (Missing ERC elastic clips, displaced rubber pads, seized liner).
  - **Weld Defects (AT / Flash Butt):** 6 items (AT weld micro-fissure, cupped weld joint >1.5mm).
  - **SEJ Gap & Temperature Abnormalities:** 4 items (Excess gap variation at 42°C, loose guide bracket).
  - **Total:** **48 Track Defects**.
- **Status Distribution:**
  - `OPEN`: 16 items
  - `WORK_IN_PROGRESS`: 12 items
  - `ATTENDED`: 12 items
  - `VERIFIED_CLOSED`: 8 items

---

## 5. Geospatial & GPS Interpolation Specification

To power the GPS Asset Map and Km Quick Finder, every asset must be assigned latitude and longitude coordinates along the railway alignment.

### Interpolation Mathematics:
Given waypoint anchors:
- `W0` (Km 1167.210): (30.320000, 76.735000) [Ambala / UBCD Entry]
- `W1` (Km 1170.435): (30.344200, 76.712100) [SMUN Yard]
- `W2` (Km 1188.575): (30.431800, 76.518400) [SBJN Yard]
- `W3` (Km 1202.015): (30.630200, 76.388100) [NSIR Yard]
- `W4` (Km 1213.187): (30.665100, 76.297400) [GVGN Yard]
- `W5` (Km 1229.087): (30.706300, 76.220500) [KNNN Yard]
- `W6` (Km 1235.837): (30.760100, 76.105200) [CHAN Yard]
- `W7` (Km 1249.720): (30.852400, 75.980200) [SNL Yard / Border]
- `Link End` (Km 1178.150): (30.484100, 76.595000) [RPJ Rajpura Chord]

For any asset at chainage `Km` between `W_i` and `W_{i+1}`:
```
t = (Km - W_i.km) / (W_{i+1}.km - W_i.km)
Latitude  = W_i.lat + t * (W_{i+1}.lat - W_i.lat)
Longitude = W_i.lon + t * (W_{i+1}.lon - W_i.lon)
```

### Google Maps Navigation Intent URL:
Tapping any asset pin triggers:
```
https://www.google.com/maps/dir/?api=1&destination={latitude},{longitude}&travelmode=driving
```

---

## 6. RBAC & Security Rule Matrix

| Resource / Collection | `SUPER_ADMIN` | `OFFICER` | `STAFF` | Public / Unauthenticated |
|-----------------------|---------------|-----------|---------|--------------------------|
| `users` (Read) | Read All | Read Self | Read Self | Denied |
| `users` (Create/Update/Delete)| Full CRUD | Denied | Denied | Denied |
| `jurisdiction` | Read / Write | Read Only | Read Only | Denied |
| `bridges` | Full CRUD | Read / Update | Read Only | Denied |
| `curves` | Full CRUD | Read / Update | Read Only | Denied |
| `points_crossings` | Full CRUD | Read / Update | Read Only | Denied |
| `level_crossings` | Full CRUD | Read / Update | Read Only | Denied |
| `track_defects` | Full CRUD | Create / Read / Update | Read / Create | Denied |
| `keymen` | Full CRUD | Read / Update | Read Only | Denied |
| `patrol_shifts` | Full CRUD | Read / Assign | Read Only | Denied |
| `officers_staff` | Full CRUD | Read Only | Read Only | Denied |

---

## 7. Personal QR Code Specification

The QR Code payload format standardizes scannable vCard/JSON metadata for all 14 officers and 18 keymen:

```json
{
  "app": "RailDiary-DFCCIL",
  "qrId": "RD-STF-001",
  "staffId": "STF-001",
  "name": "Shri Vivek Kumar Azad",
  "designation": "APM / Civil",
  "unit": "IMSD SMUN",
  "phone": "+91-9717631984",
  "email": "vkazad@dfcc.co.in",
  "bloodGroup": "B+",
  "jurisdiction": "Km 1167.210 – 1249.720 + Link Line"
}
```

---

## 8. Verification Strategy & Automated Test Plan

To satisfy the verification plan in `ORIGINAL_REQUEST.md`, an automated verification runner (`npm run verify`) must assert:
1. **10 Collection Count Invariants:**
   - `bridges`: Exactly 144 docs.
   - `curves`: Exactly 95 docs.
   - `points_crossings`: Exactly 161 docs.
   - `level_crossings`: Exactly 5 docs.
   - `officers_staff`: Exactly 14 docs.
   - `keymen`: Exactly 18 docs.
   - `patrol_shifts`: Exactly 24 docs.
   - `track_defects`: Exactly 48 docs.
   - `jurisdiction`: Exactly 8 block sections (88.679 Km sum).
   - `users`: Contains Master Admin (`vkazad@dfcc.co.in`), Officer, and Staff.
2. **Schema Property Validation:** Validates required fields, non-null constraints, and numeric bounds on every collection.
3. **RBAC Rule Assertions:** Simulates requests with role tokens (`SUPER_ADMIN`, `OFFICER`, `STAFF`) confirming delete protection.
4. **Km Quick Finder Integrity:** Tests range queries (e.g. Km 1170.000 to 1180.000) verifying accurate asset retrieval.
