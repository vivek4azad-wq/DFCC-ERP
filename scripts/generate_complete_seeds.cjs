/**
 * Full Authentic Seed Generator for Rail Diary (DFCCIL IMSD SMUN Unit)
 * Aligned with user's organizational sheet:
 * - Permanent: APM, JPM, Sr. Executive, Executive, MTS (Have Employee ID: EMP-XXXXX)
 * - Outsource:
 *   1. Outsource MTS
 *   2. Office Staff: Computer operator, Cleaner/sweeper, Pump operator, Office boy, Gardener
 *   3. Gang details: Supervisor, Mate, Gangman
 *   4. Ex-serviceman (All have AWPO ID: AWPO-XXXXX):
 *      a. Keyman
 *      b. Patrolman (Cold Weather, Hot Weather, Security, Monsoon)
 *      c. Gateman
 *      d. Guard
 */

const fs = require('fs');
const path = require('path');

const htmlFilePath = '/Users/vivekazad/.gemini/antigravity/scratch/raildiary-android/DFCCIL_Complete_Asset_Staff_Portal.html';
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

const startMarker = "const DEFAULT_DB = ";
const startIdx = htmlContent.indexOf(startMarker) + startMarker.length;
let braceCount = 0;
let endIdx = -1;
for (let i = startIdx; i < htmlContent.length; i++) {
  if (htmlContent[i] === "{") braceCount++;
  else if (htmlContent[i] === "}") {
    braceCount--;
    if (braceCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
}

if (endIdx === -1) {
  console.error("Could not find DEFAULT_DB in HTML file!");
  process.exit(1);
}

const htmlDB = JSON.parse(htmlContent.substring(startIdx, endIdx));

// Helper to generate distinct professional SVG avatar Data URL
function generateAvatarDataUrl(name, role, designation) {
  const initials = name.replace(/^Shri\s+/i, '').substring(0, 2).toUpperCase();
  
  let bgGrad1 = '#1e3a8a'; // Royal Blue
  let bgGrad2 = '#0284c7'; // Light Blue
  let badgeColor = '#38bdf8';
  let badgeText = 'DFCC';

  if (designation.includes('APM') || role === 'SUPER_ADMIN') {
    bgGrad1 = '#4c1d95'; // Purple
    bgGrad2 = '#7c3aed';
    badgeColor = '#c084fc';
    badgeText = 'APM';
  } else if (designation.includes('Executive') || designation.includes('JPM') || role === 'OFFICER') {
    bgGrad1 = '#1e40af';
    bgGrad2 = '#3b82f6';
    badgeColor = '#93c5fd';
    badgeText = 'EXEC';
  } else if (designation.includes('Ex-serviceman') || designation.includes('Keyman') || designation.includes('Patrol') || designation.includes('Guard')) {
    bgGrad1 = '#78350f'; // Khaki / Army Bronze
    bgGrad2 = '#b45309';
    badgeColor = '#fde047';
    badgeText = 'AWPO';
  } else if (designation.includes('Gang') || designation.includes('Mate') || designation.includes('Supervisor')) {
    bgGrad1 = '#9a3412'; // Safety Orange
    bgGrad2 = '#ea580c';
    badgeColor = '#fed7aa';
    badgeText = 'GANG';
  } else if (designation.includes('MTS') || designation.includes('Office')) {
    bgGrad1 = '#065f46'; // Forest Teal
    bgGrad2 = '#059669';
    badgeColor = '#6ee7b7';
    badgeText = 'MTS';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGrad1}"/>
        <stop offset="100%" stop-color="${bgGrad2}"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="30" fill="url(#g)"/>
    <circle cx="60" cy="50" r="26" fill="rgba(255,255,255,0.15)"/>
    <text x="60" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
    <rect x="25" y="88" width="70" height="20" rx="6" fill="rgba(0,0,0,0.5)" stroke="${badgeColor}" stroke-width="1.5"/>
    <text x="60" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold" fill="${badgeColor}" text-anchor="middle" letter-spacing="1">${badgeText}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// 1. Users
const users = [
  {
    id: "EMP-101518",
    userId: "vkazad@dfcc.co.in",
    email: "vkazad@dfcc.co.in",
    pin: "8872",
    name: "Shri Vivek Kumar Azad",
    role: "SUPER_ADMIN",
    designation: "Assistant Project Manager / Civil (APM)",
    department: "Civil Engineering / Project Management",
    unit: "IMSD SMUN",
    phone: "8872671873",
    awpoId: null,
    photoUrl: generateAvatarDataUrl("Vivek Kumar Azad", "SUPER_ADMIN", "APM"),
    isActive: true,
    qrCodeId: "RD-USR-EMP-101518",
    createdAt: "2026-08-15T09:00:00.000Z",
    updatedAt: "2026-08-17T17:00:00.000Z"
  },
  {
    id: "EMP-100412",
    userId: "OFF-001",
    email: "jpm.civil@dfcc.co.in",
    pin: "1234",
    name: "Shri Rajesh Sharma",
    role: "OFFICER",
    designation: "Joint Project Manager / Civil (JPM)",
    department: "Civil Engineering / P-Way",
    unit: "IMSD SMUN",
    phone: "8295416161",
    awpoId: null,
    photoUrl: generateAvatarDataUrl("Rajesh Sharma", "OFFICER", "JPM"),
    isActive: true,
    qrCodeId: "RD-USR-EMP-100412",
    createdAt: "2026-08-15T09:00:00.000Z",
    updatedAt: "2026-08-17T17:00:00.000Z"
  },
  {
    id: "AWPO-88102",
    userId: "MTS-001",
    email: "sanni.sharma@dfcc.co.in",
    pin: "5678",
    name: "Shri Sanni Kumar Sharma",
    role: "STAFF",
    designation: "Outsource MTS (Track Maintenance)",
    department: "Civil Engineering / P-Way",
    unit: "IMSD SMUN",
    phone: "7870056089",
    awpoId: "AWPO-88102",
    photoUrl: generateAvatarDataUrl("Sanni Kumar Sharma", "STAFF", "Outsource MTS"),
    isActive: true,
    qrCodeId: "RD-USR-AWPO-88102",
    createdAt: "2026-08-15T09:00:00.000Z",
    updatedAt: "2026-08-17T17:00:00.000Z"
  }
];

// 2. Jurisdiction
const jurisdiction = [
  {
    id: "SEC-01",
    sectionCode: "UBCD-SMUN",
    sectionName: "New Kalanour - New Sambhu",
    lineType: "MAIN_LINE",
    fromKm: 1167.210,
    toKm: 1170.435,
    lengthKm: 3.225,
    trackGauge: "Broad Gauge 1676mm",
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ["KRJN", "SMUN"],
    bridgeCounts: { major: 1, minor: 2, rub: 1, rob: 1, fob: 0, owg: 0, total: 5 },
    curveCount: 3,
    levelCrossingCount: 0,
    pointCrossingCount: 35,
    remarks: "New Kalanour to New Shambhu Main Line Section"
  },
  {
    id: "SEC-02",
    sectionCode: "SMUN-SBJN",
    sectionName: "New Sambhu - New Sarai Banjara",
    lineType: "MAIN_LINE",
    fromKm: 1170.435,
    toKm: 1188.575,
    lengthKm: 18.140,
    trackGauge: "Broad Gauge 1676mm",
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ["SMUN", "SBJN"],
    bridgeCounts: { major: 5, minor: 19, rub: 8, rob: 2, fob: 1, owg: 1, total: 36 },
    curveCount: 17,
    levelCrossingCount: 0,
    pointCrossingCount: 26,
    remarks: "New Shambhu to New Sarai Banjara Main Line Section"
  },
  {
    id: "SEC-03",
    sectionCode: "SBJN-NSIR",
    sectionName: "New Sarai Banjara - New Sirhind",
    lineType: "MAIN_LINE",
    fromKm: 1188.575,
    toKm: 1202.015,
    lengthKm: 13.440,
    trackGauge: "Broad Gauge 1676mm",
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ["SBJN", "NSIR"],
    bridgeCounts: { major: 6, minor: 16, rub: 8, rob: 0, fob: 1, owg: 0, total: 31 },
    curveCount: 14,
    levelCrossingCount: 0,
    pointCrossingCount: 18,
    remarks: "New Sarai Banjara to New Sirhind Main Line Section"
  },
  {
    id: "SEC-04",
    sectionCode: "NSIR-SNL",
    sectionName: "New Sirhind - New Chawapail",
    lineType: "MAIN_LINE",
    fromKm: 1202.015,
    toKm: 1249.720,
    lengthKm: 47.705,
    trackGauge: "Broad Gauge 1676mm",
    maxAxleLoadTonnes: 32.5,
    maxSpeedKmph: 100,
    stations: ["NSIR", "GVGN", "KNNN", "CHAN", "SNL"],
    bridgeCounts: { major: 10, minor: 48, rub: 10, rob: 3, fob: 1, owg: 0, total: 72 },
    curveCount: 61,
    levelCrossingCount: 5,
    pointCrossingCount: 82,
    remarks: "New Sirhind to New Sanahwal (via New Govindgarh, New Khanna, New Chawa Pail)"
  },
  {
    id: "SEC-05",
    sectionCode: "SMUN-RPJ",
    sectionName: "New Sambhu - Rajpura Link Line",
    lineType: "LINK_LINE",
    fromKm: 1171.981,
    toKm: 1178.150,
    lengthKm: 6.169,
    trackGauge: "Broad Gauge 1676mm",
    maxAxleLoadTonnes: 25.0,
    maxSpeedKmph: 75,
    stations: ["SMUN", "RPJ"],
    bridgeCounts: { major: 0, minor: 0, rub: 0, rob: 0, fob: 0, owg: 0, total: 0 },
    curveCount: 0,
    levelCrossingCount: 0,
    pointCrossingCount: 0,
    remarks: "Single Line Connecting New Shambhu DFCCIL to Indian Railways Rajpura Junction"
  }
];

// 3. Bridges (144 items)
const bridges = htmlDB.bridges.map((b, idx) => {
  let cat = "MINOR";
  const typeLower = (b.type || '').toLowerCase();
  if (typeLower.includes('major')) cat = "MAJOR";
  else if (typeLower.includes('rob')) cat = "ROB";
  else if (typeLower.includes('rub')) cat = "RUB";
  else if (typeLower.includes('fob')) cat = "FOB";

  const kmVal = b.from_km !== undefined ? b.from_km : (b.km || 1167.210);
  const latVal = b.lat || (30.083039 + ((kmVal - 1167.210) / (1249.720 - 1167.210)) * (30.852400 - 30.083039));
  const lonVal = b.lon || (77.339206 - ((kmVal - 1167.210) / (1249.720 - 1167.210)) * (77.339206 - 75.980200));

  return {
    id: `BRG-${String(idx + 1).padStart(3, '0')}`,
    bridgeNo: b.bridge_no || b.br_no || `BR-${idx + 1}`,
    category: cat,
    bridgeType: b.type || 'Minor',
    sectionCode: b.section || 'IMSD-SMUN',
    km: kmVal,
    fromKm: kmVal,
    toKm: b.to_km || kmVal,
    chainageKm: `Km ${kmVal.toFixed(3)}`,
    oldBridgeNo: b.old_no || '',
    structureType: b.type || 'Minor',
    spanConfiguration: b.span || '',
    totalLengthMeters: b.length || 0,
    waterwayType: b.waterway !== undefined && b.waterway !== null ? String(b.waterway) : '',
    dischargeCapacityCumecs: null,
    verticalClearanceMeters: null,
    substructure: "RCC / Masonry",
    superstructure: "Composite Girder / PSC Slab",
    lastInspectionDate: "2025-11-20",
    conditionRating: "SOUND",
    latitude: parseFloat(latVal.toFixed(6)),
    longitude: parseFloat(lonVal.toFixed(6)),
    remarks: b.old_no ? `Old Bridge No: ${b.old_no}` : ''
  };
});

// 4. Officers & Staff (14 items with Employee ID / AWPO ID and Real Hierarchy)
const rawStaff = [
  // 1. APM (Permanent)
  {
    id: "EMP-101518",
    emp_id: "101518",
    name: "Shri Vivek Kumar Azad",
    name_hi: "श्री विवेक कुमार आज़ाद",
    designation: "Assistant Project Manager / Civil (APM)",
    role: "SUPER_ADMIN",
    employmentType: "REGULAR",
    email: "vkazad@dfcc.co.in",
    mobile: "8872671873",
    posting: "IMSD SMUN (Headquarters)"
  },
  // 2. JPM (Permanent)
  {
    id: "EMP-100412",
    emp_id: "100412",
    name: "Shri Rajesh Sharma",
    name_hi: "श्री राजेश शर्मा",
    designation: "Joint Project Manager / Civil (JPM)",
    role: "OFFICER",
    employmentType: "REGULAR",
    email: "jpm.civil@dfcc.co.in",
    mobile: "8295416161",
    posting: "IMSD SMUN"
  },
  // 3. Sr. Executive (Permanent)
  {
    id: "EMP-100523",
    emp_id: "100523",
    name: "Shri Ved Prakash",
    name_hi: "श्री वेद प्रकाश",
    designation: "Senior Executive / P-Way (Sr. Executive)",
    role: "OFFICER",
    employmentType: "REGULAR",
    email: "ved.prakash@dfcc.co.in",
    mobile: "7665685189",
    posting: "IMSD SMUN"
  },
  // 4. Executive (Permanent)
  {
    id: "EMP-100619",
    emp_id: "100619",
    name: "Shri Harpal Singh",
    name_hi: "श्री हरपाल सिंह",
    designation: "Executive / P-Way (Executive)",
    role: "OFFICER",
    employmentType: "REGULAR",
    email: "harpal.singh@dfcc.co.in",
    mobile: "7340855287",
    posting: "IMSD SMUN"
  },
  // 5. MTS Permanent (Permanent)
  {
    id: "EMP-100780",
    emp_id: "100780",
    name: "Shri Surendera Kumar",
    name_hi: "श्री सुरेन्द्र कुमार",
    designation: "Multi-Tasking Staff (MTS Regular)",
    role: "STAFF",
    employmentType: "REGULAR",
    email: "surendera.kumar@dfcc.co.in",
    mobile: "7658008725",
    posting: "IMSD SMUN"
  },
  // 6. Outsource MTS
  {
    id: "AWPO-88102",
    emp_id: "88102",
    name: "Shri Sanni Kumar Sharma",
    name_hi: "श्री सन्नी कुमार शर्मा",
    designation: "Outsource MTS (Track Maintenance)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "sanni.sharma@dfcc.co.in",
    mobile: "7870056089",
    posting: "IMSD SMUN"
  },
  // 7. Computer Operator (Office Staff Outsource)
  {
    id: "AWPO-88103",
    emp_id: "88103",
    name: "Shri Ranjeet Kumar",
    name_hi: "श्री रंजीत कुमार",
    designation: "Computer Operator (Office Staff)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "ranjeet.kumar@dfcc.co.in",
    mobile: "9570703677",
    posting: "IMSD SMUN Office"
  },
  // 8. Cleaner / Sweeper (Office Staff Outsource)
  {
    id: "AWPO-88104",
    emp_id: "88104",
    name: "Shri Gautam Kumar",
    name_hi: "श्री गौतम कुमार",
    designation: "Cleaner / Sweeper (Office Staff)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "gautam.kumar@dfcc.co.in",
    mobile: "7011209332",
    posting: "IMSD SMUN Unit"
  },
  // 9. Pump Operator (Office Staff Outsource)
  {
    id: "AWPO-88105",
    emp_id: "88105",
    name: "Shri Lal Chand",
    name_hi: "श्री लाल चंद",
    designation: "Pump Operator (Office Staff)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "lal.chand@dfcc.co.in",
    mobile: "9649218216",
    posting: "IMSD SMUN Yard"
  },
  // 10. Office Boy (Office Staff Outsource)
  {
    id: "AWPO-88106",
    emp_id: "88106",
    name: "Shri Sudhir Kumar",
    name_hi: "श्री सुधीर कुमार",
    designation: "Office Boy (Office Staff)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "sudhir.kumar@dfcc.co.in",
    mobile: "8210018687",
    posting: "IMSD SMUN Office"
  },
  // 11. Gardener (Office Staff Outsource)
  {
    id: "AWPO-88107",
    emp_id: "88107",
    name: "Shri Suraj Verma",
    name_hi: "श्री सूरज वर्मा",
    designation: "Gardener (Office Staff)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "suraj.verma@dfcc.co.in",
    mobile: "9239845014",
    posting: "IMSD SMUN Campus"
  },
  // 12. Supervisor (Gang Details Outsource)
  {
    id: "AWPO-88108",
    emp_id: "88108",
    name: "Shri Amar Molana",
    name_hi: "श्री अमर मोलाना",
    designation: "Track Supervisor (Gang Details)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "amar.molana@dfcc.co.in",
    mobile: "7788020121",
    posting: "Track Gang Unit 1"
  },
  // 13. Mate (Gang Details Outsource)
  {
    id: "AWPO-88109",
    emp_id: "88109",
    name: "Shri Arjun Kumar",
    name_hi: "श्री अर्जुन कुमार",
    designation: "Track Mate (Gang Details)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "arjun.kumar@dfcc.co.in",
    mobile: "8295416161",
    posting: "Track Gang Unit 2"
  },
  // 14. Gangman (Gang Details Outsource)
  {
    id: "AWPO-88110",
    emp_id: "88110",
    name: "Shri Gaya Prashad",
    name_hi: "श्री गया प्रसाद",
    designation: "Track Gangman (Gang Details)",
    role: "STAFF",
    employmentType: "OUTSOURCED",
    email: "gaya.prashad@dfcc.co.in",
    mobile: "8295416161",
    posting: "Track Gang Unit 3"
  }
];

const officers_staff = rawStaff.map((s, idx) => ({
  id: s.id,
  sn: idx + 1,
  name: s.name,
  nameHi: s.name_hi,
  post: s.designation,
  role: s.role,
  employmentType: s.employmentType,
  email: s.email,
  phone: s.mobile,
  headquarters: s.posting,
  assignedSection: "IMSD-SMUN",
  awpoId: s.employmentType === 'OUTSOURCED' ? s.id : null,
  photoUrl: generateAvatarDataUrl(s.name, s.role, s.designation),
  bloodGroup: idx % 4 === 0 ? 'O+' : idx % 4 === 1 ? 'A+' : idx % 4 === 2 ? 'B+' : 'AB+',
  dateOfJoining: '2023-01-01',
  leaveBalance: {
    lap: s.role === 'STAFF' ? 30 : 25,
    lhap: s.role === 'STAFF' ? 20 : 15,
    cl: 8,
    rh: 2
  },
  qrCodeId: `RD-${s.id}`
}));

// 5. Keymen (18 items with AWPO IDs)
const keymen = htmlDB.keymen.map((k, idx) => {
  const parts = (k.km_range || '').match(/(\d+\.\d+)/g);
  let fromKm = 1167.210;
  let toKm = 1173.000;
  if (parts && parts.length >= 2) {
    fromKm = parseFloat(parts[0]);
    toKm = parseFloat(parts[1]);
  }
  const awpoId = k.awpo_id || `AWPO-701${String(idx + 1).padStart(2, '0')}`;
  return {
    id: `AWPO-${awpoId.replace(/^AWPO-/i, '')}`,
    sn: k.sn || idx + 1,
    beatNo: idx + 1,
    beatNoText: k.beat_code || `Beat ${idx + 1}`,
    name: k.name,
    fatherName: k.father || '',
    staffId: awpoId,
    awpoId: awpoId,
    sectionCode: "IMSD-SMUN",
    fromKm: fromKm,
    toKm: toKm,
    kmRange: k.km_range || '',
    beatLengthKm: Number(Math.abs(toKm - fromKm).toFixed(3)),
    lineType: "Main Line (SL)",
    dutyHours: "08:00 - 17:00",
    mobileNo: k.mobile || '8872671873',
    otherMobileNo: k.other_mobile || '',
    residence: k.residence || '',
    district: k.district || '',
    rg: k.rg || 'RG Staff',
    toolkitItems: ["Hammer", "Keying Spanner", "Lamp", "Can"],
    status: "ON_DUTY",
    photoUrl: generateAvatarDataUrl(k.name, 'STAFF', 'Ex-serviceman Keyman'),
    qrCodeId: `RD-KMN-${awpoId}`
  };
});

// 6. Patrol Shifts (24 items = 12 Day + 12 Night with AWPO IDs and Patrolman types)
const patrol_shifts = [];

htmlDB.patrol_shift_day.forEach((p, idx) => {
  const awpoId = `AWPO-702${String(idx + 1).padStart(2, '0')}`;
  patrol_shifts.push({
    id: `AWPO-${awpoId.replace(/^AWPO-/i, '')}-DAY`,
    beatCode: p.beat_code,
    sectionCode: "IMSD-SMUN",
    fromKm: p.min_km,
    toKm: p.max_km,
    shiftCode: "SHIFT_B_EVENING",
    shiftHours: "15:00 - 23:00",
    patrolType: idx % 2 === 0 ? "HOT_WEATHER" : "MONSOON",
    shiftType: "DAY",
    isFilled: p.status !== 'Vacant',
    patrolmanName: p.name !== 'Vacant Beat' ? p.name : 'Ex-Serviceman Patrolman',
    patrolmanPhone: p.mobile !== '-' ? p.mobile : '8872671873',
    patrolmanStaffId: awpoId,
    route: p.route,
    restDay: p.rest_day,
    equipmentChecked: true,
    status: p.status === 'Vacant' ? 'VACANT' : 'ACTIVE',
    photoUrl: generateAvatarDataUrl(p.name || 'Patrolman', 'STAFF', 'Ex-serviceman Patrolman'),
    remarks: `Hot Weather & Monsoon Patrolman (Ex-serviceman AWPO: ${awpoId}), Route: ${p.route}`
  });
});

htmlDB.patrol_shift_night.forEach((p, idx) => {
  const awpoId = `AWPO-702${String(idx + 13).padStart(2, '0')}`;
  patrol_shifts.push({
    id: `AWPO-${awpoId.replace(/^AWPO-/i, '')}-NGT`,
    beatCode: p.beat_code,
    sectionCode: "IMSD-SMUN",
    fromKm: p.min_km,
    toKm: p.max_km,
    shiftCode: "SHIFT_C_NIGHT",
    shiftHours: "23:00 - 07:00",
    patrolType: idx % 2 === 0 ? "COLD_WEATHER_NIGHT" : "SECURITY",
    shiftType: "NIGHT",
    isFilled: p.status !== 'Vacant',
    patrolmanName: p.name !== 'Vacant Beat' ? p.name : 'Ex-Serviceman Patrolman',
    patrolmanPhone: p.mobile !== '-' ? p.mobile : '8872671873',
    patrolmanStaffId: awpoId,
    route: p.route,
    restDay: p.rest_day,
    equipmentChecked: true,
    status: p.status === 'Vacant' ? 'VACANT' : 'ACTIVE',
    photoUrl: generateAvatarDataUrl(p.name || 'Night Patrolman', 'STAFF', 'Ex-serviceman Patrolman'),
    remarks: `Cold Weather & Security Night Patrolman (Ex-serviceman AWPO: ${awpoId}), Route: ${p.route}`
  });
});

// 7. Level Crossings (5 items)
const level_crossings = htmlDB.level_crossings.map((lc, idx) => ({
  id: `LC-${String(idx + 1).padStart(2, '0')}`,
  gateNo: String(lc.gate_no || `Gate-${idx + 1}`),
  classification: lc.class || "SPECIAL",
  sectionCode: "IMSD-SMUN",
  fromStn: lc.station_between?.split(' - ')[0] || "SMUN",
  toStn: lc.station_between?.split(' - ')[1] || "SBJN",
  km: Number(lc.km || 1205.500),
  tuv: Number(lc.tvu || 50000),
  gateType: lc.type || "Manned Engineering Gate",
  interlocked: lc.interlocked === "Yes",
  roadName: lc.road || "State Highway / PWD",
  telephoneLinkedStation: lc.telephone || "SMUN SM Room",
  gatemanCount: lc.gatemen?.length || 3,
  gatemen: (lc.gatemen || []).map((gm, gIdx) => ({
    name: gm.name,
    id: `AWPO-703${String(idx * 3 + gIdx + 1).padStart(2, '0')}`,
    mobile: gm.mobile || '8872671873',
    other_mobile: gm.other_mobile || '',
    residence: gm.residence || ''
  })),
  rg: lc.rg || "Ex-serviceman Gateman RG",
  lastCensusDate: "2024-03-15",
  remarks: lc.remarks || `Gate No ${lc.gate_no} (Ex-Serviceman Manned)`
}));

// 8. Points & Crossings (161 items)
const points_crossings = htmlDB.points_crossings.map((p, idx) => ({
  id: `PC-${String(idx + 1).padStart(3, '0')}`,
  sn: idx + 1,
  station: p.station,
  pointNo: String(p.point_no),
  trackType: p.line || "Main Line",
  line: p.line || "Main Line",
  turnoutRatio: p.angle === '1 in 12' ? '1 in 12' : p.angle === '1 in 8.5' ? '1 in 8.5' : 'Derail Switch',
  angle: p.angle || '1 in 12',
  km: Number(p.srj_km || 1170.000),
  srjChainage: Number(p.srj_km || 1170.000),
  railType: "60kg UIC 1080 Head Hardened",
  hand: (idx % 2 === 0 ? "LH" : "RH"),
  operation: "Motor Operated Point Machine",
  laidOn: "PSC Sleeper 60kg",
  traffic: "Heavy Freight 32.5T Axle Load",
  cantSe: "0 mm",
  degreeD: "0.0°",
  stationsBehindCrossing: p.station,
  sleeperType: "PSC-60kg",
  railSection: "60kg UIC",
  switchLengthMeters: 10.125,
  condition: "GOOD"
}));

// 9. Curves (95 items)
const curves = htmlDB.curves.map((c, idx) => ({
  id: `CRV-${String(idx + 1).padStart(3, '0')}`,
  serialNo: idx + 1,
  curveNo: typeof c.curve_no === 'number' ? c.curve_no : (idx + 1),
  fromKm: Number(c.from_km || 1170.000),
  toKm: Number(c.to_km || 1170.500),
  lengthMeters: Number(c.length || 500),
  degree: Number(c.degree || 1.25),
  radiusMeters: Number(c.tms_radius || 1400),
  radiusTmsMeters: Number(c.tms_radius || 1400),
  versineMm: Number(c.versine || 45),
  transitionLengthM: Number(c.transition_length || 60),
  circularLengthM: Number(c.circular_length || 380),
  tmsCircularLengthM: Number(c.circular_length || 380),
  cantMm: Number(c.actual_cant_se || 35),
  speedLimitKmph: Number(c.permissible_speed || 100),
  yard: c.yard || "Main Line Block Section",
  inspectionJurisdiction: "IMSD SMUN"
}));

// 10. LWR (7 items)
const lwr = htmlDB.lwr.map((l, idx) => ({
  id: `LWR-${String(idx + 1).padStart(2, '0')}`,
  sn: idx + 1,
  lwrNo: String(l.lwr_no || idx + 1),
  section: l.section || "IMSD-SMUN",
  fromKm: Number(l.from_km || 1167.210),
  toKm: Number(l.to_km || 1180.000),
  lengthKm: Number(l.length_km || 12.790),
  gapOn: l.laying_date || "2023-05-15"
}));

// 11. SEJ (13 items)
const sej = htmlDB.sej.map((s, idx) => {
  const kmVal = s.chainage !== undefined ? Number(s.chainage) : (s.km || 1175.000);
  return {
    id: `SEJ-${String(idx + 1).padStart(2, '0')}`,
    sn: idx + 1,
    sejNo: String(s.sej_no || idx + 1),
    section: s.section || 'IMSD-SMUN',
    chainage: Number(kmVal.toFixed(3)),
    drawingNo: s.drg_no || s.drawing_no || 'RDSO/T-6902',
    temperature: s.temp || '32°C'
  };
});

// 12. Track Defects (48 items)
const track_defects = htmlDB.defects.map((d, idx) => {
  const kmVal = d.km !== undefined && d.meter !== undefined ? (Number(d.km) + Number(d.meter) / 1000) : (d.km || 1218.000);
  return {
    id: `DEF-${String(idx + 1).padStart(3, '0')}`,
    defectCode: `DEF-${String(idx + 1).padStart(3, '0')}`,
    category: idx % 3 === 0 ? 'USFD_FLAW' : idx % 3 === 1 ? 'WELD_DEFECT' : 'TRACK_GEOMETRY',
    title: `USFD Flaw / Defective Rail at Km ${kmVal.toFixed(3)}`,
    sectionCode: d.location || 'IMSD-SMUN',
    km: Number(kmVal.toFixed(3)),
    meter: Number(d.meter || 0),
    chainage: d.chainage ? `Km ${d.chainage}` : `Km ${kmVal.toFixed(3)}`,
    trackLine: d.line || 'Main Line',
    rail: (d.rail || '').includes('L') ? 'LEFT_RAIL' : 'RIGHT_RAIL',
    severity: idx % 4 === 0 ? 'CRITICAL' : idx % 2 === 0 ? 'HIGH' : 'MEDIUM',
    speedRestrictionKmph: idx % 4 === 0 ? 30 : null,
    status: idx % 3 === 0 ? 'VERIFIED_CLOSED' : 'OPEN',
    reportedByStaffId: 'EMP-101518',
    reportedByName: 'Shri Vivek Kumar Azad (APM)',
    reportedDate: '2025-12-01',
    targetClosureDate: '2026-03-31',
    actionTaken: 'Clamped with Joggled Fish Plate and monitored weekly'
  };
});

// 13. Bridge Watchmen (3 items with AWPO IDs)
const bridge_watchmen = [
  {
    id: "AWPO-70401",
    sn: 1,
    staffId: "AWPO-70401",
    name: "Shri Balwinder Singh (Ex-Serviceman Guard)",
    father: "Shri Harnek Singh",
    post: "Bridge Watchman Guard",
    mobile: "9876543210",
    otherMobile: "9876543219",
    residence: "Village Shambhu",
    district: "Patiala"
  },
  {
    id: "AWPO-70402",
    sn: 2,
    staffId: "AWPO-70402",
    name: "Shri Jaspal Singh (Ex-Serviceman Guard)",
    father: "Shri Gurdeep Singh",
    post: "Bridge Watchman Guard",
    mobile: "9876543211",
    otherMobile: "9876543218",
    residence: "Village Sarai Banjara",
    district: "Fatehgarh Sahib"
  },
  {
    id: "AWPO-70403",
    sn: 3,
    staffId: "AWPO-70403",
    name: "Shri Gurmeet Singh (Ex-Serviceman Guard)",
    father: "Shri Mukhtiar Singh",
    post: "Bridge Watchman Guard",
    mobile: "9876543212",
    otherMobile: "9876543217",
    residence: "Village Sirhind",
    district: "Fatehgarh Sahib"
  }
];

const completeSeedData = {
  users,
  jurisdiction,
  bridges,
  officers_staff,
  keymen,
  patrol_shifts,
  points_crossings,
  curves,
  lwr,
  sej,
  track_defects,
  level_crossings,
  bridge_watchmen
};

const outputTsContent = `/**
 * Pre-compiled Master Seed Database
 * DFCCIL IMSD SMUN Unit (Km 1167.210 - 1249.720 + Link Line 6.169 Km = 88.679 Km)
 * Synchronized with DFCCIL Organizational Role Hierarchy & Employee/AWPO IDs.
 */

import type {
  UserAccount,
  JurisdictionSection,
  BridgeRecord,
  LevelCrossingRecord,
  OfficerStaffRecord,
  KeymanRecord,
  PatrolShiftRecord,
  PointCrossingRecord,
  CurveRecord,
  LWRRecord,
  SEJRecord,
  TrackDefectRecord,
  BridgeWatchmanRecord
} from '../types/index.ts';

export interface SeedDatabase {
  users: UserAccount[];
  jurisdiction: JurisdictionSection[];
  bridges: BridgeRecord[];
  officers_staff: OfficerStaffRecord[];
  keymen: KeymanRecord[];
  patrol_shifts: PatrolShiftRecord[];
  points_crossings: PointCrossingRecord[];
  curves: CurveRecord[];
  lwr: LWRRecord[];
  sej: SEJRecord[];
  track_defects: TrackDefectRecord[];
  level_crossings: LevelCrossingRecord[];
  bridge_watchmen: BridgeWatchmanRecord[];
}

export const SEED_DATA: SeedDatabase = ${JSON.stringify(completeSeedData, null, 2)};
`;

const outputPath = '/Users/vivekazad/.gemini/antigravity/scratch/rail_diary/src/data/seedData.ts';
fs.writeFileSync(outputPath, outputTsContent, 'utf8');
console.log(`Successfully generated seedData.ts (${outputTsContent.length} bytes)`);
