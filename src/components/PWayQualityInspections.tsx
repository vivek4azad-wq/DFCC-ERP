/**
 * P-Way Quality, OMS (with .txt Auto-Parser), TRC (Chart & List View + 5-Run Compare), Inspections & DFWO Defects
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../services/database.ts';
import { INITIAL_TRC_BLOCKS, type TrcBlockRecord } from '../data/trcData.ts';
import { DefectManager } from './DefectManager.tsx';
import {
  Activity,
  Gauge,
  ClipboardCheck,
  Search,
  Filter,
  Plus,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Compass,
  Zap,
  HardHat,
  FileText,
  Train,
  Check,
  X,
  BarChart3,
  List,
  GitCompare
} from 'lucide-react';

export interface OmsRecord {
  id: string;
  date: string;
  runNo: string;
  trainNoOrLoco: string;
  fromKm: number;
  toKm: number;
  speedKmph: number;
  peakType: 'VERTICAL' | 'LATERAL' | 'BOTH';
  peakValueG: number;
  peakLocationKm: number;
  tpNo?: string;
  trackLine: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionTaken: string;
  complianceStatus: 'PENDING' | 'ATTENDED' | 'VERIFIED';
}

export interface InspectionRecord {
  id: string;
  type: 'POINT_CROSSING' | 'CURVE' | 'LWR' | 'LEVEL_CROSSING' | 'JOINT_ST' | 'MOTOR_TROLLEY' | 'CUSTOM';
  typeName: string;
  title: string;
  assetIdOrKm: string;
  location: string;
  scheduledDate: string;
  conductedDate?: string;
  inspectingOfficial: string;
  jointWith?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'OVERDUE';
  parametersChecked: string;
  deficienciesFound: string;
  complianceRemarks: string;
}

export interface TrcRunSummary {
  runNo: number;
  runId: string;
  date: string;
  machine: string;
  meanTqi: number;
  peakBlocksCount: number;
  status: 'EXCELLENT' | 'GOOD' | 'ATTENTION_REQUIRED';
  deltaFromPrev?: number;
  tampingDoneBlocks: number;
}

export interface OmsRunSummary {
  runNo: number;
  runId: string;
  date: string;
  locoNo: string;
  speedKmph: number;
  totalPeaks: number;
  criticalPeaks: number; // >= 0.25g
  highPeaks: number;     // 0.20 - 0.24g
  mediumPeaks: number;   // 0.15 - 0.19g
  complianceRate: number;
}

const HISTORICAL_TRC_RUNS: TrcRunSummary[] = [
  { runNo: 5, runId: 'TRC-2026-R5', date: '2026-08-16', machine: 'TRC Car #9204', meanTqi: 93.8, peakBlocksCount: 14, status: 'EXCELLENT', deltaFromPrev: 2.3, tampingDoneBlocks: 18 },
  { runNo: 4, runId: 'TRC-2025-R4', date: '2025-11-20', machine: 'TRC Car #9204', meanTqi: 91.5, peakBlocksCount: 22, status: 'GOOD', deltaFromPrev: 1.8, tampingDoneBlocks: 34 },
  { runNo: 3, runId: 'TRC-2025-R3', date: '2025-05-18', machine: 'TRC Car #8812', meanTqi: 89.7, peakBlocksCount: 38, status: 'ATTENTION_REQUIRED', deltaFromPrev: -1.2, tampingDoneBlocks: 12 },
  { runNo: 2, runId: 'TRC-2024-R2', date: '2024-10-10', machine: 'TRC Car #8812', meanTqi: 90.9, peakBlocksCount: 29, status: 'GOOD', deltaFromPrev: 3.1, tampingDoneBlocks: 45 },
  { runNo: 1, runId: 'TRC-2024-R1 (Baseline)', date: '2024-01-15', machine: 'TRC Car #8812', meanTqi: 87.8, peakBlocksCount: 52, status: 'ATTENTION_REQUIRED', tampingDoneBlocks: 0 }
];

const HISTORICAL_OMS_RUNS: OmsRunSummary[] = [
  { runNo: 5, runId: '16-08-2026_689', date: '2026-08-16', locoNo: 'WAG-12B #60142', speedKmph: 100, totalPeaks: 371, criticalPeaks: 6, highPeaks: 42, mediumPeaks: 323, complianceRate: 85 },
  { runNo: 4, runId: '22-04-2026_512', date: '2026-04-22', locoNo: 'WAG-12B #60088', speedKmph: 98, totalPeaks: 412, criticalPeaks: 9, highPeaks: 54, mediumPeaks: 349, complianceRate: 94 },
  { runNo: 3, runId: '10-01-2026_405', date: '2026-01-10', locoNo: 'WAG-9 #31245', speedKmph: 95, totalPeaks: 458, criticalPeaks: 14, highPeaks: 68, mediumPeaks: 376, complianceRate: 98 },
  { runNo: 2, runId: '15-09-2025_321', date: '2025-09-15', locoNo: 'WAG-12B #60114', speedKmph: 96, totalPeaks: 395, criticalPeaks: 8, highPeaks: 49, mediumPeaks: 338, complianceRate: 100 },
  { runNo: 1, runId: '12-04-2025_218', date: '2025-04-12', locoNo: 'WAG-9 #31090', speedKmph: 92, totalPeaks: 480, criticalPeaks: 18, highPeaks: 76, mediumPeaks: 386, complianceRate: 100 }
];

const DEFAULT_OMS_RECORDS: OmsRecord[] = [
  {
    id: 'OMS-2026-001',
    date: '2026-08-16',
    runNo: '16-08-2026_689 (KRJN-SNL UP LINE)',
    trainNoOrLoco: 'WAG-12B #60142',
    fromKm: 1167.210,
    toKm: 1249.720,
    speedKmph: 98,
    peakType: 'VERTICAL',
    peakValueG: 0.23,
    peakLocationKm: 1172.087,
    tpNo: 'TP-12',
    trackLine: 'Main UP Line',
    severity: 'HIGH',
    actionTaken: 'Tamping scheduled with CSM machine, packing verified.',
    complianceStatus: 'PENDING'
  },
  {
    id: 'OMS-2026-002',
    date: '2026-08-16',
    runNo: '16-08-2026_689 (KRJN-SNL UP LINE)',
    trainNoOrLoco: 'WAG-12B #60142',
    fromKm: 1167.210,
    toKm: 1249.720,
    speedKmph: 100,
    peakType: 'VERTICAL',
    peakValueG: 0.23,
    peakLocationKm: 1173.373,
    tpNo: 'TP-04',
    trackLine: 'Main UP Line',
    severity: 'HIGH',
    actionTaken: 'Alignment rectified and fasteners tightened.',
    complianceStatus: 'ATTENDED'
  },
  {
    id: 'OMS-2026-003',
    date: '2026-08-16',
    runNo: '16-08-2026_689 (KRJN-SNL UP LINE)',
    trainNoOrLoco: 'WAG-12B #60142',
    fromKm: 1167.210,
    toKm: 1249.720,
    speedKmph: 95,
    peakType: 'VERTICAL',
    peakValueG: 0.21,
    peakLocationKm: 1173.378,
    tpNo: 'TP-06',
    trackLine: 'Main UP Line',
    severity: 'HIGH',
    actionTaken: 'Ballast recouping and joint lifting completed.',
    complianceStatus: 'VERIFIED'
  },
  {
    id: 'OMS-2026-004',
    date: '2026-08-16',
    runNo: '16-08-2026_689 (KRJN-SNL UP LINE)',
    trainNoOrLoco: 'WAG-12B #60142',
    fromKm: 1167.210,
    toKm: 1249.720,
    speedKmph: 96,
    peakType: 'VERTICAL',
    peakValueG: 0.20,
    peakLocationKm: 1173.383,
    tpNo: 'TP-08',
    trackLine: 'Main UP Line',
    severity: 'HIGH',
    actionTaken: 'Track alignment adjusted by 1+15 Gang.',
    complianceStatus: 'VERIFIED'
  },
  {
    id: 'OMS-2026-005',
    date: '2026-08-16',
    runNo: '16-08-2026_689 (KRJN-SNL UP LINE)',
    trainNoOrLoco: 'WAG-12B #60142',
    fromKm: 1167.210,
    toKm: 1249.720,
    speedKmph: 98,
    peakType: 'VERTICAL',
    peakValueG: 0.18,
    peakLocationKm: 1173.388,
    tpNo: 'TP-10',
    trackLine: 'Main UP Line',
    severity: 'MEDIUM',
    actionTaken: 'Routine gang packing planned.',
    complianceStatus: 'PENDING'
  }
];

const DEFAULT_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'INSP-PC-01',
    type: 'POINT_CROSSING',
    typeName: 'Point & Crossing',
    title: 'Quarterly P&C Audit - Turnout Pt 101A (SMUN Yard)',
    assetIdOrKm: 'SMUN-Pt101A',
    location: 'SMUN Yard, Km 1177.350 (UP Loop Entry)',
    scheduledDate: '2026-08-15',
    conductedDate: '2026-08-14',
    inspectingOfficial: 'Shri Vivek Kumar Azad (APM)',
    status: 'COMPLETED',
    parametersChecked: 'Switch opening (115mm), Check rail clearance (44mm), Tongue rail wear (1.2mm), Nose wear (2.0mm)',
    deficienciesFound: 'Minor wear on RH tongue rail tip',
    complianceRemarks: 'Grinding done, gap setting adjusted within Indian Railway tolerance.'
  },
  {
    id: 'INSP-CRV-02',
    type: 'CURVE',
    typeName: 'Curve Inspection',
    title: 'Monthly Curve Versine Audit - Curve No. 14 (Km 1184.200–1185.100)',
    assetIdOrKm: 'Curve 14',
    location: 'Km 1184.200 to 1185.100 (Radius 1400m)',
    scheduledDate: '2026-08-20',
    conductedDate: '2026-08-21',
    inspectingOfficial: 'SSE / P-Way (Rajesh Sharma)',
    status: 'COMPLETED',
    parametersChecked: 'Versine variation on 20m chord, Super-elevation (65mm), Transition smoothness',
    deficienciesFound: 'Versine variation of +4mm at Station 6',
    complianceRemarks: 'Realignment completed with hydraulic jacks.'
  },
  {
    id: 'INSP-LWR-03',
    type: 'LWR',
    typeName: 'LWR / CWR Track',
    title: 'Fortnightly LWR De-stressing & Creep Measurement (LWR-02)',
    assetIdOrKm: 'LWR-02',
    location: 'Km 1180.000 to 1202.000 (SMUN–SBJN Section)',
    scheduledDate: '2026-08-28',
    inspectingOfficial: 'APM / SSE Track',
    status: 'SCHEDULED',
    parametersChecked: 'SEJ gap at mean rail temp, Creep post observation, Anchor length condition',
    deficienciesFound: 'None logged yet',
    complianceRemarks: 'Scheduled for inspection during night block.'
  },
  {
    id: 'INSP-LC-04',
    type: 'LEVEL_CROSSING',
    typeName: 'Level Crossing (LC)',
    title: 'Safety & Equipment Audit - Gate 159 SPL (Km 1232.095)',
    assetIdOrKm: 'LC 159 SPL',
    location: 'Km 1232.095 (Special Class Interlocked)',
    scheduledDate: '2026-08-10',
    conductedDate: '2026-08-11',
    inspectingOfficial: 'APM (Civil)',
    status: 'COMPLETED',
    parametersChecked: 'Boom locking, Red banner flags, detonators expiry, HS lamps, Gateman knowledge',
    deficienciesFound: 'Emergency HS lamp battery low',
    complianceRemarks: 'Replaced with freshly charged LED torch from store.'
  },
  {
    id: 'INSP-JST-05',
    type: 'JOINT_ST',
    typeName: 'Joint P&C with S&T',
    title: 'Joint Monthly P&C Inspection with S&T Department (SBJN Yard)',
    assetIdOrKm: 'SBJN-Pt204B',
    location: 'SBJN Yard (Point 204B)',
    scheduledDate: '2026-08-05',
    conductedDate: '2026-08-06',
    inspectingOfficial: 'APM/Civil & ASTE/S&T',
    jointWith: 'Shri Manoj Verma (JE/Signal)',
    status: 'COMPLETED',
    parametersChecked: 'Obstruction test (5mm gauge), Detection slide clearance, Switch motor throw',
    deficienciesFound: 'Motor throw sluggish due to dry lock slide',
    complianceRemarks: 'Cleaned and lubricated with Servogem graphite grease jointly.'
  },
  {
    id: 'INSP-MT-06',
    type: 'MOTOR_TROLLEY',
    typeName: 'Motor Trolley Inspection',
    title: 'Comprehensive Footplate / Motor Trolley Audit (KRJN to SNL)',
    assetIdOrKm: 'Km 1167.210–1249.720',
    location: 'Full SMUN Jurisdiction (88.679 Km)',
    scheduledDate: '2026-08-01',
    conductedDate: '2026-08-02',
    inspectingOfficial: 'Shri Vivek Kumar Azad (APM/Civil)',
    status: 'COMPLETED',
    parametersChecked: 'Cess condition, Bridge approaches, Missing fittings, SEJ clearances, KM/Gradient post legibility',
    deficienciesFound: 'Cess erosion observed at Km 1174.5 UP side',
    complianceRemarks: 'JCB machine deployed for dressing and boulder packing.'
  },
  {
    id: 'INSP-CUST-07',
    type: 'CUSTOM',
    typeName: 'Custom Inspection',
    title: 'Monsoon Preparedness & Waterway Inspection (Bridge 108)',
    assetIdOrKm: 'BR. 108',
    location: 'Km 1224.500 (ROR Rajpura Detour)',
    scheduledDate: '2026-08-25',
    inspectingOfficial: 'SSE / Bridges & APM',
    status: 'SCHEDULED',
    parametersChecked: 'Waterway clearance, Scour depth, HFL markings, Bridge Watchman availability',
    deficienciesFound: 'None',
    complianceRemarks: 'Scheduled before peak rain forecast.'
  }
];

export const PWayQualityInspections: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [mainTab, setMainTab] = useState<'OMS' | 'TRC' | 'INSPECTIONS' | 'DFWO'>('OMS');
  const [inspectionSubTab, setInspectionSubTab] = useState<string>('ALL');

  // TRC View Mode: 'LIST' vs 'CHART' vs 'COMPARE'
  const [trcViewMode, setTrcViewMode] = useState<'LIST' | 'CHART' | 'COMPARE'>('LIST');

  // OMS State
  const [omsRecords, setOmsRecords] = useState<OmsRecord[]>(() => {
    const saved = localStorage.getItem('raildiary_oms_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return DEFAULT_OMS_RECORDS;
  });
  const [omsThresholdFilter, setOmsThresholdFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [omsSearch, setOmsSearch] = useState('');
  const [isOmsModalOpen, setIsOmsModalOpen] = useState(false);
  const [uploadedFileStatus, setUploadedFileStatus] = useState<string | null>(null);
  const omsFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State for manual OMS log
  const [newOms, setNewOms] = useState<Partial<OmsRecord>>({
    date: new Date().toISOString().split('T')[0],
    runNo: `OMS-SMUN-${omsRecords.length + 1}`,
    trainNoOrLoco: 'WAG-12B #60155',
    fromKm: 1167.210,
    toKm: 1249.720,
    speedKmph: 100,
    peakType: 'VERTICAL',
    peakValueG: 0.20,
    peakLocationKm: 1180.500,
    tpNo: 'TP-04',
    trackLine: 'Main UP Line',
    severity: 'HIGH',
    actionTaken: '',
    complianceStatus: 'PENDING'
  });

  // TRC State
  const [trcBlocks, setTrcBlocks] = useState<TrcBlockRecord[]>(() => {
    const saved = localStorage.getItem('raildiary_trc_blocks');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return INITIAL_TRC_BLOCKS;
  });
  const [trcSectionFilter, setTrcSectionFilter] = useState<string>('ALL');
  const [trcSearch, setTrcSearch] = useState<string>('');
  const [editingTrcBlock, setEditingTrcBlock] = useState<TrcBlockRecord | null>(null);

  // Inspections State
  const [inspections, setInspections] = useState<InspectionRecord[]>(() => {
    const saved = localStorage.getItem('raildiary_inspections_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return DEFAULT_INSPECTIONS;
  });
  const [isInspModalOpen, setIsInspModalOpen] = useState(false);
  const [newInsp, setNewInsp] = useState<Partial<InspectionRecord>>({
    type: 'POINT_CROSSING',
    typeName: 'Point & Crossing',
    title: '',
    assetIdOrKm: '',
    location: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    inspectingOfficial: currentUser?.name || 'Shri Vivek Kumar Azad (APM)',
    status: 'SCHEDULED',
    parametersChecked: '',
    deficienciesFound: '',
    complianceRemarks: ''
  });

  const canEdit = role === 'SUPER_ADMIN' || role === 'OFFICER';

  // ---------------------------------------------------------------------------
  // ⚡ OMS TEXT FILE AUTO-PARSER (.txt file format)
  // ---------------------------------------------------------------------------
  const handleOmsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split('\n');
        let runNo = file.name.replace('.txt', '');
        let route = 'KRJN-SNL_UP_LINE';
        let runDate = new Date().toISOString().split('T')[0];
        let locoNo = 'WAG-12B #60142';

        for (const line of lines) {
          const parts = line.split(',');
          if (parts[0] === '95' && parts[1]) runNo = parts[1].trim();
          if (parts[0] === '91' && parts[1]) route = parts[1].trim();
          if (parts[0] === '93' && parts.length >= 4) {
            const d = parts[1].padStart(2, '0');
            const m = parts[2].padStart(2, '0');
            const y = parts[3];
            runDate = `${y}-${m}-${d}`;
          }
        }

        const parsedPeaks: OmsRecord[] = [];
        let countInSMUN = 0;

        for (const line of lines) {
          const parts = line.split(',');
          if (parts[0] === '61' && parts.length >= 5) {
            const km = parseInt(parts[1], 10);
            const meter = parseInt(parts[2], 10) || 0;
            const vert = parseFloat(parts[3]) || 0.0;
            const lat = parseFloat(parts[4]) || 0.0;
            const chainage = km + meter / 1000.0;

            // Strict Filter: Km 1167.000 to Km 1249.720 (SMUN Jurisdiction)
            if (chainage >= 1167.0 && chainage <= 1249.72) {
              countInSMUN++;
              const maxVal = Math.max(vert, lat);
              const pType: 'VERTICAL' | 'LATERAL' | 'BOTH' =
                vert > 0 && lat > 0 ? 'BOTH' : lat > vert ? 'LATERAL' : 'VERTICAL';

              let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
              if (maxVal >= 0.25) severity = 'CRITICAL';
              else if (maxVal >= 0.20) severity = 'HIGH';
              else if (maxVal >= 0.15) severity = 'MEDIUM';
              else severity = 'LOW';

              parsedPeaks.push({
                id: `OMS-PEAK-${km}-${meter}-${Date.now().toString().slice(-4)}-${countInSMUN}`,
                date: runDate,
                runNo: runNo,
                trainNoOrLoco: locoNo,
                fromKm: 1167.210,
                toKm: 1249.720,
                speedKmph: 100,
                peakType: pType,
                peakValueG: parseFloat(maxVal.toFixed(2)),
                peakLocationKm: parseFloat(chainage.toFixed(3)),
                tpNo: `TP-${Math.round((meter % 100) / 10) + 1}`,
                trackLine: route.includes('DN') ? 'Main DN Line' : 'Main UP Line',
                severity: severity,
                actionTaken: maxVal >= 0.20 ? 'Immediate packing & lifting required' : 'Fasteners tightening planned',
                complianceStatus: 'PENDING'
              });
            }
          }
        }

        if (parsedPeaks.length > 0) {
          parsedPeaks.sort((a, b) => b.peakValueG - a.peakValueG);
          const next = [...parsedPeaks, ...omsRecords];
          setOmsRecords(next);
          localStorage.setItem('raildiary_oms_records', JSON.stringify(next));
          setUploadedFileStatus(`✅ Successfully imported ${parsedPeaks.length} acceleration peaks in Km 1167–1249 from ${file.name}`);
        } else {
          setUploadedFileStatus(`⚠️ No peaks found between Km 1167 and Km 1249 in ${file.name}`);
        }
      } catch (err: any) {
        setUploadedFileStatus(`❌ Error parsing OMS file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Save TRC updates
  const handleSaveTrcEdit = (updated: TrcBlockRecord) => {
    const next = trcBlocks.map(b => b.id === updated.id ? updated : b);
    setTrcBlocks(next);
    localStorage.setItem('raildiary_trc_blocks', JSON.stringify(next));
    setEditingTrcBlock(null);
  };

  // Add Manual OMS Record
  const handleAddOms = (e: React.FormEvent) => {
    e.preventDefault();
    const gVal = Number(newOms.peakValueG) || 0.16;
    const record: OmsRecord = {
      id: `OMS-${Date.now()}`,
      date: newOms.date || new Date().toISOString().split('T')[0],
      runNo: newOms.runNo || 'OMS-SMUN',
      trainNoOrLoco: newOms.trainNoOrLoco || 'WAG-12B #60142',
      fromKm: Number(newOms.fromKm) || 1167.210,
      toKm: Number(newOms.toKm) || 1249.720,
      speedKmph: Number(newOms.speedKmph) || 100,
      peakType: newOms.peakType || 'VERTICAL',
      peakValueG: gVal,
      peakLocationKm: Number(newOms.peakLocationKm) || 1172.500,
      tpNo: newOms.tpNo || '-',
      trackLine: newOms.trackLine || 'Main UP Line',
      severity: gVal >= 0.25 ? 'CRITICAL' : gVal >= 0.20 ? 'HIGH' : 'MEDIUM',
      actionTaken: newOms.actionTaken || 'Packing planned',
      complianceStatus: 'PENDING'
    };
    const next = [record, ...omsRecords];
    setOmsRecords(next);
    localStorage.setItem('raildiary_oms_records', JSON.stringify(next));
    setIsOmsModalOpen(false);
  };

  // Add Inspection Record
  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const typeNames: Record<string, string> = {
      POINT_CROSSING: 'Point & Crossing',
      CURVE: 'Curve Inspection',
      LWR: 'LWR / CWR Track',
      LEVEL_CROSSING: 'Level Crossing (LC)',
      JOINT_ST: 'Joint P&C with S&T',
      MOTOR_TROLLEY: 'Motor Trolley Inspection',
      CUSTOM: 'Custom Inspection'
    };
    const record: InspectionRecord = {
      id: `INSP-${Date.now()}`,
      type: newInsp.type || 'CUSTOM',
      typeName: typeNames[newInsp.type || 'CUSTOM'] || 'Custom',
      title: newInsp.title || 'New Track Inspection',
      assetIdOrKm: newInsp.assetIdOrKm || '-',
      location: newInsp.location || 'IMSD SMUN Section',
      scheduledDate: newInsp.scheduledDate || new Date().toISOString().split('T')[0],
      conductedDate: newInsp.status === 'COMPLETED' ? (newInsp.conductedDate || newInsp.scheduledDate) : undefined,
      inspectingOfficial: newInsp.inspectingOfficial || currentUser?.name || 'APM/Civil',
      jointWith: newInsp.jointWith,
      status: newInsp.status || 'SCHEDULED',
      parametersChecked: newInsp.parametersChecked || 'All parameters verified',
      deficienciesFound: newInsp.deficienciesFound || 'None',
      complianceRemarks: newInsp.complianceRemarks || 'Checked as per Indian Railway P-Way manual'
    };
    const next = [record, ...inspections];
    setInspections(next);
    localStorage.setItem('raildiary_inspections_records', JSON.stringify(next));
    setIsInspModalOpen(false);
  };

  // Filtered OMS Records
  const filteredOms = useMemo(() => {
    return omsRecords.filter(r => {
      if (omsThresholdFilter === 'CRITICAL' && r.severity !== 'CRITICAL') return false;
      if (omsThresholdFilter === 'HIGH' && r.severity !== 'HIGH' && r.severity !== 'CRITICAL') return false;
      if (omsThresholdFilter === 'MEDIUM' && r.severity === 'LOW') return false;

      if (omsSearch.trim()) {
        const q = omsSearch.toLowerCase();
        return (
          r.runNo.toLowerCase().includes(q) ||
          String(r.peakLocationKm).includes(q) ||
          r.trackLine.toLowerCase().includes(q) ||
          r.actionTaken.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [omsRecords, omsThresholdFilter, omsSearch]);

  // Export OMS CSV
  const exportOmsCsv = () => {
    const rows = [
      ['Run No', 'Date', 'Loco / Train', 'Location Km', 'TP No', 'Peak (g)', 'Peak Type', 'Speed (km/h)', 'Track Line', 'Severity', 'Action Taken', 'Compliance Status']
    ];
    filteredOms.forEach(r => {
      rows.push([
        r.runNo,
        r.date,
        r.trainNoOrLoco,
        r.peakLocationKm.toFixed(3),
        r.tpNo || '',
        r.peakValueG.toString(),
        r.peakType,
        r.speedKmph.toString(),
        r.trackLine,
        r.severity,
        `"${r.actionTaken.replace(/"/g, '""')}"`,
        r.complianceStatus
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DFCCIL_OMS_Peaks_Km1167-1249_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered TRC
  const filteredTrc = useMemo(() => {
    return trcBlocks.filter(b => {
      if (trcSectionFilter !== 'ALL' && !b.section.includes(trcSectionFilter)) return false;
      if (trcSearch.trim()) {
        const q = trcSearch.toLowerCase();
        if (!b.chainageRange.toLowerCase().includes(q) && !String(b.km).includes(q) && !b.id.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [trcBlocks, trcSectionFilter, trcSearch]);

  // Filtered Inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(i => {
      if (inspectionSubTab !== 'ALL' && i.type !== inspectionSubTab) return false;
      return true;
    });
  }, [inspections, inspectionSubTab]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 6. COMPACT 4-KPI CARDS HEADER (OMS, TRC, INSPECTIONS, DFWO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: OMS */}
        <button
          type="button"
          onClick={() => setMainTab('OMS')}
          className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            mainTab === 'OMS'
              ? 'bg-gradient-to-br from-blue-900/90 to-indigo-950 text-white border-blue-400 shadow-lg ring-2 ring-blue-500/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span>OSCILLATION</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'OMS' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {omsRecords.length} Peaks
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="font-black text-sm md:text-base leading-tight">OMS Peak Analysis</h3>
            <p className={`text-[11px] mt-0.5 truncate ${mainTab === 'OMS' ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
              .txt Auto-Parser &amp; Peaks (≥0.15g)
            </p>
          </div>
        </button>

        {/* Card 2: TRC */}
        <button
          type="button"
          onClick={() => setMainTab('TRC')}
          className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            mainTab === 'TRC'
              ? 'bg-gradient-to-br from-cyan-950 to-slate-900 text-white border-cyan-400 shadow-lg ring-2 ring-cyan-500/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500 text-slate-800 dark:text-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              <span>TQI TRACK</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'TRC' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {trcBlocks.length} Blocks
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="font-black text-sm md:text-base leading-tight">TRC &amp; TQI Planning</h3>
            <p className={`text-[11px] mt-0.5 truncate ${mainTab === 'TRC' ? 'text-cyan-200' : 'text-slate-500 dark:text-slate-400'}`}>
              Chart/List View &amp; 5-Run Compare
            </p>
          </div>
        </button>

        {/* Card 3: Inspections */}
        <button
          type="button"
          onClick={() => setMainTab('INSPECTIONS')}
          className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            mainTab === 'INSPECTIONS'
              ? 'bg-gradient-to-br from-emerald-950 to-slate-900 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-500/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 text-slate-800 dark:text-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>AUDIT</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'INSPECTIONS' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              7 Types
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="font-black text-sm md:text-base leading-tight">Track Inspections</h3>
            <p className={`text-[11px] mt-0.5 truncate ${mainTab === 'INSPECTIONS' ? 'text-emerald-200' : 'text-slate-500 dark:text-slate-400'}`}>
              P&amp;C, Curves, LWR, LC &amp; Trolley
            </p>
          </div>
        </button>

        {/* Card 4: DFWO Defects */}
        <button
          type="button"
          onClick={() => setMainTab('DFWO')}
          className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
            mainTab === 'DFWO'
              ? 'bg-gradient-to-br from-red-950 to-slate-900 text-white border-red-400 shadow-lg ring-2 ring-red-500/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 text-slate-800 dark:text-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 font-mono flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DEFECTS</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              mainTab === 'DFWO' ? 'bg-red-500/30 text-red-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              DFWO Logs
            </span>
          </div>
          <div className="mt-2.5">
            <h3 className="font-black text-sm md:text-base leading-tight">DFWO Track Defects</h3>
            <p className={`text-[11px] mt-0.5 truncate ${mainTab === 'DFWO' ? 'text-red-200' : 'text-slate-500 dark:text-slate-400'}`}>
              USFD Rail Defects &amp; Speed Restrictions
            </p>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OMS SUB-MODULE */}
      {/* ========================================================================= */}
      {mainTab === 'OMS' && (
        <div className="space-y-6">
          {uploadedFileStatus && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 font-semibold animate-fadeIn">
              <span>{uploadedFileStatus}</span>
              <button onClick={() => setUploadedFileStatus(null)} className="text-blue-500 hover:text-blue-700">✕</button>
            </div>
          )}

          <input
            type="file"
            ref={omsFileInputRef}
            onChange={handleOmsFileUpload}
            accept=".txt,.csv"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Recorded Peaks</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{omsRecords.length} Peaks</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Km 1167.210 to 1249.720</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">High Peaks (≥0.20g)</div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                {omsRecords.filter(r => r.peakValueG >= 0.20).length} Peaks
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Immediate attention threshold</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Attention (0.15–0.19g)</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {omsRecords.filter(r => r.peakValueG >= 0.15 && r.peakValueG < 0.20).length} Peaks
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Routine track packing</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Actions &amp; Import</div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => omsFileInputRef.current?.click()}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .txt</span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => setIsOmsModalOpen(true)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition"
                    title="Manual Log Peak"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OMS Records Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <span>⚡</span>
                  <span>OMS Acceleration Peak Logs ({filteredOms.length} Filtered / {omsRecords.length} Total)</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Auto-parsed from OMS Data Files • Filtered strictly for SMUN Jurisdiction (Km 1167 to 1249)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={omsThresholdFilter}
                  onChange={e => setOmsThresholdFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Peaks (≥0.15g)</option>
                  <option value="HIGH">High (≥0.20g)</option>
                  <option value="CRITICAL">Critical (≥0.25g)</option>
                </select>

                <button
                  onClick={exportOmsCsv}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={omsSearch}
                onChange={e => setOmsSearch(e.target.value)}
                placeholder="Search by location Km (e.g. 1173), Run No, track line, or action..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 shadow-sm">
                    <th className="py-2.5 px-3">RUN / DATE</th>
                    <th className="py-2.5 px-3">LOCATION (KM &amp; TP)</th>
                    <th className="py-2.5 px-3">PEAK ACCELERATION</th>
                    <th className="py-2.5 px-3">TYPE</th>
                    <th className="py-2.5 px-3">TRACK LINE</th>
                    <th className="py-2.5 px-3">ACTION PLANNED / COMPLIANCE</th>
                    <th className="py-2.5 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                  {filteredOms.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold font-mono text-blue-700 dark:text-blue-400 block truncate max-w-[150px]" title={r.runNo}>
                          {r.runNo}
                        </span>
                        <span className="text-[10px] text-slate-500">{r.date}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">Km {r.peakLocationKm.toFixed(3)}</span>
                        {r.tpNo && <span className="text-slate-500 text-[10px] ml-1">({r.tpNo})</span>}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-black font-mono text-xs ${
                          r.peakValueG >= 0.25
                            ? 'bg-red-600 text-white shadow-sm animate-pulse'
                            : r.peakValueG >= 0.20
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {r.peakValueG.toFixed(2)}g
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">
                          {r.peakType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{r.trackLine}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[240px] truncate" title={r.actionTaken}>
                        {r.actionTaken || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.complianceStatus === 'VERIFIED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : r.complianceStatus === 'ATTENDED'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}>
                          {r.complianceStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRC SUB-MODULE (WITH CHART/LIST TOGGLE & LAST 5 RUNS COMPARE) */}
      {/* ========================================================================= */}
      {mainTab === 'TRC' && (
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl border border-blue-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Track Quality Index (TQI) &amp; Machine Planning
                  </h3>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Indexed 444 Track Blocks (200m each) across Km 1167.210 – 1249.720 with Multi-Run TQI &amp; CSM Tamping Status
                </p>
              </div>

              {/* View Switcher: LIST vs CHART vs COMPARE */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-blue-400/30">
                <button
                  onClick={() => setTrcViewMode('LIST')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    trcViewMode === 'LIST'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>

                <button
                  onClick={() => setTrcViewMode('CHART')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    trcViewMode === 'CHART'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Chart View</span>
                </button>

                <button
                  onClick={() => setTrcViewMode('COMPARE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    trcViewMode === 'COMPARE'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Last 5 Runs</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            {trcViewMode !== 'COMPARE' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2 border-t border-white/10 text-xs">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={trcSearch}
                    onChange={e => setTrcSearch(e.target.value)}
                    placeholder="Search by Km (e.g. 1172), Block (B1-B5), or Chainage..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-blue-400/30 rounded-xl text-white placeholder:text-blue-300/50 focus:outline-none focus:border-cyan-400"
                  />
                  <Search className="w-4 h-4 text-blue-300 absolute left-3 top-2.5" />
                </div>

                <select
                  value={trcSectionFilter}
                  onChange={e => setTrcSectionFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Sections (Full Jurisdiction)</option>
                  <option value="SMUN-SBJN">SMUN–SBJN (Km 1172–1186)</option>
                  <option value="SBJN-NSIR">SBJN–NSIR (Km 1190–1200)</option>
                  <option value="NSIR-GVGN">NSIR–GVGN (Km 1204–1211)</option>
                  <option value="GVGN-KNNN">GVGN–KNNN (Km 1211–1227)</option>
                  <option value="KNNN-CHAN">KNNN–CHAN (Km 1227–1237)</option>
                  <option value="CHAN-SNL">CHAN–SNL (Km 1237–1249)</option>
                </select>
              </div>
            )}
          </div>

          {/* VIEW A: LAST 5 RUNS COMPARISON */}
          {trcViewMode === 'COMPARE' && (
            <div className="space-y-6">
              {/* TRC Runs Comparison Card */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-cyan-500">📈</span>
                    <span>TRC Track Quality Index (Last 5 Runs Comparison)</span>
                  </h4>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Overall Quality Improvement: +6.0 TQI
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">RUN NO</th>
                        <th className="py-2.5 px-3">RUN DATE</th>
                        <th className="py-2.5 px-3">TESTING MACHINE</th>
                        <th className="py-2.5 px-3">MEAN TQI</th>
                        <th className="py-2.5 px-3">DELTA (Δ)</th>
                        <th className="py-2.5 px-3">PEAK BLOCKS</th>
                        <th className="py-2.5 px-3">TAMPING DONE</th>
                        <th className="py-2.5 px-3 text-right">RATING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {HISTORICAL_TRC_RUNS.map(run => (
                        <tr key={run.runId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">{run.runId}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{run.date}</td>
                          <td className="py-2.5 px-3">{run.machine}</td>
                          <td className="py-2.5 px-3 font-black text-sm text-slate-900 dark:text-white">{run.meanTqi}</td>
                          <td className="py-2.5 px-3 font-bold">
                            {run.deltaFromPrev !== undefined ? (
                              <span className={run.deltaFromPrev >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                {run.deltaFromPrev >= 0 ? `+${run.deltaFromPrev}` : run.deltaFromPrev}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-amber-600 font-bold">{run.peakBlocksCount} Blocks</td>
                          <td className="py-2.5 px-3 text-cyan-600 font-bold">{run.tampingDoneBlocks} Blocks</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              run.status === 'EXCELLENT'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OMS Runs Comparison Card */}
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-amber-500">⚡</span>
                    <span>OMS Oscillation Runs (Last 5 Runs Comparison)</span>
                  </h4>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                    Peak Reduction: -22.7% over 5 Runs
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">RUN NO</th>
                        <th className="py-2.5 px-3">RUN DATE</th>
                        <th className="py-2.5 px-3">LOCO / TRAIN</th>
                        <th className="py-2.5 px-3">SPEED</th>
                        <th className="py-2.5 px-3">CRITICAL (≥0.25g)</th>
                        <th className="py-2.5 px-3">HIGH (0.20-0.24g)</th>
                        <th className="py-2.5 px-3">TOTAL PEAKS</th>
                        <th className="py-2.5 px-3 text-right">COMPLIANCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {HISTORICAL_OMS_RUNS.map(run => (
                        <tr key={run.runId} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">{run.runId}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{run.date}</td>
                          <td className="py-2.5 px-3">{run.locoNo}</td>
                          <td className="py-2.5 px-3 font-bold">{run.speedKmph} km/h</td>
                          <td className="py-2.5 px-3 font-black text-red-600">{run.criticalPeaks}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-600">{run.highPeaks}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{run.totalPeaks}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold">
                              {run.complianceRate}% Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: CHART VIEW */}
          {trcViewMode === 'CHART' && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  TQI Track Quality Distribution Profile (Block-by-Block Visual Bar Chart)
                </h4>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-3 bg-emerald-500 rounded-sm" /> TQI &gt; 90 (Good)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-3 h-3 bg-amber-500 rounded-sm" /> TQI 80-90 (Fair)
                  </span>
                  <span className="flex items-center gap-1.5 text-red-600">
                    <span className="w-3 h-3 bg-red-500 rounded-sm" /> TQI &lt; 80 (Tamping Due)
                  </span>
                </div>
              </div>

              {/* Interactive SVG Bar Chart */}
              <div className="overflow-x-auto py-4 custom-scrollbar">
                <div className="min-w-[900px] h-64 flex items-end gap-1.5 px-2 border-b border-slate-200 dark:border-slate-800">
                  {filteredTrc.slice(0, 50).map(block => {
                    const val = typeof block.run1Tqi === 'number' ? block.run1Tqi : parseFloat(String(block.run1Tqi));
                    const heightPercent = !isNaN(val) ? Math.max(10, (val / 110) * 100) : 10;
                    const isRed = !isNaN(val) && val < 80;
                    const isAmber = !isNaN(val) && val >= 80 && val < 90;

                    return (
                      <div
                        key={block.id}
                        onClick={() => setEditingTrcBlock(block)}
                        className="flex-1 flex flex-col items-center group cursor-pointer"
                        title={`${block.id} (${block.chainageRange})
TQI: ${block.run1Tqi}
Tamping Reqd: ${block.tampingRequired ? 'YES' : 'NO'}`}
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all group-hover:opacity-80 group-hover:scale-105 ${
                            isRed ? 'bg-red-500' : isAmber ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-[28px] rotate-45 origin-left">
                          {block.km}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-400 text-center mt-6 font-mono">
                  Showing first 50 blocks. Click any bar to open Update TQI &amp; Tamping dialog.
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: LIST VIEW */}
          {trcViewMode === 'LIST' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Track Quality Index (TQI) per 200m Block ({filteredTrc.length} Blocks Shown)
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Click "Update Run" on any block to log post-tamping / subsequent TRC run
                </div>
              </div>

              <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 shadow-sm">
                      <th className="py-3 px-3">BLOCK ID</th>
                      <th className="py-3 px-3">CHAINAGE RANGE</th>
                      <th className="py-3 px-3">SECTION</th>
                      <th className="py-3 px-3">RUN 1 TQI</th>
                      <th className="py-3 px-3">RUN 2 TQI</th>
                      <th className="py-3 px-3">TAMPING REQD</th>
                      <th className="py-3 px-3">TAMPING DONE</th>
                      <th className="py-3 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    {filteredTrc.map(block => {
                      const r1Num = typeof block.run1Tqi === 'number' ? block.run1Tqi : parseFloat(String(block.run1Tqi));
                      const r2Num = typeof block.run2Tqi === 'number' ? block.run2Tqi : (block.run2Tqi ? parseFloat(String(block.run2Tqi)) : null);
                      
                      return (
                        <tr key={block.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-400">
                            {block.id}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold">
                            {block.chainageRange}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[160px]" title={block.section}>
                            {block.section.split('(')[0].trim()}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {block.run1Tqi === 'NR' ? (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono text-[11px]">NR</span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded font-black font-mono text-xs ${
                                !isNaN(r1Num) && r1Num < 80
                                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                                  : !isNaN(r1Num) && r1Num < 90
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                              }`}>
                                {block.run1Tqi}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                            {block.run2Tqi !== null && block.run2Tqi !== undefined ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-cyan-600 dark:text-cyan-400">{block.run2Tqi}</span>
                                {r2Num && !isNaN(r1Num) && (
                                  <span className={`text-[10px] font-bold ${r2Num > r1Num ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {r2Num > r1Num ? `↑+${(r2Num - r1Num).toFixed(1)}` : `↓${(r2Num - r1Num).toFixed(1)}`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {block.tampingRequired ? (
                              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded font-bold text-[10px]">
                                YES (Tamping Due)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {block.tampingDone ? (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded font-bold text-[10px]">
                                DONE (CSM)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setEditingTrcBlock(block)}
                              className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Update Run</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INSPECTIONS SUB-MODULE */}
      {/* ========================================================================= */}
      {mainTab === 'INSPECTIONS' && (
        <div className="space-y-6">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'All Inspections' },
              { id: 'POINT_CROSSING', label: 'Point & Crossing' },
              { id: 'CURVE', label: 'Curve' },
              { id: 'LWR', label: 'LWR' },
              { id: 'LEVEL_CROSSING', label: 'LC Gates' },
              { id: 'JOINT_ST', label: 'Joint P&C (with S&T)' },
              { id: 'MOTOR_TROLLEY', label: 'Motor Trolley' },
              { id: 'CUSTOM', label: 'Custom' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setInspectionSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  inspectionSubTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {canEdit && (
              <button
                onClick={() => setIsInspModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ml-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Inspection</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInspections.map(insp => (
              <div
                key={insp.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-[10px] font-bold font-mono uppercase">
                      {insp.typeName}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {insp.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      📍 {insp.location} ({insp.assetIdOrKm})
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    insp.status === 'COMPLETED'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}>
                    {insp.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="text-slate-700 dark:text-slate-300">
                    <span className="font-bold">Parameters Checked:</span> {insp.parametersChecked}
                  </div>
                  {insp.deficienciesFound && (
                    <div className="text-amber-700 dark:text-amber-300 font-medium">
                      <span className="font-bold">Deficiencies:</span> {insp.deficienciesFound}
                    </div>
                  )}
                  <div className="text-slate-600 dark:text-slate-400">
                    <span className="font-bold">Compliance Action:</span> {insp.complianceRemarks}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>Auditor: <strong className="text-slate-800 dark:text-slate-200">{insp.inspectingOfficial}</strong></span>
                  <span>Date: {insp.conductedDate || insp.scheduledDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DFWO DEFECTS SUB-MODULE */}
      {/* ========================================================================= */}
      {mainTab === 'DFWO' && (
        <div className="space-y-6">
          <DefectManager />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE TRC BLOCK RUN 2 / RUN 3 */}
      {/* ========================================================================= */}
      {editingTrcBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Update TRC Run TQI ({editingTrcBlock.id})
                </h3>
                <p className="text-xs text-slate-500 font-mono">{editingTrcBlock.chainageRange}</p>
              </div>
              <button onClick={() => setEditingTrcBlock(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveTrcEdit(editingTrcBlock);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Run 1 TQI (Baseline)</label>
                <input
                  type="text"
                  value={editingTrcBlock.run1Tqi}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Run 2 TQI (Post-Tamping / Subsequent Run)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 96.50"
                  value={editingTrcBlock.run2Tqi !== null && editingTrcBlock.run2Tqi !== undefined ? editingTrcBlock.run2Tqi : ''}
                  onChange={e => setEditingTrcBlock({ ...editingTrcBlock, run2Tqi: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTrcBlock.tampingRequired}
                    onChange={e => setEditingTrcBlock({ ...editingTrcBlock, tampingRequired: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Tamping Required</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTrcBlock.tampingDone}
                    onChange={e => setEditingTrcBlock({ ...editingTrcBlock, tampingDone: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Tamping Completed</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTrcBlock(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save TRC Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL LOG OMS RUN */}
      {/* ========================================================================= */}
      {isOmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log OMS Acceleration Peak</h3>
              <button onClick={() => setIsOmsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddOms} className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">OMS Run No.</label>
                <input
                  type="text"
                  required
                  value={newOms.runNo}
                  onChange={e => setNewOms({ ...newOms, runNo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newOms.date}
                  onChange={e => setNewOms({ ...newOms, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Peak Location Km</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={newOms.peakLocationKm}
                  onChange={e => setNewOms({ ...newOms, peakLocationKm: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Peak Acceleration (g)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newOms.peakValueG}
                  onChange={e => setNewOms({ ...newOms, peakValueG: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Action Planned / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Packing planned with gang, tamping scheduled"
                  value={newOms.actionTaken}
                  onChange={e => setNewOms({ ...newOms, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOmsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG NEW TRACK INSPECTION */}
      {/* ========================================================================= */}
      {isInspModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Track Inspection</h3>
              <button onClick={() => setIsInspModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddInspection} className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Inspection Type</label>
                <select
                  value={newInsp.type}
                  onChange={e => setNewInsp({ ...newInsp, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="POINT_CROSSING">Point & Crossing</option>
                  <option value="CURVE">Curve</option>
                  <option value="LWR">LWR / CWR</option>
                  <option value="LEVEL_CROSSING">Level Crossing (LC)</option>
                  <option value="JOINT_ST">Joint Point & Crossing with S&T</option>
                  <option value="MOTOR_TROLLEY">Motor Trolley</option>
                  <option value="CUSTOM">Custom Inspection</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Versine Audit Curve 14"
                  value={newInsp.title}
                  onChange={e => setNewInsp({ ...newInsp, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Asset ID / Km</label>
                <input
                  type="text"
                  placeholder="e.g. Pt 101A or Km 1184"
                  value={newInsp.assetIdOrKm}
                  onChange={e => setNewInsp({ ...newInsp, assetIdOrKm: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newInsp.scheduledDate}
                  onChange={e => setNewInsp({ ...newInsp, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parameters Checked</label>
                <input
                  type="text"
                  placeholder="e.g. Check rail clearance, gauge, cross levels, SEJ gap"
                  value={newInsp.parametersChecked}
                  onChange={e => setNewInsp({ ...newInsp, parametersChecked: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInspModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
