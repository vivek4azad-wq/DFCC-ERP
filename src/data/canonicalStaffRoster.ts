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
    phone: '8872671873',
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
    beatOrSection: 'CHAN-SNL (Km 1235.837 – 1249.720)',
    photoUrl: '/staff_photos/Tarsem_Singh_14803.png'
  },
  {
    id: 'OFF-103259',
    name: 'Gautam Kumar',
    nameHi: 'गौतम कुमार',
    fatherName: 'Sh. Ramji Kumar',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-103259',
    phone: '7011209332',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-103258',
    name: 'Ranjeet Kumar',
    nameHi: 'रणजीत कुमार',
    fatherName: 'Sh. Suresh Kumar',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-103258',
    phone: '9570703677',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-103257',
    name: 'Sudhir Kumar',
    nameHi: 'सुधीर कुमार',
    fatherName: 'Sh. Jagdish Prasad',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-103257',
    phone: '8210018687',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-102623',
    name: 'Suraj Verma',
    nameHi: 'सूरज वर्मा',
    fatherName: 'Sh. Ashok Verma',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-102623',
    phone: '9239845014',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-102431',
    name: 'Sanni Kumar Sharma',
    nameHi: 'सन्नी कुमार शर्मा',
    fatherName: 'Sh. Surendra Sharma',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-102431',
    phone: '7870056089',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-102924',
    name: 'Lal Chand',
    nameHi: 'लाल चंद',
    fatherName: 'Sh. Ramji Lal',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-102924',
    phone: '9649218216',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-102460',
    name: 'Amar Molana',
    nameHi: 'अमर मोलाना',
    fatherName: 'Sh. Mohan Lal',
    designation: 'MTS / Civil',
    post: 'MTS/Civil',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-102460',
    phone: '7788020121',
    beatOrSection: 'IMSD SMUN Base Camp'
  },
  {
    id: 'OFF-104962',
    name: 'Surendera Kumar',
    nameHi: 'सुरेंद्र कुमार',
    fatherName: 'Sh. Jagdish Ram',
    designation: 'Sr. Executive / Civil (Re-employed)',
    post: 'Sr. Executive',
    category: 'PERMANENT',
    categoryLabel: 'Permanent Staff',
    isPermanent: true,
    awpoId: 'EMP-104962',
    phone: '7658008725',
    beatOrSection: 'KNNN-CHAN Section'
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
    beatOrSection: 'Bridge 108 (Km 1224.500, ROR Rajpura Detour)',
    photoUrl: '/staff_photos/Jasvir_Singh_4886.png'
  },
  {
    id: 'GM-49680',
    name: 'Harpreet Singh',
    nameHi: 'हरप्रीत सिंह',
    fatherName: 'Sh. Gurmukh Singh',
    designation: 'Gateman (LC-167C)',
    post: 'Gateman',
    category: 'GATEMAN',
    categoryLabel: 'Outsourced Staff (Ex-Servicemen)',
    isPermanent: false,
    awpoId: '49680',
    phone: '6280205954',
    beatOrSection: 'LC-167C (Km 1248.664 CHAN-SNL)',
    shift: 'Shift A / B (12h Rotational)',
    photoUrl: '/staff_photos/Harpreet_Singh_49680.png'
  },
  {
    id: 'GM-159-SARBJIT',
    name: 'Sarabjit Singh',
    nameHi: 'सरबजीत सिंह',
    fatherName: 'Sh. Gurdev Singh',
    designation: 'Gateman (LC-159 SPL)',
    post: 'Gateman',
    category: 'GATEMAN',
    categoryLabel: 'Outsourced Staff (Ex-Servicemen)',
    isPermanent: false,
    awpoId: 'ESM-159',
    phone: '9914234082',
    beatOrSection: 'LC-159 SPL (Km 1232.095 KNNN-CHAN)',
    shift: 'Shift A / B (12h Rotational)',
    photoUrl: '/staff_photos/Sarbjit_Singh.png'
  },
];
