/**
 * DFCCIL IMSD SMUN - Master Annual Track Inspection Schedule (IRPWM / DFCCIL Compliance)
 * Authentic Planning for In-Charge (APM/Civil Shri Vivek Kumar Azad) & Sectional Officials
 * 
 * Regulatory Rules:
 * 1. Points & Crossings Main Line: Once in 3 months (Quarterly) on 6-month rotational cycle.
 * 2. Points & Crossings Loop Lines: Once in a year (Annually) station-by-station to prevent mixing.
 * 3. Joint P&C with S&T: Monthly rotational station sequence.
 * 4. Curves: Complete 100% coverage of Curves 315 to 409 (Jan-Nov, Dec zero curves).
 * 5. Level Crossings: Monthly safety audit of 5 manned gates (LC-151, LC-159, LC-163, LC-164, LC-167).
 * 6. LWR / SEJ: Fortnightly/Monthly SEJ gap measurement at mean rail temperature.
 */

export interface MonthlyInspectionPlan {
  monthIndex: number; // 1 to 12
  monthName: string;
  monthShort: string;
  
  // 1. IMSD In-Charge (APM / Civil Shri Vivek Kumar Azad)
  incharge: {
    mainLinePoints: {
      station: 'GVGN' | 'SBJN' | 'CHAN' | 'SMUN' | 'KNNN' | 'NSIR';
      stationName: string;
      pointsCount: number;
      frequencyRule: string;
      turnoutSummary: string;
    };
    loopLinePoints?: {
      station: 'SBJN' | 'GVGN' | 'CHAN' | 'SMUN' | 'KNNN' | 'NSIR';
      stationName: string;
      pointsCount: number;
      frequencyRule: string;
      rationale: string;
    };
    jointST: {
      station: 'CHAN' | 'SBJN' | 'NSIR' | 'GVGN' | 'KNNN' | 'SMUN';
      stationName: string;
      jointOfficial: string;
      frequencyRule: string;
      focusItems: string;
    };
    curves: {
      rangeText: string;
      curveNumbers: number[];
      count: number;
      description: string;
    };
    trolley?: string;
    lcGates?: string[];
  };

  // 2. Sectional In-Charge (SSE / JE / Field Officials)
  sectional: {
    curves: {
      rangeText: string;
      curveNumbers: number[];
      count: number;
      description: string;
    };
    loopLinePoints?: {
      station: string;
      pointsCount: number;
    };
    routineTasks: string[];
  };
}

