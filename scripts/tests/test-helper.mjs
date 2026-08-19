/**
 * Test Helper & Domain Reference Logic for Rail Diary ERP Verification
 * Zero-dependency pure ES module with assertions, data loader, and domain engines.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, '../..');

/**
 * ---------------------------------------------------------------------------
 * 1. Seed Data Loader
 * ---------------------------------------------------------------------------
 */
export function loadSeedData() {
  const possiblePaths = [
    path.join(rootDir, 'scripts/seed-data.json'),
    path.join(rootDir, 'src/data/seed-data.json'),
    path.join(rootDir, 'src/data/seedData.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed;
      } catch (err) {
        console.error(`Failed to parse seed data at ${p}:`, err);
      }
    }
  }

  throw new Error(`Could not find seed-data.json in any expected location: ${possiblePaths.join(', ')}`);
}

/**
 * ---------------------------------------------------------------------------
 * 2. RBAC Permission Matrix & Guard Logic
 * ---------------------------------------------------------------------------
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OFFICER: 'OFFICER',
  STAFF: 'STAFF'
};

export const ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ADMIN_PANEL: 'ADMIN_PANEL',
  GENERATE_PIN: 'GENERATE_PIN',
  GENERATE_QR: 'GENERATE_QR'
};

/**
 * Evaluates whether a role can perform an action on a target resource.
 * @param {string} role - 'SUPER_ADMIN' | 'OFFICER' | 'STAFF'
 * @param {string} action - 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ADMIN_PANEL' | 'GENERATE_PIN' | 'GENERATE_QR'
 * @param {string} resource - collection name or feature area
 * @param {object} [context] - optional context (e.g. payload for mutation)
 * @returns {boolean}
 */
export function canPerform(role, action, resource, context = null) {
  if (!role || !action || !resource) return false;
  if (!['SUPER_ADMIN', 'OFFICER', 'STAFF'].includes(role)) return false;

  // SUPER_ADMIN has full permissions across all resources and actions
  if (role === 'SUPER_ADMIN') {
    return true;
  }

  // OFFICER Permissions
  if (role === 'OFFICER') {
    if (action === 'READ') return true;
    if (action === 'GENERATE_QR') return true;

    // Officer can create/edit track assets, defects, inspection records
    if (['CREATE', 'UPDATE'].includes(action)) {
      const allowedMutationResources = [
        'bridges',
        'level_crossings',
        'points_crossings',
        'curves',
        'track_defects',
        'patrol_shifts',
        'inspections',
        'materials'
      ];
      if (allowedMutationResources.includes(resource)) {
        return true;
      }
      // Officers cannot mutate user accounts or jurisdiction
      return false;
    }

    // Officers are STRICTLY BLOCKED from DELETE, ADMIN_PANEL, GENERATE_PIN
    if (action === 'DELETE') return false;
    if (action === 'ADMIN_PANEL') return false;
    if (action === 'GENERATE_PIN') return false;
    return false;
  }

  // STAFF Permissions
  if (role === 'STAFF') {
    if (action === 'READ') {
      // Staff can read assets, rosters, directories, jurisdiction
      const allowedReadResources = [
        'bridges',
        'level_crossings',
        'points_crossings',
        'curves',
        'track_defects',
        'officers_staff',
        'keymen',
        'patrol_shifts',
        'jurisdiction'
      ];
      return allowedReadResources.includes(resource);
    }

    // Staff cannot perform any mutations, deletions, or admin capabilities
    return false;
  }

  return false;
}

/**
 * ---------------------------------------------------------------------------
 * 3. Km Chainage Parser & Quick Finder Search Engine
 * ---------------------------------------------------------------------------
 */

/**
 * Parses chainage formats into numeric kilometers (e.g. "1167.210", "1167/2", "1167+210", 1167.21)
 * @param {string|number} input
 * @returns {number|null}
 */
