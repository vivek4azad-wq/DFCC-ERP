/**
 * Empirical Challenger Adversarial Stress Test Suite
 * Rail Diary ERP — DFCCIL IMSD SMUN Unit
 * 
 * Target Domains:
 * 1. Schema & Count Integrity (10 collections exact counts, PK collision detection, numeric constraints)
 * 2. Geospatial & Navigation Engine (Geofence bounding box across 453 spatial assets, coordinate validation, URI generation & escaping)
 * 3. Analytics Data Aggregations (Subtypes sums, histogram bins, empty/zero/vacant edge cases, mathematical consistency)
 */

import assert from 'node:assert/strict';
import {
  loadSeedData,
  validateCoordinates,
  buildNavigationUri,
  buildGeoUri,
  aggregateStaffByDesignation,
  aggregateAssetCounts,
  aggregateDefectsByKmBlock,
  aggregatePatrolShiftStatus,
  CORRIDOR_BOUNDS
} from './tests/test-helper.mjs';

let passedCount = 0;
let failedCount = 0;
const failures = [];

function stressTest(title, fn) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ [PASS] ${title}`);
  } catch (err) {
    failedCount++;
    failures.push({ title, error: err.message });
    console.error(`  ✗ [FAIL] ${title}: ${err.message}`);
  }
}

console.log('================================================================================');
console.log('       EMPIRICAL CHALLENGER ADVERSARIAL STRESS TEST SUITE (RAIL DIARY ERP)      ');
console.log('================================================================================\n');

const data = loadSeedData();

// =============================================================================
// DOMAIN 1: SCHEMA & COUNT INTEGRITY STRESS TESTS
// =============================================================================
console.log('--- DOMAIN 1: SCHEMA & COUNT INTEGRITY STRESS TESTS ---');

// 1. Exact document counts across all 10 collections
stressTest('Collection bridges count exactness (144 items)', () => {
  assert.equal(data.bridges.length, 144, `Expected 144, got ${data.bridges.length}`);
});

stressTest('Collection level_crossings count exactness (5 items)', () => {
  assert.equal(data.level_crossings.length, 5, `Expected 5, got ${data.level_crossings.length}`);
});

stressTest('Collection officers_staff count exactness (14 items)', () => {
  assert.equal(data.officers_staff.length, 14, `Expected 14, got ${data.officers_staff.length}`);
});

stressTest('Collection keymen count exactness (18 items)', () => {
  assert.equal(data.keymen.length, 18, `Expected 18, got ${data.keymen.length}`);
});

stressTest('Collection patrol_shifts count exactness (24 items)', () => {
  assert.equal(data.patrol_shifts.length, 24, `Expected 24, got ${data.patrol_shifts.length}`);
});

stressTest('Collection points_crossings count exactness (161 items)', () => {
  assert.equal(data.points_crossings.length, 161, `Expected 161, got ${data.points_crossings.length}`);
});

stressTest('Collection curves count exactness (95 items: No 315 to 409)', () => {
  assert.equal(data.curves.length, 95, `Expected 95, got ${data.curves.length}`);
});

stressTest('Collection track_defects count exactness (48 items)', () => {
  assert.equal(data.track_defects.length, 48, `Expected 48, got ${data.track_defects.length}`);
});

stressTest('Collection users count invariant (>= 3 items)', () => {
  assert.ok(data.users.length >= 3, `Expected >= 3 users, got ${data.users.length}`);
});

stressTest('Collection jurisdiction count invariant (>= 1 items & 88.679 Km total)', () => {
  assert.ok(data.jurisdiction.length >= 1, `Expected >= 1 sections, got ${data.jurisdiction.length}`);
  const totalKm = data.jurisdiction.reduce((acc, s) => acc + (s.lengthKm || (s.toKm - s.fromKm)), 0);
  assert.ok(Math.abs(totalKm - 88.679) < 0.05, `Expected total ~88.679 Km, got ${totalKm}`);
});

// 2. Primary Key Uniqueness & Collision Stress Test
stressTest('Primary Key Uniqueness within all 10 collections (Zero collisions)', () => {
  const collections = [
    { name: 'bridges', items: data.bridges },
    { name: 'level_crossings', items: data.level_crossings },
    { name: 'officers_staff', items: data.officers_staff },
    { name: 'keymen', items: data.keymen },
    { name: 'patrol_shifts', items: data.patrol_shifts },
    { name: 'points_crossings', items: data.points_crossings },
    { name: 'curves', items: data.curves },
    { name: 'track_defects', items: data.track_defects },
    { name: 'users', items: data.users },
    { name: 'jurisdiction', items: data.jurisdiction }
  ];

  for (const col of collections) {
    const ids = col.items.map(item => item.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, ids.length, `Duplicate IDs detected in collection '${col.name}'! Total: ${ids.length}, Unique: ${uniqueIds.size}`);
    
    // Check no empty, whitespace or non-string IDs
    for (const id of ids) {
      assert.ok(typeof id === 'string' && id.trim().length > 0, `Invalid empty or non-string ID found in ${col.name}: ${id}`);
    }
  }
});

// 3. Strict Numeric & Boundary Constraints
stressTest('Curves numeric invariants (fromKm < toKm, positive radius, degree, length)', () => {
  for (const c of data.curves) {
    assert.ok(typeof c.fromKm === 'number' && typeof c.toKm === 'number', `Invalid km types in curve ${c.id}`);
    assert.ok(c.fromKm < c.toKm, `fromKm must be < toKm in curve ${c.id}`);
    assert.ok(c.lengthMeters > 0, `lengthMeters must be > 0 in curve ${c.id}`);
    assert.ok(c.radiusMeters > 0, `radiusMeters must be > 0 in curve ${c.id}`);
    assert.ok(c.degree > 0, `degree must be > 0 in curve ${c.id}`);
    assert.ok(c.cantMm >= 0, `cantMm must be >= 0 in curve ${c.id}`);
    assert.ok(c.speedLimitKmph > 0, `speedLimitKmph must be > 0 in curve ${c.id}`);
    assert.ok(c.transitionLengthMeters >= 0, `transitionLengthMeters must be >= 0 in curve ${c.id}`);
  }
});

stressTest('Bridges numeric invariants & classification integrity', () => {
  for (const b of data.bridges) {
    assert.ok(typeof b.km === 'number', `Bridge km must be numeric: ${b.id}`);
    assert.ok(b.totalLengthMeters > 0, `totalLengthMeters must be > 0 in bridge ${b.id}`);
    assert.ok(b.bridgeNo && typeof b.bridgeNo === 'string', `bridgeNo missing in ${b.id}`);
    assert.ok(b.structureType && typeof b.structureType === 'string', `structureType missing in ${b.id}`);
    assert.ok(['MAJOR', 'MINOR', 'RUB', 'ROB', 'FOB'].includes(b.category), `Invalid bridge category: ${b.category} in ${b.id}`);
  }
});

stressTest('Staff profile & leave balance integrity (non-negative balances)', () => {
  for (const s of data.officers_staff) {
    assert.ok(s.name && typeof s.name === 'string', `Staff name missing: ${s.id}`);
    assert.ok(s.post && typeof s.post === 'string', `Staff post missing: ${s.id}`);
    assert.ok(['SUPER_ADMIN', 'OFFICER', 'STAFF'].includes(s.role), `Invalid role in staff ${s.id}`);
    assert.ok(s.leaveBalance, `leaveBalance missing in staff ${s.id}`);
    assert.ok(s.leaveBalance.lap >= 0, `Negative LAP balance in staff ${s.id}`);
    assert.ok(s.leaveBalance.lhap >= 0, `Negative LHAP balance in staff ${s.id}`);
    assert.ok(s.leaveBalance.cl >= 0, `Negative CL balance in staff ${s.id}`);
    assert.ok(s.leaveBalance.rh >= 0, `Negative RH balance in staff ${s.id}`);
  }
});

stressTest('Patrol shift coverage integrity (8 sections x 3 diurnal shifts = 24)', () => {
  const shiftsPerSection = {};
  for (const p of data.patrol_shifts) {
    shiftsPerSection[p.sectionCode] = (shiftsPerSection[p.sectionCode] || 0) + 1;
    assert.ok(['SHIFT_A_MORNING', 'SHIFT_B_EVENING', 'SHIFT_C_NIGHT'].includes(p.shiftCode), `Invalid shift code in ${p.id}`);
    assert.ok(['ACTIVE', 'SCHEDULED', 'VACANT', 'COMPLETED'].includes(p.status), `Invalid status in ${p.id}`);
  }
  const sectionCodes = Object.keys(shiftsPerSection);
  assert.equal(sectionCodes.length, 8, `Expected 8 distinct block sections, got ${sectionCodes.length}`);
  for (const sec of sectionCodes) {
    assert.equal(shiftsPerSection[sec], 3, `Expected 3 shifts per section for ${sec}, got ${shiftsPerSection[sec]}`);
  }
});


// =============================================================================
// DOMAIN 2: GEOSPATIAL & NAVIGATION ENGINE STRESS TESTS
// =============================================================================
console.log('\n--- DOMAIN 2: GEOSPATIAL & NAVIGATION ENGINE STRESS TESTS ---');

// 1. Geofence bounding box check across all 453 spatial assets
stressTest('Geofence Bounding Box (All 453 spatial assets lie within Lat 29.5°-31.5° N, Lon 75.8°-78.0° E)', () => {
  const spatialDatasets = [
    { name: 'bridges', items: data.bridges, expected: 144 },
    { name: 'curves', items: data.curves, expected: 95 },
    { name: 'level_crossings', items: data.level_crossings, expected: 5 },
    { name: 'points_crossings', items: data.points_crossings, expected: 161 },
    { name: 'track_defects', items: data.track_defects, expected: 48 }
  ];

  let verifiedCount = 0;
  for (const ds of spatialDatasets) {
    assert.equal(ds.items.length, ds.expected, `Dataset ${ds.name} size mismatch`);
    for (const item of ds.items) {
      assert.ok(typeof item.latitude === 'number' && Number.isFinite(item.latitude), `Invalid latitude in ${ds.name} ${item.id}`);
      assert.ok(typeof item.longitude === 'number' && Number.isFinite(item.longitude), `Invalid longitude in ${ds.name} ${item.id}`);
      
      const inLat = item.latitude >= CORRIDOR_BOUNDS.minLat && item.latitude <= CORRIDOR_BOUNDS.maxLat;
      const inLon = item.longitude >= CORRIDOR_BOUNDS.minLon && item.longitude <= CORRIDOR_BOUNDS.maxLon;
      
      assert.ok(inLat, `Latitude out of geofence bounds in ${ds.name} ${item.id}: ${item.latitude}`);
      assert.ok(inLon, `Longitude out of geofence bounds in ${ds.name} ${item.id}: ${item.longitude}`);
      assert.ok(validateCoordinates(item.latitude, item.longitude), `validateCoordinates failed for ${ds.name} ${item.id}`);
      verifiedCount++;
    }
  }
  assert.equal(verifiedCount, 453, `Expected exactly 453 spatial assets checked, got ${verifiedCount}`);
});

// 2. Coordinate Validator Adversarial Stress Tests
stressTest('validateCoordinates: Adversarial boundary and malicious input testing', () => {
  // Exact boundaries
  assert.equal(validateCoordinates(29.5000, 75.8000), true, 'Exact bottom-left corner should be valid');
  assert.equal(validateCoordinates(31.5000, 78.0000), true, 'Exact top-right corner should be valid');
  assert.equal(validateCoordinates(30.3442, 76.7121), true, 'SMUN center should be valid');

  // Just outside boundaries
  assert.equal(validateCoordinates(29.499999, 76.0000), false, 'Slightly below minLat should be false');
  assert.equal(validateCoordinates(31.500001, 76.0000), false, 'Slightly above maxLat should be false');
  assert.equal(validateCoordinates(30.0000, 75.799999), false, 'Slightly below minLon should be false');
  assert.equal(validateCoordinates(30.0000, 78.000001), false, 'Slightly above maxLon should be false');

  // Nulls, undefined, NaN, Infinities
  assert.equal(validateCoordinates(null, null), false, 'null, null');
  assert.equal(validateCoordinates(undefined, undefined), false, 'undefined, undefined');
  assert.equal(validateCoordinates(30.5, null), false, '30.5, null');
  assert.equal(validateCoordinates(null, 76.5), false, 'null, 76.5');
  assert.equal(validateCoordinates(30.5, undefined), false, '30.5, undefined');
  assert.equal(validateCoordinates(undefined, 76.5), false, 'undefined, 76.5');
  assert.equal(validateCoordinates(NaN, NaN), false, 'NaN, NaN');
  assert.equal(validateCoordinates(30.5, NaN), false, '30.5, NaN');
  assert.equal(validateCoordinates(NaN, 76.5), false, 'NaN, 76.5');
  assert.equal(validateCoordinates(Infinity, 76.5), false, 'Infinity, 76.5');
  assert.equal(validateCoordinates(30.5, Infinity), false, '30.5, Infinity');
  assert.equal(validateCoordinates(-Infinity, 76.5), false, '-Infinity, 76.5');
  assert.equal(validateCoordinates(30.5, -Infinity), false, '30.5, -Infinity');

  // Type mismatch / hostile payloads
  assert.equal(validateCoordinates('30.5', '76.5'), false, 'String numbers should be rejected');
  assert.equal(validateCoordinates({}, {}), false, 'Objects should be rejected');
  assert.equal(validateCoordinates([], []), false, 'Arrays should be rejected');
  assert.equal(validateCoordinates(0, 0), false, 'Null island (0, 0) should be false');
  assert.equal(validateCoordinates(76.5, 30.5), false, 'Flipped Lat/Lon should be false');
  assert.equal(validateCoordinates(90, 180), false, 'Extreme coords should be false');
});

// 3. Navigation URI & Geo URI Generator Stress Tests
stressTest('buildNavigationUri & buildGeoUri: Formatting, escaping & parameter injection defenses', () => {
  // 1. Standard valid generation
  const navUrl = buildNavigationUri(30.3442, 76.7121, 'SMUN Station');
  assert.equal(
    navUrl,
    'https://www.google.com/maps/dir/?api=1&destination=30.3442,76.7121&destination_place_id=SMUN%20Station'
  );

  const geoUri = buildGeoUri(30.3442, 76.7121, 'SMUN Station');
  assert.equal(
    geoUri,
    'geo:30.3442,76.7121?q=30.3442,76.7121(SMUN%20Station)'
  );

  // 2. Hostile Title / Query Param Injection Defense
  const maliciousTitle = 'Station&destination=0,0&param=hack';
  const injectedNavUrl = buildNavigationUri(30.3442, 76.7121, maliciousTitle);
  // Ensure the '&' and '=' inside maliciousTitle are safely percent-encoded and not parsed as separate params
  assert.ok(injectedNavUrl.includes('destination_place_id=Station%26destination%3D0%2C0%26param%3Dhack'));
  assert.ok(!injectedNavUrl.endsWith('&destination=0,0&param=hack'));

  // 3. Special characters & Unicode
  const complexTitle = 'शंभू जंक्शन (SMUN) / Bridge #104 & Culvert "OWG"';
  const complexNavUrl = buildNavigationUri(30.3442, 76.7121, complexTitle);
  assert.ok(!complexNavUrl.includes(' '), 'Must not have unencoded spaces');
  assert.ok(!complexNavUrl.includes('"'), 'Must not have unencoded quotes');
  assert.ok(complexNavUrl.includes(encodeURIComponent(complexTitle)));

  // 4. Empty and omitted label
  const emptyLabelNav = buildNavigationUri(30.3442, 76.7121, '');
  assert.equal(emptyLabelNav, 'https://www.google.com/maps/dir/?api=1&destination=30.3442,76.7121');

  const emptyLabelGeo = buildGeoUri(30.3442, 76.7121, '');
  assert.equal(emptyLabelGeo, 'geo:30.3442,76.7121?q=30.3442,76.7121');

  // 5. Throws on NaN / Infinite coordinates
  assert.throws(() => buildNavigationUri(NaN, 76.7121), /Invalid navigation coordinates/);
  assert.throws(() => buildNavigationUri(30.3442, NaN), /Invalid navigation coordinates/);
  assert.throws(() => buildNavigationUri(Infinity, 76.7121), /Invalid navigation coordinates/);
  assert.throws(() => buildGeoUri(NaN, 76.7121), /Invalid geo coordinates/);
  assert.throws(() => buildGeoUri(30.3442, Infinity), /Invalid geo coordinates/);
});


// =============================================================================
// DOMAIN 3: ANALYTICS DATA AGGREGATIONS STRESS TESTS
// =============================================================================
console.log('\n--- DOMAIN 3: ANALYTICS DATA AGGREGATIONS STRESS TESTS ---');

// 1. Mathematical Consistency Tests
stressTest('Mathematical Consistency: Bridge subtypes sum === 144', () => {
  const assetAgg = aggregateAssetCounts({ bridges: data.bridges });
  const subtypes = assetAgg.bridgeSubtypes;
  const subtypesSum = subtypes.major + subtypes.minor + subtypes.rub + subtypes.rob + subtypes.fob;
  assert.equal(subtypesSum, 144, `Subtypes sum (${subtypesSum}) must equal total bridges (144)`);
  assert.equal(subtypes.total, 144);
  assert.equal(subtypes.major, 18);
  assert.equal(subtypes.minor, 74);
  assert.equal(subtypes.rub, 37);
  assert.equal(subtypes.rob, 9);
  assert.equal(subtypes.fob, 6);
});

stressTest('Mathematical Consistency: Defect histogram bins sum === 48', () => {
  const blocks = aggregateDefectsByKmBlock(data.track_defects);
  const defectsSum = blocks.reduce((sum, b) => sum + b.count, 0);
  assert.equal(defectsSum, 48, `Histogram defects sum (${defectsSum}) must equal total defects (48)`);
  assert.equal(blocks.length, 9, 'Must have 9 blocks (8 Main + 1 Link)');
});

stressTest('Mathematical Consistency: Staff designation counts sum === 14', () => {
  const staffAgg = aggregateStaffByDesignation(data.officers_staff);
  const staffSum = Object.values(staffAgg).reduce((a, b) => a + b, 0);
  assert.equal(staffSum, 14, `Staff counts sum (${staffSum}) must equal total staff (14)`);
});

stressTest('Mathematical Consistency: Total asset count sum === 405 (144 + 95 + 161 + 5)', () => {
  const assetAgg = aggregateAssetCounts({
    bridges: data.bridges,
    curves: data.curves,
    pointsCrossings: data.points_crossings,
    levelCrossings: data.level_crossings
  });
  assert.equal(assetAgg.totalAssets, 405);
  assert.equal(assetAgg.bridges, 144);
  assert.equal(assetAgg.curves, 95);
  assert.equal(assetAgg.pointsCrossings, 161);
  assert.equal(assetAgg.levelCrossings, 5);
});

stressTest('Mathematical Consistency: Patrol shift occupancy sum === 24 (20 filled + 4 vacant = 83.33%)', () => {
  const shiftAgg = aggregatePatrolShiftStatus(data.patrol_shifts);
  assert.equal(shiftAgg.filled, 20);
  assert.equal(shiftAgg.vacant, 4);
  assert.equal(shiftAgg.total, 24);
  assert.equal(shiftAgg.filled + shiftAgg.vacant, shiftAgg.total);
  assert.equal(shiftAgg.fillPercentage, 83.33);
});

// 2. Edge State Stress Tests
stressTest('Analytics Edge State: Completely empty inputs (Zero Division & NaN resistance)', () => {
  // Empty staff
  const emptyStaff = aggregateStaffByDesignation([]);
  assert.deepEqual(emptyStaff, {});

  // Undefined staff
  const undefStaff = aggregateStaffByDesignation(undefined);
  assert.deepEqual(undefStaff, {});

  // Empty assets
  const emptyAssets = aggregateAssetCounts({});
  assert.equal(emptyAssets.bridges, 0);
  assert.equal(emptyAssets.curves, 0);
  assert.equal(emptyAssets.levelCrossings, 0);
  assert.equal(emptyAssets.pointsCrossings, 0);
  assert.equal(emptyAssets.totalAssets, 0);
  assert.equal(emptyAssets.bridgeSubtypes.total, 0);

  // Empty defects
  const emptyDefects = aggregateDefectsByKmBlock([]);
  assert.equal(emptyDefects.length, 9);
  for (const b of emptyDefects) {
    assert.equal(b.count, 0);
  }

  // Empty shifts
  const emptyShifts = aggregatePatrolShiftStatus([]);
  assert.equal(emptyShifts.filled, 0);
  assert.equal(emptyShifts.vacant, 0);
  assert.equal(emptyShifts.total, 0);
  assert.equal(emptyShifts.fillPercentage, 0);
  assert.ok(!Number.isNaN(emptyShifts.fillPercentage));
});

stressTest('Analytics Edge State: 100% Vacant Patrol Shifts', () => {
  const allVacantShifts = data.patrol_shifts.map(s => ({ ...s, isFilled: false, status: 'VACANT' }));
  const result = aggregatePatrolShiftStatus(allVacantShifts);
  assert.equal(result.filled, 0);
  assert.equal(result.vacant, 24);
  assert.equal(result.total, 24);
  assert.equal(result.fillPercentage, 0.00);
});

stressTest('Analytics Edge State: 100% Filled Patrol Shifts', () => {
  const allFilledShifts = data.patrol_shifts.map(s => ({ ...s, isFilled: true, status: 'ACTIVE' }));
  const result = aggregatePatrolShiftStatus(allFilledShifts);
  assert.equal(result.filled, 24);
  assert.equal(result.vacant, 0);
  assert.equal(result.total, 24);
  assert.equal(result.fillPercentage, 100.00);
});

stressTest('Analytics Edge State: Defect boundary binning accuracy', () => {
  // Test defects placed at exact boundary points across distinct bins
  const boundaryDefects = [
    { km: 1167.210, sectionCode: 'SMUN-SBJN', trackLine: 'UP' }, // Bin 0: Km 1167.210 – 1180.000
    { km: 1179.999, sectionCode: 'SMUN-SBJN', trackLine: 'UP' }, // Bin 0: Km 1167.210 – 1180.000
    { km: 1185.000, sectionCode: 'SBJN-NSIR', trackLine: 'DN' }, // Bin 1: Km 1180.001 – 1190.000
    { km: 1249.720, sectionCode: 'CHAN-RPJ',  trackLine: 'UP' }, // Bin 7: Km 1240.001 – 1249.720
    { km: 1172.500, sectionCode: 'SMUN-RPJ',  trackLine: 'LINK' } // Bin 8: Link Line
  ];

  const blocks = aggregateDefectsByKmBlock(boundaryDefects);
  assert.equal(blocks[0].count, 2, 'Block 0 (1167.210–1180.000) should have 2 defects');
  assert.equal(blocks[1].count, 1, 'Block 1 (1180.001–1190.000) should have 1 defect');
  assert.equal(blocks[7].count, 1, 'Block 7 (1240.001–1249.720) should have 1 defect');
  assert.equal(blocks[8].count, 1, 'Block 8 (Link Line) should have 1 defect');
  const total = blocks.reduce((sum, b) => sum + b.count, 0);
  assert.equal(total, 5, 'All 5 boundary defects binned correctly');
});


// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
console.log(`TOTAL STRESS TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('================================================================================');

if (failedCount > 0) {
  console.error('\nAdversarial stress test suite FAILED with failures:');
  console.error(failures);
  process.exit(1);
} else {
  console.log('\n✓ ALL ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY (0 FAILURES).');
  process.exit(0);
}
