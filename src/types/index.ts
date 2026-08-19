/**
 * Rail Diary - Complete TypeScript Definitions
 * DFCCIL IMSD SMUN Unit (Km 1167.210 – 1249.720 + Link Line 6.169 Km = 88.679 Km)
 */

// ---------------------------------------------------------------------------
// RBAC Roles & Authentication
// ---------------------------------------------------------------------------

export type UserRole = 'SUPER_ADMIN' | 'OFFICER' | 'STAFF' | 'STORE_KEEPER';

export interface UserAccount {
  id: string;
  userId: string;
  email: string | null;
  pin: string;
  name: string;
  role: UserRole;
  designation: string;
  department: string;
  unit: string;
  phone: string;
  employeeId?: string | null;
  awpoId?: string | null;
  photoUrl?: string;
  isActive: boolean;
  qrCodeId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export type AuthUser = UserAccount;
export type UserSession = UserAccount;

// ---------------------------------------------------------------------------
// Collection Names
// ---------------------------------------------------------------------------

export type CollectionName =
  | 'users'
  | 'jurisdiction'
  | 'bridges'
  | 'level_crossings'
  | 'officers_staff'
  | 'keymen'
  | 'patrol_shifts'
  | 'points_crossings'
  | 'curves'
  | 'track_defects'
  | 'lwr'
  | 'sej'
  | 'bridge_watchmen'
  | 'stations'
  | 'staff_attendance'
  | 'attendance_holidays'
  | 'pway_daily_progress'
  | 'pway_monthly_program'
  | 'pway_week_program'
  | 'pway_inspections'
  | 'gang_work_types'
  | 'store_items'
  | 'store_transactions';

export const ALL_COLLECTIONS: CollectionName[] = [
  'users',
  'jurisdiction',
  'bridges',
  'level_crossings',
  'officers_staff',
  'keymen',
  'patrol_shifts',
  'points_crossings',
  'curves',
  'track_defects',
  'lwr',
  'sej',
  'bridge_watchmen',
  'stations',
  'staff_attendance',
  'attendance_holidays',
  'pway_daily_progress',
  'pway_monthly_program',
  'pway_week_program',
  'pway_inspections',
  'gang_work_types',
  'store_items',
  'store_transactions'
];

export interface StationRecord {
  id: string;
  code: string;
  name: string;
  chainage: number | string;
  km: number;
  latitude: number;
  longitude: number;
  gps_lat?: number;
  gps_lon?: number;
  navigation_link?: string;
  map_link?: string;
  source?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 1. Jurisdiction & Spatial Geometry
// ---------------------------------------------------------------------------

export interface BlockSection {
  id: string;
  sectionCode?: string;
  sectionName?: string;
  fromStation?: string;
  toStation?: string;
  fromKm?: number;
  toKm?: number;
  lengthKm?: number;
  lineType?: 'MAIN_LINE' | 'LINK_LINE' | string;
  trackType?: 'UP_LINE' | 'DOWN_LINE' | 'SINGLE_LINE' | string;
  speedLimitKmph?: number;
  gmt?: number;
  railSection?: string;
  sleeperDensity?: number;
  ballastCushionMm?: number;
  trackGauge?: string;
  maxAxleLoadTonnes?: number;
  maxSpeedKmph?: number;
  stations?: string[];
  remarks?: string;
  [key: string]: any;
}

export type JurisdictionRecord = BlockSection;
export type JurisdictionSection = BlockSection;

// ---------------------------------------------------------------------------
// 2. Bridges & Cross Drainage Structures (Target: 144 items)
// ---------------------------------------------------------------------------

export type BridgeCategory = 'MAJOR' | 'MINOR' | 'RUB' | 'ROB' | 'FOB' | 'OWG' | string;
export type BridgeCondition = 'SOUND' | 'SATISFACTORY' | 'ATTENTION_DUE' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | string;

export interface BridgeRecord {
  id: string;
  sn?: number;
  bridgeNo: string;
  bridge_no?: string;
  category: BridgeCategory;
  bridgeType?: string; // MJB, MIB, RUB, ROB, FOB, OWG
  type?: string;
  sectionCode: string;
  section?: string;
  km: number;
  fromKm?: number;
  from_km?: number;
  toKm?: number;
  to_km?: number;
  chainageKm?: string | number;
  oldBridgeNo?: string;
  old_no?: string;
  structureType: string;
  spanConfiguration: string;
  span?: string;
  totalLengthMeters: number;
  length?: number;
  waterwayType: string;
  waterway?: string | number;
  dischargeCapacityCumecs?: number | null;
  verticalClearanceMeters?: number | null;
  substructure: string;
  superstructure: string;
  lastInspectionDate: string;
  conditionRating: BridgeCondition;
  latitude: number;
  longitude: number;
  remarks?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 3. Level Crossings (Target: 5 items)
// ---------------------------------------------------------------------------

export type LCClassification = 'SPECIAL' | 'CLASS_A' | 'CLASS_B' | 'CLASS_C';

export interface GatemanEntry {
  name: string;
  id: string;
  mobile: string;
  other_mobile?: string;
  otherMobile?: string;
  residence?: string;
  photoUrl?: string;
  [key: string]: any;
}

export interface LevelCrossingRecord {
  id: string;
  sn?: number;
  gateNo: string;
  lc_no?: string;
  chainage?: number | string;
  classification: string;
  class?: string;
  sectionCode: string;
  section?: string;
  fromStn: string;
  from_stn?: string;
  toStn: string;
  to_stn?: string;
  km: number;
  tuv?: number;
  gateType: string;
  interlocked: boolean;
  roadName: string;
  telephoneLinkedStation?: string;
  gatemanCount?: number;
  gatemen?: GatemanEntry[];
  rg?: string;
  lastCensusDate?: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lon?: number;
  remarks?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 4. Officers & Staff (Target: 14 items)
// ---------------------------------------------------------------------------

export type AppUserRole = 'APM' | 'Executive' | 'MTS' | 'StoreKeeper';

export type StaffCategory = 'PERMANENT' | 'OUTSOURCE' | 'EX_SERVICEMAN';
export type StaffDutyType = 'OFFICER' | 'KEYMAN' | 'PATROLMAN' | 'GATEMAN' | 'WATCHMAN' | 'OFFICE' | 'GANG' | 'MTS';
export type PermanentDesignation = 'Dy.PM' | 'APM' | 'JPM' | 'Sr.Executive' | 'Executive' | 'Jr.Executive' | 'MTS';

export type EmploymentType = 'REGULAR' | 'OUTSOURCED' | 'CONTRACT' | 'DEPUTATION' | 'PERMANENT' | 'OUTSOURCE';

export interface LeaveBalance {
  lap: number;
  lhap: number;
  cl: number;
  rh: number;
}

export interface OfficerStaffRecord {
  id: string;
  sn?: number;
  name: string;
  nameHi?: string;
  fatherName?: string;
  post: string;
  designation?: string;
  role: UserRole;
  staffCategory?: StaffCategory;
  dutyType?: StaffDutyType;
  employmentType: EmploymentType;
  email: string;
  phone: string;
  emergencyContact?: string;
  headquarters: string;
  assignedSection: string;
  leaveBalance: LeaveBalance;
  qrCodeId: string;
  dateOfJoining?: string;
  joiningDate?: string;
  pmeDate?: string;
  leaveDate?: string;
  beatNo?: string;
  beatFromTo?: string;
  patrolPairId?: string | null;
  patrolPartnerId?: string | null;
  patrolPartnerName?: string | null;
  shiftType?: 'DAY' | 'NIGHT';
  bloodGroup?: string;
  employeeId?: string | null;
  awpoId?: string | null;
  photoUrl?: string;
  remarks?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 5. Keymen (Target: 18 items)
// ---------------------------------------------------------------------------

export type KeymanStatus = 'ON_DUTY' | 'OFF_DUTY' | 'ON_LEAVE';

export interface KeymanRecord {
  id: string;
  sn?: number;
  beatNo: number;
  beatNoText: string;
  name: string;
  fatherName?: string;
  staffId: string;
  awpoId?: string;
  sectionCode: string;
  fromKm: number;
  toKm: number;
  kmRange?: string;
  beatLengthKm: number;
  lineType: string;
  dutyHours: string;
  mobileNo: string;
  otherMobileNo?: string;
  residence?: string;
  district?: string;
  rg?: string;
  toolkitItems: string[];
  status: KeymanStatus;
  qrCodeId: string;
  photoUrl?: string;
  remarks?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 6. Patrol Shifts (Target: 24 items = 12 Day + 12 Night)
// ---------------------------------------------------------------------------

export type ShiftCode = 'SHIFT_A_MORNING' | 'SHIFT_A_DAY' | 'SHIFT_B_EVENING' | 'SHIFT_C_NIGHT';
export type PatrolType = 'HOT_WEATHER' | 'COLD_WEATHER_NIGHT' | 'MONSOON' | 'SECURITY';
export type PatrolStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'VACANT';

export interface PatrolShiftRecord {
  id: string;
  beatCode: string;
  sectionCode: string;
  fromKm: number;
  toKm: number;
  shiftCode: ShiftCode;
  shiftHours: string;
  patrolType: PatrolType;
  shiftType?: 'DAY' | 'NIGHT';
  isFilled: boolean;
  patrolmanName?: string | null;
  patrolmanStaffId?: string | null;
  patrolPartnerId?: string | null;
  patrolPartnerName?: string | null;
  patrolmanPhone?: string | null;
  route?: string;
  restDay?: string;
  equipmentChecked: boolean;
  status: PatrolStatus;
  photoUrl?: string;
  remarks?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 7. Points & Crossings (Target: 161 items)
// ---------------------------------------------------------------------------

export type PointHand = 'LH' | 'RH';
export type PointCondition = 'GOOD' | 'MAINTENANCE_DUE' | 'NEEDS_TAMPING';

export interface PointCrossingRecord {
  id: string;
  sn?: number;
  station: string;
  pointNo: string;
  point_no?: string;
  trackType: string;
  line?: string;
  turnoutRatio: string;
  angle?: string;
  km: number;
  srjChainage?: number;
  srj_chainage?: number;
  railType: string;
  hand: PointHand | string;
  lh_rh?: string;
  operation: string;
  laidOn?: string;
  laid_on?: string;
  traffic?: string;
  cantSe?: string;
  se?: string;
  degreeD?: string;
  d?: string;
  stationsBehindCrossing?: string | number | null;
  stations_behind_xing?: string | number | null;
  sleeperType: string;
  railSection: string;
  switchLengthMeters: number;
  condition: PointCondition | string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 8. Curves (Target: 95 items)
// ---------------------------------------------------------------------------

export interface CurveRecord {
  id: string;
  serialNo?: number;
  sn?: number;
  curveNo: number;
  curve_no?: number;
  fromKm: number;
  from_km?: number;
  toKm: number;
  to_km?: number;
  lengthMeters: number;
  length_m?: number;
  degree: number;
  radiusMeters: number;
  radius?: number;
  radiusTmsMeters?: number;
  radius_tms?: number;
  versineMm?: number;
  versine?: number;
  transitionLengthM?: number;
  tl?: number;
  circularLengthM?: number;
  cl?: number;
  tmsCircularLengthM?: number;
  tms_cl?: number;
  cantMm?: number;
  se?: number;
  speedLimitKmph?: number;
  yard?: string;
  yard_info?: string;
  inspectionJurisdiction?: string;
  inspect_type?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 9. Track Defects (Target: 48 items)
// ---------------------------------------------------------------------------

export type DefectCategory =
  | 'USFD_FLAW'
  | 'TRACK_GEOMETRY'
  | 'FASTENERS'
  | 'WELD_DEFECT'
  | 'SEJ_DEFECT'
  | 'BALLAST_FORMATION'
  | 'POINTS_CROSSINGS'
  | 'Ballast Deficiency'
  | 'Gauge Spread'
  | 'Cross-level Discrepancy'
  | 'SEJ Gap Variation'
  | 'Weld Misalignment'
  | 'Squat / Wheel Burn'
  | 'Fastener Missing'
  | string;

export type DefectSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MAJOR' | 'MINOR' | string;
export type DefectStatus = 'OPEN' | 'WORK_IN_PROGRESS' | 'ATTENDED' | 'VERIFIED_CLOSED' | 'CLOSED' | string;
export type RailSide = 'LEFT_RAIL' | 'RIGHT_RAIL' | 'BOTH_RAILS' | string;

export interface TrackDefectRecord {
  id: string;
  defectCode: string;
  category: DefectCategory;
  title: string;
  description: string;
  sectionCode: string;
  km: number;
  meter?: number;
  chainage?: string;
  chainageKm?: number | string;
  trackLine?: string;
  lineType?: string;
  rail?: RailSide;
  severity: DefectSeverity;
  speedRestrictionKmph?: number | null;
  status: DefectStatus;
  reportedByStaffId?: string;
  reportedByName?: string;
  reportedBy?: string;
  reportedDate?: string;
  targetClosureDate?: string;
  targetDate?: string;
  actionTaken?: string;
  closedDate?: string | null;
  location?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 10. LWR (Target: 7 items)
// ---------------------------------------------------------------------------

export interface LWRRecord {
  id: string;
  sn?: number;
  lwrNo: string;
  section?: string;
  sectionCode?: string;
  fromKm: number;
  toKm: number;
  lengthKm?: number;
  lengthMeters?: number;
  gapOn?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 11. SEJ (Target: 13 items)
// ---------------------------------------------------------------------------

export interface SEJRecord {
  id: string;
  sn?: number;
  sejNo: string;
  section?: string;
  sectionCode?: string;
  chainage?: number;
  locationKm?: number;
  drawingNo?: string;
  temperature?: string | number;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 12. Bridge Watchmen (Target: 3 items)
// ---------------------------------------------------------------------------

export interface BridgeWatchmanRecord {
  id: string;
  sn?: number;
  name: string;
  awpoId: string;
  phone: string;
  emergencyContact: string;
  bridgeNo: string;
  location: string;
  dutyShift: string;
  photoUrl?: string;
  remarks?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Generic Database Types & Unified Asset Record
// ---------------------------------------------------------------------------

export type AnyDocument =
  | UserAccount
  | BlockSection
  | BridgeRecord
  | LevelCrossingRecord
  | OfficerStaffRecord
  | KeymanRecord
  | PatrolShiftRecord
  | PointCrossingRecord
  | CurveRecord
  | TrackDefectRecord
  | LWRRecord
  | SEJRecord
  | BridgeWatchmanRecord;

export type AssetCategoryName =
  | 'Bridge'
  | 'Curve'
  | 'Point & Crossing'
  | 'Level Crossing'
  | 'Track Defect'
  | 'Keyman Beat'
  | 'Patrol Shift'
  | 'LWR'
  | 'SEJ'
  | 'Bridge Watchman';

export interface UnifiedAssetItem {
  id: string;
  category: AssetCategoryName;
  title: string;
  chainageText: string;
  startKm: number;
  endKm: number;
  sectionOrStation: string;
  details: Record<string, string | number | boolean | null | undefined>;
  latitude?: number;
  longitude?: number;
  severity?: DefectSeverity;
  status?: string;
}

// ---------------------------------------------------------------------------
// Km Quick Finder Types
// ---------------------------------------------------------------------------

export type KmLineFilter = 'ALL' | 'MAIN' | 'LINK';

export interface KmQueryOptions {
  fromKm: number;
  toKm: number;
  line?: KmLineFilter;
  category?: AssetCategoryName | 'ALL';
}

export interface KmSearchResult {
  query: KmQueryOptions;
  normalizedFromKm: number;
  normalizedToKm: number;
  totalCount: number;
  items: UnifiedAssetItem[];
}

// ---------------------------------------------------------------------------
// Database Service Interface
// ---------------------------------------------------------------------------

export interface IDatabaseService {
  getCollection<T extends { id: string }>(collection: CollectionName): Promise<T[]>;
  getDocument<T extends { id: string }>(collection: CollectionName, id: string): Promise<T | null>;
  addDocument<T extends { id?: string }>(collection: CollectionName, data: T, user?: UserSession | null): Promise<string>;
  updateDocument<T>(collection: CollectionName, id: string, updates: Partial<T>, user?: UserSession | null): Promise<void>;
  deleteDocument(collection: CollectionName, id: string, user?: UserSession | null): Promise<void>;
  queryDocuments<T extends { id: string }>(collection: CollectionName, predicate: (item: T) => boolean): Promise<T[]>;
  searchKmRange(options: KmQueryOptions): Promise<KmSearchResult>;
  reseedDatabase(): Promise<void>;
  isInitialized(): Promise<boolean>;
  subscribe(listener: () => void): () => void;
}

// ---------------------------------------------------------------------------
// QR Code Types
// ---------------------------------------------------------------------------

export interface StaffQRPayload {
  app: 'RailDiary-DFCCIL';
  ver: '1.0';
  qrId: string;
  staffId: string;
  name: string;
  designation: string;
  role: UserRole;
  unit: string;
  section: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  awpoId?: string | null;
}

// ---------------------------------------------------------------------------
// Analytics Data Types
// ---------------------------------------------------------------------------

export interface AnalyticsSummary {
  corridorLengthKm: number;
  totalAssetsCount: number;
  staffCount: number;
  keymenCount: number;
  defectsCount: number;
  staffByDesignation: Record<string, number>;
  assetCountsByCategory: {
    bridges: number;
    curves: number;
    pointsCrossings: number;
    levelCrossings: number;
    total: number;
  };
  bridgeTypeCounts: {
    major: number;
    minor: number;
    rub: number;
    rob: number;
    fob: number;
  };
  defectsByKmBlock: {
    labels: string[];
    counts: number[];
  };
  patrolShiftStatus: {
    filled: number;
    vacant: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// 9. Staff Daily Attendance & Monthly Absentee Statement
// ---------------------------------------------------------------------------

export type AttendanceStatus =
  | 'P'       // Present
  | 'A'       // Absent
  | 'L'       // Leave (Outsource)
  | 'LAP'     // Leave on Average Pay (Permanent)
  | 'LHAP'    // Leave on Half Average Pay (Permanent)
  | 'CL'      // Casual Leave (Permanent)
  | 'RH'      // Restricted Holiday (Permanent)
  | 'PL'      // Paternity / Maternity Leave (Permanent)
  | 'MED'     // Medical / Sick Leave (Permanent)
  | 'OFF'     // Scheduled Off / Shift Off (Both)
  | 'REST'    // Weekly Rest (Both)
  | 'WO'      // Weekly Off / Sunday (Both)
  | 'NH'      // National Holiday (Both)
  | 'CR'      // Compensatory Rest (Both)
  | 'OD';     // On Duty / Tour (Both)

export interface DailyAttendanceRecord {
  id: string; // `${date}_${staffId}`
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  designation: string;
  category: 'PERMANENT' | 'OFFICE_STAFF' | 'OUTSOURCE_GANG' | 'EX_SERVICEMAN' | 'OUTSOURCE' | 'KEYMAN' | 'PATROL' | 'GATEMAN' | 'WATCHMAN' | string;
  awpoId?: string;
  phone?: string;
  status: AttendanceStatus;
  remarks?: string;
  updatedBy?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface HolidayDeclarationRecord {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  title: string;
  type: 'NH' | 'REST' | 'SUNDAY' | 'SPECIAL';
  isNH: boolean;
  isRest: boolean;
  remarks?: string;
  declaredBy?: string;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// 10. P-Way Track Works, 1+15 Gang Daily Progress & Inspection Program
// ---------------------------------------------------------------------------

export type PWayWorkCategory =
  | 'GANG_WORK'           // 1+15 Gang Track Maintenance, lifting, packing, lining, gauge adjustment
  | 'DRAIN_CLEANING'      // Catch water drain, side drain de-silting & opening
  | 'JCB_WORK'            // Heavy earthwork, cess repair, debris removal, slope dressing
  | 'CESS_DEWEEDING'      // Vegetation removal, weed clearing along cess & formation
  | 'BALLAST_BOXING'      // Ballast profiling, crib filling, shoulder ballast dressing
  | 'PRE_POST_TAMPING'    // Pre-tamping survey & post-tamping measurement
  | 'OTHER';

export interface PWayDailyWorkRecord {
  id: string;
  date: string; // YYYY-MM-DD
  gangName: string; // e.g. "Gang No. 1 (1+15)"
  numPersons: number; // default: 16 (1 Supervisor + 15 Persons)
  fromKm: number;
  toKm: number;
  trackType: 'UP' | 'DN' | 'BOTH' | 'YARD' | 'LINK';
  section: string; // e.g. "SMUN-SBJN"
  workCategory: PWayWorkCategory;
  workCategoryTitle?: string;
  workDone: string; // Detailed description
  quantityOrLength?: string; // e.g. "450 m", "150 sleepers"
  supervisor: string; // Contractor Supervisor / Mate Name & Phone
  dfccilRep: string; // DFCCIL Representative (MTS) e.g. "Pinki Sharma (MTS)"
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  remarks?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  [key: string]: any;
}

export interface PWayMonthlyProgramRecord {
  id: string;
  month: number; // 0 - 11
  year: number; // 2025, 2026, 2027
  workCategory: PWayWorkCategory;
  categoryTitle: string;
  section: string;
  targetKmFrom: number;
  targetKmTo: number;
  targetQuantity: number; // in Km or units
  targetUnit: string; // "Km", "Nos", "Meters", "Cu.M"
  actualProgressQuantity: number;
  achievedPercentage: number;
  assignedAgency: string; // e.g. "IMSD Maintenance Gang 1+15"
  supervisorIncharge: string;
  dfccilIncharge: string; // e.g. "APM / Civil"
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  remarks?: string;
  [key: string]: any;
}

export type PWayInspectionType =
  | 'PUSH_TROLLEY'
  | 'FOOT_INSPECTION'
  | 'FOOT_PLATE'
  | 'CURVE'
  | 'POINTS_CROSSINGS'
  | 'LEVEL_CROSSING'
  | 'BRIDGE'
  | 'SEJ'
  | 'NIGHT_FOOT_PATROL'
  | 'SURPRISE_NIGHT'
  | 'OTHER';

export interface PWayScheduleInspectionRecord {
  id: string;
  inspectionType: PWayInspectionType;
  inspectionTypeName: string;
  inspectingOfficial: string; // e.g. "Vivek Kumar Azad (APM / Civil)"
  scheduleFrequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  targetMonth: number; // 0 - 11
  targetYear: number;
  targetDate: string; // YYYY-MM-DD
  inspectionDate?: string; // YYYY-MM-DD (when conducted)
  section: string;
  fromKm: number;
  toKm: number;
  complianceStatus: 'COMPLETED' | 'PENDING' | 'OVERDUE' | 'SCHEDULED';
  deficienciesNoted?: string;
  actionTaken?: string;
  remarks?: string;
  reportedBy?: string;
  [key: string]: any;
}

export interface PWayWeekProgramRecord {
  id: string;
  month: number; // 0 - 11
  year: number;
  weekNumber: 1 | 2 | 3 | 4 | 5;
  weekLabel: string; // e.g. "Week 1 (01 to 07 Mar)"
  dateRange: string; // "01/03/2026 – 07/03/2026"
  workCategory: PWayWorkCategory;
  categoryTitle: string;
  section: string;
  targetKmFrom: number;
  targetKmTo: number;
  targetQuantity: number;
  targetUnit: string;
  actualProgressQuantity: number;
  achievedPercentage: number;
  assignedAgency: string;
  supervisorIncharge: string;
  dfccilIncharge: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  remarks?: string;
  [key: string]: any;
}

export interface GangWorkTypeRecord {
  id: string;
  title: string;
  description?: string;
  category: string;
  createdAt: string;
  createdBy?: string;
  [key: string]: any;
}

export interface StoreItemRecord {
  id: string;
  itemCode: string; // e.g. "PWAY-ERC-MK3" or Price list code "49"
  name: string; // "Elastic Rail Clip" or "Crockery Items"
  category: string; // "T&P" | "C&P" | "Furniture" | "P.way material" | "P.way machines" | string
  categoryLabel: string;
  specification: string; // "RDSO/T-3701, 60kg Rail"
  unit: string; // "Nos", "Sets", "Tonnes", "Kgs", "Meters"
  currentStock: number;
  minBufferThreshold: number;
  location: string; // "IMSD SMUN Central Store"
  unitRate?: number;
  inwardTotal: number;
  outwardTotal: number;
  lastReceivedDate?: string;
  lastIssuedDate?: string;
  supplier?: string;
  remarks?: string;
  // Departmental Ledger & Tally Book Metadata (विभागीय खाता मिलान पुस्तक)
  tallyCodeNo?: string | number; // मिलान पत्र संख्या (e.g. 1)
  priceListCode?: string | number; // मूल्य सूची / कूट संख्या (e.g. 49)
  accountsFileNo?: string | number; // लेखा कार्यालय पृष्ठ संख्या (e.g. 3195)
  [key: string]: any;
}

export interface StoreTransactionRecord {
  id: string;
  date: string; // YYYY-MM-DD (माह और तारीख)
  type: 'INWARD' | 'OUTWARD' | 'TRANSFER';
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  referenceNo: string; // प्राप्त या निर्गम वाउचर संख्या और तारीख (e.g. "Glass/771 Dated 10.09.2024")
  issuedToOrReceivedFrom: string; // किससे प्राप्त हुआ या किसे जारी किया (e.g. "CIODW Ami Bartan Bhandar/")
  purposeOrSection: string; // प्राप्ति या निर्गम का उद्देश्य (e.g. "IMSD/USED")
  authorizedBy: string; // "Vivek Kumar Azad (APM)"
  remarks?: string;
  createdAt: string;
  // Departmental Tally Ledger Quantities
  receiptQty?: number; // प्राप्ति (Receipt)
  transferQty?: number; // स्थानांतरण (Transfer)
  issueQty?: number; // निर्गम (Issues)
  balanceQty?: number; // शेष (Balance)
  [key: string]: any;
}
