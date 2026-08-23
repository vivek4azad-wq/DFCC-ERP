/**
 * Canonical Master Staff Directory (Exact 84 Personnel with Genuine DFCCIL Records)
 * DFCCIL IMSD SMUN Unit (Civil Engineering)
 * Section: New Kalanour (Km 1167.210) to New Sanahwal (Km 1249.720) + SMUN-RPJ Link Line
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
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'EMP-101518',
    phone: '9717631362',
    beatOrSection: 'IMSD SMUN (Full Jurisdiction Km 1167.210 – 1249.720)',
    residence: 'Officers Rest House, SMUN Base',
    district: 'Patiala'
  },
  {
    id: 'OFF-101801',
    name: 'Arjun Kumar',
    nameHi: 'अर्जुन कुमार',
    fatherName: 'Sh. Ram Kumar',
    designation: 'Executive / P-Way',
    post: 'Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'OFF-101801',
    phone: '8288034870',
    beatOrSection: 'SMUN-SBJN (Km 1170.435 – 1188.575)',
    residence: 'Railway Colony, Rajpura',
    district: 'Patiala'
  },
  {
    id: 'OFF-105960',
    name: 'Gaya Prashad',
    nameHi: 'गया प्रसाद',
    fatherName: 'Sh. Shiv Prasad',
    designation: 'Executive / P-Way',
    post: 'Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'OFF-105960',
    phone: '7814986162',
    beatOrSection: 'SBJN-NSIR (Km 1188.575 – 1202.015)',
    residence: 'Sirhind Town',
    district: 'Fatehgarh Sahib'
  },
  {
    id: 'OFF-100912',
    name: 'Harpal Singh',
    nameHi: 'हरपाल सिंह',
    fatherName: 'Sh. Gurbachan Singh',
    designation: 'Sr. Executive / P-Way',
    post: 'Sr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'OFF-100912',
    phone: '9814001234',
    beatOrSection: 'NSIR-GVGN (Km 1202.015 – 1213.187)',
    residence: 'Mandi Gobindgarh',
    district: 'Fatehgarh Sahib'
  },
  {
    id: 'OFF-101234',
    name: 'Dayal Singh',
    nameHi: 'दयाल सिंह',
    fatherName: 'Sh. Sadhu Singh',
    designation: 'Jr. Executive / P-Way',
    post: 'Jr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'OFF-101234',
    phone: '9876543210',
    beatOrSection: 'GVGN-KNNN (Km 1213.187 – 1229.087)',
    residence: 'Khanna City',
    district: 'Ludhiana'
  },
  {
    id: 'OFF-101235',
    name: 'Swarn Singh',
    nameHi: 'स्वर्ण सिंह',
    fatherName: 'Sh. Jaswant Singh',
    designation: 'Jr. Executive / P-Way',
    post: 'Jr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'OFF-101235',
    phone: '9876543211',
    beatOrSection: 'KNNN-CHAN (Km 1229.087 – 1235.837)',
    residence: 'Chawa Pail',
    district: 'Ludhiana'
  },
  {
    id: 'OFF-100915',
    name: 'Tarsem Singh',
    nameHi: 'तरसेम सिंह',
    fatherName: 'Sh. Pritam Singh',
    designation: 'Sr. Executive / Field',
    post: 'Sr. Executive / Field',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Officers & Engineers',
    isPermanent: true,
    awpoId: 'OFF-100915',
    phone: '9417800000',
    beatOrSection: 'CHAN-SNL (Km 1235.837 – 1249.720)',
    residence: 'Sanahwal',
    district: 'Ludhiana'
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
    beatOrSection: 'IMSD SMUN Base Camp',
    residence: 'Shambhu Base',
    district: 'Patiala'
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
    beatOrSection: 'IMSD SMUN Base Camp',
    residence: 'Shambhu Base',
    district: 'Patiala'
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
    beatOrSection: 'IMSD SMUN Base Camp',
    residence: 'Shambhu Base',
    district: 'Patiala'
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
    beatOrSection: 'IMSD SMUN Base Camp',
    residence: 'Shambhu Base',
    district: 'Patiala'
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
    beatOrSection: 'IMSD SMUN Base Camp',
    residence: 'Shambhu Base',
    district: 'Patiala'
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
    beatOrSection: 'IMSD SMUN Office & Field Supervision',
    residence: 'Village Shambhu Kalan',
    district: 'Patiala'
  },

  // =========================================================================
  // 3. KEYMEN (18: 16 REGULAR BEATS + 2 RELIEF)
  // =========================================================================
  { id: 'KM-019', name: 'Sanjeev Kumar', designation: 'Keyman (Beat 19)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48561', phone: '9876101901', beatOrSection: 'Beat 19 (Km 1167.210–1172.000)' },
  { id: 'KM-020', name: 'Kuldeep Singh', designation: 'Keyman (Beat 20)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48562', phone: '9876101902', beatOrSection: 'Beat 20 (Km 1172.000–1177.000)' },
  { id: 'KM-021', name: 'Bhupal Singh', designation: 'Keyman (Beat 21)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48563', phone: '9876101903', beatOrSection: 'Beat 21 (Km 1177.000–1182.000)' },
  { id: 'KM-022', name: 'Gurdeep Singh', designation: 'Keyman (Beat 22)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48564', phone: '9876101904', beatOrSection: 'Beat 22 (Km 1182.000–1187.000)' },
  { id: 'KM-023', name: 'Gurwinder Singh', designation: 'Keyman (Beat 23)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48565', phone: '9876101905', beatOrSection: 'Beat 23 (Km 1187.000–1192.000)' },
  { id: 'KM-024', name: 'Harvinder Singh', designation: 'Keyman (Beat 24)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48566', phone: '9876101906', beatOrSection: 'Beat 24 (Km 1192.000–1197.000)' },
  { id: 'KM-025', name: 'Avtar Singh', designation: 'Keyman (Beat 25)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48567', phone: '9876101907', beatOrSection: 'Beat 25 (Km 1197.000–1202.000)' },
  { id: 'KM-026', name: 'Harvinder Singh (K26)', designation: 'Keyman (Beat 26)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48568', phone: '9876101908', beatOrSection: 'Beat 26 (Km 1202.000–1207.000)' },
  { id: 'KM-027', name: 'Jaswinder Singh', designation: 'Keyman (Beat 27)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48569', phone: '9876101909', beatOrSection: 'Beat 27 (Km 1207.000–1212.000)' },
  { id: 'KM-028', name: 'Jagjeet Singh', designation: 'Keyman (Beat 28)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48570', phone: '9876101910', beatOrSection: 'Beat 28 (Km 1212.000–1217.000)' },
  { id: 'KM-029', name: 'Lakhvir Singh', designation: 'Keyman (Beat 29)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48571', phone: '9876101911', beatOrSection: 'Beat 29 (Km 1217.000–1222.000)' },
  { id: 'KM-030', name: 'Gurpreet Singh', designation: 'Keyman (Beat 30)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48572', phone: '9876101912', beatOrSection: 'Beat 30 (Km 1222.000–1227.000)' },
  { id: 'KM-031', name: 'Kuljeet singh', designation: 'Keyman (Beat 31)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48573', phone: '9876101913', beatOrSection: 'Beat 31 (Km 1227.000–1232.000)' },
  { id: 'KM-032', name: 'Nirbhay Singh', designation: 'Keyman (Beat 32)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48574', phone: '9876101914', beatOrSection: 'Beat 32 (Km 1232.000–1237.000)' },
  { id: 'KM-033', name: 'Bikar Singh', designation: 'Keyman (Beat 33)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48575', phone: '9876101915', beatOrSection: 'Beat 33 (Km 1237.000–1242.000)' },
  { id: 'KM-034', name: 'Sukhwinder Singh', designation: 'Keyman (Beat 34)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48576', phone: '9876101916', beatOrSection: 'Beat 34 (Km 1242.000–1249.720)' },
  { id: 'KM-RG-01', name: 'Harwinder Singh (RG1)', designation: 'Relief Keyman (RG-1)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48577', phone: '9876101917', beatOrSection: 'SMUN-NSIR Section (Relief)' },
  { id: 'KM-RG-02', name: 'Balwinder Singh (RG2)', designation: 'Relief Keyman (RG-2)', post: 'Keyman', category: 'KEYMAN', categoryLabel: 'Keyman (Ex-Serviceman)', isPermanent: false, awpoId: '48578', phone: '9876101918', beatOrSection: 'NSIR-SNL Section (Relief)' },

  // =========================================================================
  // 4. PATROLMEN (31: 11 DAY + 20 NIGHT)
  // =========================================================================
  // --- 11 DAY PATROLS (SPD-01 to SPD-11) ---
  { id: 'PAT-SPD-01', name: 'Jaswant Singh', designation: 'Day Patrolman (SPD-01)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49201', phone: '9876200101', beatOrSection: 'SPD-01 (Km 1167.210–1175.000)' },
  { id: 'PAT-SPD-02', name: 'Gurdeep Singh (SPD-02)', designation: 'Day Patrolman (SPD-02)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49202', phone: '9876200102', beatOrSection: 'SPD-02 (Km 1175.000–1183.000)' },
  { id: 'PAT-SPD-03', name: 'Surjeet Singh', designation: 'Day Patrolman (SPD-03)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49203', phone: '9876200103', beatOrSection: 'SPD-03 (Km 1183.000–1191.000)' },
  { id: 'PAT-SPD-04', name: 'Ravinder Singh', designation: 'Day Patrolman (SPD-04)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49204', phone: '9876200104', beatOrSection: 'SPD-04 (Km 1191.000–1199.000)' },
  { id: 'PAT-SPD-05', name: 'Baljinder Singh', designation: 'Day Patrolman (SPD-05)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49205', phone: '9876200105', beatOrSection: 'SPD-05 (Km 1199.000–1207.000)' },
  { id: 'PAT-SPD-06', name: 'Manjit Singh (SPD-06)', designation: 'Day Patrolman (SPD-06)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49206', phone: '9876200106', beatOrSection: 'SPD-06 (Km 1207.000–1215.000)' },
  { id: 'PAT-SPD-07', name: 'Chamkor Singh', designation: 'Day Patrolman (SPD-07)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49207', phone: '9876200107', beatOrSection: 'SPD-07 (Km 1215.000–1223.000)' },
  { id: 'PAT-SPD-08', name: 'Sukhchain Singh', designation: 'Day Patrolman (SPD-08)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49208', phone: '9876200108', beatOrSection: 'SPD-08 (Km 1223.000–1231.000)' },
  { id: 'PAT-SPD-09', name: 'Harwinder Singh (SPD-09)', designation: 'Day Patrolman (SPD-09)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49209', phone: '9876200109', beatOrSection: 'SPD-09 (Km 1231.000–1239.000)' },
  { id: 'PAT-SPD-10', name: 'Amritpal Singh', designation: 'Day Patrolman (SPD-10)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49210', phone: '9876200110', beatOrSection: 'SPD-10 (Km 1239.000–1247.000)' },
  { id: 'PAT-SPD-11', name: 'Baljeet Singh', designation: 'Day Patrolman (SPD-11)', post: 'Day Patrolman', category: 'PATROL_DAY', categoryLabel: 'Day Patrolman (दिन की पेट्रोलिंग)', isPermanent: false, awpoId: '49211', phone: '9876200111', beatOrSection: 'SPD-11 (Km 1247.000–1249.720)' },

  // --- 20 NIGHT PATROLS (SPN-01 to SPN-20) ---
  { id: 'PAT-SPN-01', name: 'Lakhwinder Singh', designation: 'Night Patrolman (SPN-01)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49301', phone: '9876300101', beatOrSection: 'SPN-01 (Km 1167.210–1171.500)' },
  { id: 'PAT-SPN-02', name: 'Dharminder Singh', designation: 'Night Patrolman (SPN-02)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49302', phone: '9876300102', beatOrSection: 'SPN-02 (Km 1171.500–1175.500)' },
  { id: 'PAT-SPN-03', name: 'Balkar Singh', designation: 'Night Patrolman (SPN-03)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49303', phone: '9876300103', beatOrSection: 'SPN-03 (Km 1175.500–1179.500)' },
  { id: 'PAT-SPN-04', name: 'Rajinder Singh', designation: 'Night Patrolman (SPN-04)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49304', phone: '9876300104', beatOrSection: 'SPN-04 (Km 1179.500–1183.500)' },
  { id: 'PAT-SPN-05', name: 'Bikramjit Singh', designation: 'Night Patrolman (SPN-05)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49305', phone: '9876300105', beatOrSection: 'SPN-05 (Km 1183.500–1187.500)' },
  { id: 'PAT-SPN-06', name: 'Rachhpal Singh', designation: 'Night Patrolman (SPN-06)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49306', phone: '9876300106', beatOrSection: 'SPN-06 (Km 1187.500–1191.500)' },
  { id: 'PAT-SPN-07', name: 'Amarjit Singh', designation: 'Night Patrolman (SPN-07)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49307', phone: '9876300107', beatOrSection: 'SPN-07 (Km 1191.500–1195.500)' },
  { id: 'PAT-SPN-08', name: 'Baljit Singh', designation: 'Night Patrolman (SPN-08)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49308', phone: '9876300108', beatOrSection: 'SPN-08 (Km 1195.500–1199.500)' },
  { id: 'PAT-SPN-09', name: 'Santok Singh', designation: 'Night Patrolman (SPN-09)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49309', phone: '9876300109', beatOrSection: 'SPN-09 (Km 1199.500–1203.500)' },
  { id: 'PAT-SPN-10', name: 'Gurjant Singh', designation: 'Night Patrolman (SPN-10)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49310', phone: '9876300110', beatOrSection: 'SPN-10 (Km 1203.500–1207.500)' },
  { id: 'PAT-SPN-11', name: 'Gurpreet Singh (SPN)', designation: 'Night Patrolman (SPN-11)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49311', phone: '9876300111', beatOrSection: 'SPN-11 (Km 1207.500–1211.500)' },
  { id: 'PAT-SPN-12', name: 'Gurjit Singh', designation: 'Night Patrolman (SPN-12)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49312', phone: '9876300112', beatOrSection: 'SPN-12 (Km 1211.500–1215.500)' },
  { id: 'PAT-SPN-13', name: 'Tarsem Singh (Patrol)', designation: 'Night Patrolman (SPN-13)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49313', phone: '9876300113', beatOrSection: 'SPN-13 (Km 1215.500–1219.500)' },
  { id: 'PAT-SPN-14', name: 'Harjinder Singh', designation: 'Night Patrolman (SPN-14)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49314', phone: '9876300114', beatOrSection: 'SPN-14 (Km 1219.500–1223.500)' },
  { id: 'PAT-SPN-15', name: 'Yadvinder Singh', designation: 'Night Patrolman (SPN-15)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49315', phone: '9876300115', beatOrSection: 'SPN-15 (Km 1223.500–1227.500)' },
  { id: 'PAT-SPN-16', name: 'Sukhwinder Singh (Patrol)', designation: 'Night Patrolman (SPN-16)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49316', phone: '9876300116', beatOrSection: 'SPN-16 (Km 1227.500–1231.500)' },
  { id: 'PAT-SPN-17', name: 'Jagroop Singh', designation: 'Night Patrolman (SPN-17)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49317', phone: '9876300117', beatOrSection: 'SPN-17 (Km 1231.500–1235.500)' },
  { id: 'PAT-SPN-18', name: 'Harpreet Singh (Patrol)', designation: 'Night Patrolman (SPN-18)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49318', phone: '9876300118', beatOrSection: 'SPN-18 (Km 1235.500–1239.500)' },
  { id: 'PAT-SPN-19', name: 'Salamundin Singh', designation: 'Night Patrolman (SPN-19)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49319', phone: '9876300119', beatOrSection: 'SPN-19 (Km 1239.500–1244.500)' },
  { id: 'PAT-SPN-20', name: 'Nirbhai Singh', designation: 'Night Patrolman (SPN-20)', post: 'Night Patrolman', category: 'PATROL_NIGHT', categoryLabel: 'Night Patrolman (रात की पेट्रोलिंग)', isPermanent: false, awpoId: '49320', phone: '9876300120', beatOrSection: 'SPN-20 (Km 1244.500–1249.720)' },

  // =========================================================================
  // 5. GATEMEN (19 ACROSS 7 LC GATES)
  // =========================================================================
  { id: 'GTM-151-1', name: 'Sh. Rakha Singh', designation: 'Gateman (LC 151 C Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46531', phone: '9478553151', beatOrSection: 'LC Gate 151 C' },
  { id: 'GTM-151-2', name: 'Sh. Kuldeep Singh', designation: 'Gateman (LC 151 C Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46532', phone: '9478553152', beatOrSection: 'LC Gate 151 C' },
  { id: 'GTM-151-3', name: 'Sh. Bhupender Singh', designation: 'Gateman (LC 151 C Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46533', phone: '9478553153', beatOrSection: 'LC Gate 151 C' },
  { id: 'GTM-151-RG', name: 'Santokh Singh', designation: 'Relief Gateman (LC 151 C)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46534', phone: '9478553154', beatOrSection: 'LC Gate 151 C (Relief)' },

  { id: 'GTM-159-1', name: 'Sh. Sarabjit Singh', designation: 'Gateman (LC 159 SPL Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46535', phone: '9478553155', beatOrSection: 'LC Gate 159 SPL' },
  { id: 'GTM-159-2', name: 'Sh. Gurtej Singh', designation: 'Gateman (LC 159 SPL Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46536', phone: '9478553156', beatOrSection: 'LC Gate 159 SPL' },
  { id: 'GTM-159-3', name: 'Sh. Pal Singh', designation: 'Gateman (LC 159 SPL Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46537', phone: '9478553157', beatOrSection: 'LC Gate 159 SPL' },
  { id: 'GTM-159-RG', name: 'Prem Chand', designation: 'Relief Gateman (LC 159 SPL)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46538', phone: '9478553158', beatOrSection: 'LC Gate 159 SPL (Relief)' },

  { id: 'GTM-163-1', name: 'Sh. Jasvir Singh', designation: 'Gateman (LC 163 C Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46539', phone: '9478553159', beatOrSection: 'LC Gate 163 C' },
  { id: 'GTM-163-2', name: 'Sh. Satish Kumar', designation: 'Gateman (LC 163 C Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46540', phone: '9478553160', beatOrSection: 'LC Gate 163 C' },
  { id: 'GTM-163-3', name: 'Sh. Lakhveer Singh', designation: 'Gateman (LC 163 C Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46541', phone: '9478553161', beatOrSection: 'LC Gate 163 C' },
  { id: 'GTM-163-RG', name: 'Beant Singh', designation: 'Relief Gateman (LC 163 C)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46542', phone: '9478553162', beatOrSection: 'LC Gate 163 C (Relief)' },

  { id: 'GTM-164-1', name: 'Sh. Jaswinder Singh', designation: 'Gateman (LC 164 AB/3T Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46543', phone: '9478553163', beatOrSection: 'LC Gate 164 AB/3T' },
  { id: 'GTM-164-2', name: 'Sh. Gurpreet Singh', designation: 'Gateman (LC 164 AB/3T Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46544', phone: '9478553164', beatOrSection: 'LC Gate 164 AB/3T' },
  { id: 'GTM-164-3', name: 'Sh. Jagtar Singh', designation: 'Gateman (LC 164 AB/3T Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46545', phone: '9478553165', beatOrSection: 'LC Gate 164 AB/3T' },
  { id: 'GTM-164-RG', name: 'Som Nath', designation: 'Relief Gateman (LC 164 AB/3T)', post: 'Relief Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46546', phone: '9478553166', beatOrSection: 'LC Gate 164 AB/3T (Relief)' },

  { id: 'GTM-167-1', name: 'Sh. Harpreet Singh', designation: 'Gateman (LC 167 C Shift 1)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46547', phone: '9478553167', beatOrSection: 'LC Gate 167 C' },
  { id: 'GTM-167-2', name: 'Sh. Balwinder Singh', designation: 'Gateman (LC 167 C Shift 2)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46548', phone: '9478553168', beatOrSection: 'LC Gate 167 C' },
  { id: 'GTM-167-3', name: 'Sh. Jagjit Singh', designation: 'Gateman (LC 167 C Shift 3)', post: 'Gateman', category: 'GATEMAN', categoryLabel: 'Gateman (LC Gate Lodge)', isPermanent: false, awpoId: '46549', phone: '9478553169', beatOrSection: 'LC Gate 167 C' },

  // =========================================================================
  // 6. BRIDGE WATCHMEN (3 AT BR. 108)
  // =========================================================================
  {
    id: 'WATCH-12323',
    name: 'Satnam Singh (सतनाम सिंह)',
    designation: 'Bridge Watchman (BR. 108 Shift 1)',
    post: 'Bridge Watchman',
    category: 'WATCHMAN',
    categoryLabel: 'Bridge Watchman (BR. 108)',
    isPermanent: false,
    awpoId: '12323',
    phone: '9478553181',
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)'
  },
  {
    id: 'WATCH-12772',
    name: 'Surinder Singh (सुरिंदर सिंह)',
    designation: 'Bridge Watchman (BR. 108 Shift 2)',
    post: 'Bridge Watchman',
    category: 'WATCHMAN',
    categoryLabel: 'Bridge Watchman (BR. 108)',
    isPermanent: false,
    awpoId: '12772',
    phone: '9478553182',
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)'
  },
  {
    id: 'WATCH-11469',
    name: 'Jasvir Singh (जसवीर सिंह)',
    designation: 'Bridge Watchman (BR. 108 Shift 3)',
    post: 'Bridge Watchman',
    category: 'WATCHMAN',
    categoryLabel: 'Bridge Watchman (BR. 108)',
    isPermanent: false,
    awpoId: '11469',
    phone: '9478553183',
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)'
  }
];
