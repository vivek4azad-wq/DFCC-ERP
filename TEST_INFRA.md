# E2E Test Infra: Rail Diary ERP

## Test Philosophy
- Opaque-box, requirement-driven, zero external cloud dependency.
- Automated verification runnable via `npm run verify` in project root with exit code 0 on pass.
- Methodology: Schema & Count Integrity + RBAC Permission Boundary Verification + Boundary Value Analysis on Chainage Queries + QR/Geospatial/Analytics Validation.

## Feature Inventory & Test Mapping

| # | Feature | Source (Requirement) | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
|---|---------|----------------------|:----------------:|:-----------------:|:----------------------:|:-------------------:|
| 1 | Firestore Schemas & 10 Collections Counts | ORIGINAL_REQUEST §R2 | 5 tests (exact counts, required fields) | 5 tests (empty fields, invalid types) | ✓ (db + persistence) | ✓ (full seed integrity) |
| 2 | Offline Persistence Layer | ORIGINAL_REQUEST §R2 | 5 tests (read/write/cache) | 5 tests (offline retrieval) | ✓ (auth + cache) | ✓ (offline field session) |
| 3 | RBAC Security & Auth Matrix | ORIGINAL_REQUEST §R1 | 5 tests (role login, tokens) | 5 tests (privilege escalation, unauthorized mutations) | ✓ (role + collections) | ✓ (multi-user workflows) |
| 4 | Super Admin Control Panel | ORIGINAL_REQUEST §R1 | 5 tests (admin access, user CRUD) | 5 tests (non-admin access rejection) | ✓ (admin + RBAC) | ✓ (staff PIN generation) |
| 5 | Km Quick Finder | ORIGINAL_REQUEST §R3 | 5 tests (range query, single km) | 5 tests (boundary Km, inverted range, float precision) | ✓ (finder + assets) | ✓ (emergency incident corridor query) |
| 6 | GPS Asset Map & Navigation | ORIGINAL_REQUEST §R3 | 5 tests (pin rendering, URI format) | 5 tests (missing coord fallback, link line coords) | ✓ (finder + map) | ✓ (field navigation trigger) |
| 7 | Personal QR Code Generator | ORIGINAL_REQUEST §R4 | 5 tests (payload format, hash) | 5 tests (special chars, missing field fallback) | ✓ (staff + QR) | ✓ (inspection badge scan) |
| 8 | Interactive Graphical Analytics | ORIGINAL_REQUEST §R5 | 5 tests (aggregation formulas) | 5 tests (empty collections, zero-division guard) | ✓ (data + charts) | ✓ (executive dashboard summary) |

## Test Architecture
- **Test Runner**: `scripts/verify.mjs` executed via `npm run verify`.
- **Test Framework**: Node test runner / ESM test assertions with comprehensive diagnostic logging and zero exit code on 100% pass.
- **Directory Layout**:
  - `scripts/verify.mjs`
  - `scripts/tests/schema.test.mjs`
  - `scripts/tests/rbac.test.mjs`
  - `scripts/tests/km-finder.test.mjs`
  - `scripts/tests/qr-geo.test.mjs`
  - `scripts/tests/analytics.test.mjs`

## Coverage Thresholds
- All 10 Firestore collections verified for exact document counts:
  - `bridges`: 144
  - `level_crossings`: 5
  - `officers_staff`: 14
  - `keymen`: 18
  - `patrol_shifts`: 24
  - `points_crossings`: 161
  - `curves`: 95
  - `track_defects`: 48
  - `users`: >= 3 (including `vkazad@dfcc.co.in`)
  - `jurisdiction`: >= 1 (88.679 Km)
- 100% RBAC security assertions passing (SUPER_ADMIN full, OFFICER edit-only, STAFF read-only).
- 100% Km Quick Finder assertions passing across Main Line (1167.210–1249.720) and Link Line.
