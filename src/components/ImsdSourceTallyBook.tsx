import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Search, XCircle } from 'lucide-react';
import { IMSD_TALLY_GZIP_BASE64 } from '../data/imsdTallyLedgerCompressed.ts';

type ImsdTallyItem = { source: string; sourceFile: string; ledgerPage: string; itemName: string; transactions: number; totalReceipt: number; totalTransfer: number; totalIssue: number; closingBalance: number | null; indexBalance: number | null; sapMaterial: string; sapDescription: string; sapUom: string; matchScore: number; matchStatus: string; category: string };
type ImsdTallyTransaction = { source: string; sourceFile: string; ledgerPage: string; itemName: string; date: string; voucher: string; party: string; purpose: string; receipt: number | null; transfer: number | null; issue: number | null; balance: number | null; rowNumber: number; sapMaterial: string; sapDescription: string; sapUom: string; matchScore: number; matchStatus: string };
type ImsdTallyData = { items: ImsdTallyItem[]; transactions: ImsdTallyTransaction[] };

const ITEM_TYPES: Record<string, string> = {
  'C&P Material': 'C&P',
  'T&P Material': 'T&P',
  'P.Way Material': 'P.Way',
  'Cash Imprest': 'Cash Imprest',
  Uniform: 'Uniform'
};
const itemType = (source: string) => ITEM_TYPES[source] || source;

