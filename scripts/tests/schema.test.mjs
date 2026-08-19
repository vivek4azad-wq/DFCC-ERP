/**
 * Suite 1: Schema Integrity & Seeding Counts Test Suite
 * Validates all 10 Firestore collections, exact document counts, field types, and integrity constraints.
 */

import assert from 'node:assert/strict';
import { loadSeedData, validateCoordinates } from './test-helper.mjs';

/**
 * Runs all schema integrity tests.
 * @param {object} [options]
 * @returns {Promise<{ name: string, total: number, passed: number, failed: number, errors: Array<{ test: string, error: any }> }>}
 */
export async function runSchemaTests(options = {}) {
  const suiteName = 'Schema Integrity & Seeding Counts';
  const results = {
    name: suiteName,
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    details: []
  };

  const test = (title, fn) => {
    results.total++;
    try {
      fn();
      results.passed++;
      results.details.push({ title, passed: true });
    } catch (err) {
      results.failed++;
      results.errors.push({ test: title, error: err });
      results.details.push({ title, passed: false, error: err.message });
    }
  };

  const data = loadSeedData();

  // -------------------------------------------------------------------------
  // 1. EXACT DOCUMENT COUNTS
  // -------------------------------------------------------------------------

  test('Collection: bridges has EXACTLY 144 items', () => {
    assert.ok(Array.isArray(data.bridges), 'bridges should be an array');
    assert.equal(data.bridges.length, 144, `Expected 144 bridges, got ${data.bridges.length}`);
  });

  test('Collection: level_crossings has EXACTLY 5 items', () => {
    assert.ok(Array.isArray(data.level_crossings), 'level_crossings should be an array');
    assert.equal(data.level_crossings.length, 5, `Expected 5 level crossings, got ${data.level_crossings.length}`);
  });

  test('Collection: officers_staff has authentic staff records (>= 14)', () => {
    assert.ok(Array.isArray(data.officers_staff), 'officers_staff should be an array');
    assert.ok(data.officers_staff.length >= 14, `Expected at least 14 officers/staff, got ${data.officers_staff.length}`);
  });

  test('Collection: keymen has EXACTLY 18 items', () => {
    assert.ok(Array.isArray(data.keymen), 'keymen should be an array');
    assert.equal(data.keymen.length, 18, `Expected 18 keymen beats, got ${data.keymen.length}`);
  });

  test('Collection: patrol_shifts has authentic patrol shifts (>= 24)', () => {
    assert.ok(Array.isArray(data.patrol_shifts), 'patrol_shifts should be an array');
    assert.ok(data.patrol_shifts.length >= 24, `Expected at least 24 patrol shifts, got ${data.patrol_shifts.length}`);
  });

  test('Collection: points_crossings has EXACTLY 161 items', () => {
    assert.ok(Array.isArray(data.points_crossings), 'points_crossings should be an array');
    assert.equal(data.points_crossings.length, 161, `Expected 161 points & crossings, got ${data.points_crossings.length}`);
  });

  test('Collection: curves has EXACTLY 95 items (Curve No. 315 to 409)', () => {
    assert.ok(Array.isArray(data.curves), 'curves should be an array');
    assert.equal(data.curves.length, 95, `Expected 95 curves, got ${data.curves.length}`);
  });

  test('Collection: track_defects has EXACTLY 48 items', () => {
    assert.ok(Array.isArray(data.track_defects), 'track_defects should be an array');
    assert.equal(data.track_defects.length, 48, `Expected 48 track defects, got ${data.track_defects.length}`);
  });

  test('Collection: users has >= 3 accounts including Master Super Admin', () => {
    assert.ok(Array.isArray(data.users), 'users should be an array');
    assert.ok(data.users.length >= 3, `Expected at least 3 users, got ${data.users.length}`);
    const admin = data.users.find(u => u.email === 'vkazad@dfcc.co.in' || u.userId === 'vkazad@dfcc.co.in');
    assert.ok(admin, 'Master Super Admin account vkazad@dfcc.co.in must exist in users');
    assert.equal(admin.role, 'SUPER_ADMIN', 'Master account role must be SUPER_ADMIN');
  });

  test('Collection: jurisdiction has >= 1 section and covers 88.679 Km total', () => {
    assert.ok(Array.isArray(data.jurisdiction), 'jurisdiction should be an array');
    assert.ok(data.jurisdiction.length >= 1, `Expected at least 1 jurisdiction record, got ${data.jurisdiction.length}`);
    const totalKm = data.jurisdiction.reduce((sum, sec) => sum + (sec.lengthKm || (sec.toKm - sec.fromKm)), 0);
    assert.ok(Math.abs(totalKm - 88.679) < 0.05, `Total jurisdiction length should be 88.679 Km, got ${totalKm}`);
  });

  // -------------------------------------------------------------------------
  // 2. DETAILED SCHEMA CONSTRAINTS PER COLLECTION
  // -------------------------------------------------------------------------

  test('Schema Validation: users contains required roles and secure attributes', () => {
    const roles = new Set(data.users.map(u => u.role));
    assert.ok(roles.has('SUPER_ADMIN'), 'users must contain SUPER_ADMIN');
    assert.ok(roles.has('OFFICER'), 'users must contain OFFICER');
    assert.ok(roles.has('STAFF'), 'users must contain STAFF');

    for (const u of data.users) {
      assert.ok(u.id && typeof u.id === 'string', `User ID missing or invalid: ${JSON.stringify(u)}`);
      assert.ok(u.name && typeof u.name === 'string', `User name missing: ${u.id}`);
      assert.ok(u.pin && typeof u.pin === 'string' && /^\d{4,6}$/.test(u.pin), `User PIN invalid: ${u.id}`);
      assert.ok(typeof u.isActive === 'boolean', `User isActive must be boolean: ${u.id}`);
    }
  });

  test('Schema Validation: jurisdiction block sections have valid boundaries & stations', () => {
    for (const s of data.jurisdiction) {
      assert.ok(s.id && typeof s.id === 'string', `Section ID invalid: ${JSON.stringify(s)}`);
      assert.ok(s.sectionCode && typeof s.sectionCode === 'string', `Section code invalid: ${s.id}`);
      assert.ok(typeof s.fromKm === 'number' && typeof s.toKm === 'number', `Section chainages must be numeric: ${s.id}`);
      assert.ok(s.fromKm < s.toKm, `fromKm must be less than toKm: ${s.id}`);
      assert.ok(Array.isArray(s.stations) && s.stations.length >= 2, `Section must have >=2 stations: ${s.id}`);
    }
  });

  test('Schema Validation: bridges category breakdown matches 18 MJB, 74 MIB, 37 RUB, 9 ROB, 6 FOB', () => {
    let mjb = 0, mib = 0, rub = 0, rob = 0, fob = 0;
    for (const b of data.bridges) {
      assert.ok(b.id && typeof b.id === 'string', `Bridge ID missing: ${JSON.stringify(b)}`);
      assert.ok(b.bridgeNo && typeof b.bridgeNo === 'string', `Bridge No missing: ${b.id}`);
      assert.ok(typeof b.km === 'number', `Bridge km must be numeric: ${b.id}`);
      assert.ok(typeof b.latitude === 'number' && typeof b.longitude === 'number', `Bridge coords must be numeric: ${b.id}`);
      assert.ok(validateCoordinates(b.latitude, b.longitude), `Bridge coords out of corridor bounds: ${b.id} (${b.latitude}, ${b.longitude})`);

      const cat = (b.category || '').toUpperCase();
      if (cat === 'MAJOR' || b.bridgeType === 'MJB' || b.bridgeType === 'OWG') mjb++;
      else if (cat === 'MINOR' || b.bridgeType === 'MIB') mib++;
      else if (cat === 'RUB' || b.bridgeType === 'RUB') rub++;
      else if (cat === 'ROB' || b.bridgeType === 'ROB') rob++;
      else if (cat === 'FOB' || b.bridgeType === 'FOB') fob++;
    }
    assert.equal(mjb, 18, `Expected 18 Major bridges, got ${mjb}`);
    assert.equal(mib, 74, `Expected 74 Minor bridges, got ${mib}`);
    assert.equal(rub, 37, `Expected 37 RUBs, got ${rub}`);
    assert.equal(rob, 9, `Expected 9 ROBs, got ${rob}`);
    assert.equal(fob, 6, `Expected 6 FOBs, got ${fob}`);
  });

  test('Schema Validation: level_crossings matches authentic 5 LCs from db.js', () => {
    const expectedLCs = ['LC-151C', 'LC-159C', 'LC-163spl', 'LC-164spl', 'LC-167C'];
    const ids = data.level_crossings.map(lc => lc.id);
    for (const expId of expectedLCs) {
      assert.ok(ids.includes(expId), `Required level crossing ${expId} missing from collection`);
    }

    for (const lc of data.level_crossings) {
      assert.ok(typeof lc.km === 'number', `LC km must be numeric: ${lc.id}`);
      assert.ok(typeof lc.tuv === 'number' && lc.tuv > 0, `LC TUV census must be positive number: ${lc.id}`);
      assert.ok(typeof lc.interlocked === 'boolean', `LC interlocked must be boolean: ${lc.id}`);
      assert.ok(validateCoordinates(lc.latitude, lc.longitude), `LC coords out of bounds: ${lc.id}`);
    }
  });

  test('Schema Validation: officers_staff includes complete profile attributes & leave balance', () => {
    for (const stf of data.officers_staff) {
      assert.ok(stf.id && /^STF-\d+$/.test(stf.id), `Staff ID format invalid: ${stf.id}`);
      assert.ok(stf.name && typeof stf.name === 'string', `Staff name invalid: ${stf.id}`);
      assert.ok(stf.post && typeof stf.post === 'string', `Staff post invalid: ${stf.id}`);
      assert.ok(['SUPER_ADMIN', 'OFFICER', 'STAFF'].includes(stf.role), `Staff role invalid: ${stf.id}`);
      assert.ok(stf.leaveBalance && typeof stf.leaveBalance === 'object', `Staff leaveBalance missing: ${stf.id}`);
      assert.ok(typeof stf.leaveBalance.lap === 'number' && stf.leaveBalance.lap >= 0, `Staff LAP invalid: ${stf.id}`);
      assert.ok(typeof stf.leaveBalance.cl === 'number' && stf.leaveBalance.cl >= 0, `Staff CL invalid: ${stf.id}`);
    }
  });

  test('Schema Validation: keymen covers 18 beats with valid toolkits & chainages', () => {
    const beatNumbers = data.keymen.map(k => k.beatNo).sort((a, b) => a - b);
    assert.deepEqual(beatNumbers, Array.from({ length: 18 }, (_, i) => i + 1), 'Keymen beats must be numbered 1 to 18');

    for (const k of data.keymen) {
      assert.ok(typeof k.fromKm === 'number' && typeof k.toKm === 'number', `Keyman km invalid: ${k.id}`);
      assert.ok(k.fromKm < k.toKm, `Keyman beat start must be < end: ${k.id}`);
      assert.ok(Array.isArray(k.toolkitItems) && k.toolkitItems.length >= 3, `Keyman must have standard toolkit items: ${k.id}`);
      assert.ok(k.dutyHours && typeof k.dutyHours === 'string', `Keyman dutyHours missing: ${k.id}`);
    }
  });

  test('Schema Validation: patrol_shifts covers 8 sections with 24 diurnal shifts (20 filled, 4 vacant)', () => {
    let filled = 0, vacant = 0;
    for (const p of data.patrol_shifts) {
      assert.ok(p.id && /^PSH-\d+$/.test(p.id), `Patrol shift ID format invalid: ${p.id}`);
      assert.ok(p.shiftCode && ['SHIFT_A_MORNING', 'SHIFT_B_EVENING', 'SHIFT_C_NIGHT'].includes(p.shiftCode), `Invalid shift code: ${p.id}`);
      assert.ok(typeof p.isFilled === 'boolean', `isFilled must be boolean: ${p.id}`);
      if (p.isFilled) filled++;
      else vacant++;
    }
    assert.equal(filled + vacant, 24, 'Patrol shifts total must be 24');
    assert.equal(vacant, 4, `Expected exactly 4 vacant patrol shifts, got ${vacant}`);
    assert.equal(filled, 20, `Expected exactly 20 filled patrol shifts, got ${filled}`);
  });

  test('Schema Validation: points_crossings station breakdown matches 35 SMUN, 26 SBJN, 18 NSIR, 32 GVGN, 22 KNNN, 28 CHAN', () => {
    const counts = {};
    for (const pc of data.points_crossings) {
      counts[pc.station] = (counts[pc.station] || 0) + 1;
      assert.ok(pc.id && typeof pc.id === 'string', `Point ID missing: ${JSON.stringify(pc)}`);
      assert.ok(pc.pointNo && typeof pc.pointNo === 'string', `Point number missing: ${pc.id}`);
      assert.ok(typeof pc.km === 'number', `Point km must be numeric: ${pc.id}`);
      assert.ok(validateCoordinates(pc.latitude, pc.longitude), `Point coordinates out of bounds: ${pc.id}`);
    }
    assert.equal(counts['SMUN'], 35, `Expected 35 SMUN turnouts, got ${counts['SMUN']}`);
    assert.equal(counts['SBJN'], 26, `Expected 26 SBJN turnouts, got ${counts['SBJN']}`);
    assert.equal(counts['NSIR'], 18, `Expected 18 NSIR turnouts, got ${counts['NSIR']}`);
    assert.equal(counts['GVGN'], 32, `Expected 32 GVGN turnouts, got ${counts['GVGN']}`);
    assert.equal(counts['KNNN'], 22, `Expected 22 KNNN turnouts, got ${counts['KNNN']}`);
    assert.equal(counts['CHAN'], 28, `Expected 28 CHAN turnouts, got ${counts['CHAN']}`);
  });

  test('Schema Validation: curves contains 95 authentic curves (Nos 315 to 409)', () => {
    const curveNumbers = data.curves.map(c => c.curveNo).sort((a, b) => a - b);
    assert.equal(curveNumbers[0], 315, 'First curve must be Curve No. 315');
    assert.equal(curveNumbers[curveNumbers.length - 1], 409, 'Last curve must be Curve No. 409');
    assert.equal(new Set(curveNumbers).size, 95, 'All 95 curve numbers must be unique');

    for (const c of data.curves) {
      assert.ok(typeof c.fromKm === 'number' && typeof c.toKm === 'number', `Curve km must be numeric: ${c.id}`);
      assert.ok(c.fromKm < c.toKm, `Curve fromKm must be < toKm: ${c.id}`);
      assert.ok(typeof c.lengthMeters === 'number' && c.lengthMeters > 0, `Curve length must be positive: ${c.id}`);
      assert.ok(typeof c.radiusMeters === 'number' && c.radiusMeters > 0, `Curve radius must be positive: ${c.id}`);
      assert.ok(typeof c.degree === 'number' && c.degree > 0, `Curve degree must be positive: ${c.id}`);
      assert.ok(validateCoordinates(c.latitude, c.longitude), `Curve coordinates out of bounds: ${c.id}`);
    }
  });

  test('Schema Validation: track_defects contains 48 defects with severity, lifecycle status, and coordinates', () => {
    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const validStatuses = ['OPEN', 'WORK_IN_PROGRESS', 'ATTENDED', 'VERIFIED_CLOSED', 'RECTIFIED'];

    for (const d of data.track_defects) {
      assert.ok(d.id && typeof d.id === 'string', `Defect ID missing: ${JSON.stringify(d)}`);
      assert.ok(validSeverities.includes(d.severity), `Invalid severity in defect ${d.id}: ${d.severity}`);
      assert.ok(validStatuses.includes(d.status), `Invalid status in defect ${d.id}: ${d.status}`);
      assert.ok(typeof d.km === 'number', `Defect chainage must be numeric: ${d.id}`);
      assert.ok(validateCoordinates(d.latitude, d.longitude), `Defect coordinates out of bounds: ${d.id}`);
    }
  });

  return results;
}

// Direct execution support via node scripts/tests/schema.test.mjs
if (process.argv[1] && process.argv[1].endsWith('schema.test.mjs')) {
  runSchemaTests().then(res => {
    console.log(`[Suite 1] ${res.name}: ${res.passed}/${res.total} passed`);
    if (res.failed > 0) {
      console.error('Failures:', res.errors);
      process.exit(1);
    }
  });
}
