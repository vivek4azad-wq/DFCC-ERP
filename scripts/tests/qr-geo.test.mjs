/**
 * Suite 4: Personal QR Code & GPS Geolocation Engine Test Suite
 * Tests staff QR payload formatting/parsing and GPS coordinates geofencing & Google Maps / geo: URI generation.
 */

import assert from 'node:assert/strict';
import {
  loadSeedData,
  generateStaffQRPayload,
  parseStaffQRPayload,
  validateCoordinates,
  buildNavigationUri,
  buildGeoUri,
  CORRIDOR_BOUNDS
} from './test-helper.mjs';

/**
 * Runs all QR and GPS tests.
 * @param {object} [options]
 * @returns {Promise<{ name: string, total: number, passed: number, failed: number, errors: Array<{ test: string, error: any }> }>}
 */
export async function runQrGeoTests(options = {}) {
  const suiteName = 'Personal QR Code & GPS Geolocation Engine';
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
  // 1. PERSONAL QR CODE PAYLOAD FORMATTING & SERIALIZATION
  // -------------------------------------------------------------------------

  test('QR Serialization: Generates valid JSON payload with required attributes for Super Admin STF-001', () => {
    const adminStaff = data.officers_staff.find(s => s.id === 'STF-001');
    assert.ok(adminStaff, 'STF-001 must exist');

    const qrString = generateStaffQRPayload(adminStaff);
    assert.ok(typeof qrString === 'string', 'QR payload must be a string');

    const parsed = JSON.parse(qrString);
    assert.equal(parsed.app, 'RailDiary-DFCCIL', 'app identifier must match');
    assert.equal(parsed.ver, '1.0', 'version must be 1.0');
    assert.equal(parsed.staffId, 'STF-001', 'staffId must match');
    assert.equal(parsed.name, 'Shri Vivek Kumar Azad', 'name must match');
    assert.equal(parsed.role, 'SUPER_ADMIN', 'role must match');
    assert.equal(parsed.designation, 'APM / Civil', 'designation must match');
    assert.equal(parsed.phone, '+91-9717631984', 'phone must match');
  });

  test('QR Serialization: Outsourced staff member STF-014 preserves AWPO ID and outsourced status', () => {
    const outsourcedStaff = data.officers_staff.find(s => s.id === 'STF-014');
    assert.ok(outsourcedStaff, 'STF-014 must exist');

    const qrString = generateStaffQRPayload(outsourcedStaff);
    const parsed = JSON.parse(qrString);
    assert.equal(parsed.employmentType, 'OUTSOURCED');
    assert.equal(parsed.awpoId, 'AWPO-SMUN-801');
  });

  test('QR Roundtrip Parsing: parseStaffQRPayload restores all employee attributes without loss', () => {
    for (const stf of data.officers_staff) {
      const serialized = generateStaffQRPayload(stf);
      const deserialized = parseStaffQRPayload(serialized);

      assert.equal(deserialized.staffId, stf.id);
      assert.equal(deserialized.name, stf.name);
      assert.equal(deserialized.role, stf.role);
    }
  });

  test('QR Special Characters: Safely encodes and decodes titles with slashes, brackets, and quotes', () => {
    const mockStaff = {
      id: 'STF-MOCK-999',
      name: 'Dr. John "The Engineer" O\'Connor (Consultant)',
      post: 'Sr. Consultant / P-Way & S&T (Specialist)',
      role: 'OFFICER',
      unit: 'IMSD SMUN / Ambala',
      phone: '+91-9999999999'
    };

    const serialized = generateStaffQRPayload(mockStaff);
    const deserialized = parseStaffQRPayload(serialized);

    assert.equal(deserialized.name, mockStaff.name);
    assert.equal(deserialized.designation, mockStaff.post);
    assert.equal(deserialized.unit, mockStaff.unit);
  });

  test('QR Error Handling: Throws error on malformed or corrupted payloads', () => {
    assert.throws(() => parseStaffQRPayload(''), /Empty QR code/);
    assert.throws(() => parseStaffQRPayload('NOT_A_JSON_STRING'), /Failed to parse/);
    assert.throws(() => parseStaffQRPayload(JSON.stringify({ app: 'DifferentApp' })), /Unrecognized app signature/);
    assert.throws(() => parseStaffQRPayload(JSON.stringify({ app: 'RailDiary-DFCCIL' })), /Missing mandatory/);
  });

  // -------------------------------------------------------------------------
  // 2. GPS COORDINATES COMPLETENESS & GEOFENCING
  // -------------------------------------------------------------------------

  test('GPS Completeness: 100% of physical track assets have numeric latitude & longitude', () => {
    const collections = [
      { name: 'bridges', items: data.bridges },
      { name: 'curves', items: data.curves },
      { name: 'level_crossings', items: data.level_crossings },
      { name: 'points_crossings', items: data.points_crossings },
      { name: 'track_defects', items: data.track_defects }
    ];

    let totalAssetsChecked = 0;
    for (const col of collections) {
      for (const item of col.items) {
        totalAssetsChecked++;
        assert.ok(
          typeof item.latitude === 'number' && Number.isFinite(item.latitude),
          `Asset ${item.id} in ${col.name} has missing/invalid latitude: ${item.latitude}`
        );
        assert.ok(
          typeof item.longitude === 'number' && Number.isFinite(item.longitude),
          `Asset ${item.id} in ${col.name} has missing/invalid longitude: ${item.longitude}`
        );
      }
    }
    assert.equal(totalAssetsChecked, 144 + 95 + 5 + 161 + 48, 'Checked exactly 453 spatial assets');
  });

  test('GPS Geofencing: All 453 spatial assets fall within the DFCCIL IMSD SMUN bounding box', () => {
    const allSpatialAssets = [
      ...data.bridges,
      ...data.curves,
      ...data.level_crossings,
      ...data.points_crossings,
      ...data.track_defects
    ];

    for (const item of allSpatialAssets) {
      const isValid = validateCoordinates(item.latitude, item.longitude);
      assert.ok(
        isValid,
        `Asset ${item.id} coords (${item.latitude}, ${item.longitude}) are outside corridor bounding box: Lat [${CORRIDOR_BOUNDS.minLat}, ${CORRIDOR_BOUNDS.maxLat}], Lon [${CORRIDOR_BOUNDS.minLon}, ${CORRIDOR_BOUNDS.maxLon}]`
      );
    }
  });

  // -------------------------------------------------------------------------
  // 3. NAVIGATION ROUTE & INTENT URI BUILDERS
  // -------------------------------------------------------------------------

  test('Navigation URI: buildNavigationUri generates valid Google Maps external directions URL', () => {
    const bridge = data.bridges[0];
    const url = buildNavigationUri(bridge.latitude, bridge.longitude, bridge.bridgeNo);

    assert.ok(url.startsWith('https://www.google.com/maps/dir/?api=1'), 'Must start with Google Maps directions API');
    assert.ok(url.includes(`destination=${bridge.latitude},${bridge.longitude}`), 'Must include destination coordinates');
    assert.ok(url.includes('destination_place_id='), 'Must include encoded place label');
  });

  test('Geo Intent URI: buildGeoUri generates Android native geo: intent URI', () => {
    const lc = data.level_crossings[0];
    const geoUri = buildGeoUri(lc.latitude, lc.longitude, lc.gateNo);

    assert.ok(geoUri.startsWith(`geo:${lc.latitude},${lc.longitude}`), 'Must start with geo:lat,lon');
    assert.ok(geoUri.includes(`?q=${lc.latitude},${lc.longitude}`), 'Must include query coordinates');
  });

  test('Geo Builders: Parameter escaping for labels with special characters & spaces', () => {
    const specialTitle = 'Bridge & Culvert #104 / Ghaggar (Major)';
    const url = buildNavigationUri(30.368541, 76.658214, specialTitle);
    assert.ok(!url.includes(' '), 'Generated URL must not contain unescaped spaces');
    assert.ok(url.includes(encodeURIComponent(specialTitle)), 'Label must be safely URI encoded');
  });

  test('Coordinate Validator: Accurately flags invalid / NaN / out-of-range coordinates', () => {
    assert.equal(validateCoordinates(30.3442, 76.7121), true, 'Valid SMUN coordinate');
    assert.equal(validateCoordinates(0, 0), false, 'Null island (0, 0) should be invalid');
    assert.equal(validateCoordinates(NaN, 76.7121), false, 'NaN latitude should be invalid');
    assert.equal(validateCoordinates(30.3442, Infinity), false, 'Infinity longitude should be invalid');
    assert.equal(validateCoordinates(55.0, 76.0), false, 'Out of bounds latitude should be invalid');
  });

  return results;
}

// Direct execution support via node scripts/tests/qr-geo.test.mjs
if (process.argv[1] && process.argv[1].endsWith('qr-geo.test.mjs')) {
  runQrGeoTests().then(res => {
    console.log(`[Suite 4] ${res.name}: ${res.passed}/${res.total} passed`);
    if (res.failed > 0) {
      console.error('Failures:', res.errors);
      process.exit(1);
    }
  });
}
