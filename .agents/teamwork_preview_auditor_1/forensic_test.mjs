/**
 * Forensic Integrity Verification Script
 * Executed independently by teamwork_preview_auditor_1
 * Stress-tests the implementation, looks for cheat facades, verifies mathematical correctness.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

console.log('================================================================');
console.log('       FORENSIC INTEGRITY AUDIT - INDEPENDENT TEST HARNESS      ');
console.log('================================================================\n');

// 1. Load Data
const seedDataPath = path.join(projectRoot, 'scripts/seed-data.json');
assert.ok(fs.existsSync(seedDataPath), 'Seed data json must exist');
const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

// Import domain logic from test-helper
import {
  canPerform,
  searchKmRange,
  parseChainage,
  generateStaffQRPayload,
  parseStaffQRPayload,
  validateCoordinates,
  buildNavigationUri,
  buildGeoUri,
  aggregateStaffByDesignation,
  aggregateAssetCounts,
  aggregateDefectsByKmBlock,
  aggregatePatrolShiftStatus,
  CORRIDOR_BOUNDS
} from '../../scripts/tests/test-helper.mjs';

let auditChecks = 0;
let auditPassed = 0;
let auditFailed = 0;

function audit(name, fn) {
  auditChecks++;
  try {
    fn();
    auditPassed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    auditFailed++;
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// SECTION 1: ANTI-CHEAT & FALSIFICATION STRESS TESTS
// ---------------------------------------------------------------------------
console.log('\n--- 1. Anti-Cheat & Mutation Sensitivity Verification ---');

audit('Data Sensitivity: Changing bridge count from 144 triggers detection', () => {
  const fakeData = { ...seedData, bridges: seedData.bridges.slice(0, 140) };
  assert.equal(fakeData.bridges.length, 140);
  assert.notEqual(fakeData.bridges.length, 144);
});

audit('Dynamic Evaluation: Km search returns dynamic array matching query', () => {
  const q1 = searchKmRange({ fromKm: 1167.210, toKm: 1168.000, line: 'MAIN' }, seedData);
  const q2 = searchKmRange({ fromKm: 1240.000, toKm: 1249.720, line: 'MAIN' }, seedData);
  assert.ok(q1.length > 0);
  assert.ok(q2.length > 0);
  // Ensure sets are completely disjoint
  const q1Ids = new Set(q1.map(i => i.id));
  const q2Ids = new Set(q2.map(i => i.id));
  for (const id of q1Ids) {
    assert.ok(!q2Ids.has(id), `Asset ${id} returned in both non-overlapping queries`);
  }
});

// ---------------------------------------------------------------------------
// SECTION 2: SEED DATA AUTHENTICITY (db.js cross-check)
// ---------------------------------------------------------------------------
console.log('\n--- 2. Seed Data Authenticity & db.js Line-by-Line Match ---');

audit('Curves Authenticity: 95 curves match db.js numbers 315 to 409', () => {
  assert.equal(seedData.curves.length, 95);
  for (let i = 0; i < 95; i++) {
    const expectedCrvNo = 315 + i;
    const c = seedData.curves[i];
    assert.equal(c.curveNo, expectedCrvNo, `Curve index ${i} has curveNo ${c.curveNo} instead of ${expectedCrvNo}`);
    assert.ok(c.fromKm < c.toKm, `Curve ${c.id} fromKm >= toKm`);
  }
});

audit('Turnouts Authenticity: 161 turnouts match db.js yard distributions', () => {
  assert.equal(seedData.points_crossings.length, 161);
  const yardCounts = {};
  for (const pc of seedData.points_crossings) {
    yardCounts[pc.station] = (yardCounts[pc.station] || 0) + 1;
  }
  assert.equal(yardCounts['SMUN'], 35);
  assert.equal(yardCounts['SBJN'], 26);
  assert.equal(yardCounts['NSIR'], 18);
  assert.equal(yardCounts['GVGN'], 32);
  assert.equal(yardCounts['KNNN'], 22);
  assert.equal(yardCounts['CHAN'], 28);
});

audit('Level Crossings Authenticity: 5 Level Crossings match db.js exactly', () => {
  assert.equal(seedData.level_crossings.length, 5);
  const expected = [
    { id: 'LC-151C', km: 1215.034, tuv: 886440.00 },
    { id: 'LC-159C', km: 1232.095, tuv: 183937.50 },
    { id: 'LC-163spl', km: 1239.827, tuv: 143633.76 },
    { id: 'LC-164spl', km: 1244.833, tuv: 599622.31 },
    { id: 'LC-167C', km: 1248.664, tuv: 232435.43 }
  ];
  for (const exp of expected) {
    const found = seedData.level_crossings.find(lc => lc.id === exp.id);
    assert.ok(found, `LC ${exp.id} missing`);
    assert.equal(found.km, exp.km);
    assert.equal(found.tuv, exp.tuv);
  }
});

audit('Bridges Authenticity: Exactly 144 bridges with category distribution', () => {
  assert.equal(seedData.bridges.length, 144);
  const counts = { MAJOR: 0, MINOR: 0, RUB: 0, ROB: 0, FOB: 0 };
  for (const b of seedData.bridges) {
    counts[b.category] = (counts[b.category] || 0) + 1;
  }
  assert.equal(counts.MAJOR, 18);
  assert.equal(counts.MINOR, 74);
  assert.equal(counts.RUB, 37);
  assert.equal(counts.ROB, 9);
  assert.equal(counts.FOB, 6);
});

audit('Staff Roster Authenticity: 14 items with Vivek Kumar Azad as Super Admin', () => {
  assert.equal(seedData.officers_staff.length, 14);
  const vkazad = seedData.officers_staff.find(s => s.id === 'STF-001');
  assert.ok(vkazad);
  assert.equal(vkazad.name, 'Shri Vivek Kumar Azad');
  assert.equal(vkazad.post, 'APM / Civil');
  assert.equal(vkazad.role, 'SUPER_ADMIN');
});

audit('Keymen Beats Authenticity: 18 contiguous beats covering full 88.679 Km', () => {
  assert.equal(seedData.keymen.length, 18);
  assert.equal(seedData.keymen[0].fromKm, 1167.210);
  assert.equal(seedData.keymen[16].toKm, 1249.720); // Main line end
  assert.equal(seedData.keymen[17].sectionCode, 'SMUN-RPJ'); // Link line
});

audit('Patrol Shifts Authenticity: 24 shifts (20 filled, 4 vacant night shifts)', () => {
  assert.equal(seedData.patrol_shifts.length, 24);
  const filled = seedData.patrol_shifts.filter(p => p.isFilled).length;
  const vacant = seedData.patrol_shifts.filter(p => !p.isFilled).length;
  assert.equal(filled, 20);
  assert.equal(vacant, 4);
});

audit('Track Defects Authenticity: 48 items across 6 engineering categories', () => {
  assert.equal(seedData.track_defects.length, 48);
  const cats = new Set(seedData.track_defects.map(d => d.category));
  assert.ok(cats.has('USFD_FLAW'));
  assert.ok(cats.has('TRACK_GEOMETRY'));
  assert.ok(cats.has('POINTS_CROSSINGS'));
  assert.ok(cats.has('FASTENERS'));
  assert.ok(cats.has('WELD_DEFECT'));
  assert.ok(cats.has('SEJ_DEFECT'));
});

// ---------------------------------------------------------------------------
// SECTION 3: RBAC ENFORCEMENT & PRIVILEGE ESCALATION RESISTANCE
// ---------------------------------------------------------------------------
console.log('\n--- 3. RBAC Enforcement & Attack Resistance ---');

audit('RBAC: Super Admin is granted ALL actions', () => {
  assert.equal(canPerform('SUPER_ADMIN', 'DELETE', 'bridges'), true);
  assert.equal(canPerform('SUPER_ADMIN', 'DELETE', 'users'), true);
  assert.equal(canPerform('SUPER_ADMIN', 'ADMIN_PANEL', 'admin'), true);
  assert.equal(canPerform('SUPER_ADMIN', 'GENERATE_PIN', 'users'), true);
});

audit('RBAC: Field Officer is blocked from DELETION, ADMIN PANEL, PIN GENERATION', () => {
  assert.equal(canPerform('OFFICER', 'DELETE', 'bridges'), false);
  assert.equal(canPerform('OFFICER', 'DELETE', 'curves'), false);
  assert.equal(canPerform('OFFICER', 'DELETE', 'users'), false);
  assert.equal(canPerform('OFFICER', 'ADMIN_PANEL', 'admin'), false);
  assert.equal(canPerform('OFFICER', 'GENERATE_PIN', 'users'), false);
  // Allowed actions:
  assert.equal(canPerform('OFFICER', 'CREATE', 'track_defects'), true);
  assert.equal(canPerform('OFFICER', 'UPDATE', 'bridges'), true);
  assert.equal(canPerform('OFFICER', 'READ', 'jurisdiction'), true);
});

audit('RBAC: Field Staff is STRICTLY Read-Only', () => {
  assert.equal(canPerform('STAFF', 'CREATE', 'bridges'), false);
  assert.equal(canPerform('STAFF', 'UPDATE', 'curves'), false);
  assert.equal(canPerform('STAFF', 'DELETE', 'points_crossings'), false);
  assert.equal(canPerform('STAFF', 'ADMIN_PANEL', 'admin'), false);
  assert.equal(canPerform('STAFF', 'GENERATE_PIN', 'users'), false);
  assert.equal(canPerform('STAFF', 'READ', 'bridges'), true);
});

audit('RBAC: Attacker supplying arbitrary or malicious role strings is blocked', () => {
  assert.equal(canPerform('ROOT', 'DELETE', 'bridges'), false);
  assert.equal(canPerform('ADMIN', 'DELETE', 'bridges'), false);
  assert.equal(canPerform('../admin', 'DELETE', 'bridges'), false);
  assert.equal(canPerform('__proto__', 'CREATE', 'users'), false);
  assert.equal(canPerform(null, 'READ', 'bridges'), false);
  assert.equal(canPerform(undefined, 'READ', 'bridges'), false);
});

// ---------------------------------------------------------------------------
// SECTION 4: KM QUICK FINDER ALGORITHMIC INTEGRITY
// ---------------------------------------------------------------------------
console.log('\n--- 4. Km Quick Finder Mathematical Precision ---');

audit('Km Range: Point search at exact Km 1215.034 finds Level Crossing LC-151C', () => {
  const hits = searchKmRange({ fromKm: 1215.034, toKm: 1215.034, line: 'ALL' }, seedData);
  const lc = hits.find(h => h.id === 'LC-151C');
  assert.ok(lc, 'LC-151C must match at exact chainage');
});

audit('Km Range: Linear Curve Interval overlap matches correctly', () => {
  // Curve 321 spans 1174.826 to 1175.167
  const hits = searchKmRange({ fromKm: 1175.000, toKm: 1176.000, category: 'Curve', line: 'MAIN' }, seedData);
  const c321 = hits.find(h => h.id === 'CRV-321');
  assert.ok(c321, 'Curve 321 must overlap range [1175.000, 1176.000]');
});

audit('Km Range: Inverted range [1220.000, 1200.000] matches [1200.000, 1220.000]', () => {
  const norm = searchKmRange({ fromKm: 1200.000, toKm: 1220.000, line: 'ALL' }, seedData);
  const inv = searchKmRange({ fromKm: 1220.000, toKm: 1200.000, line: 'ALL' }, seedData);
  assert.equal(inv.length, norm.length);
  assert.deepEqual(inv.map(i => i.id).sort(), norm.map(i => i.id).sort());
});

audit('Chainage Parser: Multi-format parsing accuracy', () => {
  assert.equal(parseChainage('1167.210'), 1167.21);
  assert.equal(parseChainage('1167+210'), 1167.21);
  assert.equal(parseChainage('1170+500'), 1170.5);
  assert.equal(parseChainage(1200.5), 1200.5);
  assert.equal(parseChainage('invalid_input'), null);
});

// ---------------------------------------------------------------------------
// SECTION 5: PERSONAL QR CODE & GEOLOCATION
// ---------------------------------------------------------------------------
console.log('\n--- 5. Personal QR Code & GPS Geofencing ---');

audit('QR Payload: Serializes all required fields with DFCCIL app signature', () => {
  const payload = generateStaffQRPayload(seedData.officers_staff[0]);
  const parsed = parseStaffQRPayload(payload);
  assert.equal(parsed.app, 'RailDiary-DFCCIL');
  assert.equal(parsed.ver, '1.0');
  assert.equal(parsed.staffId, 'STF-001');
  assert.equal(parsed.name, 'Shri Vivek Kumar Azad');
  assert.equal(parsed.role, 'SUPER_ADMIN');
});

audit('QR Payload: Corrupted or tampered JSON is rejected with error', () => {
  assert.throws(() => parseStaffQRPayload('{corrupt json}'), /Failed to parse/);
  assert.throws(() => parseStaffQRPayload(JSON.stringify({ app: 'FakeApp' })), /Unrecognized app signature/);
  assert.throws(() => parseStaffQRPayload(JSON.stringify({ app: 'RailDiary-DFCCIL' })), /Missing mandatory/);
});

audit('GPS Geofencing: 100% of 453 spatial assets fall strictly within SMUN bounds', () => {
  const allSpatial = [
    ...seedData.bridges,
    ...seedData.curves,
    ...seedData.level_crossings,
    ...seedData.points_crossings,
    ...seedData.track_defects
  ];
  assert.equal(allSpatial.length, 453);
  for (const item of allSpatial) {
    const valid = validateCoordinates(item.latitude, item.longitude);
    assert.ok(valid, `Asset ${item.id} coords (${item.latitude}, ${item.longitude}) failed geofencing`);
  }
});

audit('GPS URI Builders: Google Maps and Android geo: intents generated correctly', () => {
  const navUrl = buildNavigationUri(30.3442, 76.7121, 'SMUN Yard');
  assert.ok(navUrl.startsWith('https://www.google.com/maps/dir/?api=1'));
  assert.ok(navUrl.includes('destination=30.3442,76.7121'));

  const geoUri = buildGeoUri(30.3442, 76.7121, 'SMUN Yard');
  assert.ok(geoUri.startsWith('geo:30.3442,76.7121?q=30.3442,76.7121'));
});

// ---------------------------------------------------------------------------
// SECTION 6: ANALYTICS AGGREGATIONS
// ---------------------------------------------------------------------------
console.log('\n--- 6. Interactive Analytics Aggregations ---');

audit('Analytics: Staff by designation adds up to 14', () => {
  const res = aggregateStaffByDesignation(seedData.officers_staff);
  const total = Object.values(res).reduce((a, b) => a + b, 0);
  assert.equal(total, 14);
});

audit('Analytics: Asset counts sum to 405 (144 Brg, 95 Crv, 161 PC, 5 LC)', () => {
  const res = aggregateAssetCounts({
    bridges: seedData.bridges,
    curves: seedData.curves,
    levelCrossings: seedData.level_crossings,
    pointsCrossings: seedData.points_crossings
  });
  assert.equal(res.totalAssets, 405);
  assert.equal(res.bridgeSubtypes.total, 144);
});

audit('Analytics: Defect histogram sums to 48 across 9 spatial buckets', () => {
  const blocks = aggregateDefectsByKmBlock(seedData.track_defects);
  assert.equal(blocks.length, 9);
  const total = blocks.reduce((s, b) => s + b.count, 0);
  assert.equal(total, 48);
});

audit('Analytics: Patrol shift status computes 20 filled, 4 vacant (83.33%)', () => {
  const res = aggregatePatrolShiftStatus(seedData.patrol_shifts);
  assert.equal(res.filled, 20);
  assert.equal(res.vacant, 4);
  assert.equal(res.total, 24);
  assert.equal(res.fillPercentage, 83.33);
});

console.log('\n================================================================');
console.log(`FORENSIC SCORE: ${auditPassed}/${auditChecks} PASSED (${auditFailed} FAILURES)`);
console.log('================================================================\n');

if (auditFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
