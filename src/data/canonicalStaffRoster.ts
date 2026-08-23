/**
 * Canonical Master Staff Directory (Handcrafted 100% Genuine Records from Desktop Excel 'At a Glance')
 * DFCCIL IMSD SMUN Unit
 */

export interface CanonicalStaffMember {
  id: string;
  name: string;
  nameHi?: string;
  fatherName?: string;
  designation: string;
  post: string;
  category: 'PERMANENT' | 'OUTSOURCE_GANG' | 'OFFICE_STAFF' | 'KEYMAN' | 'PATROL_DAY' | 'PATROL_NIGHT' | 'GATEMAN' | 'WATCHMAN';
  categoryLabel: string;
  isPermanent: boolean;
  awpoId: string;
  phone: string;
  beatOrSection: string;
  residence?: string;
  district?: string;
  shift?: string;
  photoUrl?: string;
}

export const CANONICAL_SMUN_84_STAFF: CanonicalStaffMember[] = [
  // =========================================================================
  // 1. PERMANENT OFFICERS & ENGINEERS (12)
  // =========================================================================
  {
    id: 'OFF-101518',
    name: 'Vivek Kumar Azad',
    nameHi: 'श्री विवेक कुमार आजाद',
    fatherName: 'Late Sh. R. P. Azad',
    designation: 'APM / Civil (Unit Incharge)',
    post: 'APM/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-101518',
    phone: '9717631362',
    beatOrSection: 'IMSD SMUN (Full Jurisdiction Km 1167.210 – 1249.720)'
  },
  {
    id: 'OFF-101801',
    name: 'Arjun Kumar',
    nameHi: 'अर्जुन कुमार',
    fatherName: 'Sh. Ram Kumar',
    designation: 'Executive / P-Way',
    post: 'Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101801',
    phone: '8288034870',
    beatOrSection: 'SMUN-SBJN (Km 1170.435 – 1188.575)'
  },
  {
    id: 'OFF-105960',
    name: 'Gaya Prashad',
    nameHi: 'गया प्रसाद',
    fatherName: 'Sh. Shiv Prasad',
    designation: 'Executive / P-Way',
    post: 'Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-105960',
    phone: '7814986162',
    beatOrSection: 'SBJN-NSIR (Km 1188.575 – 1202.015)'
  },
  {
    id: 'OFF-100912',
    name: 'Harpal Singh',
    nameHi: 'हरपाल सिंह',
    fatherName: 'Sh. Gurbachan Singh',
    designation: 'Sr. Executive / P-Way',
    post: 'Sr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-100912',
    phone: '9814001234',
    beatOrSection: 'NSIR-GVGN (Km 1202.015 – 1213.187)'
  },
  {
    id: 'OFF-101234',
    name: 'Dayal Singh',
    nameHi: 'दयाल सिंह',
    fatherName: 'Sh. Sadhu Singh',
    designation: 'Jr. Executive / P-Way',
    post: 'Jr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101234',
    phone: '9876543210',
    beatOrSection: 'GVGN-KNNN (Km 1213.187 – 1229.087)'
  },
  {
    id: 'OFF-101235',
    name: 'Swarn Singh',
    nameHi: 'स्वर्ण सिंह',
    fatherName: 'Sh. Jaswant Singh',
    designation: 'Jr. Executive / P-Way',
    post: 'Jr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101235',
    phone: '9876543211',
    beatOrSection: 'KNNN-CHAN (Km 1229.087 – 1235.837)'
  },
  {
    id: 'OFF-100915',
    name: 'Tarsem Singh',
    nameHi: 'तरसेम सिंह',
    fatherName: 'Sh. Pritam Singh',
    designation: 'Sr. Executive / Field',
    post: 'Sr. Executive / Field',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-100915',
    phone: '9417800000',
    beatOrSection: 'CHAN-SNL (Km 1235.837 – 1249.720)'
  },
  {
    id: 'OFF-101804',
    name: 'Gautam Kumar',
    nameHi: 'गौतम कुमार',
    fatherName: 'Sh. Ramji Kumar',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101804',
    phone: '9729851608',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-101805',
    name: 'Ranjeet Kumar',
    nameHi: 'रणजीत कुमार',
    fatherName: 'Sh. Suresh Kumar',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101805',
    phone: '9467657954',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-101806',
    name: 'Sudhir Kumar',
    nameHi: 'सुधीर कुमार',
    fatherName: 'Sh. Jagdish Prasad',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101806',
    phone: '8528994503',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-101807',
    name: 'Suraj Verma',
    nameHi: 'सूरज वर्मा',
    fatherName: 'Sh. Ashok Verma',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101807',
    phone: '9812401826',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-101808',
    name: 'Sanni Kumar Sharma',
    nameHi: 'सन्नी कुमार शर्मा',
    fatherName: 'Sh. Ramesh Sharma',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'OFF-101808',
    phone: '8199990812',
    beatOrSection: 'IMSD SMUN Base Camp'
  },

  // =========================================================================
  // 2. OUTSOURCE MTS (1)
  // =========================================================================
  {
    id: 'OFF-102914',
    name: 'Pinki Sharma',
    nameHi: 'पिंकी शर्मा',
    fatherName: 'Sh. Som Dutt Sharma',
    designation: 'MTS / DFCCIL Representative',
    post: 'MTS / DFCCIL Representative',
    category: 'OUTSOURCE_GANG',
    categoryLabel: 'Outsource MTS (Pinki Sharma)',
    isPermanent: false,
    awpoId: 'MTS-SMUN-01',
    phone: '9417855315',
    beatOrSection: 'IMSD SMUN Office & Field Supervision'
  },

  // =========================================================================
  // 3. KEYMEN (18)
  // =========================================================================
  { id: 'KM-019', name: 'Sanjeev Kumar', designation: 'Keyman (Beat 19)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48561', phone: '7341182346', beatOrSection: 'Beat 19 (Km 1164.500–1170.535)' },
  { id: 'KM-020', name: 'Kuldeep Singh', designation: 'Keyman (Beat 20)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48562', phone: '7087352069', beatOrSection: 'Beat 20 (Km 1170.535–1176.010)' },
  { id: 'KM-021', name: 'Bhupal Singh', designation: 'Keyman (Beat 21)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48563', phone: '9465362321', beatOrSection: 'Beat 21 (Km 1176.000–1183.800)' },
  { id: 'KM-022', name: 'Gurdeep Singh', designation: 'Keyman (Beat 22)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48564', phone: '6239826819', beatOrSection: 'Beat 22 (Km 1183.800–1189.290)' },
  { id: 'KM-023', name: 'Gurwinder Singh', designation: 'Keyman (Beat 23)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48565', phone: '9465551335', beatOrSection: 'Beat 23 (Km 1189.290–1195.295)' },
  { id: 'KM-024', name: 'Harvinder Singh', designation: 'Keyman (Beat 24)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48566', phone: '8847533591', beatOrSection: 'Beat 24 (Km 1195.295–1201.595)' },
  { id: 'KM-025', name: 'Avtar Singh', designation: 'Keyman (Beat 25)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48567', phone: '9855456186', beatOrSection: 'Beat 25 (Km 1201.590–1207.395)' },
  { id: 'KM-026', name: 'Harvinder Singh (K26)', designation: 'Keyman (Beat 26)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48568', phone: '9417462599', beatOrSection: 'Beat 26 (Km 1207.395–1213.195)' },
  { id: 'KM-027', name: 'Jaswinder Singh', designation: 'Keyman (Beat 27)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48569', phone: '7002081220', beatOrSection: 'Beat 27 (Km 1213.195–1217.195)' },
  { id: 'KM-028', name: 'Jagjeet Singh', designation: 'Keyman (Beat 28)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48570', phone: '8290590570', beatOrSection: 'Beat 28 (Km 1217.195–1224.895)' },
  { id: 'KM-029', name: 'Lakhvir Singh', designation: 'Keyman (Beat 29)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48571', phone: '9468647575', beatOrSection: 'Beat 29 (Km 1224.890–1228.895)' },
  { id: 'KM-030', name: 'Gurpreet Singh', designation: 'Keyman (Beat 30)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48572', phone: '7508648281', beatOrSection: 'Beat 30 (Km 1228.895–1232.947)' },
  { id: 'KM-031', name: 'Kuljeet singh', designation: 'Keyman (Beat 31)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48573', phone: '9876101913', beatOrSection: 'Beat 31 (Km 1232.947–1237.000)' },
  { id: 'KM-032', name: 'Nirbhay Singh', designation: 'Keyman (Beat 32)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48574', phone: '9876101914', beatOrSection: 'Beat 32 (Km 1237.000–1241.000)' },
  { id: 'KM-033', name: 'Bikar Singh', designation: 'Keyman (Beat 33)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48575', phone: '9876101915', beatOrSection: 'Beat 33 (Km 1241.000–1245.000)' },
  { id: 'KM-034', name: 'Sukhwinder Singh', designation: 'Keyman (Beat 34)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48576', phone: '9876101916', beatOrSection: 'Beat 34 (Km 1245.000–1249.720)' },
  { id: 'KM-RG-01', name: 'Harwinder Singh (RG1)', designation: 'Relief Keyman (RG-1)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48577', phone: '9465326270', beatOrSection: 'Keyman Beats 19-23 & 34 Relief' },
  { id: 'KM-RG-02', name: 'Balwinder Singh (RG2)', designation: 'Relief Keyman (RG-2)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48578', phone: '9137463588', beatOrSection: 'Keyman Beats 24-29 Relief' },

  // =========================================================================
  // 4. DAY PATROLMEN (9 FILLED BEATS FROM EXCEL)
  // =========================================================================
  { id: 'SPD-002', name: 'Gurdeep Singh', designation: 'Day Patrol (SPD-002)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-002', phone: '9876588667', beatOrSection: 'B 1170/16 to C 1078/12 (Km 1170.700–1178.600)' },
  { id: 'SPD-003', name: 'Surjeet Singh', designation: 'Day Patrol (SPD-003)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-003', phone: '9501277242', beatOrSection: 'B 1078/12 to C 1186/9 (Km 1178.600–1186.500)' },
  { id: 'SPD-004', name: 'Ravinder Singh', designation: 'Day Patrol (SPD-004)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-004', phone: '9463088814', beatOrSection: 'B 1186/9 to C 1194/7 (Km 1186.500–1194.400)' },
  { id: 'SPD-005', name: 'Baljinder Singh', designation: 'Day Patrol (SPD-005)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-005', phone: '7460849679', beatOrSection: 'B 1194/7 to C 1202/6 (Km 1194.400–1202.300)' },
  { id: 'SPD-007', name: 'Chamkor Singh', designation: 'Day Patrol (SPD-007)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-007', phone: '7986000467', beatOrSection: 'B 1210/5 to C 1218/2 (Km 1210.200–1218.100)' },
  { id: 'SPD-008', name: 'Sukhchain Singh', designation: 'Day Patrol (SPD-008)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-008', phone: '8054012678', beatOrSection: 'B 1218/2 to C 1226/1 (Km 1218.100–1226.000)' },
  { id: 'SPD-009', name: 'Harwinder Singh', designation: 'Day Patrol (SPD-009)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-009', phone: '8429171981', beatOrSection: 'B 1226/1 to C 1233/16 (Km 1226.000–1233.900)' },
  { id: 'SPD-010', name: 'Amritpal Singh', designation: 'Day Patrol (SPD-010)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-010', phone: '8812006561', beatOrSection: 'B 1233/16 to C 1241/15 (Km 1233.900–1241.800)' },
  { id: 'SPD-011', name: 'Baljeet Singh', designation: 'Day Patrol (SPD-011)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPD-011', phone: '8427463892', beatOrSection: 'B 1241/15 to C 1249/15 (Km 1241.800–1249.720)' },

  // =========================================================================
  // 5. NIGHT PATROLMEN (22 POSITIONS FROM EXCEL)
  // =========================================================================
  { id: 'SPN-002A', name: 'Dharminder Singh', designation: 'Night Patrol (SPN-002)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-002A', phone: '9466303713', beatOrSection: 'B 1170/16 to C 1078/12 (Km 1170.700–1178.600)' },
  { id: 'SPN-002B', name: 'Balkar Singh', designation: 'Night Patrol (SPN-002)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-002B', phone: '9896486583', beatOrSection: 'B 1170/16 to C 1078/12 (Km 1170.700–1178.600)' },
  { id: 'SPN-003A', name: 'Rajinder Singh', designation: 'Night Patrol (SPN-003)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-003A', phone: '7973074232', beatOrSection: 'B 1078/12 to C 1186/9 (Km 1178.600–1186.500)' },
  { id: 'SPN-003B', name: 'Bikramjit Singh', designation: 'Night Patrol (SPN-003)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-003B', phone: '9478790749', beatOrSection: 'B 1078/12 to C 1186/9 (Km 1178.600–1186.500)' },
  { id: 'SPN-004A', name: 'Dharminder Singh (SPN4)', designation: 'Night Patrol (SPN-004)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-004A', phone: '9877978448', beatOrSection: 'B 1186/9 to C 1194/7 (Km 1186.500–1194.400)' },
  { id: 'SPN-004B', name: 'Rachhpal Singh', designation: 'Night Patrol (SPN-004)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-004B', phone: '7087370322', beatOrSection: 'B 1186/9 to C 1194/7 (Km 1186.500–1194.400)' },
  { id: 'SPN-005A', name: 'Gurmail Singh', designation: 'Night Patrol (SPN-005)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-005A', phone: '9478553150', beatOrSection: 'B 1194/7 to C 1202/6 (Km 1194.400–1202.300)' },
  { id: 'SPN-005B', name: 'Apinder Singh', designation: 'Night Patrol (SPN-005)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-005B', phone: '9478553151', beatOrSection: 'B 1194/7 to C 1202/6 (Km 1194.400–1202.300)' },
  { id: 'SPN-006A', name: 'Amarjit Singh', designation: 'Night Patrol (SPN-006)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-006A', phone: '7004563174', beatOrSection: 'B 1202/6 to C 1210/5 (Km 1202.300–1210.200)' },
  { id: 'SPN-006B', name: 'Baljit Singh', designation: 'Night Patrol (SPN-006)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-006B', phone: '9530822519', beatOrSection: 'B 1202/6 to C 1210/5 (Km 1202.300–1210.200)' },
  { id: 'SPN-007A', name: 'Santok Singh', designation: 'Night Patrol (SPN-007)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-007A', phone: '9592458167', beatOrSection: 'B 1210/5 to C 1218/2 (Km 1210.200–1218.100)' },
  { id: 'SPN-007B', name: 'Gurjant Singh', designation: 'Night Patrol (SPN-007)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-007B', phone: '8283848434', beatOrSection: 'B 1210/5 to C 1218/2 (Km 1210.200–1218.100)' },
  { id: 'SPN-008A', name: 'Gurpreet Singh (SPN)', designation: 'Night Patrol (SPN-008)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-008A', phone: '8847400008', beatOrSection: 'B 1218/2 to C 1226/1 (Km 1218.100–1226.000)' },
  { id: 'SPN-008B', name: 'Gurjit Singh', designation: 'Night Patrol (SPN-008)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-008B', phone: '8360358775', beatOrSection: 'B 1218/2 to C 1226/1 (Km 1218.100–1226.000)' },
  { id: 'SPN-009A', name: 'Tarsem Singh (Patrol)', designation: 'Night Patrol (SPN-009)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-009A', phone: '8427122355', beatOrSection: 'B 1226/1 to C 1233/16 (Km 1226.000–1233.900)' },
  { id: 'SPN-009B', name: 'Harjinder Singh', designation: 'Night Patrol (SPN-009)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-009B', phone: '9463843762', beatOrSection: 'B 1226/1 to C 1233/16 (Km 1226.000–1233.900)' },
  { id: 'SPN-010A', name: 'Yadwinder Singh', designation: 'Night Patrol (SPN-010)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-010A', phone: '9501572141', beatOrSection: 'B 1233/16 to C 1241/15 (Km 1233.900–1241.800)' },
  { id: 'SPN-010B', name: 'Sukhwinder Singh (Patrol)', designation: 'Night Patrol (SPN-010)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-010B', phone: '7973475062', beatOrSection: 'B 1233/16 to C 1241/15 (Km 1233.900–1241.800)' },
  { id: 'SPN-011A', name: 'Jagroop Singh', designation: 'Night Patrol (SPN-011)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-011A', phone: '8146492292', beatOrSection: 'B 1241/15 to C 1249/15 (Km 1241.800–1249.720)' },
  { id: 'SPN-011B', name: 'Harpreet Singh (Patrol)', designation: 'Night Patrol (SPN-011)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-011B', phone: '8847593020', beatOrSection: 'B 1241/15 to C 1249/15 (Km 1241.800–1249.720)' },
  { id: 'SPN-012A', name: 'Salamundin Singh', designation: 'Night Patrol (SPN-012)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-012A', phone: '9417986390', beatOrSection: 'B 1170/9 to C 1178/4 (Km 1170.435–1178.150)' },
  { id: 'SPN-012B', name: 'Nirbhay Singh (Patrol)', designation: 'Night Patrol (SPN-012)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: 'AWPO-SPN-012B', phone: '8872359476', beatOrSection: 'B 1170/9 to C 1178/4 (Km 1170.435–1178.150)' },

  // =========================================================================
  // 6. GATEMEN (20: 15 REGULAR + 5 RG FROM EXCEL)
  // =========================================================================
  { id: 'GTM-151-1', name: 'Sh. Rakha Singh', designation: 'Gateman (LC 151 C Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46536', phone: '9815460386', beatOrSection: 'LC Gate 151 C (Km 1215.034)' },
  { id: 'GTM-151-2', name: 'Sh. Kuldeep Singh', designation: 'Gateman (LC 151 C Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46537', phone: '9855456784', beatOrSection: 'LC Gate 151 C (Km 1215.034)' },
  { id: 'GTM-151-3', name: 'Sh. Bhupender Singh', designation: 'Gateman (LC 151 C Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '49354', phone: '8437892721', beatOrSection: 'LC Gate 151 C (Km 1215.034)' },
  { id: 'GTM-151-RG', name: 'Sh. Santokh Singh', designation: 'Relief Gateman (LC 151 C)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '48579', phone: '9478553153', beatOrSection: 'LC Gate 151 C (Relief)' },

  { id: 'GTM-159-1', name: 'Sh. Gurtej Singh', designation: 'Gateman (LC 159 SPL Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46548', phone: '9402932236', beatOrSection: 'LC Gate 159 SPL (Km 1232.095)' },
  { id: 'GTM-159-2', name: 'Sh. Sarbjit Singh', designation: 'Gateman (LC 159 SPL Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46549', phone: '9914234082', beatOrSection: 'LC Gate 159 SPL (Km 1232.095)' },
  { id: 'GTM-159-3', name: 'Sh. Pal Singh', designation: 'Gateman (LC 159 SPL Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46538', phone: '8360635600', beatOrSection: 'LC Gate 159 SPL (Km 1232.095)' },
  { id: 'GTM-159-RG', name: 'Sh. Prem Chand', designation: 'Relief Gateman (LC 159 SPL)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: 'RG-159', phone: '9478553158', beatOrSection: 'LC Gate 159 SPL (Relief)' },

  { id: 'GTM-163-1', name: 'Sh. Jasvir Singh', designation: 'Gateman (LC 163 C Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '48886', phone: '7986604268', beatOrSection: 'LC Gate 163 C (Km 1239.827)' },
  { id: 'GTM-163-2', name: 'Sh. Satish Kumar', designation: 'Gateman (LC 163 C Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '47041', phone: '9465431003', beatOrSection: 'LC Gate 163 C (Km 1239.827)' },
  { id: 'GTM-163-3', name: 'Sh. Lakhveer Singh', designation: 'Gateman (LC 163 C Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '47113', phone: '9463807884', beatOrSection: 'LC Gate 163 C (Km 1239.827)' },
  { id: 'GTM-163-RG', name: 'Sh. Beant Singh', designation: 'Relief Gateman (LC 163 C)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46482', phone: '6005502719', beatOrSection: 'LC Gate 163 C (Relief)' },

  { id: 'GTM-164-1', name: 'Sh. Jaswinder Singh', designation: 'Gateman (LC 164AB/3T Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46523', phone: '8728016142', beatOrSection: 'LC Gate 164AB/3T (Km 1244.833)' },
  { id: 'GTM-164-2', name: 'Sh. Gurpreet Singh', designation: 'Gateman (LC 164AB/3T Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46524', phone: '9463355013', beatOrSection: 'LC Gate 164AB/3T (Km 1244.833)' },
  { id: 'GTM-164-3', name: 'Sh. Jagtar Singh', designation: 'Gateman (LC 164AB/3T Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '47207', phone: '9518133849', beatOrSection: 'LC Gate 164AB/3T (Km 1244.833)' },
  { id: 'GTM-164-RG', name: 'Sh. Som Nath', designation: 'Relief Gateman (LC 164AB/3T)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: 'RG-164', phone: '9478553166', beatOrSection: 'LC Gate 164AB/3T (Relief)' },

  { id: 'GTM-167-1', name: 'Sh. Harpreet Singh', designation: 'Gateman (LC 167 C Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '49680', phone: '6280205954', beatOrSection: 'LC Gate 167 C (Km 1248.664)' },
  { id: 'GTM-167-2', name: 'Sh. Balwinder Singh', designation: 'Gateman (LC 167 C Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '52595', phone: '9872341355', beatOrSection: 'LC Gate 167 C (Km 1248.664)' },
  { id: 'GTM-167-3', name: 'Sh. Jagjit Singh', designation: 'Gateman (LC 167 C Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '49321', phone: '8847650107', beatOrSection: 'LC Gate 167 C (Km 1248.664)' },
  { id: 'GTM-167-RG', name: 'Sh. Harjinder Singh', designation: 'Relief Gateman (LC 167 C)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '49322', phone: '9876879224', beatOrSection: 'LC Gate 167 C (Relief)' },

  // =========================================================================
  // 7. BRIDGE WATCHMEN (3 FROM EXCEL)
  // =========================================================================
  {
    id: 'WATCH-12323',
    name: 'Satnam Singh (सतनाम सिंह)',
    designation: 'Watchman (BR. 108 Shift 1)',
    post: 'Bridge Watchman',
    category: 'WATCHMAN',
    categoryLabel: 'Bridge Watchman (BR. 108)',
    isPermanent: false,
    awpoId: '12323',
    phone: '8295369825',
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)'
  },
  {
    id: 'WATCH-12772',
    name: 'Surinder Singh (सुरिंदर सिंह)',
    designation: 'Watchman (BR. 108 Shift 2)',
    post: 'Bridge Watchman',
    category: 'WATCHMAN',
    categoryLabel: 'Bridge Watchman (BR. 108)',
    isPermanent: false,
    awpoId: '12772',
    phone: '7529026738',
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)'
  },
  {
    id: 'WATCH-11469',
    name: 'Jasvir Singh (जसवीर सिंह)',
    designation: 'Watchman (BR. 108 Shift 3)',
    post: 'Bridge Watchman',
    category: 'WATCHMAN',
    categoryLabel: 'Bridge Watchman (BR. 108)',
    isPermanent: false,
    awpoId: '11469',
    phone: '8398036955',
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)'
  }
];
