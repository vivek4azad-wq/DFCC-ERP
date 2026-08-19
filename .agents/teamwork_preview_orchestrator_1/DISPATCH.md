## 2026-08-15T09:23:26Z
You are the Project Orchestrator for the "Rail Diary" project.

Your assigned identity: teamwork_preview_orchestrator
Your working directory: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/.agents/teamwork_preview_orchestrator_1
Your project workspace: /Users/vivekazad/.gemini/antigravity/scratch/rail_diary

Read the original user request at /Users/vivekazad/.gemini/antigravity/scratch/rail_diary/ORIGINAL_REQUEST.md.
Reference real asset data is available at /Users/vivekazad/.gemini/antigravity/scratch/antigravity-ims/js/db.js.

Key Deliverables:
1. Role-based ERP Android application ("Rail Diary") for DFCCIL IMSD SMUN Unit (Km 1167.210 to Km 1249.720 + SMUN-RPJ Link Line).
2. RBAC (SUPER_ADMIN, OFFICER, STAFF) with client-side & Firestore security rules / enforcement, admin panel restricted to SUPER_ADMIN.
3. Firestore backend, schemas, offline caching (setPersistenceEnabled(true)), and exact seeding for all 10 collections:
   - users
   - jurisdiction
   - bridges (144 items)
   - level_crossings (5 items)
   - officers_staff (14 items)
   - keymen (18 items)
   - patrol_shifts (24 items)
   - points_crossings (161 items)
   - curves (95 items)
   - track_defects (48 items)
4. Km Quick Finder & GPS Asset Map with navigation triggers.
5. Automatic Personal QR Generation for staff profiles.
6. Interactive Graphical Analytics.
7. Automated verification test suite runnable with `npm run verify` in the workspace root asserting Schema Integrity, RBAC Rules, and Km Quick Finder.

Decompose the work, spawn specialist subagents, monitor progress in your working directory, and deliver high-quality, verified implementation. Report back when all deliverables and tests are complete.