export function parseChainage(input) {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Format 1: "1167+210" or "1167 + 210" (Km + meters)
  if (trimmed.includes('+')) {
    const parts = trimmed.split('+').map(p => p.trim());
    if (parts.length === 2) {
      const km = parseFloat(parts[0]);
      const m = parseFloat(parts[1]);
      if (!isNaN(km) && !isNaN(m)) {
        return Number((km + m / 1000).toFixed(3));
      }
    }
  }

  // Format 2: "1167/2" or "1167 / 2" (Km / Telegraph Post or 100m interval)
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => p.trim());
    if (parts.length === 2) {
      const km = parseFloat(parts[0]);
      const tp = parseFloat(parts[1]);
      if (!isNaN(km) && !isNaN(tp)) {
        return Number((km + tp * 0.05).toFixed(3)); // approximate or decimal offset
      }
    }
  }

  // Format 3: Direct float string "1167.210" or "1167.21"
  const val = parseFloat(trimmed);
  return !isNaN(val) ? Number(val.toFixed(3)) : null;
}

/**
 * Searches assets across chainage boundaries.
 * @param {object} options
 * @param {number} options.fromKm
 * @param {number} options.toKm
 * @param {'ALL'|'MAIN'|'LINK'} [options.line='ALL']
 * @param {string} [options.category='ALL']
 * @param {object} seedData
 * @returns {Array<object>}
 */
export function searchKmRange({ fromKm, toKm, line = 'ALL', category = 'ALL' }, seedData) {
  if (fromKm === undefined || toKm === undefined) return [];
  if (!seedData) return [];

  // Auto-normalize inverted interval
  const start = Math.min(Number(fromKm), Number(toKm));
  const end = Math.max(Number(fromKm), Number(toKm));
  const EPSILON = 0.001; // 1 meter tolerance for float comparisons

  const results = [];

  // Helper to check line filter
  const matchLine = (itemLine, itemSection) => {
    if (line === 'ALL') return true;
    const isLink = itemLine === 'LINK_LINE' || itemLine === 'LINK' || (itemSection && itemSection.includes('RPJ'));
    if (line === 'LINK') return isLink;
    if (line === 'MAIN') return !isLink;
    return true;
  };

  // Helper to check category filter
  const matchCategory = (cat) => {
    if (category === 'ALL') return true;
    return cat.toLowerCase() === category.toLowerCase();
  };

  // 1. Bridges (Point / Span)
  if (matchCategory('Bridge') || matchCategory('bridges')) {
    for (const b of seedData.bridges || []) {
      if (matchLine(b.sectionCode === 'SMUN-RPJ' ? 'LINK' : 'MAIN', b.sectionCode)) {
        if (b.km >= start - EPSILON && b.km <= end + EPSILON) {
          results.push({ ...b, assetCategory: 'Bridge', startKm: b.km, endKm: b.km });
        }
      }
    }
  }

  // 2. Curves (Interval fromKm to toKm)
  if (matchCategory('Curve') || matchCategory('curves')) {
    for (const c of seedData.curves || []) {
      const isLinkCurve = c.curveNo >= 397 && c.curveNo <= 409;
      if (matchLine(isLinkCurve ? 'LINK' : 'MAIN', isLinkCurve ? 'SMUN-RPJ' : '')) {
        // Interval overlap test: max(start1, start2) <= min(end1, end2)
        const overlapStart = Math.max(c.fromKm, start);
        const overlapEnd = Math.min(c.toKm, end);
        if (overlapStart <= overlapEnd + EPSILON) {
          results.push({ ...c, assetCategory: 'Curve', startKm: c.fromKm, endKm: c.toKm });
        }
      }
    }
  }

  // 3. Level Crossings (Point)
  if (matchCategory('Level Crossing') || matchCategory('level_crossings')) {
    for (const lc of seedData.level_crossings || []) {
      if (matchLine(lc.sectionCode === 'SMUN-RPJ' ? 'LINK' : 'MAIN', lc.sectionCode)) {
        if (lc.km >= start - EPSILON && lc.km <= end + EPSILON) {
          results.push({ ...lc, assetCategory: 'Level Crossing', startKm: lc.km, endKm: lc.km });
        }
      }
    }
  }

  // 4. Points & Crossings (Point)
  if (matchCategory('Point & Crossing') || matchCategory('points_crossings')) {
    for (const pc of seedData.points_crossings || []) {
      if (matchLine('MAIN', pc.station)) {
        if (pc.km >= start - EPSILON && pc.km <= end + EPSILON) {
          results.push({ ...pc, assetCategory: 'Point & Crossing', startKm: pc.km, endKm: pc.km });
        }
      }
    }
  }

  // 5. Track Defects (Point)
  if (matchCategory('Track Defect') || matchCategory('track_defects')) {
    for (const d of seedData.track_defects || []) {
      if (matchLine(d.sectionCode === 'SMUN-RPJ' ? 'LINK' : 'MAIN', d.sectionCode)) {
        if (d.km >= start - EPSILON && d.km <= end + EPSILON) {
          results.push({ ...d, assetCategory: 'Track Defect', startKm: d.km, endKm: d.km });
        }
      }
    }
  }

  return results;
}

