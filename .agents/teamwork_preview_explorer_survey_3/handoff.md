# Phase 0 Survey Handoff Report: Verification Suite & Testing Architecture

**Agent**: `teamwork_preview_explorer_survey_3`  
**Working Directory**: `/Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_explorer_survey_3`  
**Date**: 2026-08-15  
**Target Milestone**: Phase 0 Survey -> Test Architecture Specification  

---

## 1. Observation

1. **Original Request File**: Inspected `/Users/vivekazad/.gemini/antigravity/scratch/rail_diary/ORIGINAL_REQUEST.md`:
   - Line 5: Section defined as "Km 1167.210 to Km 1249.720 (82.510 Km Main Line) + SMUN-RPJ Link Line (6.169 Km) — Total 88.679 Km."
   - Lines 12–21: RBAC rules defining SUPER_ADMIN (`vkazad@dfcc.co.in`), OFFICER (Assigned PIN), and STAFF (AWPO ID / PIN).
   - Lines 23–35: Exact 10 Firestore collections with target seeded document counts:
     * `users`
     * `jurisdiction`
     * `bridges` (144 items)
     * `level_crossings` (5 items)
     * `officers_staff` (14 items)
     * `keymen` (18 items)
     * `patrol_shifts` (24 items)
     * `points_crossings` (161 items)
     * `curves` (95 items)
     * `track_defects` (48 items)
   - Lines 56–61: Automated verification requirement: "`npm run verify` in the workspace root that runs test suites (Jest/Node) asserting: 1. Schema Integrity... 2. RBAC Rules... 3. Km Quick Finder...".

2. **Reference Database File**: Inspected `/Users/vivekazad/.gemini/antigravity/scratch/antigravity-ims/js/db.js`:
   - Lines 214–220: Real data for 5 Level Crossings (`LC-151C`, `LC-159C`, `LC-163spl`, `LC-164spl`, `LC-167C`).
   - Lines 246–416: Real data for 161 Points & Crossings across 6 stations (SMUN: 35, SBJN: 26, NSIR: 18, GVGN: 32, KNNN: 22, CHAN: 28).
   - Lines 428–431: Real data for 95 Curves (Curve No. 315 to 409).
   - Lines 166–182: Staff definitions with leave balances (`lap`, `lhap`, `cl`, `rh`).

3. **Runtime Environment**:
   - Node version: `v26.5.0`
   - npm version: `12.0.2`
   - Platform: macOS (Darwin)

---

## 2. Logic Chain

1. From Observation 1 (lines 56–61) and Observation 3, the workspace requires a single entry point `npm run verify` configured in `package.json` that runs deterministically without external cloud dependencies.
2. From Observation 1 (lines 23–35) and Observation 2, the 10 collection counts (144 bridges, 5 LCs, 14 staff, 18 keymen, 24 patrol shifts, 161 PCs, 95 curves, 48 track defects) can be fully seeded using the exact reference data from `antigravity-ims/js/db.js` for LCs, PCs, and Curves, combined with realistic procedural generators for bridges, keymen, shifts, and defects.
3. From Observation 1 (lines 12–21), the authorization model requires 3 role levels (SUPER_ADMIN, OFFICER, STAFF) where write/delete operations for STAFF and delete operations for OFFICER are denied, while SUPER_ADMIN holds unconditional CRUD and administrative privileges. A dedicated RBAC test matrix is required to verify all permissions across all resources.
4. From Observation 1 (lines 5 & 39), the Km Quick Finder query engine must correctly slice assets across Main Line (`1167.210` to `1249.720`) and Link Line (`1168.697` to `1178.150`), handling boundary limits, inverted ranges, and floating-point precision.
5. From Observation 1 (lines 42–50), automated verification must also validate QR payload integrity, GPS bounding geofence (Lat 29.5–31.5, Lon 76.0–78.0), Google Maps navigation URI builder, and chart aggregation metrics.

---

## 3. Caveats

1. **Firestore Persistence in Pure Node Environment**: In a Node environment running unit tests, `setPersistenceEnabled(true)` is specific to web/browser environments (IndexedDB). For offline testing in Node/CLI, an in-memory/mock Firestore repository must be utilized that replicates the exact Firestore API (`collection`, `doc`, `where`, `getDocs`) and offline caching behavior.
2. **Link Line Chainage Overlap**: Chainage numbers on the SMUN-RPJ Link Line overlap with the Main Line (around Km 1168–1178). Quick Finder search functions must accept an explicit `line` or `isLinkLine` parameter to prevent cross-line asset leakage when disambiguation is requested.

---

## 4. Conclusion

A comprehensive testing specification and verification architecture has been designed and documented in `survey_report.md`. The design specifies:
- Test runner and CLI orchestrator (`scripts/verify.mjs` callable via `npm run verify`).
- 6 dedicated test suites covering Schema Integrity (all 10 collections and exact counts), RBAC Security Matrix, Km Quick Finder boundary edge cases, QR code generator/scanner, GPS navigation URL builder, and Analytics data aggregation.
- Clear diagnostic scorecard reporting with zero exit code on pass and non-zero on failure.

---

## 5. Verification Method

1. **Inspect Report Artifacts**:
   - View `/Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_explorer_survey_3/survey_report.md` to verify all schema rules, assert statements, and architecture designs.
   - View `/Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_explorer_survey_3/BRIEFING.md` and `progress.md`.
2. **Future Invalidation Conditions**:
   - Any modification to the 10 collection names or required item counts (e.g. changing 144 bridges or 161 PCs).
   - Any change to the section boundary definitions (Km 1167.210 to Km 1249.720 + 6.169 Km link line).
   - Any failure of `npm run verify` to execute or exit cleanly with code 0 once implemented.
