/**
 * Suite 5: Interactive Analytics Data Aggregation Test Suite
 * Tests aggregation formulas for staff by designation, asset counts, defect density per 10km block, and patrol shift occupancy.
 */

import assert from 'node:assert/strict';
import {
  loadSeedData,
  aggregateStaffByDesignation,
  aggregateAssetCounts,
  aggregateDefectsByKmBlock,
  aggregatePatrolShiftStatus
} from './test-helper.mjs';

/**
 * Runs all Analytics aggregation tests.
 * @param {object} [options]
 * @returns {Promise<{ name: string, total: number, passed: number, failed: number, errors: Array<{ test: string, error: any }> }>}
 */
export async function runAnalyticsTests(options = {}) {
  const suiteName = 'Interactive Analytics Data Aggregation Engine';
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
  // 1. STAFF DISTRIBUTION BY DESIGNATION
  // -------------------------------------------------------------------------

  test('Staff Aggregation: Designation distribution sums to valid staff count (>= 14)', () => {
    const summary = aggregateStaffByDesignation(data.officers_staff);
    assert.ok(typeof summary === 'object', 'Summary should be an object');

    const totalCount = Object.values(summary).reduce((a, b) => a + b, 0);
    assert.ok(totalCount >= 14, `Expected staff counts >= 14, got ${totalCount}`);
  });

  test('Staff Aggregation: Contains APM leadership role', () => {
    const summary = aggregateStaffByDesignation(data.officers_staff);
    const hasApm = Object.keys(summary).some(k => k.includes('APM') || k.includes('Assistant Project Manager'));
    assert.ok(hasApm, 'Expected APM in staff summary');
  });

  // -------------------------------------------------------------------------
  // 2. INFRASTRUCTURE ASSET INVENTORY AGGREGATION
  // -------------------------------------------------------------------------

  test('Asset Inventory: Category counts sum to EXACTLY 405 total physical assets', () => {
    const summary = aggregateAssetCounts({
      bridges: data.bridges,
      curves: data.curves,
      levelCrossings: data.level_crossings,
      pointsCrossings: data.points_crossings
    });

    assert.equal(summary.bridges, 144, 'Expected 144 bridges');
    assert.equal(summary.curves, 95, 'Expected 95 curves');
    assert.equal(summary.levelCrossings, 5, 'Expected 5 level crossings');
    assert.equal(summary.pointsCrossings, 161, 'Expected 161 points & crossings');
    assert.equal(summary.totalAssets, 405, `Expected 405 total assets, got ${summary.totalAssets}`);
  });

  test('Bridge Subtypes: Breakdown matches 18 Major, 74 Minor, 37 RUB, 9 ROB, 6 FOB (Total = 144)', () => {
    const summary = aggregateAssetCounts({ bridges: data.bridges });
    const subtypes = summary.bridgeSubtypes;

    assert.equal(subtypes.major, 18, `Expected 18 Major bridges, got ${subtypes.major}`);
    assert.equal(subtypes.minor, 74, `Expected 74 Minor bridges, got ${subtypes.minor}`);
    assert.equal(subtypes.rub, 37, `Expected 37 RUBs, got ${subtypes.rub}`);
    assert.equal(subtypes.rob, 9, `Expected 9 ROBs, got ${subtypes.rob}`);
    assert.equal(subtypes.fob, 6, `Expected 6 FOBs, got ${subtypes.fob}`);
    assert.equal(subtypes.total, 144, 'Total bridges must equal 144');
  });

  // -------------------------------------------------------------------------
  // 3. TRACK DEFECT 10-KM HISTOGRAM BINS
  // -------------------------------------------------------------------------

  test('Defect Density: 10-km section histogram counts sum to EXACTLY 48 defects', () => {
    const blocks = aggregateDefectsByKmBlock(data.track_defects);
    assert.equal(blocks.length, 9, 'Expected 8 Main Line 10-km blocks + 1 Link Line block');

    const totalDefects = blocks.reduce((sum, b) => sum + b.count, 0);
    assert.equal(totalDefects, 48, `Expected sum of binned defects to equal 48, got ${totalDefects}`);
  });

  test('Defect Density: Each block has valid chainage labels and non-negative counts', () => {
    const blocks = aggregateDefectsByKmBlock(data.track_defects);
    for (const b of blocks) {
      assert.ok(b.label && typeof b.label === 'string', 'Block label missing');
      assert.ok(typeof b.count === 'number' && b.count >= 0, `Invalid defect count in block: ${b.label}`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. PATROL SHIFT OCCUPANCY
  // -------------------------------------------------------------------------

  test('Patrol Shift Occupancy: 20 filled shifts + 4 vacant shifts = 24 total (83.33% fill rate)', () => {
    const status = aggregatePatrolShiftStatus(data.patrol_shifts);

    assert.equal(status.filled, 20, `Expected 20 filled shifts, got ${status.filled}`);
    assert.equal(status.vacant, 4, `Expected 4 vacant shifts, got ${status.vacant}`);
    assert.equal(status.total, 24, `Expected 24 total shifts, got ${status.total}`);
    assert.equal(status.fillPercentage, 83.33, `Expected 83.33% fill rate, got ${status.fillPercentage}`);
  });

  // -------------------------------------------------------------------------
  // 5. EDGE CASES & ZERO-DIVISION GUARDS
  // -------------------------------------------------------------------------

  test('Analytics Edge Case: Empty input arrays return clean zeroed summaries without NaN or crashing', () => {
    const emptyStaff = aggregateStaffByDesignation([]);
    assert.deepEqual(emptyStaff, {});

    const emptyAssets = aggregateAssetCounts({ bridges: [], curves: [], levelCrossings: [], pointsCrossings: [] });
    assert.equal(emptyAssets.totalAssets, 0);
    assert.equal(emptyAssets.bridgeSubtypes.total, 0);

    const emptyDefects = aggregateDefectsByKmBlock([]);
    assert.equal(emptyDefects.reduce((s, b) => s + b.count, 0), 0);

    const emptyShifts = aggregatePatrolShiftStatus([]);
    assert.equal(emptyShifts.filled, 0);
    assert.equal(emptyShifts.vacant, 0);
    assert.equal(emptyShifts.fillPercentage, 0);
    assert.ok(!Number.isNaN(emptyShifts.fillPercentage), 'fillPercentage must not be NaN');
  });

  return results;
}

// Direct execution support via node scripts/tests/analytics.test.mjs
if (process.argv[1] && process.argv[1].endsWith('analytics.test.mjs')) {
  runAnalyticsTests().then(res => {
    console.log(`[Suite 5] ${res.name}: ${res.passed}/${res.total} passed`);
    if (res.failed > 0) {
      console.error('Failures:', res.errors);
      process.exit(1);
    }
  });
}
