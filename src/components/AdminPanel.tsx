/**
 * Super Admin Control Panel
 * DFCCIL IMSD SMUN Unit
 * Strictly restricted to SUPER_ADMIN (Shri Vivek Kumar Azad, APM/Civil)
 * Comprehensive editing, updating, creating, and managing Staff & all Asset Types.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { db } from '../services/database.ts';
import {
  ShieldCheck,
  UserPlus,
  Key,
  Trash2,
  Edit,
  RotateCcw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Sparkles,
  Users,
  Layers,
  Check,
  X,
  Plus,
  Train,
  MapPin,
  Filter
} from 'lucide-react';
import type {
  UserAccount,
  OfficerStaffRecord,
  UserRole,
  EmploymentType,
  CollectionName
} from '../types/index.ts';

export const AdminPanel: React.FC = () => {
  const { currentUser, role, refreshUsers } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [staff, setStaff] = useState<OfficerStaffRecord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'assets' | 'pinGen' | 'telemetry'>('employees');

  // Staff Form Modal State
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    nameHi: '',
    post: 'Junior Engineer / P-Way (JE/P-Way)',
    role: 'OFFICER' as UserRole,
    employmentType: 'REGULAR' as EmploymentType,
    email: '',
    phone: '',
    headquarters: 'IMSD SMUN',
    assignedSection: 'SMUN-SBJN',
    awpoId: '',
    lap: 30,
    cl: 8
  });

  // General Asset Manager State
  const [targetCollection, setTargetCollection] = useState<CollectionName>('bridges');
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [assetFormData, setAssetFormData] = useState<Record<string, any>>({});
  const [isAssetEditOpen, setIsAssetEditOpen] = useState(false);

  // PIN Generator State
  const [genUserId, setGenUserId] = useState('');
  const [genName, setGenName] = useState('');
  const [genRole, setGenRole] = useState<UserRole>('OFFICER');
  const [generatedPin, setGeneratedPin] = useState('');
  const [pinSuccessMessage, setPinSuccessMessage] = useState<string | null>(null);

  // Status & Feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [uList, stfList, assetCol] = await Promise.all([
        db.getCollection<UserAccount>('users'),
        db.getCollection<OfficerStaffRecord>('officers_staff'),
        db.getCollection<any>(targetCollection)
      ]);
      setUsers(uList);
      setStaff(stfList);
      setAssetsList(assetCol);
    } catch (err: any) {
      setActionError(`Failed to load admin data: ${err.message}`);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetCollection]);

  // Handle Staff Save
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingStaffId) {
        // Edit existing staff
        await db.updateDocument(
          'officers_staff',
          editingStaffId,
          {
            name: staffFormData.name,
            nameHi: staffFormData.nameHi,
            post: staffFormData.post,
            role: staffFormData.role,
            employmentType: staffFormData.employmentType,
            email: staffFormData.email,
            phone: staffFormData.phone,
            headquarters: staffFormData.headquarters,
            assignedSection: staffFormData.assignedSection,
            awpoId: staffFormData.awpoId || null,
            leaveBalance: {
              lap: Number(staffFormData.lap) || 0,
              lhap: 15,
              cl: Number(staffFormData.cl) || 0,
              rh: 2
            }
          },
          currentUser
        );
        setActionSuccess(`Staff ${staffFormData.name} updated successfully.`);
      } else {
        // Add new staff with authentic Employee ID or AWPO ID
        const newId = staffFormData.employmentType === 'REGULAR'
          ? `EMP-${String(100800 + staff.length)}`
          : (staffFormData.awpoId ? `AWPO-${staffFormData.awpoId.replace(/^AWPO-/i, '')}` : `AWPO-${String(88120 + staff.length)}`);
        await db.addDocument(
          'officers_staff',
          {
            id: newId,
            name: staffFormData.name,
            nameHi: staffFormData.nameHi,
            post: staffFormData.post,
            role: staffFormData.role,
            employmentType: staffFormData.employmentType,
            email: staffFormData.email,
            phone: staffFormData.phone,
            headquarters: staffFormData.headquarters,
            assignedSection: staffFormData.assignedSection,
            awpoId: staffFormData.awpoId || null,
            leaveBalance: {
              lap: Number(staffFormData.lap) || 0,
              lhap: 15,
              cl: Number(staffFormData.cl) || 0,
              rh: 2
            },
            qrCodeId: `RD-${newId}`,
            dateOfJoining: new Date().toISOString().split('T')[0],
            bloodGroup: 'O+'
          },
          currentUser
        );
        setActionSuccess(`New staff ${staffFormData.name} registered with ID ${newId}.`);
      }

      setIsStaffFormOpen(false);
      setEditingStaffId(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Open Edit Staff
  const openEditStaff = (stf: OfficerStaffRecord) => {
    setEditingStaffId(stf.id);
    setStaffFormData({
      name: stf.name,
      nameHi: stf.nameHi || '',
      post: stf.post,
      role: stf.role,
      employmentType: stf.employmentType,
      email: stf.email,
      phone: stf.phone,
      headquarters: stf.headquarters,
      assignedSection: stf.assignedSection,
      awpoId: stf.awpoId || '',
      lap: stf.leaveBalance.lap,
      cl: stf.leaveBalance.cl
    });
    setIsStaffFormOpen(true);
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete staff record '${name}'?`)) return;
    try {
      await db.deleteDocument('officers_staff', id, currentUser);
      setActionSuccess(`Staff record '${name}' deleted.`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle Asset Edit
  const openEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setAssetFormData({ ...asset });
    setIsAssetEditOpen(true);
  };

  const handleSaveAssetEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    try {
      await db.updateDocument(targetCollection, editingAsset.id, assetFormData, currentUser);
      setActionSuccess(`Asset ${editingAsset.id} in '${targetCollection}' updated successfully!`);
      setIsAssetEditOpen(false);
      setEditingAsset(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Handle Delete Asset
  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm(`Confirm deletion of asset '${id}' from '${targetCollection}'?`)) return;
    try {
      await db.deleteDocument(targetCollection, id, currentUser);
      setActionSuccess(`Asset '${id}' deleted from '${targetCollection}'.`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Generate PIN
  const handleGeneratePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genUserId.trim() || !genName.trim()) {
      setActionError('User ID and Name are required.');
      return;
    }

    const pinVal = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPin(pinVal);

    try {
      await db.addDocument(
        'users',
        {
          id: `usr_${genUserId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          userId: genUserId,
          email: `${genUserId.toLowerCase()}@dfcc.co.in`,
          pin: pinVal,
          name: genName,
          role: genRole,
          designation: genRole === 'OFFICER' ? 'Section Engineer' : 'Track Maintainer',
          department: 'Civil Engineering / P-Way',
          unit: 'IMSD SMUN',
          phone: '8872671873',
          isActive: true,
          qrCodeId: `RD-USR-${genUserId.toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        currentUser
      );

      setPinSuccessMessage(`PIN '${pinVal}' successfully generated for ${genName} (${genUserId}).`);
      await refreshUsers();
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Reset Database
  const handleResetDatabase = async () => {
    if (!window.confirm('WARNING: Reset database back to authentic DFCCIL seed state?')) return;
    try {
      await db.reseedDatabase();
      setActionSuccess('Database reseeded back to authentic DFCCIL portal state!');
      await refreshUsers();
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-purple-800/40 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Super Admin Operations Center</h2>
            <p className="text-xs text-purple-300/80">
              Shri Vivek Kumar Azad (Assistant Project Manager / Civil) • Master Authority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDatabase}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2 border border-slate-700"
            title="Reset to authentic seed data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reseed Master DB</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center justify-between text-xs text-red-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'employees'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory ({staff.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('assets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'assets'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Asset Editor &amp; Delete Console</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pinGen')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'pinGen'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Generate PIN / User ID</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------
          SUB-TAB 1: STAFF DIRECTORY & EDITING
      ---------------------------------------------------------------------- */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Personnel &amp; Field Staff Management</h3>
              <p className="text-xs text-slate-400">Total {staff.length} registered officers &amp; staff</p>
            </div>
            <button
              onClick={() => {
                setEditingStaffId(null);
                setStaffFormData({
                  name: '',
                  nameHi: '',
                  post: 'Junior Engineer / P-Way',
                  role: 'OFFICER',
                  employmentType: 'REGULAR',
                  email: '',
                  phone: '',
                  headquarters: 'IMSD SMUN',
                  assignedSection: 'SMUN-SBJN',
                  awpoId: '',
                  lap: 30,
                  cl: 8
                });
                setIsStaffFormOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">AWPO ID</th>
                  <th className="p-3">HQ</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-slate-400">{s.id}</td>
                    <td className="p-3 font-bold text-white">
                      {s.name}
                      {s.nameHi && <span className="block text-[11px] text-slate-400 font-normal">{s.nameHi}</span>}
                    </td>
                    <td className="p-3 text-blue-400 font-medium">{s.post}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950 border border-slate-800 text-slate-300">
                        {s.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-emerald-400">{s.phone}</td>
                    <td className="p-3 font-mono text-amber-300">{s.awpoId || '-'}</td>
                    <td className="p-3 text-slate-400">{s.headquarters}</td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => openEditStaff(s)}
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs"
                        title="Edit Staff"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(s.id, s.name)}
                        className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          SUB-TAB 2: ASSET EDITOR & DELETE CONSOLE
      ---------------------------------------------------------------------- */}
      {activeSubTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-300">Select Asset Collection:</label>
              <select
                value={targetCollection}
                onChange={e => setTargetCollection(e.target.value as CollectionName)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-purple-500"
              >
                <option value="bridges">Bridges (144)</option>
                <option value="points_crossings">Points &amp; Crossings (161)</option>
                <option value="curves">Curves (95)</option>
                <option value="level_crossings">Level Crossings (5)</option>
                <option value="lwr">LWR / CWR (7)</option>
                <option value="sej">SEJ (13)</option>
                <option value="track_defects">Track Defects (48)</option>
                <option value="keymen">Keymen Beats (18)</option>
                <option value="patrol_shifts">Patrol Shifts (24)</option>
                <option value="bridge_watchmen">Bridge Watchmen (3)</option>
              </select>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search within collection..."
                value={assetSearchQuery}
                onChange={e => setAssetSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Key Details</th>
                    <th className="p-3">Section / Location</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {assetsList
                    .filter(a => {
                      const q = assetSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return JSON.stringify(a).toLowerCase().includes(q);
                    })
                    .map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white">{item.id}</td>
                        <td className="p-3 font-sans">
                          <div className="font-semibold text-slate-200">
                            {item.bridgeNo || item.pointNo || item.curveNo || item.gateNo || item.lwrNo || item.sejNo || item.defectCode || item.name || item.beatCode}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.spanConfiguration || item.angle || item.degree || item.classification || item.lengthKm || item.temperature || item.category || item.route || item.post}
                          </div>
                        </td>
                        <td className="p-3 font-sans text-slate-400">
                          {item.sectionCode || item.section || item.station || item.yard || item.location || '-'}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => openEditAsset(item)}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs"
                            title="Edit Asset"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(item.id)}
                            className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          SUB-TAB 3: PIN & CREDENTIAL GENERATOR
      ---------------------------------------------------------------------- */}
      {activeSubTab === 'pinGen' && (
        <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Generate User ID &amp; Assigned Security PIN</h3>
          </div>

          {pinSuccessMessage && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 font-mono">
              {pinSuccessMessage}
            </div>
          )}

          <form onSubmit={handleGeneratePin} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">User ID:</label>
              <input
                type="text"
                placeholder="e.g. EMP-100801 or AWPO-88125"
                value={genUserId}
                onChange={e => setGenUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Full Employee Name:</label>
              <input
                type="text"
                placeholder="e.g. Shri Kamaldeep Singh"
                value={genName}
                onChange={e => setGenName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Assigned Role:</label>
              <select
                value={genRole}
                onChange={e => setGenRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
              >
                <option value="OFFICER">Field Officer (OFFICER)</option>
                <option value="STAFF">Field Staff (STAFF)</option>
                <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <Key className="w-4 h-4" />
              <span>Generate &amp; Issue Security PIN</span>
            </button>
          </form>
        </div>
      )}

      {/* Staff Form Modal */}
      {isStaffFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">
                  {editingStaffId ? `Edit Staff (${editingStaffId})` : 'Register New Staff'}
                </span>
              </div>
              <button
                onClick={() => setIsStaffFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Name (English):</label>
                <input
                  type="text"
                  required
                  value={staffFormData.name}
                  onChange={e => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Name (Hindi):</label>
                <input
                  type="text"
                  value={staffFormData.nameHi}
                  onChange={e => setStaffFormData({ ...staffFormData, nameHi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Designation / Post:</label>
                <input
                  type="text"
                  required
                  value={staffFormData.post}
                  onChange={e => setStaffFormData({ ...staffFormData, post: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Role:</label>
                  <select
                    value={staffFormData.role}
                    onChange={e => setStaffFormData({ ...staffFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="OFFICER">Field Officer</option>
                    <option value="STAFF">Field Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Employment Type:</label>
                  <select
                    value={staffFormData.employmentType}
                    onChange={e => setStaffFormData({ ...staffFormData, employmentType: e.target.value as EmploymentType })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="REGULAR">REGULAR (Permanent)</option>
                    <option value="OUTSOURCED">OUTSOURCED (AWPO)</option>
                    <option value="DEPUTATION">DEPUTATION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mobile No:</label>
                  <input
                    type="text"
                    required
                    value={staffFormData.phone}
                    onChange={e => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">AWPO ID:</label>
                  <input
                    type="text"
                    value={staffFormData.awpoId}
                    onChange={e => setStaffFormData({ ...staffFormData, awpoId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Headquarters:</label>
                  <input
                    type="text"
                    value={staffFormData.headquarters}
                    onChange={e => setStaffFormData({ ...staffFormData, headquarters: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email:</label>
                  <input
                    type="text"
                    value={staffFormData.email}
                    onChange={e => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffFormOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Form Modal */}
      {isAssetEditOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-white">
                  Edit Asset ({editingAsset.id}) in '{targetCollection}'
                </span>
              </div>
              <button
                onClick={() => setIsAssetEditOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssetEdit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
              {Object.entries(assetFormData).map(([k, v]) => {
                if (k === 'id' || k === 'createdAt' || k === 'updatedAt') return null;
                return (
                  <div key={k}>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {k}
                    </label>
                    <input
                      type="text"
                      value={v !== undefined && v !== null ? String(v) : ''}
                      onChange={e => setAssetFormData({ ...assetFormData, [k]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                );
              })}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssetEditOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
