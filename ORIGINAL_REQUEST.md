# Original User Request

## 2026-08-15T09:23:06Z

Build "Rail Diary", a role-based Enterprise Resource Planning (ERP) Android Application designed for the Dedicated Freight Corridor Corporation of India Ltd. (DFCCIL - IMSD SMUN Unit) covering section Km 1167.210 to Km 1249.720 (82.510 Km Main Line) + SMUN-RPJ Link Line (6.169 Km) — Total 88.679 Km.

Working directory: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary
Integrity mode: development

## Requirements

### R1. Authentication & Role-Based Access Control (RBAC)
- Support login credentials:
  - Super Admin (SUPER_ADMIN): Master ID vkazad@dfcc.co.in (Shri Vivek Kumar Azad, Assistant Project Manager / Civil)
  - Field Officer (OFFICER): User ID and Assigned PIN
  - Field Staff (STAFF): AWPO ID or Employee PIN
- Admin Panel: Visible only to SUPER_ADMIN.
- Execution privileges:
  - Only SUPER_ADMIN can add/edit/delete employees, generate User IDs & PINs, and delete assets/materials.
  - OFFICER can view directories, view rosters, add/edit track assets (if role assigned), and generate personal QR codes.
  - STAFF have Read-Only access to track assets and can view directories/rosters.

### R2. Firestore Backend, Schemas, & Seeding
All database logic must integrate with Cloud Firestore using offline persistence (setPersistenceEnabled(true)). Seeding must populate the following 10 collections:
1. users
2. jurisdiction
3. bridges (Exactly 144 items seeded)
4. level_crossings (Exactly 5 items seeded)
5. officers_staff (Exactly 14 items seeded)
6. keymen (Exactly 18 items seeded)
7. patrol_shifts (Exactly 24 items seeded)
8. points_crossings (Exactly 161 items seeded)
9. curves (Exactly 95 items seeded)
10. track_defects (Exactly 48 items seeded)

Utilize the real asset data in /Users/vivekazad/.gemini/antigravity/scratch/antigravity-ims/js/db.js as reference for curves (95), points & crossings (161), and level crossings (5), and synthetically generate realistic mock records for the remaining count requirements conforming exactly to the schemas defined in the specification.

### R3. Km Quick Finder & Asset Map
- Km Quick Finder: Query assets within a range of main-line Km (Km 1167.210 to Km 1249.720) or SMUN-RPJ link line. Output details of all matched assets.
- GPS Navigation: Map screen displaying assets as pins (using lat/lon fields). Tapping on an asset pin launches external GPS navigation (e.g. Google Maps).

### R4. Automatic Personal QR Generation
- Each staff member profile (permanent and outsourced) must feature an automatically generated, scannable QR code displaying details such as Name, Designation, posting, employee ID, and contact details.

### R5. Interactive Graphical Analytics
- Render visual analytics including:
  - Distribution of staff by designations.
  - Count of different assets (bridges, curves, level crossings, points & crossings).
  - Defects counted per Km range.
  - Filled vs vacant patrol shifts.

---

## Verification Plan

### Automated Verification
Create a test script npm run verify in the workspace root that runs test suites (Jest/Node) asserting:
1. Schema Integrity: Verifies that the mock/local Firebase database has all 10 collections initialized with exact property structures and expected document counts.
2. RBAC Rules: Verifies that permissions restrictions block write/delete requests for STAFF and delete requests for OFFICER, while permitting them for SUPER_ADMIN.
3. Km Quick Finder: Runs search utility tests verifying assets are correctly returned within a given chainage boundary.

### Manual Verification
- Walkthrough of app flow using login credentials representing SUPER_ADMIN, OFFICER, and STAFF.
- Check profile page QR generation.
- Check analytics dashboard visual rendering.

---

## Acceptance Criteria

### Authentication & Authorization
- [ ] Users can login with master admin ID vkazad@dfcc.co.in or via assigned PINs.
- [ ] Staff and Officers have access restrictions verified in client-side navigation and server-side rules.
- [ ] Admin options (such as User ID / PIN generation, asset deletion) are hidden from non-admin roles.

### Firestore Caching
- [ ] Offline caching is configured, allowing cached asset retrieval when offline.
- [ ] Firestore emulator configuration or mock client matches the schema structures.

### Data Seeding
- [ ] 10 firestore collections are populated with correct counts matching the specification.

### GPS & Quick Finder
- [ ] Searching Km chainages correctly returns corresponding assets.
- [ ] GPS map coordinates display pins with functional navigation link triggers.
