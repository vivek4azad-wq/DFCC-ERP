/**
 * Track Defect & Asset Maintenance Manager
 * DFCCIL IMSD SMUN Unit
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../services/database.ts';
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Shield,
  Train,
  SlidersHorizontal,
  X
} from 'lucide-react';
import type {
  TrackDefectRecord,
  DefectCategory,
  DefectSeverity,
  DefectStatus,
  RailSide
} from '../types/index.ts';

export const DefectManager: React.FC = () => {
  const { currentUser, role, canPerform } = useAuth();
  const [defects, setDefects] = useState<TrackDefectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDefectId, setEditingDefectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    defectCode: '',
    category: 'TRACK_GEOMETRY' as DefectCategory,
    title: '',
    sectionCode: 'SMUN-SBJN',
    km: 1172.500,
    trackLine: 'Main UP Line',
    rail: 'LEFT_RAIL' as RailSide,
    severity: 'MEDIUM' as DefectSeverity,
    speedRestrictionKmph: 0,
    status: 'OPEN' as DefectStatus,
    reportedByName: currentUser?.name || 'Shri Rajesh Sharma',
    actionTaken: ''
  });

  const canCreateOrEdit = role === 'SUPER_ADMIN' || role === 'OFFICER';
  const canDeleteDirectly = role === 'SUPER_ADMIN';
  const canDelete = role === 'SUPER_ADMIN';

  const loadDefects = async () => {
    try {
      setLoading(true);
      const list = await db.getCollection<TrackDefectRecord>('track_defects');
      setDefects(list);
    } catch (err) {
      console.error('Failed to load track defects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefects();
  }, []);

  const pendingDeletions = useMemo(() => {
    return defects.filter(d => d.isDeleteRequested);
  }, [defects]);

  const filteredDefects = useMemo(() => {
    return defects.filter(d => {
      if (selectedCategory !== 'ALL' && d.category !== selectedCategory) return false;
      if (selectedSeverity !== 'ALL' && d.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mCode = d.defectCode.toLowerCase().includes(q);
        const mTitle = d.title.toLowerCase().includes(q);
        const mSec = d.sectionCode.toLowerCase().includes(q);
        if (!mCode && !mTitle && !mSec) return false;
      }
      return true;
    });
  }, [defects, selectedCategory, selectedSeverity, searchQuery]);

  const handleSaveDefect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDefectId) {
        await db.updateDocument<TrackDefectRecord>(
          'track_defects',
          editingDefectId,
          {
            title: formData.title,
            category: formData.category,
            severity: formData.severity,
            status: formData.status,
            speedRestrictionKmph: formData.speedRestrictionKmph ? Number(formData.speedRestrictionKmph) : null,
            actionTaken: formData.actionTaken,
            km: Number(formData.km)
          },
          currentUser
        );
      } else {
        const newCode = `DEF-${(defects.length + 1).toString().padStart(3, '0')}`;
        await db.addDocument<any>(
          'track_defects',
          {
            defectCode: newCode,
            category: formData.category,
            title: formData.title,
            sectionCode: formData.sectionCode,
            km: Number(formData.km),
            trackLine: formData.trackLine,
            rail: formData.rail,
            severity: formData.severity,
            speedRestrictionKmph: formData.speedRestrictionKmph ? Number(formData.speedRestrictionKmph) : null,
            status: formData.status,
            reportedByStaffId: currentUser?.id || 'EMP-101518',
            reportedByName: currentUser?.name || 'Shri Vivek Kumar Azad (APM)',
            reportedDate: new Date().toISOString().split('T')[0],
            targetClosureDate: '2026-08-30',
            actionTaken: formData.actionTaken
          },
          currentUser
        );
      }
      setIsFormOpen(false);
      setEditingDefectId(null);
      await loadDefects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Executive Deletion Request to APM
  const handleRequestDeletion = async (defect: TrackDefectRecord) => {
    const reason = window.prompt(`Submit deletion request to APM (Shri Vivek Kumar Azad) for defect ${defect.defectCode}.\nEnter Reason for deletion:`, "Duplicate / Rectified / Incorrect Entry");
    if (!reason || !reason.trim()) return;

    try {
      await db.updateDocument('track_defects', defect.id, {
        isDeleteRequested: true,
        deletionRequestedBy: currentUser?.name || 'Executive (Arjun)',
        deletionReason: reason.trim(),
        deletionRequestedAt: new Date().toISOString()
      }, currentUser);
      alert('✅ Deletion request sent to APM (Shri Vivek Kumar Azad) for approval.');
      await loadDefects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // APM Approve Deletion
  const handleApproveDeletion = async (id: string) => {
    if (!window.confirm('APM Approval: Permanently delete this defect log?')) return;
    try {
      await db.deleteDocument('track_defects', id, currentUser);
      await loadDefects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // APM Reject Deletion Request
  const handleRejectDeletion = async (id: string) => {
    try {
      await db.updateDocument('track_defects', id, {
        isDeleteRequested: false,
        deletionReason: null,
        deletionRequestedBy: null
      }, currentUser);
      alert('Deletion request rejected. Defect record retained in master.');
      await loadDefects();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteDefect = async (id: string) => {
    if (!window.confirm(`Delete defect log ${id}?`)) return;
    try {
      await db.deleteDocument('track_defects', id, currentUser);
      await loadDefects();
    } catch (err: any) {
      alert(`Permission Denied: ${err.message}`);
    }
  };

  const getSeverityBadge = (sev: DefectSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold text-[10px]">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[10px]">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded font-bold text-[10px]">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-bold text-[10px]">LOW</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Track Defects &amp; Asset Maintenance</h2>
              <p className="text-xs text-slate-500">
                USFD Flaws, Track Geometry, Fasteners, Welds, SEJ Gap Monitoring ({defects.length} Active Records)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canCreateOrEdit ? (
              <button
                onClick={() => {
                  setEditingDefectId(null);
                  setFormData({
                    defectCode: '',
                    category: 'TRACK_GEOMETRY',
                    title: '',
                    sectionCode: 'SMUN-SBJN',
                    km: 1172.500,
                    trackLine: 'Main UP Line',
                    rail: 'LEFT_RAIL',
                    severity: 'MEDIUM',
                    speedRestrictionKmph: 0,
                    status: 'OPEN',
                    reportedByName: currentUser?.name || 'Field Officer',
                    actionTaken: ''
                  });
                  setIsFormOpen(true);
                }}
                className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Track Defect</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-xl border border-slate-200">
                Read-Only (STAFF Role)
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search defect code, title, section..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Categories</option>
              <option value="USFD_FLAW">USFD Flaw</option>
              <option value="TRACK_GEOMETRY">Track Geometry</option>
              <option value="FASTENERS">Fasteners</option>
              <option value="WELD_DEFECT">Weld Defect</option>
              <option value="SEJ_DEFECT">SEJ Defect</option>
              <option value="BALLAST_FORMATION">Ballast Formation</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Drawer */}
      {isFormOpen && (
        <div className="bg-white border border-red-200 p-5 rounded-2xl shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingDefectId ? `Edit Track Defect (${editingDefectId})` : 'Log New Track Defect'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>

          <form onSubmit={handleSaveDefect} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Defect Title / Observation</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Excessive wear on RH rail head at turnout point"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Defect Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as DefectCategory })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="TRACK_GEOMETRY">Track Geometry</option>
                <option value="USFD_FLAW">USFD Flaw</option>
                <option value="FASTENERS">Fasteners</option>
                <option value="WELD_DEFECT">Weld Defect</option>
                <option value="SEJ_DEFECT">SEJ Defect</option>
                <option value="BALLAST_FORMATION">Ballast Formation</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Chainage (Km)</label>
              <input
                type="number"
                step="0.001"
                required
                value={formData.km}
                onChange={e => setFormData({ ...formData, km: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Severity Level</label>
              <select
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value as DefectSeverity })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Lifecycle Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as DefectStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-red-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="WORK_IN_PROGRESS">WORK IN PROGRESS</option>
                <option value="ATTENDED">ATTENDED</option>
                <option value="VERIFIED_CLOSED">VERIFIED CLOSED</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Speed Restriction (km/h, 0 for none)</label>
              <input
                type="number"
                value={formData.speedRestrictionKmph}
                onChange={e => setFormData({ ...formData, speedRestrictionKmph: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Action Taken / Remarks</label>
              <input
                type="text"
                value={formData.actionTaken}
                onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
                placeholder="e.g. Fishplates tightened, caution order issued"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
              />
            </div>

            <div className="lg:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl shadow-sm"
              >
                {editingDefectId ? 'Save Changes' : 'Record Defect'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Defects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDefects.map(d => (
          <div
            key={d.id}
            className="bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-2xl transition flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {d.defectCode}
                  </span>
                  {getSeverityBadge(d.severity)}
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Km {d.km.toFixed(3)}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">{d.title}</h4>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Train className="w-3.5 h-3.5 text-slate-400" />
                <span>{d.sectionCode} ({d.trackLine})</span>
              </p>

              {/* Attributes */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">CATEGORY</span>
                  <span className="text-slate-800 font-medium truncate block">{d.category}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">STATUS</span>
                  <span className="text-slate-800 font-semibold truncate block">{d.status}</span>
                </div>
                {d.speedRestrictionKmph ? (
                  <div className="col-span-2 bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-amber-800 font-semibold">
                    Caution Order: {d.speedRestrictionKmph} km/h Restriction
                  </div>
                ) : null}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-emerald-700">
                {d.chainage ? d.chainage : `Km ${d.km.toFixed(3)}`}
              </span>

              <div className="flex items-center gap-1.5">
                {canCreateOrEdit && (
                  <button
                    onClick={() => {
                      setEditingDefectId(d.id);
                      setFormData({
                        defectCode: d.defectCode,
                        category: d.category,
                        title: d.title,
                        sectionCode: d.sectionCode,
                        km: d.km,
                        trackLine: d.trackLine || 'UP_LINE',
                        rail: d.rail || 'BOTH_RAILS',
                        severity: d.severity,
                        speedRestrictionKmph: d.speedRestrictionKmph || 0,
                        status: d.status,
                        reportedByName: d.reportedByName || d.reportedBy || '',
                        actionTaken: d.actionTaken || ''
                      });
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition"
                    title="Edit Defect"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}

                {canDeleteDirectly ? (
                  <button
                    onClick={() => handleDeleteDefect(d.id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition"
                    title="Super Admin: Permanently Delete Defect"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : canCreateOrEdit ? (
                  d.isDeleteRequested ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-bold">
                      ⏳ Deletion Pending Approval
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequestDeletion(d)}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition text-[11px] font-bold flex items-center gap-1"
                      title="Request Deletion from APM"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Req Delete</span>
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
