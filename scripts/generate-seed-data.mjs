/**
 * Seed Data Generator Script for Rail Diary ERP
 * Extracts authentic data from db.js and constructs all 10 Firestore collections.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Linear waypoint anchors for GPS interpolation
const WAYPOINTS = [
  { km: 1167.210, lat: 30.320000, lon: 76.735000, name: 'UBCD Entry' },
  { km: 1170.435, lat: 30.344200, lon: 76.712100, name: 'SMUN Yard' },
  { km: 1188.575, lat: 30.431800, lon: 76.518400, name: 'SBJN Yard' },
  { km: 1202.015, lat: 30.630200, lon: 76.388100, name: 'NSIR Yard' },
  { km: 1213.187, lat: 30.665100, lon: 76.297400, name: 'GVGN Yard' },
  { km: 1229.087, lat: 30.706300, lon: 76.220500, name: 'KNNN Yard' },
  { km: 1235.837, lat: 30.760100, lon: 76.105200, name: 'CHAN Yard' },
  { km: 1249.720, lat: 30.852400, lon: 75.980200, name: 'SNL Border' }
];

const LINK_WAYPOINTS = [
  { km: 1168.697, lat: 30.344200, lon: 76.712100, name: 'SMUN Junction' },
  { km: 1172.000, lat: 30.392000, lon: 76.672000, name: 'Link Mid' },
  { km: 1178.150, lat: 30.484100, lon: 76.595000, name: 'RPJ Chord' }
];

export function getCoordinates(km, isLink = false) {
  const pts = isLink ? LINK_WAYPOINTS : WAYPOINTS;
  if (km <= pts[0].km) {
    return { latitude: Number(pts[0].lat.toFixed(6)), longitude: Number(pts[0].lon.toFixed(6)) };
  }
  if (km >= pts[pts.length - 1].km) {
    const last = pts[pts.length - 1];
    return { latitude: Number(last.lat.toFixed(6)), longitude: Number(last.lon.toFixed(6)) };
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const w1 = pts[i];
    const w2 = pts[i + 1];
    if (km >= w1.km && km <= w2.km) {
      const t = (km - w1.km) / (w2.km - w1.km);
      const lat = w1.lat + t * (w2.lat - w1.lat);
      const lon = w1.lon + t * (w2.lon - w1.lon);
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lon.toFixed(6)) };
    }
  }
  return { latitude: 30.344200, longitude: 76.712100 };
}

// 1. USERS
const users = [
  {
    id: 'usr_vkazad',
    userId: 'vkazad@dfcc.co.in',
    email: 'vkazad@dfcc.co.in',
    pin: '9999',
    name: 'Shri Vivek Kumar Azad',
    role: 'SUPER_ADMIN',
    designation: 'Assistant Project Manager / Civil (APM/Civil)',
    department: 'Civil Engineering / P-Way',
    unit: 'IMSD SMUN',
    phone: '+91-9717631984',
    awpoId: null,
    isActive: true,
    qrCodeId: 'RD-USR-VKAZAD',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-15T09:00:00.000Z'
  },
  {
    id: 'usr_off_001',
    userId: 'OFF-001',
    email: 'rajesh.sse@dfcc.co.in',
    pin: '1201',
    name: 'Shri Rajesh Sharma',
    role: 'OFFICER',
    designation: 'Sr. Section Engineer / P-Way (In-Charge SMUN)',
    department: 'Civil Engineering / P-Way',
    unit: 'IMSD SMUN',
    phone: '+91-9872101001',
    awpoId: null,
    isActive: true,
    qrCodeId: 'RD-USR-OFF-001',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-15T09:00:00.000Z'
  },
  {
    id: 'usr_stf_001',
    userId: 'STF-001',
    email: 'ravinder.mts@dfcc.co.in',
    pin: '2001',
    name: 'Shri Ravinder Kumar',
    role: 'STAFF',
    designation: 'Multi-Tasking Staff (MTS / Track Maintenance)',
    department: 'Civil Engineering / P-Way',
    unit: 'IMSD SMUN',
    phone: '+91-9872202001',
    awpoId: 'AWPO-SMUN-701',
    isActive: true,
    qrCodeId: 'RD-USR-STF-001',
    createdAt: '2026-08-15T09:00:00.000Z',
    updatedAt: '2026-08-15T09:00:00.000Z'
  }
];

// 2. JURISDICTION (8 Block Sections)
const jurisdiction = [
  {
    id: 'SEC-01',
    sectionCode: 'UBCD-SMUN',
    sectionName: 'Ambala (UBCD) to Shambhu (SMUN)',
    lineType: 'MAIN_LINE',
    fromKm: 1167.210,
    toKm: 1170.435,
    lengthKm: 3.225,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['UBCD', 'Shambhu (SMUN)'],
    bridgeCounts: { major: 1, minor: 2, rub: 1, rob: 1, fob: 0, owg: 0, total: 5 },
    curveCount: 3,
    levelCrossingCount: 0,
    pointCrossingCount: 35,
    remarks: 'MJB:1 MIB:2 RUB:1 ROB:1 | Curves:3 | SMUN Yard P&C'
  },
  {
    id: 'SEC-02',
    sectionCode: 'SMUN-SBJN',
    sectionName: 'Shambhu (SMUN) to Sarai Banjara (SBJN)',
    lineType: 'MAIN_LINE',
    fromKm: 1170.435,
    toKm: 1188.575,
    lengthKm: 18.140,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['Shambhu (SMUN)', 'Sarai Banjara (SBJN)'],
    bridgeCounts: { major: 5, minor: 19, rub: 8, rob: 2, fob: 1, owg: 1, total: 35 },
    curveCount: 17,
    levelCrossingCount: 0,
    pointCrossingCount: 26,
    remarks: 'MJB:5 MIB:19 RUB:8 ROB:2 FOB:1 OWG:1 | Curves:17'
  },
  {
    id: 'SEC-03',
    sectionCode: 'SBJN-NSIR',
    sectionName: 'Sarai Banjara (SBJN) to New Sirhind (NSIR)',
    lineType: 'MAIN_LINE',
    fromKm: 1188.575,
    toKm: 1202.015,
    lengthKm: 13.440,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['Sarai Banjara (SBJN)', 'New Sirhind (NSIR)'],
    bridgeCounts: { major: 6, minor: 16, rub: 8, rob: 0, fob: 1, owg: 0, total: 31 },
    curveCount: 14,
    levelCrossingCount: 0,
    pointCrossingCount: 18,
    remarks: 'MJB:6 MIB:16 RUB:8 FOB:1 | Curves:14'
  },
  {
    id: 'SEC-04',
    sectionCode: 'NSIR-GVGN',
    sectionName: 'New Sirhind (NSIR) to New Mandi Gobindgarh (GVGN)',
    lineType: 'MAIN_LINE',
    fromKm: 1202.015,
    toKm: 1213.187,
    lengthKm: 11.172,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['New Sirhind (NSIR)', 'New Mandi Gobindgarh (GVGN)'],
    bridgeCounts: { major: 4, minor: 11, rub: 9, rob: 2, fob: 0, owg: 2, total: 26 },
    curveCount: 10,
    levelCrossingCount: 0,
    pointCrossingCount: 32,
    remarks: 'MJB:4 MIB:11 RUB:9 ROB:2 OWG:2 | Curves:10'
  },
  {
    id: 'SEC-05',
    sectionCode: 'GVGN-KNNN',
    sectionName: 'New Mandi Gobindgarh (GVGN) to New Khanna (KNNN)',
    lineType: 'MAIN_LINE',
    fromKm: 1213.187,
    toKm: 1229.087,
    lengthKm: 15.900,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['New Mandi Gobindgarh (GVGN)', 'New Khanna (KNNN)'],
    bridgeCounts: { major: 0, minor: 10, rub: 3, rob: 3, fob: 2, owg: 0, total: 18 },
    curveCount: 19,
    levelCrossingCount: 1,
    pointCrossingCount: 22,
    remarks: 'MIB:10 RUB:3 ROB:3 FOB:2 LC:1 | Curves:19'
  },
  {
    id: 'SEC-06',
    sectionCode: 'KNNN-CHAN',
    sectionName: 'New Khanna (KNNN) to New Chawa Pail (CHAN)',
    lineType: 'MAIN_LINE',
    fromKm: 1229.087,
    toKm: 1235.837,
    lengthKm: 6.750,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['New Khanna (KNNN)', 'New Chawa Pail (CHAN)'],
    bridgeCounts: { major: 0, minor: 6, rub: 3, rob: 1, fob: 0, owg: 0, total: 10 },
    curveCount: 10,
    levelCrossingCount: 1,
    pointCrossingCount: 28,
    remarks: 'MIB:6 RUB:3 ROB:1 LC:1 | Curves:10'
  },
  {
    id: 'SEC-07',
    sectionCode: 'CHAN-SNL',
    sectionName: 'New Chawa Pail (CHAN) to Sanahwal Border (SNL)',
    lineType: 'MAIN_LINE',
    fromKm: 1235.837,
    toKm: 1249.720,
    lengthKm: 13.883,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['New Chawa Pail (CHAN)', 'Sanahwal (SNL)'],
    bridgeCounts: { major: 1, minor: 8, rub: 3, rob: 0, fob: 2, owg: 1, total: 14 },
    curveCount: 9,
    levelCrossingCount: 3,
    pointCrossingCount: 0,
    remarks: 'MJB:1 MIB:8 RUB:3 FOB:2 OWG:1 LC:3 | Curves:9'
  },
  {
    id: 'SEC-08',
    sectionCode: 'SMUN-RPJ',
    sectionName: 'Shambhu (SMUN) to Rajpura (RPJ) Link Line',
    lineType: 'LINK_LINE',
    fromKm: 1168.697,
    toKm: 1178.150,
    lengthKm: 6.169,
    trackGauge: 'Broad Gauge 1676mm',
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ['Shambhu Link Junction', 'Rajpura Junction (RPJ)'],
    bridgeCounts: { major: 1, minor: 2, rub: 2, rob: 0, fob: 0, owg: 1, total: 5 },
    curveCount: 13,
    levelCrossingCount: 0,
    pointCrossingCount: 0,
    remarks: 'MJB:1 MIB:2 RUB:2 OWG:1 | Curves:13 | Chord to Northern Railway'
  }
];

// 3. BRIDGES (144 Items: 18 MJB, 74 MIB, 37 RUB, 9 ROB, 6 FOB)
function generateBridges() {
  const list = [];
  const sectionAllocations = [
    { sec: 'UBCD-SMUN', fromKm: 1167.210, toKm: 1170.435, isLink: false, counts: { MAJOR: 1, MINOR: 2, RUB: 1, ROB: 1, FOB: 0 } },
    { sec: 'SMUN-SBJN', fromKm: 1170.435, toKm: 1188.575, isLink: false, counts: { MAJOR: 5, MINOR: 19, RUB: 8, ROB: 2, FOB: 1 } },
    { sec: 'SBJN-NSIR', fromKm: 1188.575, toKm: 1202.015, isLink: false, counts: { MAJOR: 6, MINOR: 16, RUB: 8, ROB: 0, FOB: 1 } },
    { sec: 'NSIR-GVGN', fromKm: 1202.015, toKm: 1213.187, isLink: false, counts: { MAJOR: 4, MINOR: 11, RUB: 9, ROB: 2, FOB: 0 } },
    { sec: 'GVGN-KNNN', fromKm: 1213.187, toKm: 1229.087, isLink: false, counts: { MAJOR: 0, MINOR: 10, RUB: 3, ROB: 3, FOB: 2 } },
    { sec: 'KNNN-CHAN', fromKm: 1229.087, toKm: 1235.837, isLink: false, counts: { MAJOR: 0, MINOR: 6, RUB: 3, ROB: 1, FOB: 0 } },
    { sec: 'CHAN-SNL',  fromKm: 1235.837, toKm: 1249.720, isLink: false, counts: { MAJOR: 1, MINOR: 8, RUB: 3, ROB: 0, FOB: 2 } },
    { sec: 'SMUN-RPJ',  fromKm: 1168.697, toKm: 1178.150, isLink: true,  counts: { MAJOR: 1, MINOR: 2, RUB: 2, ROB: 0, FOB: 0 } }
  ];

  let majorIdx = 1, minorIdx = 1, rubIdx = 1, robIdx = 1, fobIdx = 1;

  for (const s of sectionAllocations) {
    const totalSecBridges = s.counts.MAJOR + s.counts.MINOR + s.counts.RUB + s.counts.ROB + s.counts.FOB;
    let slot = 0;
    const getKm = () => {
      const step = (s.toKm - s.fromKm) / (totalSecBridges + 1);
      slot++;
      return Number((s.fromKm + slot * step).toFixed(3));
    };

    // Major
    for (let i = 0; i < s.counts.MAJOR; i++) {
      const km = getKm();
      const coords = getCoordinates(km, s.isLink);
      const isOwg = (majorIdx === 2 || majorIdx === 7 || majorIdx === 11 || majorIdx === 15 || majorIdx === 18);
      list.push({
        id: `BRG-MJB-${String(majorIdx).padStart(3, '0')}`,
        bridgeNo: `BR-MJB/${s.sec.split('-')[0]}/${majorIdx}`,
        category: 'MAJOR',
        bridgeType: isOwg ? 'OWG' : 'MJB',
        sectionCode: s.sec,
        km,
        structureType: isOwg ? 'Open Web Steel Girder (OWG)' : 'PSC I-Girder with RCC Deck',
        spanConfiguration: isOwg ? '1x61.0m OWG + 2x30.5m Plate Girder' : '4x24.4m PSC Girder',
        totalLengthMeters: isOwg ? 122.0 : 97.6,
        waterwayType: isOwg ? 'Ghaggar / Sirhind Canal Main Branch' : 'Perennial Drainage Canal',
        dischargeCapacityCumecs: isOwg ? 650.0 : 280.0,
        verticalClearanceMeters: null,
        substructure: 'RCC Pier on 1200mm Dia Bored Cast-In-Situ Piles',
        superstructure: isOwg ? 'Structural Steel Truss (Fe 410B)' : 'Post-Tensioned Prestressed Concrete (M45)',
        lastInspectionDate: '2026-05-15',
        conditionRating: 'SOUND',
        latitude: coords.latitude,
        longitude: coords.longitude,
        remarks: isOwg ? 'OWG Rail-over-Rail / Major River Crossing' : 'Annual waterway clearance completed'
      });
      majorIdx++;
    }

    // Minor
    for (let i = 0; i < s.counts.MINOR; i++) {
      const km = getKm();
      const coords = getCoordinates(km, s.isLink);
      list.push({
        id: `BRG-MIB-${String(minorIdx).padStart(3, '0')}`,
        bridgeNo: `BR-MIB/${minorIdx}`,
        category: 'MINOR',
        bridgeType: 'MIB',
        sectionCode: s.sec,
        km,
        structureType: 'RCC Twin Box Culvert',
        spanConfiguration: '2x4.0m RCC Box',
        totalLengthMeters: 8.5,
        waterwayType: 'Agricultural Irrigation Siphon / Minor Nullah',
        dischargeCapacityCumecs: 35.0,
        verticalClearanceMeters: null,
        substructure: 'Precast RCC Box Base Slab',
        superstructure: 'Monolithic RCC Box Barrel (M35)',
        lastInspectionDate: '2026-04-20',
        conditionRating: 'SOUND',
        latitude: coords.latitude,
        longitude: coords.longitude,
        remarks: 'Catch water drains desilted'
      });
      minorIdx++;
    }

    // RUB
    for (let i = 0; i < s.counts.RUB; i++) {
      const km = getKm();
      const coords = getCoordinates(km, s.isLink);
      list.push({
        id: `BRG-RUB-${String(rubIdx).padStart(3, '0')}`,
        bridgeNo: `RUB-${rubIdx}`,
        category: 'RUB',
        bridgeType: 'RUB',
        sectionCode: s.sec,
        km,
        structureType: 'Precast Segmental RCC Road Under Bridge',
        spanConfiguration: '1x7.5m x 4.5m Limited Height Subway (LHS)',
        totalLengthMeters: 18.0,
        waterwayType: 'Rural Road / Vehicular Subway',
        dischargeCapacityCumecs: null,
        verticalClearanceMeters: 4.5,
        substructure: 'RCC Raft Foundation with Cutoff Walls',
        superstructure: 'Precast RCC Box Units with Bituminous Wearing Coat',
        lastInspectionDate: '2026-06-05',
        conditionRating: 'SATISFACTORY',
        latitude: coords.latitude,
        longitude: coords.longitude,
        remarks: 'Automatic dewatering pump operational'
      });
      rubIdx++;
    }

    // ROB
    for (let i = 0; i < s.counts.ROB; i++) {
      const km = getKm();
      const coords = getCoordinates(km, s.isLink);
      list.push({
        id: `BRG-ROB-${String(robIdx).padStart(3, '0')}`,
        bridgeNo: `ROB-${robIdx}`,
        category: 'ROB',
        bridgeType: 'ROB',
        sectionCode: s.sec,
        km,
        structureType: 'Composite Steel Girder with RCC Deck Road Over Bridge',
        spanConfiguration: '1x45.0m Composite Girder + 2x24.0m Approaches',
        totalLengthMeters: 93.0,
        waterwayType: 'State Highway / MDR Crossing Over Track',
        dischargeCapacityCumecs: null,
        verticalClearanceMeters: 6.87,
        substructure: 'RCC Abutments and Hollow Piers',
        superstructure: 'Steel Bowstring / Plate Girders with Crash Barriers',
        lastInspectionDate: '2026-03-12',
        conditionRating: 'SOUND',
        latitude: coords.latitude,
        longitude: coords.longitude,
        remarks: 'Standard 25kV OHE electrical clearance verified'
      });
      robIdx++;
    }

    // FOB
    for (let i = 0; i < s.counts.FOB; i++) {
      const km = getKm();
      const coords = getCoordinates(km, s.isLink);
      list.push({
        id: `BRG-FOB-${String(fobIdx).padStart(3, '0')}`,
        bridgeNo: `FOB-${fobIdx}`,
        category: 'FOB',
        bridgeType: 'FOB',
        sectionCode: s.sec,
        km,
        structureType: 'Structural Steel Truss Foot Over Bridge',
        spanConfiguration: '1x28.0m Steel Tubular Truss',
        totalLengthMeters: 28.0,
        waterwayType: 'Pedestrian Overpass / Village Connectivity',
        dischargeCapacityCumecs: null,
        verticalClearanceMeters: 6.52,
        substructure: 'RCC Column Trestles on Isolated Footings',
        superstructure: 'Galvanized Structural Steel Lattice Truss with Polycarbonate Roof',
        lastInspectionDate: '2026-05-22',
        conditionRating: 'SOUND',
        latitude: coords.latitude,
        longitude: coords.longitude,
        remarks: 'Anti-fall protective wire mesh intact'
      });
      fobIdx++;
    }
  }

  return list;
}

// 4. LEVEL CROSSINGS (5 items from db.js)
const level_crossings = [
  {
    id: 'LC-151C',
    gateNo: '151C',
    classification: 'CLASS_C',
    sectionCode: 'GVGN-KNNN',
    km: 1215.034,
    tuv: 886440.00,
    gateType: 'Manned / Electric Lifting Barrier (ELB)',
    interlocked: true,
    roadName: 'Mandi Gobindgarh to Amloh Road',
    telephoneLinkedStation: 'GVGN Station Master',
    gatemanCount: 3,
    lastCensusDate: '2025-11-15',
    latitude: 30.669886,
    longitude: 76.288467,
    remarks: 'CCTV surveillance active; High TUV census: 8,86,440'
  },
  {
    id: 'LC-159C',
    gateNo: '159C',
    classification: 'CLASS_C',
    sectionCode: 'KNNN-CHAN',
    km: 1232.095,
    tuv: 183937.50,
    gateType: 'Manned / Electric Lifting Barrier (ELB)',
    interlocked: true,
    roadName: 'Khanna to Samrala Link Road',
    telephoneLinkedStation: 'KNNN Station Master',
    gatemanCount: 3,
    lastCensusDate: '2025-10-20',
    latitude: 30.718542,
    longitude: 76.195420,
    remarks: 'TUV: 1,83,937.50; Solar backup power operational'
  },
  {
    id: 'LC-163spl',
    gateNo: '163spl',
    classification: 'SPECIAL',
    sectionCode: 'CHAN-SNL',
    km: 1239.827,
    tuv: 143633.76,
    gateType: 'Manned / Electric Lifting Barrier (ELB)',
    interlocked: true,
    roadName: 'Chawa to Payal Feeder Road',
    telephoneLinkedStation: 'CHAN Station Master',
    gatemanCount: 3,
    lastCensusDate: '2025-12-05',
    latitude: 30.785412,
    longitude: 76.072145,
    remarks: 'Special Class LC; Heavy agricultural tractor traffic'
  },
  {
    id: 'LC-164spl',
    gateNo: '164spl',
    classification: 'SPECIAL',
    sectionCode: 'CHAN-SNL',
    km: 1244.833,
    tuv: 599622.31,
    gateType: 'Manned / Electric Lifting Barrier (ELB)',
    interlocked: true,
    roadName: 'Doraha to Sanahwal Industrial Arterial',
    telephoneLinkedStation: 'CHAN Station Master',
    gatemanCount: 3,
    lastCensusDate: '2025-11-28',
    latitude: 30.819874,
    longitude: 76.024512,
    remarks: 'Special Class LC; TUV: 5,99,622.31; ROB proposal in progress'
  },
  {
    id: 'LC-167C',
    gateNo: '167C',
    classification: 'CLASS_C',
    sectionCode: 'CHAN-SNL',
    km: 1248.664,
    tuv: 232435.43,
    gateType: 'Manned / Electric Lifting Barrier (ELB)',
    interlocked: true,
    roadName: 'Sanahwal Outer Ring Road',
    telephoneLinkedStation: 'SNL / CHAN Station Master',
    gatemanCount: 3,
    lastCensusDate: '2025-09-18',
    latitude: 30.846512,
    longitude: 75.989745,
    remarks: 'TUV: 2,32,435.43; Rumble strips & warning signage intact'
  }
];

// 5. OFFICERS & STAFF (14 items)
const officers_staff = [
  {
    id: 'STF-001',
    name: 'Shri Vivek Kumar Azad',
    post: 'APM / Civil',
    role: 'SUPER_ADMIN',
    employmentType: 'REGULAR',
    email: 'vkazad@dfcc.co.in',
    phone: '+91-9717631984',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Entire IMSD SMUN Jurisdiction (Km 1167.210 – 1249.720 + Link Line)',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-001',
    dateOfJoining: '2021-03-15',
    bloodGroup: 'B+'
  },
  {
    id: 'STF-002',
    name: 'Shri Rajesh Sharma',
    post: 'Sr. Section Engineer / P-Way (In-Charge SMUN)',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'rajesh.sharma@dfcc.co.in',
    phone: '+91-9872101001',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Section Km 1167.210 – 1202.015 (UBCD to NSIR)',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-002',
    dateOfJoining: '2021-06-01',
    bloodGroup: 'O+'
  },
  {
    id: 'STF-003',
    name: 'Shri Harpreet Singh',
    post: 'Sr. Section Engineer / P-Way (In-Charge CHAN)',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'harpreet.singh@dfcc.co.in',
    phone: '+91-9872101002',
    headquarters: 'IMSD Chawa Pail (CHAN)',
    assignedSection: 'Section Km 1202.015 – 1249.720 (NSIR to SNL)',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-003',
    dateOfJoining: '2021-07-15',
    bloodGroup: 'A+'
  },
  {
    id: 'STF-004',
    name: 'Shri Sunil Kumar',
    post: 'Section Engineer / Track Assets',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'sunil.kumar@dfcc.co.in',
    phone: '+91-9872101003',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Curves, SEJs & LWR Asset Management',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-004',
    dateOfJoining: '2022-01-10',
    bloodGroup: 'B+'
  },
  {
    id: 'STF-005',
    name: 'Shri Gurmeet Singh',
    post: 'Section Engineer / Bridges & Structures',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'gurmeet.singh@dfcc.co.in',
    phone: '+91-9872101004',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Major Bridges, OWG & FOB/ROB Inspection',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-005',
    dateOfJoining: '2022-02-15',
    bloodGroup: 'AB+'
  },
  {
    id: 'STF-006',
    name: 'Shri Amit Verma',
    post: 'Junior Engineer / P-Way Curves',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'amit.verma@dfcc.co.in',
    phone: '+91-9872101005',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Curves 315–354 (Km 1167.210 – 1210.000)',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-006',
    dateOfJoining: '2022-08-01',
    bloodGroup: 'O+'
  },
  {
    id: 'STF-007',
    name: 'Shri Manpreet Singh',
    post: 'Junior Engineer / P&C Special',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'manpreet.singh@dfcc.co.in',
    phone: '+91-9872101006',
    headquarters: 'IMSD Chawa Pail (CHAN)',
    assignedSection: 'Points & Crossings (GVGN, KNNN, CHAN Yards)',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-007',
    dateOfJoining: '2022-09-15',
    bloodGroup: 'B+'
  },
  {
    id: 'STF-008',
    name: 'Shri Deepak Yadav',
    post: 'Junior Engineer / Quality & USFD',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'deepak.yadav@dfcc.co.in',
    phone: '+91-9872101007',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'USFD Testing & Track Defect Rectification',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-008',
    dateOfJoining: '2023-01-05',
    bloodGroup: 'A+'
  },
  {
    id: 'STF-009',
    name: 'Shri Vikas Kumar',
    post: 'Sr. Executive / Civil',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'vikas.kumar@dfcc.co.in',
    phone: '+91-9872101008',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Quality Assurance & TMS Data Operations',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-009',
    dateOfJoining: '2023-03-20',
    bloodGroup: 'O-'
  },
  {
    id: 'STF-010',
    name: 'Shri Jaswinder Singh',
    post: 'Executive / Track Maintenance',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'jaswinder.singh@dfcc.co.in',
    phone: '+91-9872101009',
    headquarters: 'IMSD Chawa Pail (CHAN)',
    assignedSection: 'Track Machine & Tamping Support',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-010',
    dateOfJoining: '2023-05-10',
    bloodGroup: 'B+'
  },
  {
    id: 'STF-011',
    name: 'Shri Kuldeep Singh',
    post: 'Executive / Stores & DMTR',
    role: 'OFFICER',
    employmentType: 'REGULAR',
    email: 'kuldeep.singh@dfcc.co.in',
    phone: '+91-9872101010',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'P-Way Material Stores & DMTR Registers',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-011',
    dateOfJoining: '2023-07-01',
    bloodGroup: 'AB-'
  },
  {
    id: 'STF-012',
    name: 'Shri Ravinder Kumar',
    post: 'MTS (Track Maintenance)',
    role: 'STAFF',
    employmentType: 'REGULAR',
    email: 'ravinder.kumar@dfcc.co.in',
    phone: '+91-9872202001',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Beat 1–4 Track Maintenance',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-012',
    dateOfJoining: '2023-09-01',
    bloodGroup: 'O+'
  },
  {
    id: 'STF-013',
    name: 'Shri Joginder Ram',
    post: 'MTS (P-Way Gang)',
    role: 'STAFF',
    employmentType: 'REGULAR',
    email: 'joginder.ram@dfcc.co.in',
    phone: '+91-9872202002',
    headquarters: 'IMSD Chawa Pail (CHAN)',
    assignedSection: 'Beat 14–17 Track Maintenance',
    leaveBalance: { lap: 15, lhap: 7, cl: 8, rh: 2 },
    qrCodeId: 'RD-STF-013',
    dateOfJoining: '2023-11-15',
    bloodGroup: 'A+'
  },
  {
    id: 'STF-014',
    name: 'Shri Surinder Pal',
    post: 'MTS (Outsource / Contractor)',
    role: 'STAFF',
    employmentType: 'OUTSOURCED',
    email: 'surinder.pal@dfcc.co.in',
    phone: '+91-9872202003',
    headquarters: 'IMSD Shambhu (SMUN)',
    assignedSection: 'Tool & Plant Depot Shambhu',
    leaveBalance: { lap: 12, lhap: 5, cl: 6, rh: 2 },
    qrCodeId: 'RD-STF-014',
    dateOfJoining: '2024-02-01',
    bloodGroup: 'B+',
    awpoId: 'AWPO-SMUN-801'
  }
];

// 6. KEYMEN (18 items covering 18 beats)
const keymen = [
  { beatNo: 1, name: 'Gurdeep Singh', staffId: 'STF-KM-101', sec: 'UBCD-SMUN', fromKm: 1167.210, toKm: 1172.000, phone: '+91-9872110001' },
  { beatNo: 2, name: 'Ram Kumar', staffId: 'STF-KM-102', sec: 'SMUN-SBJN', fromKm: 1172.000, toKm: 1176.500, phone: '+91-9872110002' },
  { beatNo: 3, name: 'Malkit Singh', staffId: 'STF-KM-103', sec: 'SMUN-SBJN', fromKm: 1176.500, toKm: 1181.000, phone: '+91-9872110003' },
  { beatNo: 4, name: 'Suresh Chand', staffId: 'STF-KM-104', sec: 'SMUN-SBJN', fromKm: 1181.000, toKm: 1185.500, phone: '+91-9872110004' },
  { beatNo: 5, name: 'Harbhajan Singh', staffId: 'STF-KM-105', sec: 'SMUN-SBJN', fromKm: 1185.500, toKm: 1188.575, phone: '+91-9872110005' },
  { beatNo: 6, name: 'Ramesh Lal', staffId: 'STF-KM-106', sec: 'SBJN-NSIR', fromKm: 1188.575, toKm: 1193.000, phone: '+91-9872110006' },
  { beatNo: 7, name: 'Sukhwinder Singh', staffId: 'STF-KM-107', sec: 'SBJN-NSIR', fromKm: 1193.000, toKm: 1197.500, phone: '+91-9872110007' },
  { beatNo: 8, name: 'Ashok Kumar', staffId: 'STF-KM-108', sec: 'SBJN-NSIR', fromKm: 1197.500, toKm: 1202.015, phone: '+91-9872110008' },
  { beatNo: 9, name: 'Baldev Raj', staffId: 'STF-KM-109', sec: 'NSIR-GVGN', fromKm: 1202.015, toKm: 1207.500, phone: '+91-9872110009' },
  { beatNo: 10, name: 'Tarsem Singh', staffId: 'STF-KM-110', sec: 'NSIR-GVGN', fromKm: 1207.500, toKm: 1213.187, phone: '+91-9872110010' },
  { beatNo: 11, name: 'Prem Chand', staffId: 'STF-KM-111', sec: 'GVGN-KNNN', fromKm: 1213.187, toKm: 1218.500, phone: '+91-9872110011' },
  { beatNo: 12, name: 'Kulwant Singh', staffId: 'STF-KM-112', sec: 'GVGN-KNNN', fromKm: 1218.500, toKm: 1224.000, phone: '+91-9872110012' },
  { beatNo: 13, name: 'Dharam Pal', staffId: 'STF-KM-113', sec: 'GVGN-KNNN', fromKm: 1224.000, toKm: 1229.087, phone: '+91-9872110013' },
  { beatNo: 14, name: 'Jagdish Singh', staffId: 'STF-KM-114', sec: 'KNNN-CHAN', fromKm: 1229.087, toKm: 1235.837, phone: '+91-9872110014' },
  { beatNo: 15, name: 'Balwant Rai', staffId: 'STF-KM-115', sec: 'CHAN-SNL', fromKm: 1235.837, toKm: 1240.500, phone: '+91-9872110015' },
  { beatNo: 16, name: 'Mohan Lal', staffId: 'STF-KM-116', sec: 'CHAN-SNL', fromKm: 1240.500, toKm: 1245.000, phone: '+91-9872110016' },
  { beatNo: 17, name: 'Satnam Singh', staffId: 'STF-KM-117', sec: 'CHAN-SNL', fromKm: 1245.000, toKm: 1249.720, phone: '+91-9872110017' },
  { beatNo: 18, name: 'Nirmal Singh', staffId: 'STF-KM-118', sec: 'SMUN-RPJ', fromKm: 1168.697, toKm: 1178.150, phone: '+91-9872110018' }
].map(k => ({
  id: `KM-${String(k.beatNo).padStart(3, '0')}`,
  beatNo: k.beatNo,
  name: k.name,
  staffId: k.staffId,
  sectionCode: k.sec,
  fromKm: k.fromKm,
  toKm: k.toKm,
  beatLengthKm: Number((k.toKm - k.fromKm).toFixed(3)),
  lineType: k.sec === 'SMUN-RPJ' ? 'Link Line (Single Track)' : 'Main Line (Up & Dn Tracks)',
  dutyHours: '06:30 – 14:30',
  mobileNo: k.phone,
  toolkitItems: [
    'Keyman Hammer (1.8kg)',
    'Fish Bolt Spanner (32/36mm)',
    'Track Canter Gauge',
    'Red/Green Banner Flags',
    '10 Detonators in Tin Box',
    'Track Chalk & Feeler Gauge'
  ],
  status: 'ON_DUTY',
  qrCodeId: `RD-KM-${String(k.beatNo).padStart(3, '0')}`
}));

// 7. PATROL SHIFTS (24 items: 8 sections × 3 diurnal shifts; 20 filled, 4 vacant)
const patrol_shifts = [];
const sectionsForPatrol = [
  { sec: 'UBCD-SMUN', fromKm: 1167.210, toKm: 1170.435 },
  { sec: 'SMUN-SBJN', fromKm: 1170.435, toKm: 1188.575 },
  { sec: 'SBJN-NSIR', fromKm: 1188.575, toKm: 1202.015 },
  { sec: 'NSIR-GVGN', fromKm: 1202.015, toKm: 1213.187 },
  { sec: 'GVGN-KNNN', fromKm: 1213.187, toKm: 1229.087 },
  { sec: 'KNNN-CHAN', fromKm: 1229.087, toKm: 1235.837 },
  { sec: 'CHAN-SNL',  fromKm: 1235.837, toKm: 1249.720 },
  { sec: 'SMUN-RPJ',  fromKm: 1168.697, toKm: 1178.150 }
];

const shiftProtocols = [
  { code: 'SHIFT_A_MORNING', hours: '06:00 – 14:00', type: 'HOT_WEATHER' },
  { code: 'SHIFT_B_EVENING', hours: '14:00 – 22:00', type: 'SECURITY' },
  { code: 'SHIFT_C_NIGHT',   hours: '22:00 – 06:00', type: 'COLD_WEATHER_NIGHT' }
];

let pshId = 1;
for (const s of sectionsForPatrol) {
  for (const sh of shiftProtocols) {
    // 4 vacant night shifts: GVGN-KNNN Night (pshId 15), KNNN-CHAN Night (pshId 18), CHAN-SNL Night (pshId 21), SMUN-RPJ Night (pshId 24)
    const isVacant = (pshId === 15 || pshId === 18 || pshId === 21 || pshId === 24);
    patrol_shifts.push({
      id: `PSH-${String(pshId).padStart(3, '0')}`,
      sectionCode: s.sec,
      fromKm: s.fromKm,
      toKm: s.toKm,
      shiftCode: sh.code,
      shiftHours: sh.hours,
      patrolType: sh.type,
      isFilled: !isVacant,
      patrolmanName: isVacant ? null : `Patrolman ${['Balwinder Singh', 'Jaswant Lal', 'Kashmir Singh', 'Harnek Singh', 'Devinder Pal'][pshId % 5]}`,
      patrolmanStaffId: isVacant ? null : `STF-PAT-${200 + pshId}`,
      patrolmanPhone: isVacant ? null : `+91-987255${String(1000 + pshId).slice(1)}`,
      equipmentChecked: !isVacant,
      status: isVacant ? 'VACANT' : 'ACTIVE',
      remarks: isVacant ? 'Night shift currently vacant — ad-hoc overtime assigned' : 'SEJ rail gap & temperature log maintained'
    });
    pshId++;
  }
}

// 8. POINTS & CROSSINGS (161 items from db.js)
function loadPointsCrossingsFromDb() {
  const dbPath = path.resolve('/Users/vivekazad/.gemini/antigravity/scratch/antigravity-ims/js/db.js');
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  
  // Extract pc array
  const pcMatch = dbContent.match(/const pc=\[\s*([\s\S]*?)\s*\];\s*pc\.forEach/);
  if (!pcMatch) throw new Error('Could not match points & crossings in db.js');
  
  const rawRows = eval(`[${pcMatch[1]}]`);
  return rawRows.map(r => {
    const coords = getCoordinates(r[5], false);
    return {
      id: r[0],
      station: r[1],
      pointNo: r[2],
      trackType: r[3],
      turnoutRatio: r[4],
      km: r[5],
      railType: r[6],
      hand: r[7],
      operation: r[8],
      stationsBehindCrossing: r[9] ? String(r[9]) : null,
      sleeperType: 'PSC Turnout Sleeper (RDSO T-4218)',
      railSection: '60 Kg 1080 Head Hardened (HH)',
      switchLengthMeters: r[4] === '1/8.5' ? 6.4 : 10.125,
      latitude: coords.latitude,
      longitude: coords.longitude,
      condition: 'GOOD'
    };
  });
}

// 9. CURVES (95 items from db.js)
function loadCurvesFromDb() {
  const dbPath = path.resolve('/Users/vivekazad/.gemini/antigravity/scratch/antigravity-ims/js/db.js');
  const dbContent = fs.readFileSync(dbPath, 'utf8');
  
  const cvMatch = dbContent.match(/const cv=\[\s*([\s\S]*?)\s*\];\s*cv\.forEach/);
  if (!cvMatch) throw new Error('Could not match curves in db.js');
  
  const rawRows = eval(`[${cvMatch[1]}]`);
  return rawRows.map(r => {
    const isLink = r[0] >= 83;
    const coords = getCoordinates(r[2], isLink);
    return {
      id: `CRV-${r[1]}`,
      serialNo: r[0],
      curveNo: r[1],
      fromKm: r[2],
      toKm: r[3],
      lengthMeters: r[4],
      degree: r[5],
      radiusTmsMeters: r[6],
      radiusMeters: r[7],
      speedLimitKmph: r[8],
      transitionLengthMeters: r[9],
      circularLengthMeters: r[10],
      tmsCircularLengthM: r[11],
      cantMm: r[12],
      yard: r[14] || '',
      inspectionJurisdiction: r[15] || 'Sectional',
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  });
}

// 10. TRACK DEFECTS (48 items)
function generateTrackDefects() {
  const defects = [
    // USFD Flaws (12 items: 4 CRITICAL IMR, 8 OBS)
    { code: 'USFD-IMR-001', cat: 'USFD_FLAW', title: 'Internal Transverse Fatigue Flaw (IMR 70° probe)', sec: 'SMUN-SBJN', km: 1174.850, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'CRITICAL', sr: 30, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Joggled fishplate with 2 far-end clamps applied' },
    { code: 'USFD-IMR-002', cat: 'USFD_FLAW', title: 'Gauge Corner Cracking with sub-surface IMR defect', sec: 'SBJN-NSIR', km: 1195.420, track: 'Dn Main Line', rail: 'LEFT_RAIL', sev: 'CRITICAL', sr: 30, st: 'WORK_IN_PROGRESS', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Rail replacement cut marked; block requested' },
    { code: 'USFD-IMR-003', cat: 'USFD_FLAW', title: 'Horizontal Web-Head Junction Separation (IMR defect)', sec: 'GVGN-KNNN', km: 1221.150, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'CRITICAL', sr: 30, st: 'ATTENDED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Emergency piece inserted and AT welded' },
    { code: 'USFD-IMR-004', cat: 'USFD_FLAW', title: 'Transverse Defect in Head (TDH-IMR flaw)', sec: 'CHAN-SNL', km: 1243.600, track: 'Dn Main Line', rail: 'BOTH_RAILS', sev: 'CRITICAL', sr: 20, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: '30 km/h caution imposed; pilot watch posted' },
    { code: 'USFD-OBS-005', cat: 'USFD_FLAW', title: 'Minor Head Checking (OBS flaw under observation)', sec: 'UBCD-SMUN', km: 1169.100, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'MEDIUM', sr: null, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Monthly USFD re-testing scheduled' },
    { code: 'USFD-OBS-006', cat: 'USFD_FLAW', title: 'Wheel Burn Scab with 0° probe echo attenuation (OBS)', sec: 'SMUN-SBJN', km: 1182.350, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'MEDIUM', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Cupping depth monitored; profile grinding planned' },
    { code: 'USFD-OBS-007', cat: 'USFD_FLAW', title: 'Bolt Hole Hairline Crack indication (OBS-B flaw)', sec: 'SBJN-NSIR', km: 1191.800, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'HIGH', sr: null, st: 'ATTENDED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Fishplate tightened with torque wrench' },
    { code: 'USFD-OBS-008', cat: 'USFD_FLAW', title: 'Flange Micro-defect near weld heat zone (OBS-W)', sec: 'NSIR-GVGN', km: 1206.500, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'MEDIUM', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Verified normal by ultrasonic re-scan' },
    { code: 'USFD-OBS-009', cat: 'USFD_FLAW', title: 'Rolling Contact Fatigue (RCF) micro-spalling (OBS)', sec: 'GVGN-KNNN', km: 1218.900, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'LOW', sr: null, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'RCF anti-head-check grinding logged' },
    { code: 'USFD-OBS-010', cat: 'USFD_FLAW', title: 'Rail Web Corrugation acoustic echo distortion (OBS)', sec: 'KNNN-CHAN', km: 1233.400, track: 'Dn Main Line', rail: 'LEFT_RAIL', sev: 'LOW', sr: null, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Visual track gauge verification logged' },
    { code: 'USFD-OBS-011', cat: 'USFD_FLAW', title: 'Tongue Rail Root Defect indication (OBS)', sec: 'SMUN-SBJN', km: 1187.400, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: null, st: 'ATTENDED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Switch layout re-aligned and clamped' },
    { code: 'USFD-OBS-012', cat: 'USFD_FLAW', title: 'Link Line Curve 401 outer rail flaw (OBS)', sec: 'SMUN-RPJ', km: 1174.900, track: 'Link Line', rail: 'RIGHT_RAIL', sev: 'MEDIUM', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Gauge and crosslevel calibrated' },

    // Track Geometry (10 items)
    { code: 'GEOM-TWIST-013', cat: 'TRACK_GEOMETRY', title: 'Track Twist Exceedance (3.8 mm/m on 3.6m base)', sec: 'SMUN-SBJN', km: 1178.500, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'HIGH', sr: 60, st: 'OPEN', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'CSM Tamping machine requisitioned' },
    { code: 'GEOM-GAUGE-014', cat: 'TRACK_GEOMETRY', title: 'Gauge Widening (+7.5 mm on curve transition)', sec: 'SBJN-NSIR', km: 1198.200, track: 'Dn Main Line', rail: 'BOTH_RAILS', sev: 'HIGH', sr: 45, st: 'WORK_IN_PROGRESS', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Gauge tie rods and liners replaced' },
    { code: 'GEOM-UNEVEN-015', cat: 'TRACK_GEOMETRY', title: 'Vertical Unevenness Peak (12mm over 10m chord)', sec: 'NSIR-GVGN', km: 1208.700, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'MEDIUM', sr: null, st: 'ATTENDED', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Manual off-track hydraulic lifting completed' },
    { code: 'GEOM-ALIGN-016', cat: 'TRACK_GEOMETRY', title: 'Alignment Slew Error (8mm deviation on tangent track)', sec: 'GVGN-KNNN', km: 1224.600, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Track slewed back to laser survey alignment' },
    { code: 'GEOM-CANT-017', cat: 'TRACK_GEOMETRY', title: 'Crosslevel Deficiency (-14mm on transition curve 368)', sec: 'GVGN-KNNN', km: 1223.500, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'MEDIUM', sr: null, st: 'OPEN', staff: 'STF-006', name: 'Amit Verma (JE/Curves)', act: 'Superelevation ramping recalculated' },
    { code: 'GEOM-TWIST-018', cat: 'TRACK_GEOMETRY', title: 'Short Base Twist Exceedance on bridge approach', sec: 'UBCD-SMUN', km: 1169.800, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'HIGH', sr: 50, st: 'WORK_IN_PROGRESS', staff: 'STF-005', name: 'Gurmeet Singh (SE/Bridges)', act: 'Bridge guard rail and sleeper packing underway' },
    { code: 'GEOM-GAUGE-019', cat: 'TRACK_GEOMETRY', title: 'Tight Gauge (-4mm on Point 245b crossover)', sec: 'CHAN-SNL', km: 1237.700, track: 'Dn Main Line', rail: 'BOTH_RAILS', sev: 'MEDIUM', sr: null, st: 'ATTENDED', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Insulated gauge face liners adjusted' },
    { code: 'GEOM-UNEVEN-020', cat: 'TRACK_GEOMETRY', title: 'Dip at Insulated Glued Joint (Glued joint depression 4mm)', sec: 'KNNN-CHAN', km: 1231.200, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'LOW', sr: null, st: 'OPEN', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Tamping and ballast packing scheduled' },
    { code: 'GEOM-ALIGN-021', cat: 'TRACK_GEOMETRY', title: 'Versine Defect on Curve 352 (8mm versine scatter)', sec: 'NSIR-GVGN', km: 1206.100, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: null, st: 'ATTENDED', staff: 'STF-006', name: 'Amit Verma (JE/Curves)', act: 'Versine realignment by 3-point method executed' },
    { code: 'GEOM-TWIST-022', cat: 'TRACK_GEOMETRY', title: 'Link Line Bridge Approach Transition Twist (2.9 mm/m)', sec: 'SMUN-RPJ', km: 1176.400, track: 'Link Line', rail: 'BOTH_RAILS', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-005', name: 'Gurmeet Singh (SE/Bridges)', act: 'Approach ballast tamping verified' },

    // Points & Crossings Defects (8 items)
    { code: 'PC-DEF-023', cat: 'POINTS_CROSSINGS', title: 'Tongue Rail Chipping (>200mm on switch entry)', sec: 'SMUN-SBJN', km: 1170.500, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: 30, st: 'OPEN', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Tongue rail replacement unit ordered' },
    { code: 'PC-DEF-024', cat: 'POINTS_CROSSINGS', title: 'Excess Check Rail Clearance (48mm at nose)', sec: 'SMUN-SBJN', km: 1188.500, track: 'Dn Main Line', rail: 'LEFT_RAIL', sev: 'HIGH', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Check rail distance blocks re-torqued' },
    { code: 'PC-DEF-025', cat: 'POINTS_CROSSINGS', title: 'Loose Stretcher Bar Insulation Bushing', sec: 'NSIR-GVGN', km: 1201.800, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'MEDIUM', sr: null, st: 'ATTENDED', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Nylon insulating bushes replaced' },
    { code: 'PC-DEF-026', cat: 'POINTS_CROSSINGS', title: 'CMS Crossing Nose Wear (4.2mm vertical battering)', sec: 'NSIR-GVGN', km: 1203.100, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'MEDIUM', sr: null, st: 'OPEN', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Translamatic robotic welding re-profiling logged' },
    { code: 'PC-DEF-027', cat: 'POINTS_CROSSINGS', title: 'Switch Opening Gap Inconsistency (112mm vs 115mm std)', sec: 'GVGN-KNNN', km: 1213.200, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Point motor stroke adjusted with S&T team' },
    { code: 'PC-DEF-028', cat: 'POINTS_CROSSINGS', title: 'Slide Chair Dryness & Severe Friction', sec: 'GVGN-KNNN', km: 1214.500, track: 'Dn Main Line', rail: 'BOTH_RAILS', sev: 'LOW', sr: null, st: 'ATTENDED', staff: 'STF-010', name: 'Jaswinder Singh (Exec/Maint)', act: 'Graphite lubricating grease applied' },
    { code: 'PC-DEF-029', cat: 'POINTS_CROSSINGS', title: 'Loose Crossing Wing Rail Bolts', sec: 'KNNN-CHAN', km: 1228.900, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'HT bolts tightened to 600 Nm torque' },
    { code: 'PC-DEF-030', cat: 'POINTS_CROSSINGS', title: 'Switch Rail Toe Clearance Out of Tolerance', sec: 'CHAN-SNL', km: 1236.700, track: 'Dn Main Line', rail: 'LEFT_RAIL', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-007', name: 'Manpreet Singh (JE/P&C)', act: 'Switch toe verified flush with stock rail' },

    // Fasteners & Fittings (8 items)
    { code: 'FAST-ERC-031', cat: 'FASTENERS', title: 'Missing ERC Elastic Rail Clips (6 consecutive sleepers)', sec: 'SMUN-SBJN', km: 1177.300, track: 'Up Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: null, st: 'OPEN', staff: 'STF-012', name: 'Ravinder Kumar (MTS)', act: 'New ERC Mk-V clips requisitioned from store' },
    { code: 'FAST-PAD-032', cat: 'FASTENERS', title: 'Crushed and Displaced Grooved Rubber Sole Pads (GRSP)', sec: 'SBJN-NSIR', km: 1194.100, track: 'Dn Main Line', rail: 'LEFT_RAIL', sev: 'MEDIUM', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-012', name: 'Ravinder Kumar (MTS)', act: '10mm composite rubber pads being inserted' },
    { code: 'FAST-LINER-033', cat: 'FASTENERS', title: 'Broken Glass Filled Nylon (GFN) Insulating Liners', sec: 'NSIR-GVGN', km: 1209.400, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'LOW', sr: null, st: 'ATTENDED', staff: 'STF-013', name: 'Joginder Ram (MTS)', act: '40 Nos GFN-66 liners replaced' },
    { code: 'FAST-ERC-034', cat: 'FASTENERS', title: 'Corroded ERC Clips in Waterlogged Cutting', sec: 'GVGN-KNNN', km: 1216.700, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'MEDIUM', sr: null, st: 'OPEN', staff: 'STF-010', name: 'Jaswinder Singh (Exec/Maint)', act: 'Anti-corrosive bituminized grease coating logged' },
    { code: 'FAST-BOLT-035', cat: 'FASTENERS', title: 'Loose Fish Bolts at Insulated Rail Joint', sec: 'KNNN-CHAN', km: 1234.800, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'HIGH', sr: null, st: 'ATTENDED', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Fish bolts replaced and torqued' },
    { code: 'FAST-PAD-036', cat: 'FASTENERS', title: 'Perished Rubber Pads under SEJ Transition Sleepers', sec: 'CHAN-SNL', km: 1244.700, track: 'Dn Main Line', rail: 'BOTH_RAILS', sev: 'MEDIUM', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'High-density EVA pads installation underway' },
    { code: 'FAST-ERC-037', cat: 'FASTENERS', title: 'Toe Load Deficient ERC Clips (<850 kg toe load)', sec: 'UBCD-SMUN', km: 1168.400, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Toe load testing gauge verified replacement' },
    { code: 'FAST-LINER-038', cat: 'FASTENERS', title: 'Displaced GFN Liners on SMUN-RPJ Link Chord', sec: 'SMUN-RPJ', km: 1173.600, track: 'Link Line', rail: 'RIGHT_RAIL', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-014', name: 'Surinder Pal (MTS Outsource)', act: 'Liners repositioned and clips driven home' },

    // Weld Defects (6 items)
    { code: 'WELD-AT-039', cat: 'WELD_DEFECT', title: 'Alumino-Thermic (AT) Weld Cupping (>1.8mm dip)', sec: 'SMUN-SBJN', km: 1180.200, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'HIGH', sr: 45, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Precision rail profile grinder dispatched' },
    { code: 'WELD-FB-040', cat: 'WELD_DEFECT', title: 'Flash Butt Weld Joint Peak (1.4mm upward crown)', sec: 'SBJN-NSIR', km: 1199.600, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'MEDIUM', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Crown grinding in progress' },
    { code: 'WELD-AT-041', cat: 'WELD_DEFECT', title: 'Micro-Lack of Fusion at AT Weld Rail Collar', sec: 'NSIR-GVGN', km: 1205.300, track: 'Up Main Line', rail: 'LEFT_RAIL', sev: 'CRITICAL', sr: 30, st: 'ATTENDED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Joggled fishplated with 4 bolts; re-weld queued' },
    { code: 'WELD-AT-042', cat: 'WELD_DEFECT', title: 'Porosity & Slag Inclusion in Rail Foot Weld', sec: 'GVGN-KNNN', km: 1226.100, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: null, st: 'OPEN', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Cut and re-weld block scheduled' },
    { code: 'WELD-FB-043', cat: 'WELD_DEFECT', title: 'Flash Butt Weld Misalignment in Horizontal Plane', sec: 'KNNN-CHAN', km: 1230.800, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-008', name: 'Deepak Yadav (JE/USFD)', act: 'Weld side ground to 1:500 taper tolerance' },
    { code: 'WELD-AT-044', cat: 'WELD_DEFECT', title: 'AT Weld Scab near SEJ No.21 interface', sec: 'CHAN-SNL', km: 1249.200, track: 'Dn Main Line', rail: 'LEFT_RAIL', sev: 'MEDIUM', sr: null, st: 'ATTENDED', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Thermit weld collar inspected and smoothed' },

    // SEJ & Ballast Defects (4 items)
    { code: 'SEJ-GAP-045', cat: 'SEJ_DEFECT', title: 'SEJ No.14 Gap Expansion Exceedance (118mm at 44°C)', sec: 'SMUN-SBJN', km: 1175.987, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'HIGH', sr: 45, st: 'OPEN', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'LWR destressing block Requisitioned' },
    { code: 'SEJ-BRK-046', cat: 'SEJ_DEFECT', title: 'Loose SEJ Central Guide Bracket & Broken Fasteners', sec: 'NSIR-GVGN', km: 1210.863, track: 'Dn Main Line', rail: 'RIGHT_RAIL', sev: 'HIGH', sr: null, st: 'WORK_IN_PROGRESS', staff: 'STF-004', name: 'Sunil Kumar (SE/Track)', act: 'Guide bracket tightened; anti-vibration washers fitted' },
    { code: 'BAL-CUSH-047', cat: 'BALLAST_FORMATION', title: 'Deficient Clean Ballast Cushion (<250mm under sleepers)', sec: 'GVGN-KNNN', km: 1217.400, track: 'Up Main Line', rail: 'BOTH_RAILS', sev: 'MEDIUM', sr: null, st: 'OPEN', staff: 'STF-010', name: 'Jaswinder Singh (Exec/Maint)', act: 'Hopper ballast train unloading programmed' },
    { code: 'BAL-PUD-048', cat: 'BALLAST_FORMATION', title: 'Water Logging & Ballast Puddling near Culvert BR-MIB/42', sec: 'SBJN-NSIR', km: 1192.700, track: 'Dn Main Line', rail: 'BOTH_RAILS', sev: 'LOW', sr: null, st: 'VERIFIED_CLOSED', staff: 'STF-005', name: 'Gurmeet Singh (SE/Bridges)', act: 'Cross-drains cleared; clean ballast packed' }
  ];

  return defects.map((d, i) => {
    const coords = getCoordinates(d.km, d.sec === 'SMUN-RPJ');
    return {
      id: `DEF-${String(i + 1).padStart(3, '0')}`,
      defectCode: d.code,
      category: d.cat,
      title: d.title,
      sectionCode: d.sec,
      km: d.km,
      trackLine: d.track,
      rail: d.rail,
      severity: d.sev,
      speedRestrictionKmph: d.sr,
      status: d.st,
      reportedByStaffId: d.staff,
      reportedByName: d.name,
      reportedDate: '2026-08-10T10:30:00.000Z',
      targetClosureDate: d.sev === 'CRITICAL' ? '2026-08-11T18:00:00.000Z' : '2026-08-18T18:00:00.000Z',
      actionTaken: d.act,
      closedDate: d.st === 'VERIFIED_CLOSED' ? '2026-08-12T16:00:00.000Z' : null,
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  });
}

// Assemble full database
export function generateSeedData() {
  const bridges = generateBridges();
  const points_crossings = loadPointsCrossingsFromDb();
  const curves = loadCurvesFromDb();
  const track_defects = generateTrackDefects();

  return {
    users,
    jurisdiction,
    bridges,
    level_crossings,
    officers_staff,
    keymen,
    patrol_shifts,
    points_crossings,
    curves,
    track_defects
  };
}

// Generate files if executed directly
const data = generateSeedData();

console.log('--- SEED DATA COUNTS ---');
console.log(`users:            ${data.users.length}`);
console.log(`jurisdiction:     ${data.jurisdiction.length}`);
console.log(`bridges:          ${data.bridges.length}`);
console.log(`level_crossings:  ${data.level_crossings.length}`);
console.log(`officers_staff:   ${data.officers_staff.length}`);
console.log(`keymen:           ${data.keymen.length}`);
console.log(`patrol_shifts:    ${data.patrol_shifts.length}`);
console.log(`points_crossings: ${data.points_crossings.length}`);
console.log(`curves:           ${data.curves.length}`);
console.log(`track_defects:    ${data.track_defects.length}`);

// Write scripts/seed-data.json
const jsonPath = path.resolve(rootDir, 'scripts/seed-data.json');
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Wrote ${jsonPath}`);

// Write src/data/seedData.ts
const tsDataPath = path.resolve(rootDir, 'src/data/seedData.ts');
fs.mkdirSync(path.dirname(tsDataPath), { recursive: true });
const tsContent = `/**
 * Pre-compiled Seed Data for Rail Diary ERP (DFCCIL IMSD SMUN Unit)
 * Generated automatically from authentic DFCCIL database reference.
 */

import type {
  UserAccount,
  BlockSection,
  BridgeRecord,
  LevelCrossingRecord,
  OfficerStaffRecord,
  KeymanRecord,
  PatrolShiftRecord,
  PointCrossingRecord,
  CurveRecord,
  TrackDefectRecord
} from '../types/index.ts';

export interface SeedDatabase {
  users: UserAccount[];
  jurisdiction: BlockSection[];
  bridges: BridgeRecord[];
  level_crossings: LevelCrossingRecord[];
  officers_staff: OfficerStaffRecord[];
  keymen: KeymanRecord[];
  patrol_shifts: PatrolShiftRecord[];
  points_crossings: PointCrossingRecord[];
  curves: CurveRecord[];
  track_defects: TrackDefectRecord[];
}

export const SEED_DATA: SeedDatabase = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync(tsDataPath, tsContent, 'utf8');
console.log(`Wrote ${tsDataPath}`);
