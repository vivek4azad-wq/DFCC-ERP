## 2026-08-15T09:28:18Z
You are teamwork_preview_worker_m1, assigned to Milestone 1: Data Models, Seeding & Offline Persistence.
Your working directory is: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_worker_m1
Project workspace: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Deliverables:
1. Initialize `package.json` (with react, react-dom, lucide-react, leaflet, react-leaflet, chart.js, react-chartjs-2, qrcode, jsQR, firebase, tailwindcss, typescript, vite, etc., and `"verify": "node scripts/verify.mjs"`), `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`.
2. Implement complete TypeScript types in `src/types/index.ts` for all 10 Firestore collections, user sessions, RBAC roles, and search queries.
3. Implement 100% authentic seed data in `scripts/seed-data.json` and `src/data/seedData.ts` with EXACT item counts matching specification:
   - `users`: >= 3 (SUPER_ADMIN: vkazad@dfcc.co.in / Shri Vivek Kumar Azad, OFFICER, STAFF)
   - `jurisdiction`: Section Km 1167.210 to Km 1249.720 (82.510 Km) + SMUN-RPJ Link Line (6.169 Km) = 88.679 Km
   - `bridges`: Exactly 144 items (18 Major, 74 Minor, 37 RUB, 9 ROB, 6 FOB)
   - `level_crossings`: Exactly 5 items (LC-151C, LC-159C, LC-163spl, LC-164spl, LC-167C)
   - `officers_staff`: Exactly 14 items (APM, SSEs, SEs, JEs, MTS)
   - `keymen`: Exactly 18 items (18 contiguous beats)
   - `patrol_shifts`: Exactly 24 items (8 sections × 3 diurnal shifts; 20 filled, 4 vacant)
   - `points_crossings`: Exactly 161 items (SMUN 35, SBJN 26, NSIR 18, GVGN 32, KNNN 22, CHAN 28) from `db.js`
   - `curves`: Exactly 95 items (Curve Nos 315–409) from `db.js`
   - `track_defects`: Exactly 48 items (USFD, Geometry, Fasteners, Welds, SEJs)
4. Implement Firestore database service in `src/services/firebase.ts` configuring offline persistence (`setPersistenceEnabled(true)` / `persistentLocalCache`) and `src/services/database.ts` implementing `LocalDatabaseService` (providing dual-tier persistence, local storage fallback, and complete Firestore-compatible query interface).
5. Verify your implementation with Node scripts, document test outputs, and write your report to `handoff.md`.
6. Send a completion message back to parent.
