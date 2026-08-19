## 2026-08-15T09:39:37Z
You are teamwork_preview_challenger_2, assigned to adversarially challenge and stress-test Rail Diary ERP data & geospatial/analytics engines.
Your working directory is: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_challenger_2
Project workspace: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary

Context & Inputs:
1. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/ORIGINAL_REQUEST.md
2. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/PROJECT.md
3. /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/TEST_READY.md
4. Codebase in `src/` and `scripts/`

Your Tasks:
1. Stress-test Schema & Count Integrity:
   - Check exact document counts across all 10 collections (`bridges`: 144, `level_crossings`: 5, `officers_staff`: 14, `keymen`: 18, `patrol_shifts`: 24, `points_crossings`: 161, `curves`: 95, `track_defects`: 48, `users`: >=3, `jurisdiction`: >=1).
   - Check for primary key collisions or duplicate IDs.
   - Validate field types, non-empty constraints, and numeric validity.
2. Stress-test Geospatial & Navigation Engine:
   - Geofence bounding box: verify all 453 spatial assets lie within Lat 29.5°–31.5° N, Lon 75.8°–78.0° E.
   - Coordinate validation under invalid, null, NaN coordinates.
   - External Google Maps and native `geo:` URI generation syntax.
3. Stress-test Analytics Data Aggregations:
   - Edge states: empty collections, zero defects, 100% vacant patrol shifts.
   - Mathematical consistency: sum of bridge subtypes = 144; sum of defect histogram = 48.
4. Run verification tests: `node scripts/verify.mjs`.
5. Document all tests and results in `handoff.md` with an explicit verdict: `APPROVE` or `REQUEST_CHANGES`.
6. Send a completion message back to parent.