export const ANNUAL_PWAY_INSPECTION_SCHEDULE: MonthlyInspectionPlan[] = [
  // 1. JANUARY
  {
    monthIndex: 1,
    monthName: 'January',
    monthShort: 'Jan',
    incharge: {
      mainLinePoints: {
        station: 'GVGN',
        stationName: 'Govindgarh (GVGN)',
        pointsCount: 7,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 1',
        turnoutSummary: 'Pt 101, 102, 201, 202, 203, 204, 205 (Main UP/DN)'
      },
      jointST: {
        station: 'CHAN',
        stationName: 'Chawa Pail (CHAN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 1',
        focusItems: 'Obstruction test (5mm gauge), switch motor throw, lock slide lubrication'
      },
      curves: {
        rangeText: 'Curves 315 to 320',
        curveNumbers: [315, 316, 317, 318, 319, 320],
        count: 6,
        description: 'Km 1167.627 to 1174.500 (R 1750m - 3500m, Versine & Super-elevation)'
      },
      trolley: 'Motor Trolley Audit - Full Section (KRJN - SNL, 88.679 Km)',
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 321 & 322',
        curveNumbers: [321, 322],
        count: 2,
        description: 'Km 1174.826 to 1176.010 (Radius 800m & 1200m)'
      },
      routineTasks: [
        'SEJ Gap measurement at mean rail temp (Winter destressing verification)',
        'Check rail clearance on P&C Govindgarh',
        'LC-151 & LC-159 boom locking & gate equipment audit'
      ]
    }
  },

  // 2. FEBRUARY
  {
    monthIndex: 2,
    monthName: 'February',
    monthShort: 'Feb',
    incharge: {
      mainLinePoints: {
        station: 'SBJN',
        stationName: 'Sarai Banjara (SBJN)',
        pointsCount: 7,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 1',
        turnoutSummary: 'Pt 201, 202, 203, 204, 205, 206, 207 (Main UP/DN)'
      },
      jointST: {
        station: 'SBJN',
        stationName: 'Sarai Banjara (SBJN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 1',
        focusItems: 'Detection slide clearance, switch rail housing, insulated joints'
      },
      curves: {
        rangeText: 'Curves 323 & 324',
        curveNumbers: [323, 324],
        count: 2,
        description: 'Km 1176.200 to 1178.400 (R 2000m - 3000m)'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 325 to 329',
        curveNumbers: [325, 326, 327, 328, 329],
        count: 5,
        description: 'Km 1178.600 to 1183.800 (R 1200m - 2500m)'
      },
      routineTasks: [
        'SBJN Yard yard-drain cleaning & switch packing',
        'Check rail wear measurement on turnouts 201-207',
        'Fishplate bolt torque checking with 1m torque wrench'
      ]
    }
  },

  // 3. MARCH
  {
    monthIndex: 3,
    monthName: 'March',
    monthShort: 'Mar',
    incharge: {
      mainLinePoints: {
        station: 'CHAN',
        stationName: 'Chawa Pail (CHAN)',
        pointsCount: 6,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 1',
        turnoutSummary: 'Pt 101, 102, 201, 202, 203, 204 (Main UP/DN)'
      },
      loopLinePoints: {
        station: 'SBJN',
        stationName: 'Sarai Banjara (SBJN)',
        pointsCount: 19,
        frequencyRule: 'Annual Mandatory Loop Audit (100% Loop Points of Station)',
        rationale: 'सभी 19 लूप लाइन टर्नआउट्स का एकमुश्त संपूर्ण ऑडिट ताकि कोई पॉइंट न छूटे'
      },
      jointST: {
        station: 'NSIR',
        stationName: 'Sirhind Detour (NSIR)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 1',
        focusItems: 'Point machine gear clearances, facing point lock test (3.25mm test)'
      },
      curves: {
        rangeText: 'Curves 330 to 334',
        curveNumbers: [330, 331, 332, 333, 334],
        count: 5,
        description: 'Km 1184.000 to 1189.290 (R 1400m - 3500m)'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 335 to 339',
        curveNumbers: [335, 336, 337, 338, 339],
        count: 5,
        description: 'Km 1189.500 to 1195.295'
      },
      routineTasks: [
        'Detailed wear audit of SBJN loop points (tongue rail, nose wear)',
        'SEJ gap verification before summer temperature rise',
        'LC-163 & LC-164 road approach & boom alignment'
      ]
    }
  },

  // 4. APRIL
  {
    monthIndex: 4,
    monthName: 'April',
    monthShort: 'Apr',
    incharge: {
      mainLinePoints: {
        station: 'SMUN',
        stationName: 'New Shambhu (SMUN)',
        pointsCount: 9,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 1',
        turnoutSummary: 'Pt 201b, 205b, 206a, 207b, 208b, 211b, 212b, 215b, 216b'
      },
      jointST: {
        station: 'GVGN',
        stationName: 'Govindgarh (GVGN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 1',
        focusItems: 'Facing point lock, switch detection, spring loaded piroller lubrication'
      },
      curves: {
        rangeText: 'Curves 340 to 347',
        curveNumbers: [340, 341, 342, 343, 344, 345, 346, 347],
        count: 8,
        description: 'Km 1195.500 to 1201.595 (High degree transition curves)'
      },
      trolley: 'Motor Trolley Audit - Full Section (KRJN - SNL, 88.679 Km)',
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 348 to 350',
        curveNumbers: [348, 349, 350],
        count: 3,
        description: 'Km 1201.800 to 1204.500'
      },
      routineTasks: [
        'Pre-summer track destressing verification and creep post readings',
        'SMUN yard crossover gauge cum level inspection',
        'LC-167C Doraha bypass road gate equipment check'
      ]
    }
  },

  // 5. MAY
  {
    monthIndex: 5,
    monthName: 'May',
    monthShort: 'May',
    incharge: {
      mainLinePoints: {
        station: 'KNNN',
        stationName: 'Khanna (KNNN)',
        pointsCount: 4,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 1',
        turnoutSummary: 'Pt 101, 102, 201, 202 (Main UP/DN)'
      },
      jointST: {
        station: 'KNNN',
        stationName: 'Khanna (KNNN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 1',
        focusItems: 'Point machine throw, check rail clearances, insulated rail joints'
      },
      curves: {
        rangeText: 'Curve 351',
        curveNumbers: [351],
        count: 1,
        description: 'Km 1204.714 to 1205.463 (Radius 700m, Length 749m, High Degree 2.5°)'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curve 352',
        curveNumbers: [352],
        count: 1,
        description: 'Km 1205.800 to 1206.500'
      },
      routineTasks: [
        'Hot weather patrolling review & patrolman equipment audit',
        'KNNN loop lines turnout inspection and gauge checks',
        'LWR-09 & LWR-10 tongue rail gap measurement'
      ]
    }
  },

  // 6. JUNE
  {
    monthIndex: 6,
    monthName: 'June',
    monthShort: 'Jun',
    incharge: {
      mainLinePoints: {
        station: 'NSIR',
        stationName: 'Sirhind Detour (NSIR)',
        pointsCount: 8,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 1 (Completion of 6-Month Cycle)',
        turnoutSummary: 'Pt 101, 102, 103, 104, 201, 202, 203, 204'
      },
      jointST: {
        station: 'SMUN',
        stationName: 'New Shambhu (SMUN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 1 (Completion of 6-Month Cycle)',
        focusItems: 'Switch motor throw, track circuit bonding, detection gap tolerance'
      },
      curves: {
        rangeText: 'Curve 353',
        curveNumbers: [353],
        count: 1,
        description: 'Km 1206.800 to 1207.395'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 354 & 355',
        curveNumbers: [354, 355],
        count: 2,
        description: 'Km 1207.600 to 1210.000'
      },
      routineTasks: [
        'Pre-monsoon waterway & drain cleaning verification on all bridges',
        'NSIR yard points switch opening and nose wear audit',
        'Monsoon patrol equipment & waterproof torch distribution'
      ]
    }
  },

  // 7. JULY (ROUND 2 BEGINS)
  {
    monthIndex: 7,
    monthName: 'July',
    monthShort: 'Jul',
    incharge: {
      mainLinePoints: {
        station: 'GVGN',
        stationName: 'Govindgarh (GVGN)',
        pointsCount: 7,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 2',
        turnoutSummary: 'Pt 101, 102, 201, 202, 203, 204, 205 (Main UP/DN)'
      },
      loopLinePoints: {
        station: 'GVGN',
        stationName: 'Govindgarh (GVGN)',
        pointsCount: 25,
        frequencyRule: 'Annual Mandatory Loop Audit (100% Loop Points of Station)',
        rationale: 'गोविंदगढ़ के सभी 25 लूप लाइन टर्नआउट्स का एकमुश्त संपूर्ण ऑडिट ताकि कोई पॉइंट न छूटे'
      },
      jointST: {
        station: 'CHAN',
        stationName: 'Chawa Pail (CHAN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 2',
        focusItems: 'Water ingress protection in point machines, obstruction test'
      },
      curves: {
        rangeText: 'Curves 356 to 359',
        curveNumbers: [356, 357, 358, 359],
        count: 4,
        description: 'Km 1210.200 to 1215.740 (Radius 1200m - 2000m)'
      },
      trolley: 'Motor Trolley Audit - Monsoon Inspection (KRJN - SNL, 88.679 Km)',
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 360 to 364',
        curveNumbers: [360, 361, 362, 363, 364],
        count: 5,
        description: 'Km 1216.000 to 1220.500'
      },
      routineTasks: [
        'Monsoon cess stability and high bank inspection',
        'GVGN loop line turnouts tongue rail wear & switch opening check',
        'Bridge waterways clearance and HFL observation'
      ]
    }
  },

  // 8. AUGUST
  {
    monthIndex: 8,
    monthName: 'August',
    monthShort: 'Aug',
    incharge: {
      mainLinePoints: {
        station: 'SBJN',
        stationName: 'Sarai Banjara (SBJN)',
        pointsCount: 7,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 2',
        turnoutSummary: 'Pt 201, 202, 203, 204, 205, 206, 207 (Main UP/DN)'
      },
      jointST: {
        station: 'SBJN',
        stationName: 'Sarai Banjara (SBJN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 2',
        focusItems: 'Insulation testing, switch lock integrity, motor operating voltage'
      },
      curves: {
        rangeText: 'Curves 365 to 369',
        curveNumbers: [365, 366, 367, 368, 369],
        count: 5,
        description: 'Km 1221.000 to 1226.500 (Radius 1400m - 3000m)'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 370 to 374',
        curveNumbers: [370, 371, 372, 373, 374],
        count: 5,
        description: 'Km 1227.000 to 1232.095'
      },
      routineTasks: [
        'Scour depth measurement on major & minor bridges',
        'SBJN Main line points check rail clearance and wear inspection',
        'LC-159 SPL & LC-163 C gate boom and bell audit'
      ]
    }
  },

  // 9. SEPTEMBER
  {
    monthIndex: 9,
    monthName: 'September',
    monthShort: 'Sep',
    incharge: {
      mainLinePoints: {
        station: 'CHAN',
        stationName: 'Chawa Pail (CHAN)',
        pointsCount: 6,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 2',
        turnoutSummary: 'Pt 101, 102, 201, 202, 203, 204 (Main UP/DN)'
      },
      jointST: {
        station: 'NSIR',
        stationName: 'Sirhind Detour (NSIR)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 2',
        focusItems: 'Slide lubrication, detector slides, lock bar clearance'
      },
      curves: {
        rangeText: 'Curves 375 to 381',
        curveNumbers: [375, 376, 377, 378, 379, 380, 381],
        count: 7,
        description: 'Km 1232.500 to 1238.000 (R 1200m - 2800m)'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 382 to 386',
        curveNumbers: [382, 383, 384, 385, 386],
        count: 5,
        description: 'Km 1238.500 to 1242.000'
      },
      routineTasks: [
        'Post-monsoon cess dressing & ballast recouping check',
        'CHAN main line points gauge and cross-level check',
        'SEJ gap measurement on LWR 09/10'
      ]
    }
  },

  // 10. OCTOBER
  {
    monthIndex: 10,
    monthName: 'October',
    monthShort: 'Oct',
    incharge: {
      mainLinePoints: {
        station: 'SMUN',
        stationName: 'New Shambhu (SMUN)',
        pointsCount: 9,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 2',
        turnoutSummary: 'Pt 201b, 205b, 206a, 207b, 208b, 211b, 212b, 215b, 216b'
      },
      jointST: {
        station: 'GVGN',
        stationName: 'Govindgarh (GVGN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 2',
        focusItems: 'Facing point lock testing, Piroller adjustment, tongue rail gap'
      },
      curves: {
        rangeText: 'Curves 387 to 391',
        curveNumbers: [387, 388, 389, 390, 391],
        count: 5,
        description: 'Km 1242.500 to 1246.500 (R 1600m - 3200m)'
      },
      trolley: 'Motor Trolley Audit - Pre-Winter Inspection (KRJN - SNL, 88.679 Km)',
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 392 to 397',
        curveNumbers: [392, 393, 394, 395, 396, 397],
        count: 6,
        description: 'Km 1246.800 to 1249.720'
      },
      routineTasks: [
        'SMUN yard crossover bolt tightening & greasing',
        'Check rail clearance on P&C SMUN',
        'LC-167C gate road surface & warning sign boards'
      ]
    }
  },

  // 11. NOVEMBER
  {
    monthIndex: 11,
    monthName: 'November',
    monthShort: 'Nov',
    incharge: {
      mainLinePoints: {
        station: 'KNNN',
        stationName: 'Khanna (KNNN)',
        pointsCount: 4,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 2',
        turnoutSummary: 'Pt 101, 102, 201, 202 (Main UP/DN)'
      },
      loopLinePoints: {
        station: 'CHAN',
        stationName: 'Chawa Pail (CHAN)',
        pointsCount: 22,
        frequencyRule: 'Annual Mandatory Loop Audit (100% Loop Points of Station)',
        rationale: 'चावा के सभी 22 लूप लाइन टर्नआउट्स का एकमुश्त संपूर्ण ऑडिट ताकि कोई पॉइंट न छूटे'
      },
      jointST: {
        station: 'KNNN',
        stationName: 'Khanna (KNNN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 2',
        focusItems: 'Point lock integrity, switch motor throw, lock slide lubrication'
      },
      curves: {
        rangeText: 'Curves 398 to 404',
        curveNumbers: [398, 399, 400, 401, 402, 403, 404],
        count: 7,
        description: 'Km 1171.981 to 1176.585 (SMUN-RPJ Link Line)'
      },
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Curves 405 to 409',
        curveNumbers: [405, 406, 407, 408, 409],
        count: 5,
        description: 'Km 1176.800 to 1178.166 (Link Line Final Stretch - 100% Curves Completed!)'
      },
      routineTasks: [
        'Winter track preparation, rail fracture prevention & joggled fishplates check',
        'CHAN loop line turnouts detailed wear audit',
        'SEJ gap verification at minimum rail temperature'
      ]
    }
  },

  // 12. DECEMBER (ZERO CURVES - WINTER SAFETY / FOG ATTENTION)
  {
    monthIndex: 12,
    monthName: 'December',
    monthShort: 'Dec',
    incharge: {
      mainLinePoints: {
        station: 'NSIR',
        stationName: 'Sirhind Detour (NSIR)',
        pointsCount: 8,
        frequencyRule: 'Quarterly (3-Month Cycle) • Round 2 (Full Annual Cycle Completed)',
        turnoutSummary: 'Pt 101, 102, 103, 104, 201, 202, 203, 204'
      },
      jointST: {
        station: 'SMUN',
        stationName: 'New Shambhu (SMUN)',
        jointOfficial: 'ASTE / JE (Signal) DFCCIL',
        frequencyRule: 'Monthly Joint S&T Cycle • Round 2 (Full Annual Cycle Completed)',
        focusItems: 'Winter fog safety: signal visibility, detonator stock at gates, points heating/lubrication'
      },
      curves: {
        rangeText: 'Zero Curves Scheduled (Winter Focus)',
        curveNumbers: [],
        count: 0,
        description: 'दिसंबर में कोई भी कर्व शेड्यूल्ड नहीं है (शीतकालीन ट्रैक अनुरक्षण व फ्रैक्चर रोकथाम पर केंद्रित)'
      },
      trolley: 'Motor Trolley Audit - Comprehensive Year-End Track Review (88.679 Km)',
      lcGates: ['LC-151', 'LC-159', 'LC-163', 'LC-164', 'LC-167']
    },
    sectional: {
      curves: {
        rangeText: 'Zero Curves Scheduled',
        curveNumbers: [],
        count: 0,
        description: 'दिसंबर में कोई भी कर्व शेड्यूल्ड नहीं है'
      },
      routineTasks: [
        'Night cold-weather patrolling review (SPN shifts 12 patrolmen)',
        'Detonator testing & supply verification at all 5 gates',
        'Annual track compliance report consolidation'
      ]
    }
  }
];