/**
 * ---------------------------------------------------------------------------
 * 4. Personal QR Code Generator & Deserializer
 * ---------------------------------------------------------------------------
 */

/**
 * Serializes staff profile into standardized QR code payload string.
 * @param {object} staff
 * @returns {string}
 */
export function generateStaffQRPayload(staff) {
  if (!staff || !staff.id) {
    throw new Error('Invalid staff record provided for QR generation');
  }

  const payload = {
    app: 'RailDiary-DFCCIL',
    ver: '1.0',
    qrId: staff.qrCodeId || `AG-STAFF-${staff.id}`,
    staffId: staff.id,
    name: staff.name || '',
    designation: staff.post || staff.designation || '',
    role: staff.role || 'STAFF',
    unit: staff.unit || 'IMSD SMUN',
    section: staff.assignedSection || staff.posting || 'SMUN Jurisdiction',
    phone: staff.phone || staff.contactNo || '',
    email: staff.email || '',
    bloodGroup: staff.bloodGroup || null,
    awpoId: staff.awpoId || null,
    employmentType: staff.employmentType || 'REGULAR'
  };

  return JSON.stringify(payload);
}

/**
 * Parses and verifies a staff QR payload string.
 * @param {string} rawString
 * @returns {object}
 */
export function parseStaffQRPayload(rawString) {
  if (typeof rawString !== 'string' || !rawString.trim()) {
    throw new Error('Empty QR code payload string');
  }

  try {
    const data = JSON.parse(rawString);
    if (data.app !== 'RailDiary-DFCCIL') {
      throw new Error(`Unrecognized app signature in QR payload: ${data.app}`);
    }
    if (!data.staffId || !data.name || !data.designation) {
      throw new Error('Missing mandatory employee fields in QR payload');
    }
    return data;
  } catch (err) {
    throw new Error(`Failed to parse staff QR payload: ${err.message}`);
  }
}

/**
 * ---------------------------------------------------------------------------
 * 5. GPS Geolocation & Navigation URL Builder
 * ---------------------------------------------------------------------------
 */

export const CORRIDOR_BOUNDS = {
  minLat: 29.5000,
  maxLat: 31.5000,
  minLon: 75.8000,
  maxLon: 78.0000
};

/**
 * Checks whether coordinates lie within the IMSD SMUN corridor geofence.
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
export function validateCoordinates(lat, lon) {
  if (lat === null || lon === null || lat === undefined || lon === undefined) return false;
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return (
    lat >= CORRIDOR_BOUNDS.minLat &&
    lat <= CORRIDOR_BOUNDS.maxLat &&
    lon >= CORRIDOR_BOUNDS.minLon &&
    lon <= CORRIDOR_BOUNDS.maxLon
  );
}

/**
 * Generates an external Google Maps directions URL.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [title]
 * @returns {string}
 */
export function buildNavigationUri(lat, lon, title = '') {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid navigation coordinates: lat=${lat}, lon=${lon}`);
  }
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';
  const dest = `&destination=${lat},${lon}`;
  const label = title ? `&destination_place_id=${encodeURIComponent(title)}` : '';
  return `${baseUrl}${dest}${label}`;
}

/**
 * Generates an Android `geo:` intent URI.
 * @param {number} lat
 * @param {number} lon
 * @param {string} [label]
 * @returns {string}
 */
export function buildGeoUri(lat, lon, label = '') {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid geo coordinates: lat=${lat}, lon=${lon}`);
  }
  const q = label ? `${lat},${lon}(${encodeURIComponent(label)})` : `${lat},${lon}`;
  return `geo:${lat},${lon}?q=${q}`;
}

/**
 * ---------------------------------------------------------------------------
 * 6. Interactive Analytics Aggregations
 * ---------------------------------------------------------------------------
 */

