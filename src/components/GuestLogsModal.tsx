/**
 * Guest Visitor Dossier Modal
 * DFCCIL IMSD SMUN Unit
 * Displays all visitors who accessed the system via "View as Guest"
 */

import React, { useState, useEffect } from 'react';
import { db } from '../services/database.ts';
import type { GuestVisitorLog } from '../types/index.ts';
import {
  Users,
  X,
  Search,
  Phone,
  MessageSquare,
  Clock,
  Shield,
  Download,
  Printer,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  RefreshCw
} from 'lucide-react';

interface GuestLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestLogsModal: React.FC<GuestLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<GuestVisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await db.getCollection<GuestVisitorLog>('guest_logins');
      // Sort newest first
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch guest logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.name.toLowerCase().includes(q) ||
      log.phone.includes(q) ||
      (log.purpose || '').toLowerCase().includes(q)
    );
  });

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['S.No', 'Guest Name', 'Mobile Number', 'Purpose / Dept', 'Login Date & Time', 'Device / Agent'];
    const rows = logs.map((l, idx) => [
      idx + 1,
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.purpose || 'General View'}"`,
      `"${new Date(l.timestamp).toLocaleString('en-IN')}"`,
      `"${(l.userAgent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DFCCIL_IMSD_Guest_Visitors_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2b5c] via-slate-900 to-indigo-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Guest Visitor Register (गेस्ट विज़िटर रिकॉर्ड)
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                  {logs.length} Logged
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited Logins via "View as Guest" • DFCCIL IMSD SMUN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, mobile, or purpose..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportToCSV}
              disabled={logs.length === 0}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Export to CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Print Register"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Fetching visitor records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <div className="font-bold text-slate-300 text-sm">No Guest Visitor Records Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever anyone logs in via "View as Guest", their Name, Mobile Number, and Timestamp will be recorded here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                    <th className="p-2.5 text-center w-12">#</th>
                    <th className="p-2.5">Visitor Name</th>
                    <th className="p-2.5">Mobile Number</th>
                    <th className="p-2.5">Purpose / Dept</th>
                    <th className="p-2.5">Login Time</th>
                    <th className="p-2.5 text-center">Contact Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
                  {filteredLogs.map((item, idx) => {
                    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
                    const whatsappUrl = `https://wa.me/91${cleanPhone.slice(-10)}`;
                    const dateStr = new Date(item.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 text-center font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>{item.name}</span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-slate-300">
                          +91 {cleanPhone.slice(-10)}
                        </td>
                        <td className="p-2.5 text-slate-400">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[10px] font-semibold text-slate-300">
                            {item.purpose || 'General View'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                          {dateStr}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`tel:${cleanPhone}`}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition"
                              title={`Call ${item.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg transition"
                              title={`WhatsApp ${item.name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Official DFCCIL IMSD SMUN Visitor Access Security</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
