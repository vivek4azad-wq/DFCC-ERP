/**
 * Dual-Tier Database Service with Offline Persistence & Local Storage Fallback
 * Provides complete Firestore-compatible CRUD, indexed Km Quick Finder, RBAC guards, and Analytics.
 */

import { SEED_DATA, type SeedDatabase } from '../data/seedData.ts';
import {
  syncDocToFirestore,
  deleteDocFromFirestore,
  syncCollectionToFirestore,
  fetchCollectionFromFirestore,
  isFirebaseConfigured
} from './firebase.ts';
import type {
  CollectionName,
  IDatabaseService,
  UserSession,
  UserRole,
  KmQueryOptions,
  KmSearchResult,
  UnifiedAssetItem,
  AnalyticsSummary,
  ALL_COLLECTIONS
} from '../types/index.ts';

const STORAGE_PREFIX = 'raildiary_db_';
const INITIALIZED_KEY = 'raildiary_db_initialized_v28';

export class DatabaseSecurityError extends Error {
  constructor(message: string, public role?: UserRole, public action?: string) {
    super(message);
    this.name = 'DatabaseSecurityError';
  }
}

export class LocalDatabaseService implements IDatabaseService {
  private memoryStore: Map<CollectionName, Map<string, any>> = new Map();
  private initialized = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initStore();
    this.setupAdaptiveSync();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyChange(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Error in database subscriber:', err);
      }
    });
  }

  private hasLocalStorage(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  private initStore(): void {
    // Populate memory store from LocalStorage or fallback to SEED_DATA
    for (const col of Object.keys(SEED_DATA) as CollectionName[]) {
      this.memoryStore.set(col, new Map());
    }

    if (this.hasLocalStorage()) {
      try {
        const isAlreadyInit = localStorage.getItem(INITIALIZED_KEY) === 'true';
        if (isAlreadyInit) {
          for (const col of Object.keys(SEED_DATA) as CollectionName[]) {
            const raw = localStorage.getItem(`${STORAGE_PREFIX}${col}`);
            if (raw) {
              try {
                let list: any[] = JSON.parse(raw);
                if (col === 'store_items' && (!list || list.length === 0)) {
                  list = (SEED_DATA as any).store_items || [];
                  localStorage.setItem(`${STORAGE_PREFIX}store_items`, JSON.stringify(list));
                }
                if (col === 'store_transactions' && (!list || list.length === 0)) {
                  list = (SEED_DATA as any).store_transactions || [];
                  localStorage.setItem(`${STORAGE_PREFIX}store_transactions`, JSON.stringify(list));
                }
                const map = new Map<string, any>();
                list.forEach(item => map.set(item.id, item));
                this.memoryStore.set(col, map);
              } catch {
                // fallback for this specific collection without wiping others
                const seedList = (SEED_DATA as any)[col] || [];
                const map = new Map<string, any>();
                seedList.forEach((item: any) => map.set(item.id, item));
                this.memoryStore.set(col, map);
              }
            } else {
              // fallback for this collection
              const seedList = (SEED_DATA as any)[col] || [];
              const map = new Map<string, any>();
              seedList.forEach((item: any) => map.set(item.id, item));
              this.memoryStore.set(col, map);
            }
          }
          this.initialized = true;
          this.pullAllFromFirestore().catch(e => console.warn('Firestore initial pull:', e));
          return;
        }
      } catch (e) {
        console.warn('LocalStorage access warning in initStore:', e);
      }
    }

    // Default: Seed from SEED_DATA
    this.seedFromSource(SEED_DATA);
    this.pullAllFromFirestore().catch(e => console.warn('Firestore initial pull error:', e));
  }

  /**
   * Pull and merge remote collection data from Cloud Firestore
   */
  public async pullAllFromFirestore(): Promise<void> {
    if (!isFirebaseConfigured()) return;
    try {
      let anyUpdated = false;
      for (const col of Object.keys(SEED_DATA) as CollectionName[]) {
        const remoteDocs = await fetchCollectionFromFirestore(col);
        if (remoteDocs && remoteDocs.length > 0) {
          let colMap = this.memoryStore.get(col);
          if (!colMap) {
            colMap = new Map();
            this.memoryStore.set(col, colMap);
          }
          remoteDocs.forEach(doc => {
            colMap?.set(doc.id, doc);
          });
          this.saveCollection(col);
          anyUpdated = true;
        }
      }
      if (anyUpdated) {
        this.notifyChange();
      }
    } catch (e) {
      console.warn('Failed to pull all collections from Firestore:', e);
    }
  }

  private seedFromSource(source: SeedDatabase): void {
    for (const [colName, items] of Object.entries(source) as [CollectionName, any[]][]) {
      const map = new Map<string, any>();
      items.forEach(item => map.set(item.id, { ...item }));
      this.memoryStore.set(colName, map);

      if (this.hasLocalStorage()) {
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${colName}`, JSON.stringify(items));
        } catch (e) {
          console.warn(`LocalStorage write error for ${colName}:`, e);
        }
      }
    }

    if (this.hasLocalStorage()) {
      try {
        localStorage.setItem(INITIALIZED_KEY, 'true');
      } catch (e) {
        console.warn('LocalStorage error setting initialized flag:', e);
      }
    }

    this.initialized = true;
  }

  /**
   * Adaptive Data Sync Strategy:
   * - Immediate background synchronization when app is open/active in foreground
   * - Automatic reconciliation on window focus / visibility change
   * - 24-Hour periodic refresh timer for offline persistence
   */
  private setupAdaptiveSync(): void {
    if (typeof window === 'undefined') return;

    // 1. Immediate sync on window focus or foreground resume
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pullAllFromFirestore().catch(e => console.warn('Foreground sync:', e));
      }
    });

    window.addEventListener('focus', () => {
      this.pullAllFromFirestore().catch(e => console.warn('Focus sync:', e));
    });

    // 2. Real-time active sync every 15 seconds while app is open
    setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.pullAllFromFirestore().catch(e => console.warn('Periodic active sync:', e));
      }
    }, 15000);

    // 3. 24-Hour background reconciliation timer
    setInterval(() => {
      this.pullAllFromFirestore().catch(e => console.warn('24-Hour sync reconciliation:', e));
    }, 24 * 60 * 60 * 1000);
  }

  private saveCollection(collection: CollectionName): void {
    if (!this.hasLocalStorage()) return;
    const map = this.memoryStore.get(collection);
    if (!map) return;
    const array = Array.from(map.values());
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${collection}`, JSON.stringify(array));
    } catch (e) {
      console.warn(`LocalStorage write error for ${collection}:`, e);
    }
  }

  public async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  public async reseedDatabase(): Promise<void> {
    if (this.hasLocalStorage()) {
      for (const col of Object.keys(SEED_DATA) as CollectionName[]) {
        localStorage.removeItem(`${STORAGE_PREFIX}${col}`);
      }
      localStorage.removeItem(INITIALIZED_KEY);
    }
    this.seedFromSource(SEED_DATA);
    this.notifyChange();
  }

  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------

  public async getCollection<T extends { id: string }>(collection: CollectionName): Promise<T[]> {
    const colMap = this.memoryStore.get(collection);
    if (!colMap) {
      return [];
    }
    return Array.from(colMap.values()) as T[];
  }

  public async getDocument<T extends { id: string }>(
    collection: CollectionName,
    id: string
  ): Promise<T | null> {
    const colMap = this.memoryStore.get(collection);
    if (!colMap) return null;
    return (colMap.get(id) as T) || null;
  }

  public async addDocument<T extends { id?: string }>(
    collection: CollectionName,
    data: T,
    user?: UserSession | null
  ): Promise<string> {
    // RBAC: STAFF cannot add documents
    if (user && user.role === 'STAFF') {
      throw new DatabaseSecurityError('Staff role has read-only access. Write rejected.', 'STAFF', 'add');
    }

    let docId = data.id;
    if (!docId) {
      const prefix = collection.substring(0, 3).toUpperCase();
      docId = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const newDoc = {
      ...data,
      id: docId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let colMap = this.memoryStore.get(collection);
    if (!colMap) {
      colMap = new Map();
      this.memoryStore.set(collection, colMap);
    }

    colMap.set(docId, newDoc);
    this.saveCollection(collection);
    this.notifyChange();

    // Sync directly and synchronously to Cloud Firestore
    try {
      await syncDocToFirestore(collection, docId, newDoc);
    } catch (e) {
      console.warn('Firestore write sync error:', e);
    }

    return docId;
  }

  public async updateDocument<T>(
    collection: CollectionName,
    id: string,
    updates: Partial<T>,
    user?: UserSession | null
  ): Promise<void> {
    // RBAC: STAFF cannot edit
    if (user && user.role === 'STAFF') {
      throw new DatabaseSecurityError('Staff role has read-only access. Update rejected.', 'STAFF', 'update');
    }

    let colMap = this.memoryStore.get(collection);
    if (!colMap) {
      colMap = new Map();
      this.memoryStore.set(collection, colMap);
    }

    const existing = colMap.get(id);
    if (!existing) {
      await this.addDocument(collection, { ...updates, id } as any, user);
      return;
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    colMap.set(id, updated);
    this.saveCollection(collection);
    this.notifyChange();

    // Sync directly and synchronously to Cloud Firestore
    try {
      await syncDocToFirestore(collection, id, updated);
    } catch (e) {
      console.warn('Firestore update sync error:', e);
    }
  }

  public async deleteDocument(
    collection: CollectionName,
    id: string,
    user?: UserSession | null
  ): Promise<void> {
    // RBAC: Only SUPER_ADMIN can delete assets or employees
    if (user && user.role !== 'SUPER_ADMIN') {
      throw new DatabaseSecurityError(
        `Role '${user.role}' cannot delete documents. Only SUPER_ADMIN has delete privileges.`,
        user.role,
        'delete'
      );
    }

    const colMap = this.memoryStore.get(collection);
    if (!colMap) {
      throw new Error(`Collection '${collection}' does not exist.`);
    }

    let targetId = id;
    if (!colMap.has(id)) {
      // Find by matching AWPO ID, employeeId, staffId, beatCode, or name
      const cleanId = id.trim().toLowerCase();
      for (const [key, doc] of colMap.entries()) {
        const anyDoc = doc as any;
        if (
          (anyDoc.awpoId && String(anyDoc.awpoId).trim().toLowerCase() === cleanId) ||
          (anyDoc.employeeId && String(anyDoc.employeeId).trim().toLowerCase() === cleanId) ||
          (anyDoc.staffId && String(anyDoc.staffId).trim().toLowerCase() === cleanId) ||
          (anyDoc.patrolmanStaffId && String(anyDoc.patrolmanStaffId).trim().toLowerCase() === cleanId) ||
          (anyDoc.beatCode && String(anyDoc.beatCode).trim().toLowerCase() === cleanId) ||
          (anyDoc.name && String(anyDoc.name).trim().toLowerCase() === cleanId)
        ) {
          targetId = key;
          break;
        }
      }
    }

    if (colMap.has(targetId)) {
      colMap.delete(targetId);
      this.saveCollection(collection);
      this.notifyChange();

      // Sync deletion directly and synchronously to Cloud Firestore
      try {
        await deleteDocFromFirestore(collection, targetId);
      } catch (e) {
        console.warn('Firestore delete sync error:', e);
      }
    }
  }


  /**
   * Complete synchronization of all 13 local collections to Cloud Firestore
   */
  public async syncAllToFirebase(): Promise<{ totalSynced: number; collections: string[] }> {
    let totalSynced = 0;
    const syncedCollections: string[] = [];

    for (const [colName, colMap] of this.memoryStore.entries()) {
      const items = Array.from(colMap.values());
      if (items.length > 0) {
        const count = await syncCollectionToFirestore(colName, items);
        totalSynced += count;
        syncedCollections.push(`${colName} (${count})`);
      }
    }

    return { totalSynced, collections: syncedCollections };
  }

  public async queryDocuments<T extends { id: string }>(
    collection: CollectionName,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    const colMap = this.memoryStore.get(collection);
    if (!colMap) return [];
    const all = Array.from(colMap.values()) as T[];
    return all.filter(predicate);
  }

  // -------------------------------------------------------------------------
  // Km Quick Finder Engine (Optimized Boundary Query)
  // -------------------------------------------------------------------------

  public async searchKmRange(options: KmQueryOptions): Promise<KmSearchResult> {
    const { fromKm, toKm, line = 'ALL', category: categoryFilter = 'ALL' } = options;

    const normalizedFromKm = Math.min(fromKm, toKm);
    const normalizedToKm = Math.max(fromKm, toKm);
    const lineFilter = line || 'ALL';

    const results: UnifiedAssetItem[] = [];

    // 1. Bridges (STRICT: Bridges are the ONLY asset type with GPS coordinates!)
    if (categoryFilter === 'ALL' || categoryFilter === 'Bridge') {
      const bridges = await this.getCollection<any>('bridges');
      for (const b of bridges) {
        const isLink = b.sectionCode && b.sectionCode.includes('RPJ');
        if (lineFilter === 'MAIN' && isLink) continue;
        if (lineFilter === 'LINK' && !isLink) continue;

        const bFrom = b.fromKm !== undefined ? b.fromKm : b.km;
        const bTo = b.toKm !== undefined ? b.toKm : b.km;

        if (bFrom <= normalizedToKm && bTo >= normalizedFromKm) {
          results.push({
            id: b.id,
            category: 'Bridge',
            title: `Bridge ${b.bridgeNo} (${b.bridgeType || b.category})`,
            chainageText: `Km ${bFrom.toFixed(3)}${bTo !== bFrom ? ` – ${bTo.toFixed(3)}` : ''}`,
            startKm: bFrom,
            endKm: bTo,
            sectionOrStation: b.sectionCode,
            details: {
              'Bridge No': b.bridgeNo,
              'Old No': b.oldBridgeNo || '-',
              'Type': b.bridgeType || b.category,
              'Span': b.spanConfiguration,
              'Length': b.totalLengthMeters ? `${b.totalLengthMeters} m` : '-',
              'Section': b.sectionCode,
              'Waterway': b.waterwayType || '-'
            },
            latitude: b.latitude,
            longitude: b.longitude
          });
        }
      }
    }

    // 2. Points & Crossings (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'Point & Crossing') {
      const pcs = await this.getCollection<any>('points_crossings');
      for (const p of pcs) {
        const isLink = p.station === 'RPJ';
        if (lineFilter === 'MAIN' && isLink) continue;
        if (lineFilter === 'LINK' && !isLink) continue;

        const pKm = p.srjChainage !== undefined ? p.srjChainage : p.km;
        if (pKm >= normalizedFromKm && pKm <= normalizedToKm) {
          results.push({
            id: p.id,
            category: 'Point & Crossing',
            title: `${p.station} Point ${p.pointNo} (${p.turnoutRatio || p.angle || '1/12'})`,
            chainageText: `Km ${pKm.toFixed(3)}`,
            startKm: pKm,
            endKm: pKm,
            sectionOrStation: p.station,
            details: {
              'Station': p.station,
              'Point No': p.pointNo,
              'Line': p.line || p.trackType,
              'Turnout Ratio': p.turnoutRatio || p.angle,
              'Operation': p.laidOn || p.operation,
              'Hand': p.hand,
              'Traffic': p.traffic || '-'
            }
          });
        }
      }
    }

    // 3. Curves (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'Curve') {
      const curves = await this.getCollection<any>('curves');
      for (const c of curves) {
        const isLink = c.yard && c.yard.includes('RPJ');
        if (lineFilter === 'MAIN' && isLink) continue;
        if (lineFilter === 'LINK' && !isLink) continue;

        if (c.fromKm <= normalizedToKm && c.toKm >= normalizedFromKm) {
          results.push({
            id: c.id,
            category: 'Curve',
            title: `Curve #${c.curveNo} (${c.degree}° / ${c.radiusMeters}m)`,
            chainageText: `Km ${c.fromKm.toFixed(3)} – ${c.toKm.toFixed(3)}`,
            startKm: c.fromKm,
            endKm: c.toKm,
            sectionOrStation: c.yard || 'Main Line',
            details: {
              'Curve No': `#${c.curveNo}`,
              'Degree': `${c.degree}°`,
              'Radius': `${c.radiusMeters} m`,
              'Length': `${c.lengthMeters} m`,
              'Cant (SE)': c.cantMm ? `${c.cantMm} mm` : '-',
              'Inspection': c.inspectionJurisdiction || '-'
            }
          });
        }
      }
    }

    // 4. Level Crossings (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'Level Crossing') {
      const lcs = await this.getCollection<any>('level_crossings');
      for (const lc of lcs) {
        if (lc.km >= normalizedFromKm && lc.km <= normalizedToKm) {
          results.push({
            id: lc.id,
            category: 'Level Crossing',
            title: `LC-${lc.gateNo} (${lc.classification})`,
            chainageText: `Km ${lc.km.toFixed(3)}`,
            startKm: lc.km,
            endKm: lc.km,
            sectionOrStation: lc.sectionCode,
            details: {
              'Gate No': lc.gateNo,
              'Class': lc.classification,
              'TVU Census': lc.tuv ? lc.tuv.toLocaleString() : '-',
              'Interlocking': lc.interlocked ? 'Interlocked' : 'Non-Interlocked',
              'Road': lc.roadName,
              'Gatemen Count': lc.gatemanCount || (lc.gatemen ? lc.gatemen.length : 0),
              'Gatemen': lc.remarks || '-'
            }
          });
        }
      }
    }

    // 5. Track Defects (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'Track Defect') {
      const defects = await this.getCollection<any>('track_defects');
      for (const d of defects) {
        const isLink = d.sectionCode === 'SMUN-RPJ' || d.trackLine === 'Link Line';
        if (lineFilter === 'MAIN' && isLink) continue;
        if (lineFilter === 'LINK' && !isLink) continue;

        if (d.km >= normalizedFromKm && d.km <= normalizedToKm) {
          results.push({
            id: d.id,
            category: 'Track Defect',
            title: `${d.defectCode}: ${d.title}`,
            chainageText: `Km ${d.km.toFixed(3)}`,
            startKm: d.km,
            endKm: d.km,
            sectionOrStation: d.location || d.sectionCode,
            details: {
              'Category': d.category,
              'Severity': d.severity,
              'Status': d.status,
              'Speed Restriction': d.speedRestrictionKmph ? `${d.speedRestrictionKmph} km/h` : 'None',
              'Reported By': d.reportedByName,
              'Action Taken': d.actionTaken
            },
            severity: d.severity,
            status: d.status
          });
        }
      }
    }

    // 6. LWR / CWR (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'LWR') {
      const lwrs = await this.getCollection<any>('lwr');
      for (const l of lwrs) {
        if (l.fromKm <= normalizedToKm && l.toKm >= normalizedFromKm) {
          results.push({
            id: l.id,
            category: 'LWR',
            title: `LWR No. ${l.lwrNo} (${l.section})`,
            chainageText: `Km ${l.fromKm.toFixed(3)} – ${l.toKm.toFixed(3)}`,
            startKm: l.fromKm,
            endKm: l.toKm,
            sectionOrStation: l.section,
            details: {
              'LWR No': l.lwrNo,
              'Section': l.section,
              'Length': `${l.lengthKm} Km`,
              'Gap On': l.gapOn
            }
          });
        }
      }
    }

    // 7. SEJ (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'SEJ') {
      const sejs = await this.getCollection<any>('sej');
      for (const s of sejs) {
        if (s.chainage >= normalizedFromKm && s.chainage <= normalizedToKm) {
          results.push({
            id: s.id,
            category: 'SEJ',
            title: `SEJ No. ${s.sejNo} (${s.section})`,
            chainageText: `Km ${s.chainage.toFixed(3)}`,
            startKm: s.chainage,
            endKm: s.chainage,
            sectionOrStation: s.section,
            details: {
              'SEJ No': s.sejNo,
              'Section': s.section,
              'Drawing No': s.drawingNo,
              'Temperature': s.temperature
            }
          });
        }
      }
    }

    // 8. Keyman Beats (NO GPS Coordinates)
    if (categoryFilter === 'ALL' || categoryFilter === 'Keyman Beat') {
      const keymen = await this.getCollection<any>('keymen');
      for (const k of keymen) {
        const kMin = Math.min(k.fromKm, k.toKm);
        const kMax = Math.max(k.fromKm, k.toKm);

        if (Math.max(kMin, normalizedFromKm) <= Math.min(kMax, normalizedToKm)) {
          results.push({
            id: k.id,
            category: 'Keyman Beat',
            title: `Beat No. ${k.beatNo} (${k.name})`,
            chainageText: `Km ${k.fromKm.toFixed(3)} – ${k.toKm.toFixed(3)}`,
            startKm: kMin,
            endKm: kMax,
            sectionOrStation: k.sectionCode,
            details: {
              'Keyman Name': k.name,
              'AWPO ID': k.awpoId || k.staffId,
              'Duty Hours': k.dutyHours,
              'Mobile': k.mobileNo,
              'Status': k.status
            },
            status: k.status
          });
        }
      }
    }

    // Sort ascending by startKm
    results.sort((a, b) => a.startKm - b.startKm);

    return {
      query: options,
      normalizedFromKm,
      normalizedToKm,
      totalCount: results.length,
      items: results
    };
  }

  // -------------------------------------------------------------------------
  // Analytics Aggregations
  // -------------------------------------------------------------------------

  public async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const [staff, bridges, curves, pcs, lcs, defects, patrolShifts, keymen] = await Promise.all([
      this.getCollection<any>('officers_staff'),
      this.getCollection<any>('bridges'),
      this.getCollection<any>('curves'),
      this.getCollection<any>('points_crossings'),
      this.getCollection<any>('level_crossings'),
      this.getCollection<any>('track_defects'),
      this.getCollection<any>('patrol_shifts'),
      this.getCollection<any>('keymen')
    ]);

    // 1. Staff by designation
    const staffByDesignation: Record<string, number> = {};
    staff.forEach(s => {
      const p = s.post || 'Other';
      staffByDesignation[p] = (staffByDesignation[p] || 0) + 1;
    });

    // 2. Asset counts
    const assetCountsByCategory = {
      bridges: bridges.length,
      curves: curves.length,
      pointsCrossings: pcs.length,
      levelCrossings: lcs.length,
      total: bridges.length + curves.length + pcs.length + lcs.length
    };

    // 3. Bridge Type counts
    const bridgeTypeCounts = {
      major: bridges.filter(b => b.category === 'MAJOR').length,
      minor: bridges.filter(b => b.category === 'MINOR').length,
      rub: bridges.filter(b => b.category === 'RUB').length,
      rob: bridges.filter(b => b.category === 'ROB').length,
      fob: bridges.filter(b => b.category === 'FOB').length
    };

    // 4. Defect density per 10km block
    const blocks = [
      { label: '1167–1180', min: 1167.210, max: 1180.000 },
      { label: '1180–1195', min: 1180.000, max: 1195.000 },
      { label: '1195–1210', min: 1195.000, max: 1210.000 },
      { label: '1210–1225', min: 1210.000, max: 1225.000 },
      { label: '1225–1240', min: 1225.000, max: 1240.000 },
      { label: '1240–1250', min: 1240.000, max: 1249.720 },
      { label: 'Link Line', min: 0.000, max: 10.000, isLink: true }
    ];

    const counts = blocks.map(b => {
      return defects.filter(d => {
        if (b.isLink) {
          return d.sectionCode === 'SMUN-RPJ' || d.trackLine === 'Link Line';
        }
        return d.km >= b.min && d.km <= b.max && d.sectionCode !== 'SMUN-RPJ';
      }).length;
    });

    // 5. Patrol shift status
    const filled = patrolShifts.filter(p => p.isFilled || p.status === 'ACTIVE' || p.status === 'SCHEDULED').length;
    const vacant = patrolShifts.filter(p => !p.isFilled || p.status === 'VACANT').length;

    return {
      corridorLengthKm: 88.679,
      totalAssetsCount: assetCountsByCategory.total,
      staffCount: staff.length,
      keymenCount: keymen.length,
      defectsCount: defects.length,
      staffByDesignation,
      assetCountsByCategory,
      bridgeTypeCounts,
      defectsByKmBlock: {
        labels: blocks.map(b => b.label),
        counts
      },
      patrolShiftStatus: {
        filled,
        vacant,
        total: patrolShifts.length
      }
    };
  }
}

// Export singleton database instance
export const db = new LocalDatabaseService();