const fmt = (value: number | null | undefined) => value == null ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const ledgerKey = (item: Pick<ImsdTallyItem, 'sourceFile' | 'ledgerPage'>) => `${item.sourceFile}||${item.ledgerPage}`;
const decodeTallyData = async (): Promise<ImsdTallyData> => {
  const compressed = Uint8Array.from(atob(IMSD_TALLY_GZIP_BASE64), char => char.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as ImsdTallyData;
};

export const ImsdSourceTallyBook: React.FC = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ImsdTallyItem | null>(null);
  const [ledgerData, setLedgerData] = useState<ImsdTallyData>({ items: [], transactions: [] });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    decodeTallyData().then(setLedgerData).catch(() => setLoadError('Source tally data could not be loaded.'));
  }, []);

  const tallyItems = ledgerData.items;
  const tallyTransactions = ledgerData.transactions;

  const sourceTypes = useMemo(() => [...new Set(tallyItems.map(item => item.source))].sort(), [tallyItems]);
  const totals = useMemo(() => ({
    items: tallyItems.length,
    transactions: tallyTransactions.length,
    assigned: tallyItems.filter(item => Boolean(item.sapMaterial)).length,
    partial: tallyItems.filter(item => item.matchStatus.startsWith('SAP ID partial')).length
  }), [tallyItems, tallyTransactions]);
  const filteredItems = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return tallyItems.filter(item => {
      if (typeFilter !== 'ALL' && item.source !== typeFilter) return false;
      if (reviewOnly && item.matchStatus === 'SAP ID matched') return false;
      return !lower || [item.itemName, item.sapMaterial, item.sapDescription, item.ledgerPage, item.source]
        .join(' ').toLowerCase().includes(lower);
    });
  }, [tallyItems, query, typeFilter, reviewOnly]);
  const selectedTransactions = useMemo(() => selectedItem
    ? tallyTransactions.filter(transaction => ledgerKey(transaction) === ledgerKey(selectedItem))
    : [], [selectedItem, tallyTransactions]);

  return (
    <section className="space-y-4 animate-fadeIn">
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-cyan-950/20 p-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-black text-sm"><BookOpen className="w-4 h-4" /> IMSD Source Departmental Ledger &amp; Tally Book</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">Actual source-ledger data: Uniform, C&amp;P, Cash Imprest, P.Way and T&amp;P. Select any item to view voucher-wise transaction details exactly as extracted from its tally-book page.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shrink-0">
            {[[totals.items, 'Items'], [totals.transactions, 'Transactions'], [totals.assigned, 'SAP Codes'], [totals.partial, 'Partial Matches']].map(([value, label]) => <div key={String(label)} className="rounded-xl bg-white/90 dark:bg-slate-950/60 border border-indigo-100 dark:border-indigo-900 px-3 py-2"><div className="font-black text-indigo-700 dark:text-cyan-300">{Number(value).toLocaleString('en-IN')}</div><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div></div>)}
          </div>
        </div>
        {loadError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{loadError}</div>}
        {!loadError && !tallyItems.length && <div className="mt-3 text-xs font-bold text-indigo-700 dark:text-cyan-300">Loading 196-item source tally master…</div>}
      </div>

      <div className="flex flex-col lg:flex-row gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <label className="relative flex-1"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search item, SAP code, description or ledger page…" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
        <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold"><option value="ALL">All item types</option>{sourceTypes.map(type => <option key={type} value={type}>{itemType(type)}</option>)}</select>
        <button onClick={() => setReviewOnly(value => !value)} className={`rounded-xl px-3 py-2 text-xs font-bold border ${reviewOnly ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>Partial / Pending Review</button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-xs"><thead className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 uppercase text-[10px]"><tr><th className="p-3">Sr. No</th><th className="p-3">SAP Item Code</th><th className="p-3">Item Name</th><th className="p-3">Item Type</th><th className="p-3 text-right">Receipt</th><th className="p-3 text-right">Transfer</th><th className="p-3 text-right">Issue</th><th className="p-3 text-right">Balance</th><th className="p-3">Min Buffer / Stock Trigger</th><th className="p-3">SAP Description</th><th className="p-3">Ledger Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredItems.map((item, index) => {
          const partial = item.matchStatus.startsWith('SAP ID partial');
          const bal = item.closingBalance ?? 0;
          const isZero = bal <= 0;
          const isLow = bal > 0 && bal <= 5;
          return <tr key={ledgerKey(item)} className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 ${isZero ? 'bg-red-50/30 dark:bg-red-950/15' : isLow ? 'bg-amber-50/25 dark:bg-amber-950/10' : ''}`}><td className="p-3 text-right text-slate-500 font-mono">{index + 1}</td><td className="p-3 font-mono font-black text-blue-700 dark:text-cyan-300">{item.sapMaterial || <span className="text-amber-700 dark:text-amber-300">Pending</span>}{partial && <div className="text-[9px] text-amber-700 dark:text-amber-300 mt-1">Partial — verify</div>}</td><td className="p-3"><div className="font-bold text-slate-900 dark:text-white">{item.itemName}</div><div className="text-[10px] text-slate-500 mt-1">Ledger page: {item.ledgerPage}</div></td><td className="p-3"><span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 px-2 py-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">{itemType(item.source)}</span></td><td className="p-3 text-right font-mono">{fmt(item.totalReceipt)}</td><td className="p-3 text-right font-mono">{fmt(item.totalTransfer)}</td><td className="p-3 text-right font-mono">{fmt(item.totalIssue)}</td><td className="p-3 text-right font-mono font-black text-sm">{fmt(item.closingBalance)}</td><td className="p-3">{isZero ? <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-red-600 text-white shadow-sm inline-block">🔴 ZERO (0) • CRITICAL</span> : isLow ? <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm inline-block">⚠️ LOW (≤ 5 Buffer)</span> : <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 inline-block">🟢 IN STOCK (&gt; 5)</span>}</td><td className="p-3 max-w-sm"><div className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{item.sapDescription || <span className="text-amber-700 dark:text-amber-300">SAP description pending verification</span>}</div><div className="text-[10px] text-slate-500 mt-1">{item.sapUom}{partial ? ' • partial description match' : ''}</div></td><td className="p-3"><button onClick={() => setSelectedItem(item)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 font-bold shadow-sm transition"><BookOpen className="w-3.5 h-3.5" /> View <ChevronRight className="w-3.5 h-3.5" /></button></td></tr>;
        })}</tbody></table></div>
        {!filteredItems.length && <div className="p-8 text-center text-sm text-slate-500">No item found for this filter.</div>}
      </div>

      {selectedItem && <div className="fixed inset-0 z-[90] bg-slate-950/60 p-3 sm:p-6 flex items-center justify-center" onMouseDown={() => setSelectedItem(null)}><div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700" onMouseDown={event => event.stopPropagation()}><div className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#0c234a] to-[#123b72] p-5 text-white"><div><div className="flex items-center gap-2 text-cyan-200 text-xs font-bold"><BookOpen className="w-4 h-4" /> DEPARTMENTAL LEDGER AND TALLY BOOK</div><h2 className="mt-1 text-lg sm:text-xl font-black">{selectedItem.itemName}</h2><p className="mt-1 text-xs text-blue-100">{itemType(selectedItem.source)} • Ledger Page {selectedItem.ledgerPage} • SAP Item Code: {selectedItem.sapMaterial || 'Pending verification'}</p></div><button onClick={() => setSelectedItem(null)} className="rounded-xl bg-white/10 hover:bg-white/20 p-2" aria-label="Close ledger"><XCircle className="w-5 h-5" /></button></div><div className="p-4 sm:p-5 overflow-y-auto max-h-[75vh]"><div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">{[[selectedItem.transactions, 'Transactions'], [selectedItem.totalReceipt, 'Receipt'], [selectedItem.totalTransfer, 'Transfer'], [selectedItem.totalIssue, 'Issue'], [selectedItem.closingBalance, 'Closing Balance']].map(([value, label]) => <div key={String(label)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 p-3"><div className="text-[10px] font-bold uppercase text-slate-500">{label}</div><div className="mt-1 text-lg font-black text-indigo-700 dark:text-cyan-300">{fmt(value as number | null)}</div></div>)}</div><div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl"><table className="min-w-[900px] w-full text-left text-xs"><thead className="bg-slate-100 dark:bg-slate-800 uppercase text-[10px] text-slate-600 dark:text-slate-300"><tr><th className="p-3">S.No</th><th className="p-3">Date</th><th className="p-3">Voucher / Reference</th><th className="p-3">Received From / Issued To</th><th className="p-3">Purpose / Particulars</th><th className="p-3 text-right">Receipt</th><th className="p-3 text-right">Transfer</th><th className="p-3 text-right">Issue</th><th className="p-3 text-right">Balance</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{selectedTransactions.map((transaction, index) => <tr key={`${transaction.rowNumber}-${index}`}><td className="p-3 text-right">{index + 1}</td><td className="p-3">{transaction.date}</td><td className="p-3">{transaction.voucher}</td><td className="p-3">{transaction.party}</td><td className="p-3 max-w-xs">{transaction.purpose}</td><td className="p-3 text-right font-mono">{fmt(transaction.receipt)}</td><td className="p-3 text-right font-mono">{fmt(transaction.transfer)}</td><td className="p-3 text-right font-mono">{fmt(transaction.issue)}</td><td className="p-3 text-right font-mono font-bold">{fmt(transaction.balance)}</td></tr>)}</tbody></table></div></div></div></div>}
    </section>
  );
};
