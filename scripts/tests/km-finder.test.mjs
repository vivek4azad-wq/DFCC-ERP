/**
 * Suite 3: Km Quick Finder Query Engine Test Suite
 * Tests chainage boundary queries across Main Line (1167.210 - 1249.720) and Link Line (6.169 Km).
 */

import assert from 'node:assert/strict';
import { loadSeedData, searchKmRange, parseChainage } from './test-helper.mjs';

/**
 * Runs all Km Quick Finder tests.
 * @param {object} [options]
 * @returns {Promise<{ name: string, total: number, passed: number, failed: number, errors: Array<{ test: string, error: any }> }>}
 */
export async function runKmFinderTests(options = {}) {
  const suiteName = 'Km Quick Finder & Chainage Boundary Engine';
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
  // 1. EXACT POINT & WINDOW QUERIES
  // -------------------------------------------------------------------------

  test('Exact Point Lookup: Query at Km 1215.034 returns Level Crossing LC-151C', () => {
    const hits = searchKmRange({ fromKm: 1215.034, toKm: 1215.034, line: 'MAIN' }, data);
    assert.ok(hits.length > 0, 'Expected at least 1 hit at Km 1215.034');
    const lc = hits.find(item => item.id === 'LC-151C');
    assert.ok(lc, 'LC-151C must be returned at Km 1215.034');
    assert.equal(lc.assetCategory, 'Level Crossing');
  });

  test('Window Range Query: Km 1170.000 to Km 1172.000 returns all matching assets', () => {
    const hits = searchKmRange({ fromKm: 1170.000, toKm: 1172.000, line: 'MAIN' }, data);
    assert.ok(hits.length >= 5, `Expected >=5 assets in Km 1170-1172 window, got ${hits.length}`);

    // Verify all returned assets are within window (or overlap window)
    for (const h of hits) {
      const start = h.startKm ?? h.km;
      const end = h.endKm ?? h.km;
      assert.ok(
        start <= 1172.001 && end >= 1169.999,
        `Asset ${h.id} (${start}-${end}) is outside requested window 1170-1172`
      );
    }
  });

  test('Full Corridor Query: Km 1167.210 to Km 1249.720 returns Main Line inventory', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, line: 'MAIN' }, data);
    assert.ok(hits.length >= 350, `Expected comprehensive asset set, got ${hits.length}`);
  });

  // -------------------------------------------------------------------------
  // 2. BOUNDARY CONDITIONS & EDGE CHECKS
  // -------------------------------------------------------------------------

  test('Lower Boundary: Km 1167.210 boundary returns start assets (Curve 315 & Major Bridge 1)', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1168.000, line: 'MAIN' }, data);
    assert.ok(hits.length > 0, 'Should find assets in first 800m');
    const crv315 = hits.find(h => h.id === 'CRV-315');
    assert.ok(crv315, 'CRV-315 (starts at 1167.627) should be present');
    const brg1 = hits.find(h => h.id === 'BRG-MJB-001');
    assert.ok(brg1, 'BRG-MJB-001 (at 1167.747) should be present');
  });

  test('Upper Boundary: Km 1249.720 boundary returns end assets (LC-167C & end curves)', () => {
    const hits = searchKmRange({ fromKm: 1245.000, toKm: 1249.720, line: 'MAIN' }, data);
    assert.ok(hits.length > 0, 'Should find assets near end of jurisdiction');
    const lc167 = hits.find(h => h.id === 'LC-167C');
    assert.ok(lc167, 'LC-167C (at 1248.664) should be present');
  });

  test('Section Specific: SMUN-SBJN section (1170.435 to 1188.575) returns section assets', () => {
    const hits = searchKmRange({ fromKm: 1170.435, toKm: 1188.575, line: 'MAIN' }, data);
    assert.ok(hits.length >= 50, `Expected >=50 assets in SMUN-SBJN block section, got ${hits.length}`);
  });

  // -------------------------------------------------------------------------
  // 3. INVERTED INTERVAL AUTO-NORMALIZATION
  // -------------------------------------------------------------------------

  test('Inverted Range: fromKm: 1200.000, toKm: 1190.000 normalizes and returns identical results as [1190, 1200]', () => {
    const normalHits = searchKmRange({ fromKm: 1190.000, toKm: 1200.000, line: 'MAIN' }, data);
    const invertedHits = searchKmRange({ fromKm: 1200.000, toKm: 1190.000, line: 'MAIN' }, data);

    assert.equal(invertedHits.length, normalHits.length, 'Inverted query should return same number of hits');
    const normalIds = normalHits.map(h => h.id).sort();
    const invertedIds = invertedHits.map(h => h.id).sort();
    assert.deepEqual(invertedIds, normalIds, 'Asset IDs returned by inverted query must match normal query');
  });

  // -------------------------------------------------------------------------
  // 4. LINK LINE ISOLATION & FILTERING
  // -------------------------------------------------------------------------

  test('Link Line Isolation: line: "LINK" on 1172.000 - 1178.000 returns only Link Line assets', () => {
    const linkHits = searchKmRange({ fromKm: 1172.000, toKm: 1178.000, line: 'LINK' }, data);
    assert.ok(linkHits.length > 0, 'Link query should find link line assets');

    for (const h of linkHits) {
      if (h.assetCategory === 'Curve') {
        assert.ok(h.curveNo >= 397 && h.curveNo <= 409, `Curve ${h.id} is not a link line curve`);
      } else if (h.assetCategory === 'Bridge') {
        assert.equal(h.sectionCode, 'SMUN-RPJ', `Bridge ${h.id} is not on SMUN-RPJ link line`);
      }
    }
  });

  test('Main Line Isolation: line: "MAIN" excludes Link Line curves (Nos 397-409)', () => {
    const mainHits = searchKmRange({ fromKm: 1172.000, toKm: 1178.000, line: 'MAIN' }, data);
    assert.ok(mainHits.length > 0, 'Main query should find main line assets');

    for (const h of mainHits) {
      if (h.assetCategory === 'Curve') {
        assert.ok(h.curveNo < 397, `Link curve ${h.id} leaked into Main Line query`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // 5. CATEGORY FILTERING & MULTI-ASSET DISPATCH
  // -------------------------------------------------------------------------

  test('Category Filter: category: "Bridge" returns ONLY bridges', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, category: 'Bridge', line: 'ALL' }, data);
    assert.equal(hits.length, 144, `Expected all 144 bridges, got ${hits.length}`);
    assert.ok(hits.every(h => h.assetCategory === 'Bridge'));
  });

  test('Category Filter: category: "Curve" returns ONLY curves', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, category: 'Curve', line: 'ALL' }, data);
    assert.equal(hits.length, 95, `Expected all 95 curves, got ${hits.length}`);
    assert.ok(hits.every(h => h.assetCategory === 'Curve'));
  });

  test('Category Filter: category: "Level Crossing" returns ONLY 5 LCs', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, category: 'Level Crossing', line: 'ALL' }, data);
    assert.equal(hits.length, 5, `Expected all 5 LCs, got ${hits.length}`);
    assert.ok(hits.every(h => h.assetCategory === 'Level Crossing'));
  });

  test('Category Filter: category: "Point & Crossing" returns ONLY 161 turnouts', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, category: 'Point & Crossing', line: 'ALL' }, data);
    assert.equal(hits.length, 161, `Expected all 161 turnouts, got ${hits.length}`);
    assert.ok(hits.every(h => h.assetCategory === 'Point & Crossing'));
  });

  test('Category Filter: category: "Track Defect" returns ONLY 48 defects', () => {
    const hits = searchKmRange({ fromKm: 1167.210, toKm: 1249.720, category: 'Track Defect', line: 'ALL' }, data);
    assert.equal(hits.length, 48, `Expected all 48 defects, got ${hits.length}`);
    assert.ok(hits.every(h => h.assetCategory === 'Track Defect'));
  });

  // -------------------------------------------------------------------------
  // 6. INTERVAL OVERLAP & SPATIAL PRECISION
  // -------------------------------------------------------------------------

  test('Interval Overlap: Partial curve overlap (Curve from 1174.826 to 1175.167) is returned for range 1175.000 to 1176.000', () => {
    const hits = searchKmRange({ fromKm: 1175.000, toKm: 1176.000, category: 'Curve', line: 'MAIN' }, data);
    const crv321 = hits.find(h => h.id === 'CRV-321');
    assert.ok(crv321, 'Curve CRV-321 spanning 1174.826-1175.167 must match query 1175.000-1176.000');
  });

  test('Out of Bounds: Chainages far outside jurisdiction (Km 1000 to 1100) return empty array []', () => {
    const hits = searchKmRange({ fromKm: 1000.000, toKm: 1100.000, line: 'ALL' }, data);
    assert.equal(hits.length, 0, 'Out of bounds query must return 0 results');
  });

  // -------------------------------------------------------------------------
  // 7. CHAINAGE STRING FORMAT PARSING
  // -------------------------------------------------------------------------

  test('Chainage Parser: Handles "1167.210", "1167+210", "1167/2", and numeric floats', () => {
    assert.equal(parseChainage('1167.210'), 1167.21);
    assert.equal(parseChainage('1167+210'), 1167.21);
    assert.equal(parseChainage(1215.034), 1215.034);
    assert.ok(typeof parseChainage('1167/2') === 'number');
    assert.equal(parseChainage('invalid'), null);
    assert.equal(parseChainage(''), null);
  });

  return results;
}

// Direct execution support via node scripts/tests/km-finder.test.mjs
if (process.argv[1] && process.argv[1].endsWith('km-finder.test.mjs')) {
  runKmFinderTests().then(res => {
    console.log(`[Suite 3] ${res.name}: ${res.passed}/${res.total} passed`);
    if (res.failed > 0) {
      console.error('Failures:', res.errors);
      process.exit(1);
    }
  });
}