/**
 * Groups officers and staff by designation.
 * @param {Array<object>} staffList
 * @returns {Record<string, number>}
 */
export function aggregateStaffByDesignation(staffList = []) {
  const counts = {};
  for (const s of staffList) {
    const des = s.post || s.designation || 'Unassigned';
    counts[des] = (counts[des] || 0) + 1;
  }
  return counts;
}

/**
 * Aggregates counts across asset collections.
 * @param {object} collections
 * @returns {object}
 */
export function aggregateAssetCounts({ bridges = [], curves = [], levelCrossings = [], pointsCrossings = [] } = {}) {
  const bridgeCounts = {
    major: 0,
    minor: 0,
    rub: 0,
    rob: 0,
    fob: 0,
    total: bridges.length
  };

  for (const b of bridges) {
    const cat = (b.category || '').toUpperCase();
    if (cat === 'MAJOR' || b.bridgeType === 'MJB' || b.bridgeType === 'OWG') bridgeCounts.major++;
    else if (cat === 'MINOR' || b.bridgeType === 'MIB') bridgeCounts.minor++;
    else if (cat === 'RUB') bridgeCounts.rub++;
    else if (cat === 'ROB') bridgeCounts.rob++;
    else if (cat === 'FOB') bridgeCounts.fob++;
  }

  return {
    bridges: bridges.length,
    curves: curves.length,
    levelCrossings: levelCrossings.length,
    pointsCrossings: pointsCrossings.length,
    bridgeSubtypes: bridgeCounts,
    totalAssets: bridges.length + curves.length + levelCrossings.length + pointsCrossings.length
  };
}

/**
 * Bins track defects into 10-km chainage intervals + Link line.
 * @param {Array<object>} defects
 * @returns {Array<{ label: string, count: number, fromKm: number, toKm: number }>}
 */
export function aggregateDefectsByKmBlock(defects = []) {
  const blocks = [
    { label: 'Km 1167.210 – 1180.000', fromKm: 1167.210, toKm: 1180.000, isLink: false, count: 0 },
    { label: 'Km 1180.001 – 1190.000', fromKm: 1180.001, toKm: 1190.000, isLink: false, count: 0 },
    { label: 'Km 1190.001 – 1200.000', fromKm: 1190.001, toKm: 1200.000, isLink: false, count: 0 },
    { label: 'Km 1200.001 – 1210.000', fromKm: 1200.001, toKm: 1210.000, isLink: false, count: 0 },
    { label: 'Km 1210.001 – 1220.000', fromKm: 1210.001, toKm: 1220.000, isLink: false, count: 0 },
    { label: 'Km 1220.001 – 1230.000', fromKm: 1220.001, toKm: 1230.000, isLink: false, count: 0 },
    { label: 'Km 1230.001 – 1240.000', fromKm: 1230.001, toKm: 1240.000, isLink: false, count: 0 },
    { label: 'Km 1240.001 – 1249.720', fromKm: 1240.001, toKm: 1249.720, isLink: false, count: 0 },
    { label: 'SMUN–RPJ Link Line', fromKm: 1168.697, toKm: 1178.150, isLink: true, count: 0 }
  ];

  for (const d of defects) {
    const isLink = d.sectionCode === 'SMUN-RPJ' || d.trackLine === 'LINK';
    if (isLink) {
      blocks[8].count++;
    } else {
      for (let i = 0; i < 8; i++) {
        const b = blocks[i];
        if (d.km >= b.fromKm - 0.001 && d.km <= b.toKm + 0.001) {
          b.count++;
          break;
        }
      }
    }
  }

  return blocks;
}

/**
 * Aggregates patrol shift occupancy status (filled vs vacant).
 * @param {Array<object>} shifts
 * @returns {{ filled: number, vacant: number, total: number, fillPercentage: number }}
 */
export function aggregatePatrolShiftStatus(shifts = []) {
  let filled = 0;
  let vacant = 0;

  for (const s of shifts) {
    if (s.isFilled === true && s.status !== 'VACANT') {
      filled++;
    } else {
      vacant++;
    }
  }

  const total = shifts.length;
  const fillPercentage = total > 0 ? Number(((filled / total) * 100).toFixed(2)) : 0;

  return {
    filled,
    vacant,
    total,
    fillPercentage
  };
}
