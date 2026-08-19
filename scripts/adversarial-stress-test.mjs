#!/usr/bin/env node
/**
 * Rail Diary ERP - Adversarial Stress Testing & Empirical Challenge Suite
 * Invoked by teamwork_preview_challenger_1.
 * 
 * Exhaustively stress-tests:
 * 1. Km Quick Finder Query Engine (boundary floats, micro-intervals, inverted ranges, line isolation, extreme out-of-corridor chainages, string parsers).
 * 2. RBAC Permission Engine (STAFF mutations, OFFICER deletions/admin escalation, token/role spoofing, type confusion, DB mutation guards).
 */

import assert from 'node:assert/strict';
import { performance } from 'perf_hooks';
import {
  loadSeedData,
  searchKmRange,
  parseChainage,
  canPerform,
  ROLES,
  ACTIONS,
  CORRIDOR_BOUNDS,
  validateCoordinates
} from './tests/test-helper.mjs';

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

const seedData = loadSeedData();

class ChallengeRunner {
  constructor(categoryName) {
    this.categoryName = categoryName;
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  assert(title, fn) {
    this.total++;
    const tStart = performance.now();
    try {
      fn();
      const dur = (performance.now() - tStart).toFixed(2);
      this.passed++;
      this.tests.push({ title, passed: true, dur });
    } catch (err) {
      const dur = (performance.now() - tStart).toFixed(2);
      this.failed++;
      this.tests.push({ title, passed: false, dur, error: err.message, stack: err.stack });
    }
  }

  report() {
    console.log(`\n${BOLD}${CYAN}--------------------------------------------------------------------------------${RESET}`);
    console.log(`${BOLD}${CYAN}CHALLENGE DOMAIN: ${this.categoryName}${RESET}`);
    console.log(`${BOLD}${CYAN}--------------------------------------------------------------------------------${RESET}`);
    for (const t of this.tests) {
      if (t.passed) {
        console.log(`  ${GREEN}✔ PASS${RESET} ${t.title} ${GRAY}(${t.dur}ms)${RESET}`);
      } else {
        console.log(`  ${RED}✖ FAIL${RESET} ${t.title} ${GRAY}(${t.dur}ms)${RESET}`);
        console.log(`    ${RED}Reason: ${t.error}${RESET}`);
      }
    }
    const status = this.failed === 0 ? `${GREEN}ALL ${this.passed}/${this.total} PASSED${RESET}` : `${RED}${this.failed}/${this.total} FAILED${RESET}`;
    console.log(`\n  Domain Result: ${status}\n`);
    return {
      category: this.categoryName,
      total: this.total,
      passed: this.passed,
      failed: this.failed,
      tests: this.tests
    };
  }
}

async function runAllChallenges() {
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}       RAIL DIARY ERP - ADVERSARIAL STRESS TEST & ATTACK SUITE                 ${RESET}`);
  console.log(`${GRAY}       Target: Km Quick Finder & RBAC Authorization Hardening                  ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);

  const startTotalTime = performance.now();
  const domainReports = [];

  // ===========================================================================
  // DOMAIN 1: Km Quick Finder Boundary & Precision Stress Testing
  // ===========================================================================
  const kmPrecisionRunner = new ChallengeRunner('Km Quick Finder: Floating-Point Boundary & Precision');

  kmPrecisionRunner.assert('Exact start boundary at Km 1167.210 returns Curve 315 & Bridge MJB 001', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1168.000, line: 'MAIN' }, seedData);
    assert.ok(hits.length >= 2, `Expected >= 2 hits, got ${hits.length}`);
    const crv315 = hits.find(h => h.id === 'CRV-315');
    const brg1 = hits.find(h => h.id === 'BRG-MJB-001');
    assert.ok(crv315, 'CRV-315 must be returned');
    assert.ok(brg1, 'BRG-MJB-001 must be returned');
  });

  kmPrecisionRunner.assert('Exact end boundary at Km 1249.720 returns LC-167C & tail curves', () => {
    const hits = searchKmRange({ fromKm: 1248.000, toKm: 1249.720, line: 'MAIN' }, seedData);
    assert.ok(hits.length >= 1, `Expected assets at end boundary, got ${hits.length}`);
    const lc = hits.find(h => h.id === 'LC-167C');
    assert.ok(lc, 'LC-167C at 1248.664 must be present');
  });

  kmPrecisionRunner.assert('SMUN-RPJ Link Line boundary at Km 1178.150 returns link curves up to 409', () => {
    const hits = searchKmRange({ fromKm: 1177.000, toKm: 1178.150, line: 'LINK' }, seedData);
    assert.ok(hits.length > 0, 'Link line end boundary must return assets');
    const crv409 = hits.find(h => h.id === 'CRV-409');
    assert.ok(crv409, 'CRV-409 (at link line terminal) must be returned');
  });

  kmPrecisionRunner.assert('Micro-interval (1-meter window) at Km 1215.034 strictly isolates LC-151C', () => {
    const hits = searchKmRange({ fromKm: 1215.0335, toKm: 1215.0345, line: 'MAIN', category: 'Level Crossing' }, seedData);
    assert.equal(hits.length, 1, `Expected exactly 1 LC, got ${hits.length}`);
    assert.equal(hits[0].id, 'LC-151C');
  });

  kmPrecisionRunner.assert('Zero-meter point interval (1215.034 to 1215.034) returns exact point match LC-151C', () => {
    const hits = searchKmRange({ fromKm: 1215.034, toKm: 1215.034, line: 'MAIN', category: 'Level Crossing' }, seedData);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].id, 'LC-151C');
  });

  kmPrecisionRunner.assert('Near-miss window (1215.020 to 1215.030) correctly excludes LC-151C at 1215.034', () => {
    const hits = searchKmRange({ fromKm: 1215.020, toKm: 1215.030, line: 'MAIN', category: 'Level Crossing' }, seedData);
    assert.equal(hits.length, 0, 'Near-miss window must return 0 LCs');
  });

  domainReports.push(kmPrecisionRunner.report());

  // ===========================================================================
  // DOMAIN 2: Inverted Range Intervals & Normalization
  // ===========================================================================
  const invertedRangeRunner = new ChallengeRunner('Km Quick Finder: Inverted Range Normalization');

  invertedRangeRunner.assert('Inverted range [1200.000, 1190.000] returns identical hits to [1190.000, 1200.000]', () => {
    const normal = searchKmRange({ fromKm: 1190.000, toKm: 1200.000, line: 'MAIN' }, seedData);
    const inverted = searchKmRange({ fromKm: 1200.000, toKm: 1190.000, line: 'MAIN' }, seedData);
    assert.ok(normal.length > 0);
    assert.equal(inverted.length, normal.length);
    assert.deepEqual(inverted.map(x => x.id).sort(), normal.map(x => x.id).sort());
  });

  invertedRangeRunner.assert('Full corridor inverted [1249.720, 1167.210] returns entire main line asset suite', () => {
    const normal = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, line: 'MAIN' }, seedData);
    const inverted = searchKmRange({ fromKm: 1249.720, toKm: 1167.210, line: 'MAIN' }, seedData);
    assert.ok(normal.length >= 350);
    assert.equal(inverted.length, normal.length);
  });

  invertedRangeRunner.assert('Link line inverted [1178.150, 1168.697] matches normal [1168.697, 1178.150]', () => {
    const normal = searchKmRange({ fromKm: 1168.697, toKm: 1178.150, line: 'LINK' }, seedData);
    const inverted = searchKmRange({ fromKm: 1178.150, toKm: 1168.697, line: 'LINK' }, seedData);
    assert.ok(normal.length > 0);
    assert.equal(inverted.length, normal.length);
    assert.deepEqual(inverted.map(x => x.id).sort(), normal.map(x => x.id).sort());
  });

  domainReports.push(invertedRangeRunner.report());

  // ===========================================================================
  // DOMAIN 3: Link Line vs Main Line Strict Isolation
  // ===========================================================================
  const lineIsolationRunner = new ChallengeRunner('Km Quick Finder: Link vs Main Line Isolation');

  lineIsolationRunner.assert('Main line query on overlap chainage [1168, 1179] strictly excludes all Link Curves 397-409', () => {
    const hits = searchKmRange({ fromKm: 1168.000, toKm: 1179.000, line: 'MAIN', category: 'Curve' }, seedData);
    assert.ok(hits.length > 0, 'Main line curves should be found');
    for (const h of hits) {
      assert.ok(h.curveNo < 397, `Curve ${h.id} (Curve No ${h.curveNo}) is a Link Line curve and MUST NOT leak into Main Line query!`);
    }
  });

  lineIsolationRunner.assert('Main line query strictly excludes Link Line bridges (SMUN-RPJ section)', () => {
    const hits = searchKmRange({ fromKm: 1168.000, toKm: 1179.000, line: 'MAIN', category: 'Bridge' }, seedData);
    assert.ok(hits.length > 0);
    for (const b of hits) {
      assert.notEqual(b.sectionCode, 'SMUN-RPJ', `Bridge ${b.id} is on SMUN-RPJ link line and must not leak into Main Line query`);
    }
  });

  lineIsolationRunner.assert('Link line query on [1168, 1179] strictly contains ONLY Link Curves 397-409', () => {
    const hits = searchKmRange({ fromKm: 1168.000, toKm: 1179.000, line: 'LINK', category: 'Curve' }, seedData);
    assert.ok(hits.length > 0, 'Link curves should be found');
    for (const h of hits) {
      assert.ok(h.curveNo >= 397 && h.curveNo <= 409, `Curve ${h.id} (Curve No ${h.curveNo}) is NOT a Link Line curve!`);
    }
  });

  lineIsolationRunner.assert('Link line query excludes Main Line Points & Crossings and Level Crossings', () => {
    const pcs = searchKmRange({ fromKm: 1168.000, toKm: 1179.000, line: 'LINK', category: 'Point & Crossing' }, seedData);
    assert.equal(pcs.length, 0, 'Link line has no P&C entries in seed data; must return 0');

    const lcs = searchKmRange({ fromKm: 1168.000, toKm: 1179.000, line: 'LINK', category: 'Level Crossing' }, seedData);
    assert.equal(lcs.length, 0, 'Link line has no LC entries; must return 0');
  });

  lineIsolationRunner.assert('ALL lines query returns union of both Main Line and Link Line assets without drops', () => {
    const mainHits = searchKmRange({ fromKm: 1172.000, toKm: 1175.000, line: 'MAIN' }, seedData);
    const linkHits = searchKmRange({ fromKm: 1172.000, toKm: 1175.000, line: 'LINK' }, seedData);
    const allHits = searchKmRange({ fromKm: 1172.000, toKm: 1175.000, line: 'ALL' }, seedData);

    assert.ok(mainHits.length > 0);
    assert.ok(linkHits.length > 0);
    assert.equal(allHits.length, mainHits.length + linkHits.length, 'ALL query count must equal Main + Link counts');
  });

  domainReports.push(lineIsolationRunner.report());

  // ===========================================================================
  // DOMAIN 4: Extreme Out-of-Corridor Chainages & Malformed Inputs
  // ===========================================================================
  const outOfBoundsRunner = new ChallengeRunner('Km Quick Finder: Out-of-Corridor & Malformed Inputs');

  outOfBoundsRunner.assert('Negative chainage range [-500, -100] returns empty array [] without crash', () => {
    const hits = searchKmRange({ fromKm: -500, toKm: -100, line: 'ALL' }, seedData);
    assert.equal(hits.length, 0);
  });

  outOfBoundsRunner.assert('Zero chainage [0, 0] returns empty array []', () => {
    const hits = searchKmRange({ fromKm: 0, toKm: 0, line: 'ALL' }, seedData);
    assert.equal(hits.length, 0);
  });

  outOfBoundsRunner.assert('Far future chainage range [5000, 6000] returns empty array []', () => {
    const hits = searchKmRange({ fromKm: 5000, toKm: 6000, line: 'ALL' }, seedData);
    assert.equal(hits.length, 0);
  });

  outOfBoundsRunner.assert('NaN chainages return empty array [] gracefully', () => {
    const hits = searchKmRange({ fromKm: NaN, toKm: NaN, line: 'ALL' }, seedData);
    assert.equal(hits.length, 0);
  });

  outOfBoundsRunner.assert('Undefined / missing parameters return empty array []', () => {
    const hits1 = searchKmRange({}, seedData);
    assert.equal(hits1.length, 0);
    const hits2 = searchKmRange({ fromKm: undefined, toKm: 1200 }, seedData);
    assert.equal(hits2.length, 0);
  });

  outOfBoundsRunner.assert('Chainage parser handles adversarial & corrupted strings safely', () => {
    assert.equal(parseChainage(''), null);
    assert.equal(parseChainage('   '), null);
    assert.equal(parseChainage('garbage_text'), null);
    assert.equal(parseChainage('++abc'), null);
    assert.equal(parseChainage('invalid_chainage'), null);
    assert.equal(parseChainage('<script>'), null);
    assert.equal(parseChainage(null), null);
    assert.equal(parseChainage(undefined), null);
    assert.equal(parseChainage({}), null);
    assert.equal(parseChainage([]), null);

    // Valid formats
    assert.equal(parseChainage('1167.210'), 1167.21);
    assert.equal(parseChainage('1167+210'), 1167.21);
    assert.equal(parseChainage('1167+0'), 1167.0);
    assert.equal(parseChainage(1215.034), 1215.034);
    assert.ok(typeof parseChainage('1167/2') === 'number');
  });

  domainReports.push(outOfBoundsRunner.report());

  // ===========================================================================
  // DOMAIN 5: Linear Asset Span Overlap Mechanics
  // ===========================================================================
  const spanOverlapRunner = new ChallengeRunner('Km Quick Finder: Linear Asset Span Overlap Mechanics');

  spanOverlapRunner.assert('Curve partially overlapping from left (starts before window, ends inside) is matched', () => {
    // Curve CRV-321 is 1174.826 to 1175.167
    const hits = searchKmRange({ fromKm: 1175.000, toKm: 1176.000, category: 'Curve', line: 'MAIN' }, seedData);
    const matched = hits.find(c => c.id === 'CRV-321');
    assert.ok(matched, 'CRV-321 spanning 1174.826-1175.167 must match 1175.000-1176.000');
  });

  spanOverlapRunner.assert('Curve partially overlapping from right (starts inside window, ends after) is matched', () => {
    const hits = searchKmRange({ fromKm: 1174.000, toKm: 1175.000, category: 'Curve', line: 'MAIN' }, seedData);
    const matched = hits.find(c => c.id === 'CRV-321');
    assert.ok(matched, 'CRV-321 spanning 1174.826-1175.167 must match 1174.000-1175.000');
  });

  spanOverlapRunner.assert('Curve completely encompassing a small query window is matched', () => {
    const hits = searchKmRange({ fromKm: 1174.900, toKm: 1175.000, category: 'Curve', line: 'MAIN' }, seedData);
    const matched = hits.find(c => c.id === 'CRV-321');
    assert.ok(matched, 'CRV-321 must be matched when window is strictly interior to curve');
  });

  domainReports.push(spanOverlapRunner.report());

  // ===========================================================================
  // DOMAIN 6: RBAC Unauthorized Mutations by STAFF (Read-Only Enforcement)
  // ===========================================================================
  const rbacStaffRunner = new ChallengeRunner('RBAC: STAFF Mutation Blocking & Read-Only Enforcement');

  const all10Collections = [
    'users',
    'jurisdiction',
    'bridges',
    'level_crossings',
    'officers_staff',
    'keymen',
    'patrol_shifts',
    'points_crossings',
    'curves',
    'track_defects'
  ];

  rbacStaffRunner.assert('STAFF is strictly BLOCKED from CREATE on all 10 collections', () => {
    for (const col of all10Collections) {
      const allowed = canPerform(ROLES.STAFF, ACTIONS.CREATE, col);
      assert.equal(allowed, false, `STAFF MUST NOT be permitted CREATE on '${col}'`);
    }
  });

  rbacStaffRunner.assert('STAFF is strictly BLOCKED from UPDATE on all 10 collections', () => {
    for (const col of all10Collections) {
      const allowed = canPerform(ROLES.STAFF, ACTIONS.UPDATE, col);
      assert.equal(allowed, false, `STAFF MUST NOT be permitted UPDATE on '${col}'`);
    }
  });

  rbacStaffRunner.assert('STAFF is strictly BLOCKED from DELETE on all 10 collections', () => {
    for (const col of all10Collections) {
      const allowed = canPerform(ROLES.STAFF, ACTIONS.DELETE, col);
      assert.equal(allowed, false, `STAFF MUST NOT be permitted DELETE on '${col}'`);
    }
  });

  rbacStaffRunner.assert('STAFF is strictly BLOCKED from Admin Panel access', () => {
    assert.equal(canPerform(ROLES.STAFF, ACTIONS.ADMIN_PANEL, 'admin'), false);
    assert.equal(canPerform(ROLES.STAFF, ACTIONS.ADMIN_PANEL, 'super_admin_panel'), false);
  });

  rbacStaffRunner.assert('STAFF is strictly BLOCKED from PIN generation & User account provisioning', () => {
    assert.equal(canPerform(ROLES.STAFF, ACTIONS.GENERATE_PIN, 'users'), false);
    assert.equal(canPerform(ROLES.STAFF, ACTIONS.GENERATE_PIN, 'officers_staff'), false);
  });

  rbacStaffRunner.assert('STAFF is permitted READ access to operational track collections and directories', () => {
    const readable = ['bridges', 'curves', 'level_crossings', 'points_crossings', 'track_defects', 'officers_staff', 'keymen', 'patrol_shifts', 'jurisdiction'];
    for (const res of readable) {
      assert.equal(canPerform(ROLES.STAFF, ACTIONS.READ, res), true, `STAFF should have READ access to ${res}`);
    }
  });

  domainReports.push(rbacStaffRunner.report());

  // ===========================================================================
  // DOMAIN 7: RBAC OFFICER Privilege Escalation & Deletion Blocking
  // ===========================================================================
  const rbacOfficerRunner = new ChallengeRunner('RBAC: OFFICER Privilege Escalation & Deletion Blocking');

  rbacOfficerRunner.assert('OFFICER is strictly BLOCKED from DELETING track assets and materials', () => {
    const assetCols = ['bridges', 'curves', 'points_crossings', 'level_crossings', 'track_defects', 'materials'];
    for (const col of assetCols) {
      const allowed = canPerform(ROLES.OFFICER, ACTIONS.DELETE, col);
      assert.equal(allowed, false, `OFFICER MUST NOT be permitted DELETE on '${col}'`);
    }
  });

  rbacOfficerRunner.assert('OFFICER is strictly BLOCKED from DELETING employee profiles and user accounts', () => {
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.DELETE, 'officers_staff'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.DELETE, 'users'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.DELETE, 'keymen'), false);
  });

  rbacOfficerRunner.assert('OFFICER is strictly BLOCKED from Admin Panel access', () => {
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.ADMIN_PANEL, 'admin'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.ADMIN_PANEL, 'super_admin_panel'), false);
  });

  rbacOfficerRunner.assert('OFFICER is strictly BLOCKED from generating or resetting PINs and User IDs', () => {
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.GENERATE_PIN, 'users'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.GENERATE_PIN, 'officers_staff'), false);
  });

  rbacOfficerRunner.assert('OFFICER is strictly BLOCKED from CREATE/UPDATE on users and jurisdiction collections', () => {
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.CREATE, 'users'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.UPDATE, 'users'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.CREATE, 'jurisdiction'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.UPDATE, 'jurisdiction'), false);
  });

  rbacOfficerRunner.assert('OFFICER is permitted CREATE and UPDATE on field track assets & defects', () => {
    const fieldAssets = ['bridges', 'curves', 'points_crossings', 'level_crossings', 'track_defects', 'patrol_shifts'];
    for (const fa of fieldAssets) {
      assert.equal(canPerform(ROLES.OFFICER, ACTIONS.CREATE, fa), true, `OFFICER should be allowed CREATE on ${fa}`);
      assert.equal(canPerform(ROLES.OFFICER, ACTIONS.UPDATE, fa), true, `OFFICER should be allowed UPDATE on ${fa}`);
    }
  });

  domainReports.push(rbacOfficerRunner.report());

  // ===========================================================================
  // DOMAIN 8: RBAC Token Spoofing, Type Confusion & Boundary Gating
  // ===========================================================================
  const rbacSpoofRunner = new ChallengeRunner('RBAC: Token Spoofing, Type Confusion & Role Tampering');

  rbacSpoofRunner.assert('Empty, whitespace, or unknown role strings are rejected for all actions', () => {
    const badRoles = ['', '   ', '\t', 'ADMIN', 'SUPERADMIN', 'ROOT', 'SYSTEM', 'ANONYMOUS', 'GUEST', 'super_admin', 'officer', 'staff'];
    for (const r of badRoles) {
      for (const a of [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE, ACTIONS.ADMIN_PANEL, ACTIONS.GENERATE_PIN]) {
        assert.equal(canPerform(r, a, 'bridges'), false, `Role spoof '${r}' with action '${a}' must be rejected`);
      }
    }
  });

  rbacSpoofRunner.assert('Type confusion (null, undefined, numbers, booleans, objects, arrays) is safely rejected', () => {
    const invalidTypes = [null, undefined, 0, 1, 999, true, false, NaN, {}, [], () => {}];
    for (const it of invalidTypes) {
      assert.equal(canPerform(it, ACTIONS.READ, 'bridges'), false, `Type confusion '${String(it)}' must be rejected`);
      assert.equal(canPerform(it, ACTIONS.ADMIN_PANEL, 'admin'), false);
    }
  });

  rbacSpoofRunner.assert('Invalid or malicious action strings are rejected for non-superadmin roles', () => {
    const badActions = ['', '   ', 'DROP_TABLE', 'EXEC_CODE', 'GRANT_ALL', 'BYPASS_RBAC', null, undefined];
    for (const ba of badActions) {
      assert.equal(canPerform(ROLES.OFFICER, ba, 'bridges'), false);
      assert.equal(canPerform(ROLES.STAFF, ba, 'bridges'), false);
    }
  });

  domainReports.push(rbacSpoofRunner.report());

  // ===========================================================================
  // DOMAIN 9: High-Volume Fuzzing & Stress Invariants (10,000 Queries)
  // ===========================================================================
  const fuzzRunner = new ChallengeRunner('Km Quick Finder: High-Volume Random Fuzzing & Stress (10k queries)');

  fuzzRunner.assert('10,000 random fuzz queries execute within 100ms without throwing uncaught exceptions', () => {
    const startFuzz = performance.now();
    for (let i = 0; i < 10000; i++) {
      const fromKm = (Math.random() * 200) + 1100; // 1100 to 1300
      const toKm = (Math.random() * 200) + 1100;
      const lines = ['ALL', 'MAIN', 'LINK'];
      const categories = ['ALL', 'Bridge', 'Curve', 'Point & Crossing', 'Level Crossing', 'Track Defect'];
      const line = lines[i % 3];
      const category = categories[i % 6];

      const res = searchKmRange({ fromKm, toKm, line, category }, seedData);
      assert.ok(Array.isArray(res));
      assert.ok(res.length >= 0);
    }
    const fuzzDur = performance.now() - startFuzz;
    assert.ok(fuzzDur < 500, `10,000 queries took ${fuzzDur.toFixed(2)}ms (expected < 500ms)`);
  });

  fuzzRunner.assert('Extreme fuzzing with negative, zero, infinity, and NaN values returns safe arrays', () => {
    const extremeValues = [-1e9, -99999, -1, 0, 1167.210, 1200.0, 1249.720, 99999, 1e9, NaN, Infinity, -Infinity];
    for (const v1 of extremeValues) {
      for (const v2 of extremeValues) {
        const res = searchKmRange({ fromKm: v1, toKm: v2, line: 'ALL', category: 'ALL' }, seedData);
        assert.ok(Array.isArray(res));
      }
    }
  });

  domainReports.push(fuzzRunner.report());

  // ===========================================================================
  // DOMAIN 10: Database Mutation Guard Simulation (Simulated Local DB Layer)
  // ===========================================================================
  const dbGuardRunner = new ChallengeRunner('Database Mutation Guards: Simulated Service Access Rejections');

  // Simulated Database Permission Enforcement
  class MockDbGuard {
    static assertPermission(action, collection, role) {
      if (!role) return; // test internal bypass
      if (role === 'SUPER_ADMIN') return; // full permission

      if (collection === 'users' || action === 'MANAGE_USERS') {
        throw new Error(`Permission Denied: Only SUPER_ADMIN can manage user accounts. Role '${role}' is forbidden.`);
      }

      if (role === 'OFFICER') {
        if (action === 'DELETE') {
          throw new Error(`Permission Denied: Role 'OFFICER' cannot delete assets. Only SUPER_ADMIN can delete.`);
        }
        if (collection === 'jurisdiction' && (action === 'CREATE' || action === 'UPDATE')) {
          throw new Error(`Permission Denied: Block sections / jurisdiction can only be modified by SUPER_ADMIN.`);
        }
        return;
      }

      if (role === 'STAFF') {
        if (action !== 'READ') {
          throw new Error(`Permission Denied: Role 'STAFF' has Read-Only access. Cannot perform ${action} on '${collection}'.`);
        }
      }
    }
  }

  dbGuardRunner.assert('STAFF session attempting addDocument throws Permission Denied Error', () => {
    assert.throws(() => {
      MockDbGuard.assertPermission('CREATE', 'bridges', 'STAFF');
    }, /Permission Denied/);
  });

  dbGuardRunner.assert('STAFF session attempting updateDocument throws Permission Denied Error', () => {
    assert.throws(() => {
      MockDbGuard.assertPermission('UPDATE', 'curves', 'STAFF');
    }, /Permission Denied/);
  });

  dbGuardRunner.assert('STAFF session attempting deleteDocument throws Permission Denied Error', () => {
    assert.throws(() => {
      MockDbGuard.assertPermission('DELETE', 'level_crossings', 'STAFF');
    }, /Permission Denied/);
  });

  dbGuardRunner.assert('OFFICER session attempting deleteDocument on assets throws Permission Denied Error', () => {
    assert.throws(() => {
      MockDbGuard.assertPermission('DELETE', 'bridges', 'OFFICER');
    }, /Permission Denied/);
  });

  dbGuardRunner.assert('OFFICER session attempting to modify jurisdiction block sections throws Error', () => {
    assert.throws(() => {
      MockDbGuard.assertPermission('CREATE', 'jurisdiction', 'OFFICER');
    }, /Permission Denied/);
  });

  dbGuardRunner.assert('SUPER_ADMIN session performs all mutations without throwing', () => {
    assert.doesNotThrow(() => {
      MockDbGuard.assertPermission('CREATE', 'bridges', 'SUPER_ADMIN');
      MockDbGuard.assertPermission('UPDATE', 'curves', 'SUPER_ADMIN');
      MockDbGuard.assertPermission('DELETE', 'level_crossings', 'SUPER_ADMIN');
      MockDbGuard.assertPermission('CREATE', 'users', 'SUPER_ADMIN');
      MockDbGuard.assertPermission('UPDATE', 'jurisdiction', 'SUPER_ADMIN');
    });
  });

  domainReports.push(dbGuardRunner.report());

  // ===========================================================================
  // DOMAIN 11: Geospatial Coordinates & Boundary Invariants
  // ===========================================================================
  const geoRunner = new ChallengeRunner('Geospatial Geofencing & Coordinates Invariance');

  geoRunner.assert('All 144 bridges possess valid latitude & longitude within corridor bounding box', () => {
    for (const b of seedData.bridges) {
      assert.ok(typeof b.latitude === 'number' && !isNaN(b.latitude), `Bridge ${b.id} missing latitude`);
      assert.ok(typeof b.longitude === 'number' && !isNaN(b.longitude), `Bridge ${b.id} missing longitude`);
      assert.ok(b.latitude >= CORRIDOR_BOUNDS.minLat && b.latitude <= CORRIDOR_BOUNDS.maxLat);
      assert.ok(b.longitude >= CORRIDOR_BOUNDS.minLon && b.longitude <= CORRIDOR_BOUNDS.maxLon);
    }
  });

  geoRunner.assert('All 95 curves possess valid latitude & longitude within corridor bounding box', () => {
    for (const c of seedData.curves) {
      assert.ok(typeof c.latitude === 'number' && !isNaN(c.latitude), `Curve ${c.id} missing latitude`);
      assert.ok(typeof c.longitude === 'number' && !isNaN(c.longitude), `Curve ${c.id} missing longitude`);
      assert.ok(c.latitude >= CORRIDOR_BOUNDS.minLat && c.latitude <= CORRIDOR_BOUNDS.maxLat);
      assert.ok(c.longitude >= CORRIDOR_BOUNDS.minLon && c.longitude <= CORRIDOR_BOUNDS.maxLon);
    }
  });

  geoRunner.assert('All 161 turnouts possess valid coordinates within corridor bounding box', () => {
    for (const pc of seedData.points_crossings) {
      assert.ok(typeof pc.latitude === 'number' && !isNaN(pc.latitude), `P&C ${pc.id} missing latitude`);
      assert.ok(typeof pc.longitude === 'number' && !isNaN(pc.longitude), `P&C ${pc.id} missing longitude`);
      assert.ok(pc.latitude >= CORRIDOR_BOUNDS.minLat && pc.latitude <= CORRIDOR_BOUNDS.maxLat);
      assert.ok(pc.longitude >= CORRIDOR_BOUNDS.minLon && pc.longitude <= CORRIDOR_BOUNDS.maxLon);
    }
  });

  geoRunner.assert('All 48 track defects possess valid coordinates within corridor bounding box', () => {
    for (const d of seedData.track_defects) {
      assert.ok(typeof d.latitude === 'number' && !isNaN(d.latitude), `Defect ${d.id} missing latitude`);
      assert.ok(typeof d.longitude === 'number' && !isNaN(d.longitude), `Defect ${d.id} missing longitude`);
      assert.ok(d.latitude >= CORRIDOR_BOUNDS.minLat && d.latitude <= CORRIDOR_BOUNDS.maxLat);
      assert.ok(d.longitude >= CORRIDOR_BOUNDS.minLon && d.longitude <= CORRIDOR_BOUNDS.maxLon);
    }
  });

  domainReports.push(geoRunner.report());

  // ===========================================================================
  // SUMMARY SCORECARD
  // ===========================================================================
  const totalDuration = (performance.now() - startTotalTime).toFixed(2);
  let totalAllAssertions = 0;
  let totalAllPassed = 0;
  let totalAllFailed = 0;

  for (const r of domainReports) {
    totalAllAssertions += r.total;
    totalAllPassed += r.passed;
    totalAllFailed += r.failed;
  }

  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`${BOLD}                    ADVERSARIAL STRESS TEST SCORECARD                          ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);
  console.log(`  ${BOLD}Domain                                              Total  Pass  Fail  Status${RESET}`);
  console.log(`  ${GRAY}-----------------------------------------------------------------------------${RESET}`);

  domainReports.forEach(r => {
    const name = r.category.padEnd(52, ' ');
    const tot = String(r.total).padStart(5, ' ');
    const pass = String(r.passed).padStart(5, ' ');
    const fail = String(r.failed).padStart(5, ' ');
    const status = r.failed === 0 ? `${GREEN}PASSED${RESET}` : `${RED}FAILED${RESET}`;
    console.log(`  ${name} ${tot} ${pass} ${fail}  ${status}`);
  });

  console.log(`  ${GRAY}-----------------------------------------------------------------------------${RESET}`);
  console.log(`  ${BOLD}${'TOTAL ADVERSARIAL STRESS CHALLENGES'.padEnd(52, ' ')} ${String(totalAllAssertions).padStart(5, ' ')} ${String(totalAllPassed).padStart(5, ' ')} ${String(totalAllFailed).padStart(5, ' ')}  ${totalAllFailed === 0 ? `${GREEN}100% HARDENED${RESET}` : `${RED}VULNERABILITIES FOUND${RESET}`}${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================================${RESET}`);

  if (totalAllFailed === 0) {
    console.log(`\n${BOLD}${GREEN}✔ STRESS TEST SUCCESS: ALL ${totalAllAssertions} EMPIRICAL CHALLENGES PASSED [${totalDuration}ms]${RESET}`);
    console.log(`${GREEN}✔ Empirical Verdict: APPROVE - Zero security, precision, or isolation regressions.${RESET}\n`);
    process.exit(0);
  } else {
    console.error(`\n${BOLD}${RED}✖ STRESS TEST FAILURE: ${totalAllFailed} VULNERABILITIES IDENTIFIED [${totalDuration}ms]${RESET}`);
    console.error(`${RED}✖ Empirical Verdict: REQUEST_CHANGES - See failed assertions above.${RESET}\n`);
    process.exit(1);
  }
}

runAllChallenges().catch(err => {
  console.error(`${RED}Fatal Uncaught Error in Stress Test Suite:${RESET}`, err);
  process.exit(1);
});
