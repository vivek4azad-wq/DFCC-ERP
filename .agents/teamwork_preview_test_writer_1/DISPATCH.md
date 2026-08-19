## 2026-08-15T09:28:18Z
You are teamwork_preview_test_writer_1, assigned to the E2E Testing Track for Rail Diary.
Your working directory is: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_test_writer_1
Project workspace: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary

Context & Inputs to read:
1. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/ORIGINAL_REQUEST.md
2. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/PROJECT.md
3. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/TEST_INFRA.md
4. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_explorer_survey_3/survey_report.md
5. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_spec_miner_survey_1/survey_report.md

Scope & Deliverables:
1. Implement the automated verification test harness in `scripts/verify.mjs` runnable via `npm run verify` in the workspace root.
2. Implement 5 modular test suites in `scripts/tests/`:
   - `scripts/tests/schema.test.mjs`: Verifies all 10 Firestore collections are initialized with exact required counts:
     * bridges: 144
     * level_crossings: 5
     * officers_staff: 14
     * keymen: 18
     * patrol_shifts: 24
     * points_crossings: 161
     * curves: 95
     * track_defects: 48
     * users: >= 3 (includes vkazad@dfcc.co.in)
     * jurisdiction: >= 1 (88.679 Km)
     and validates required field types and constraints.
   - `scripts/tests/rbac.test.mjs`: Tests RBAC permission matrix (SUPER_ADMIN full CRUD + Admin Panel + PIN generation, OFFICER edit-only no delete, STAFF read-only).
   - `scripts/tests/km-finder.test.mjs`: Tests Km Quick Finder query engine across Main Line (1167.210 to 1249.720) and Link Line, testing range queries, single km lookup, edge boundaries, inverted intervals, and precision.
   - `scripts/tests/qr-geo.test.mjs`: Tests QR code payload formatting/parsing and GPS coordinates geofencing & Google Maps / `geo:` URI generation.
   - `scripts/tests/analytics.test.mjs`: Tests aggregation formulas for staff by designation, asset counts, defect density per 10km block, and patrol shift vacancy.
3. Ensure the test runner executes cleanly with Node, outputs a structured summary report, and exits with code 0 on pass (non-zero on fail).
4. Create and publish `TEST_READY.md` at the project workspace root with coverage summary.
5. Write your report to `handoff.md` and send a completion message back to parent.
