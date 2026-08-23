import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Search,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Layers,
  Filter,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { IMSD_TALLY_GZIP_BASE64 } from '../data/imsdTallyLedgerCompressed.ts';

export type ImsdTallyItem = {
  id?: string;
  source: string;
  sourceFile: string;
  ledgerPage: string;
  itemName: string;
  transactions: number;
  totalReceipt: number;
  totalTransfer: number;
  totalIssue: number;
  closingBalance: number | null;
  indexBalance: number | null;
  sapMaterial: string;
  sapDescription: string;
  sapUom: string;
  matchScore: number;
  matchStatus: string;
  category: string;
};

export type ImsdTallyTransaction = {
  id?: string;
  source: string;
  sourceFile: string;
  ledgerPage: string;
  itemName: string;
  date: string;
  voucher: string;
  party: string;
  purpose: string;
  receipt: number | null;
  transfer: number | null;
  issue: number | null;
  balance: number | null;
  rowNumber: number;
  sapMaterial: string;
  sapDescription: string;
  sapUom: string;
  matchScore: number;
  matchStatus: string;
};

type ImsdTallyData = {
  items: ImsdTallyItem[];
  transactions: ImsdTallyTransaction[];
};

const ITEM_TYPES: Record<string, string> = {
  'C&P Material': 'C&P (Consumables & Petroleum)',
  'T&P Material': 'T&P (Tools & Plant)',
  'P.Way Material': 'P.Way Material',
  'Cash Imprest': 'Cash Imprest',
  'Uniform': 'Uniform & Safety Gear',
  'Furniture': 'Furniture & Office',
  'P.way machines': 'P.way machines'
};

const CATEGORY_OPTIONS = [
  { value: 'C&P Material', label: 'C&P (Consumables & Petroleum)' },
  { value: 'T&P Material', label: 'T&P (Tools & Plant)' },
  { value: 'P.Way Material', label: 'P.Way Material' },
  { value: 'Cash Imprest', label: 'Cash Imprest' },
  { value: 'Uniform', label: 'Uniform & Safety Gear' },
  { value: 'Furniture', label: 'Furniture & Office Equipment' },
  { value: 'P.way machines', label: 'P.way machines' }
];

const itemType = (source: string) => ITEM_TYPES[source] || source;

const fmt = (value: number | null | undefined) =>
  value == null ? '—' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });

const ledgerKey = (item: Pick<ImsdTallyItem, 'sourceFile' | 'ledgerPage' | 'itemName'>) =>
  `${item.sourceFile || 'CUSTOM'}||${item.ledgerPage}||${item.itemName}`;

const decodeTallyData = async (): Promise<ImsdTallyData> => {
  const compressed = Uint8Array.from(atob(IMSD_TALLY_GZIP_BASE64), char => char.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as ImsdTallyData;
};

const LOCAL_STORAGE_KEY_ITEMS = 'imsd_tally_custom_items';
const LOCAL_STORAGE_KEY_TXNS = 'imsd_tally_custom_txns';

export const ImsdSourceTallyBook: React.FC = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ImsdTallyItem | null>(null);
  const [ledgerData, setLedgerData] = useState<ImsdTallyData>({ items: [], transactions: [] });
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals for CRUD operations
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImsdTallyItem | null>(null);
  const [isAddTxnModalOpen, setIsAddTxnModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form States
  const [itemFormData, setItemFormData] = useState({
    itemName: '',
    source: 'C&P Material',
    sapMaterial: '',
    sapDescription: '',
    ledgerPage: '',
    sapUom: 'NOS',
    openingStock: '0',
    minBuffer: '5'
  });

  const [txnFormData, setTxnFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voucher: '',
    party: 'CIODW Ami Bartan Bhandar/',
    purpose: 'IMSD/USED',
    type: 'RECEIPT' as 'RECEIPT' | 'ISSUE' | 'TRANSFER',
    quantity: '1'
  });

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  useEffect(() => {
    decodeTallyData()
      .then(initialData => {
        // Load custom persisted modifications
        try {
          const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
          const storedTxns = localStorage.getItem(LOCAL_STORAGE_KEY_TXNS);
          let finalItems = initialData.items;
          let finalTxns = initialData.transactions;

          if (storedItems) {
            finalItems = JSON.parse(storedItems);
          }
          if (storedTxns) {
            finalTxns = JSON.parse(storedTxns);
          }

          setLedgerData({ items: finalItems, transactions: finalTxns });
        } catch (e) {
          setLedgerData(initialData);
        }
      })
      .catch(() => setLoadError('Source tally data could not be loaded.'));
  }, []);

  const saveStateToStorage = (items: ImsdTallyItem[], txns: ImsdTallyTransaction[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(items));
      localStorage.setItem(LOCAL_STORAGE_KEY_TXNS, JSON.stringify(txns));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  };

  const tallyItems = ledgerData.items;
  const tallyTransactions = ledgerData.transactions;

  const sourceTypes = useMemo(() => {
    const types = [...new Set(tallyItems.map(item => item.source))].filter(Boolean);
    return types.sort();
  }, [tallyItems]);

  const totals = useMemo(
    () => ({
      items: tallyItems.length,
      transactions: tallyTransactions.length,
      assigned: tallyItems.filter(item => Boolean(item.sapMaterial)).length,
      partial: tallyItems.filter(item => item.matchStatus.startsWith('SAP ID partial')).length
    }),
    [tallyItems, tallyTransactions]
  );

  const filteredItems = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return tallyItems.filter(item => {
      if (typeFilter !== 'ALL' && item.source !== typeFilter) return false;
      if (reviewOnly && item.matchStatus === 'SAP ID matched') return false;
      return (
        !lower ||
        [item.itemName, item.sapMaterial, item.sapDescription, item.ledgerPage, item.source]
          .join(' ')
          .toLowerCase()
          .includes(lower)
      );
    });
  }, [tallyItems, query, typeFilter, reviewOnly]);

  const selectedTransactions = useMemo(
    () =>
      selectedItem
        ? tallyTransactions.filter(transaction => ledgerKey(transaction) === ledgerKey(selectedItem))
        : [],
    [selectedItem, tallyTransactions]
  );

  // ---------------------------------------------------------------------------
  // 1. ADD NEW MATERIAL ITEM
  // ---------------------------------------------------------------------------
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemFormData.itemName.trim()) {
      alert('Please provide Item Name');
      return;
    }

    const initialStock = Number(itemFormData.openingStock) || 0;
    const newItem: ImsdTallyItem = {
      source: itemFormData.source,
      sourceFile: `Tally_${itemFormData.source.replace(/\s+/g, '_')}.csv`,
      ledgerPage: itemFormData.ledgerPage || String(tallyItems.length + 1),
      itemName: itemFormData.itemName.trim(),
      transactions: initialStock > 0 ? 1 : 0,
      totalReceipt: initialStock,
      totalTransfer: 0,
      totalIssue: 0,
      closingBalance: initialStock,
      indexBalance: initialStock,
      sapMaterial: itemFormData.sapMaterial.trim() || 'Pending',
      sapDescription: itemFormData.sapDescription.trim() || itemFormData.itemName.trim(),
      sapUom: itemFormData.sapUom.toUpperCase(),
      matchScore: 100,
      matchStatus: itemFormData.sapMaterial.trim() ? 'SAP ID matched' : 'Manual Entry',
      category: itemFormData.source
    };

    const newTxns = [...tallyTransactions];
    if (initialStock > 0) {
      newTxns.push({
        source: newItem.source,
        sourceFile: newItem.sourceFile,
        ledgerPage: newItem.ledgerPage,
        itemName: newItem.itemName,
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        voucher: 'OB/Opening-Stock',
        party: 'Opening Stock / Ledger Initial',
        purpose: 'Initial Ledger Stock Balance',
        receipt: initialStock,
        transfer: 0,
        issue: 0,
        balance: initialStock,
        rowNumber: 1,
        sapMaterial: newItem.sapMaterial,
        sapDescription: newItem.sapDescription,
        sapUom: newItem.sapUom,
        matchScore: 100,
        matchStatus: newItem.matchStatus
      });
    }

    const updatedItems = [newItem, ...tallyItems];
    setLedgerData({ items: updatedItems, transactions: newTxns });
    saveStateToStorage(updatedItems, newTxns);
    setIsAddItemModalOpen(false);
    setItemFormData({
      itemName: '',
      source: 'C&P Material',
      sapMaterial: '',
      sapDescription: '',
      ledgerPage: '',
      sapUom: 'NOS',
      openingStock: '0',
      minBuffer: '5'
    });
    showToast(`✅ "${newItem.itemName}" registered in ${itemType(newItem.source)}`);
  };

  // ---------------------------------------------------------------------------
  // 2. EDIT MATERIAL ITEM (Including Category Switch between C&P and T&P)
  // ---------------------------------------------------------------------------
  const handleOpenEditItem = (item: ImsdTallyItem) => {
    setEditingItem(item);
    setItemFormData({
      itemName: item.itemName,
      source: item.source,
      sapMaterial: item.sapMaterial === 'Pending' ? '' : item.sapMaterial,
      sapDescription: item.sapDescription,
      ledgerPage: item.ledgerPage,
      sapUom: item.sapUom || 'NOS',
      openingStock: String(item.closingBalance ?? 0),
      minBuffer: '5'
    });
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const oldKey = ledgerKey(editingItem);
    const updatedCategory = itemFormData.source;

    const updatedItems = tallyItems.map(it => {
      if (ledgerKey(it) === oldKey) {
        return {
          ...it,
          itemName: itemFormData.itemName.trim(),
          source: updatedCategory,
          sapMaterial: itemFormData.sapMaterial.trim() || 'Pending',
          sapDescription: itemFormData.sapDescription.trim() || itemFormData.itemName.trim(),
          ledgerPage: itemFormData.ledgerPage || it.ledgerPage,
          sapUom: itemFormData.sapUom.toUpperCase(),
          category: updatedCategory
        };
      }
      return it;
    });

    // Update transactions associated with this item
    const updatedTxns = tallyTransactions.map(tx => {
      if (ledgerKey(tx) === oldKey) {
        return {
          ...tx,
          itemName: itemFormData.itemName.trim(),
          source: updatedCategory,
          sapMaterial: itemFormData.sapMaterial.trim() || 'Pending',
          sapDescription: itemFormData.sapDescription.trim(),
          ledgerPage: itemFormData.ledgerPage || tx.ledgerPage
        };
      }
      return tx;
    });

    setLedgerData({ items: updatedItems, transactions: updatedTxns });
    saveStateToStorage(updatedItems, updatedTxns);

    if (selectedItem && ledgerKey(selectedItem) === oldKey) {
      const refreshed = updatedItems.find(it => it.itemName === itemFormData.itemName.trim() && it.source === updatedCategory);
      if (refreshed) setSelectedItem(refreshed);
    }

    setEditingItem(null);
    showToast(`✏️ Updated "${itemFormData.itemName}" (Category: ${itemType(updatedCategory)})`);
  };

  // ---------------------------------------------------------------------------
  // 3. DELETE MATERIAL ITEM
  // ---------------------------------------------------------------------------
  const handleDeleteItem = (item: ImsdTallyItem) => {
    const key = ledgerKey(item);
    if (!window.confirm(`Are you sure you want to delete "${item.itemName}" from ${itemType(item.source)}? This will remove all associated ledger entries.`)) {
      return;
    }

    const updatedItems = tallyItems.filter(it => ledgerKey(it) !== key);
    const updatedTxns = tallyTransactions.filter(tx => ledgerKey(tx) !== key);

    setLedgerData({ items: updatedItems, transactions: updatedTxns });
    saveStateToStorage(updatedItems, updatedTxns);

    if (selectedItem && ledgerKey(selectedItem) === key) {
      setSelectedItem(null);
    }
    showToast(`🗑️ Deleted "${item.itemName}"`);
  };

  // ---------------------------------------------------------------------------
  // 4. ADD TRANSACTION VOUCHER (+ Inward / - Issue / Transfer)
  // ---------------------------------------------------------------------------
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = Number(txnFormData.quantity) || 0;
    if (qty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    const currentBal = selectedItem.closingBalance ?? 0;
    let receiptQty: number | null = null;
    let issueQty: number | null = null;
    let transferQty: number | null = null;
    let newBal = currentBal;

    if (txnFormData.type === 'RECEIPT') {
      receiptQty = qty;
      newBal = currentBal + qty;
    } else if (txnFormData.type === 'ISSUE') {
      issueQty = qty;
      newBal = currentBal - qty;
    } else if (txnFormData.type === 'TRANSFER') {
      transferQty = qty;
      newBal = currentBal - qty;
    }

    const newTxn: ImsdTallyTransaction = {
      source: selectedItem.source,
      sourceFile: selectedItem.sourceFile,
      ledgerPage: selectedItem.ledgerPage,
      itemName: selectedItem.itemName,
      date: txnFormData.date,
      voucher: txnFormData.voucher.trim() || `V-${Date.now().toString().slice(-4)}`,
      party: txnFormData.party.trim(),
      purpose: txnFormData.purpose.trim(),
      receipt: receiptQty,
      transfer: transferQty,
      issue: issueQty,
      balance: newBal,
      rowNumber: selectedTransactions.length + 1,
      sapMaterial: selectedItem.sapMaterial,
      sapDescription: selectedItem.sapDescription,
      sapUom: selectedItem.sapUom,
      matchScore: 100,
      matchStatus: selectedItem.matchStatus
    };

    const updatedTxns = [...tallyTransactions, newTxn];

    const updatedItems = tallyItems.map(it => {
      if (ledgerKey(it) === ledgerKey(selectedItem)) {
        return {
          ...it,
          transactions: it.transactions + 1,
          totalReceipt: it.totalReceipt + (receiptQty || 0),
          totalTransfer: it.totalTransfer + (transferQty || 0),
          totalIssue: it.totalIssue + (issueQty || 0),
          closingBalance: newBal
        };
      }
      return it;
    });

    setLedgerData({ items: updatedItems, transactions: updatedTxns });
    saveStateToStorage(updatedItems, updatedTxns);

    const refreshed = updatedItems.find(it => ledgerKey(it) === ledgerKey(selectedItem));
    if (refreshed) setSelectedItem(refreshed);

    setIsAddTxnModalOpen(false);
    setTxnFormData({
      date: new Date().toISOString().split('T')[0],
      voucher: '',
      party: 'CIODW Ami Bartan Bhandar/',
      purpose: 'IMSD/USED',
      type: 'RECEIPT',
      quantity: '1'
    });
    showToast(`📝 Added ${txnFormData.type} Voucher (${qty} ${selectedItem.sapUom || 'Nos'}) -> New Balance: ${newBal}`);
  };

  return (
    <section className="space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner with Stats and + Add Item Action */}
      <div className="rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-cyan-950/20 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-black text-base">
              <BookOpen className="w-5 h-5" />
              <span>IMSD Source Departmental Ledger &amp; Tally Book (विभागीय खाता पुस्तक)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              Complete source-ledger repository across <strong>Uniform, C&amp;P, Cash Imprest, P.Way, and T&amp;P</strong>.
              All master alterations, category switching (e.g. C&amp;P ⇄ T&amp;P), and voucher entries are fully editable.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-xl transition flex items-center gap-2 transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Material Item</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {[
            [totals.items, 'Total Items', 'text-indigo-700 dark:text-cyan-300'],
            [totals.transactions, 'Total Transactions', 'text-purple-700 dark:text-purple-300'],
            [totals.assigned, 'Assigned SAP Codes', 'text-emerald-700 dark:text-emerald-400'],
            [totals.partial, 'Partial / Pending', 'text-amber-700 dark:text-amber-300']
          ].map(([value, label, colorClass]) => (
            <div
              key={String(label)}
              className="rounded-2xl bg-white/90 dark:bg-slate-950/60 border border-indigo-100 dark:border-indigo-900/80 px-4 py-2.5 shadow-sm"
            >
              <div className={`text-lg font-black font-mono ${colorClass}`}>
                {Number(value).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
              </div>
            </div>
          ))}
        </div>

        {loadError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {loadError}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search item name, SAP code, description, or ledger page..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </label>
        <select
          value={typeFilter}
          onChange={event => setTypeFilter(event.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 text-xs font-bold"
        >
          <option value="ALL">All Categories / Item Types</option>
          {sourceTypes.map(type => (
            <option key={type} value={type}>
              {itemType(type)}
            </option>
          ))}
        </select>
        <button
          onClick={() => setReviewOnly(value => !value)}
          className={`rounded-xl px-3.5 py-2 text-xs font-bold border transition ${
            reviewOnly
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800'
              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          {reviewOnly ? '✓ Filtering Review' : 'Partial / Pending Review'}
        </button>
      </div>

      {/* Main Departmental Tally Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
            <thead className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 uppercase text-[10px] font-black border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Sr. No</th>
                <th className="p-3">SAP Item Code</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category (श्रेणी)</th>
                <th className="p-3 text-right">Receipt</th>
                <th className="p-3 text-right">Transfer</th>
                <th className="p-3 text-right">Issue</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3">Stock Trigger</th>
                <th className="p-3">SAP Description</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {filteredItems.map((item, index) => {
                const partial = item.matchStatus.startsWith('SAP ID partial');
                const bal = item.closingBalance ?? 0;
                const isZero = bal <= 0;
                const isLow = bal > 0 && bal <= 5;
                return (
                  <tr
                    key={ledgerKey(item)}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition ${
                      isZero ? 'bg-red-50/30 dark:bg-red-950/15' : isLow ? 'bg-amber-50/25 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="p-3 text-right text-slate-500 font-mono font-bold">{index + 1}</td>
                    <td className="p-3 font-mono font-black text-blue-700 dark:text-cyan-300">
                      {item.sapMaterial || <span className="text-amber-700 dark:text-amber-300">Pending</span>}
                      {partial && <div className="text-[9px] text-amber-700 dark:text-amber-300 mt-0.5">Partial — verify</div>}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{item.itemName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ledger Page: {item.ledgerPage}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        {itemType(item.source)}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{fmt(item.totalReceipt)}</td>
                    <td className="p-3 text-right font-mono">{fmt(item.totalTransfer)}</td>
                    <td className="p-3 text-right font-mono">{fmt(item.totalIssue)}</td>
                    <td className="p-3 text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                      {fmt(item.closingBalance)}
                    </td>
                    <td className="p-3">
                      {isZero ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-600 text-white shadow-sm inline-block">
                          🔴 ZERO (0)
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm inline-block">
                          ⚠️ LOW (≤ 5)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-block">
                          🟢 IN STOCK
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                        {item.sapDescription || (
                          <span className="text-amber-700 dark:text-amber-300">SAP description pending verification</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {item.sapUom}
                        {partial ? ' • partial match' : ''}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-xs font-bold shadow-sm transition"
                          title="Open full voucher transactions ledger"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
                          title="Edit Master Details / Switch Category"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filteredItems.length && (
          <div className="p-8 text-center text-sm text-slate-500">No items found for this query.</div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. ITEM TRANSACTIONS DETAIL MODAL (विभागीय खाता पुस्तक Ledger View)   */}
      {/* --------------------------------------------------------------------- */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center animate-fadeIn"
          onMouseDown={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
            onMouseDown={event => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-[#0c234a] to-[#123b72] p-5 text-white">
              <div>
                <div className="flex items-center gap-2 text-cyan-200 text-xs font-bold">
                  <BookOpen className="w-4 h-4" /> DEPARTMENTAL LEDGER AND TALLY BOOK
                </div>
                <h2 className="mt-1 text-lg sm:text-xl font-black">{selectedItem.itemName}</h2>
                <p className="mt-1 text-xs text-blue-100">
                  {itemType(selectedItem.source)} • Ledger Page {selectedItem.ledgerPage} • SAP Code:{' '}
                  {selectedItem.sapMaterial || 'Pending verification'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddTxnModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Voucher</span>
                </button>

                <button
                  onClick={() => handleOpenEditItem(selectedItem)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit / Change Category</span>
                </button>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl bg-white/10 hover:bg-white/20 p-2"
                  aria-label="Close ledger"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[75vh] space-y-4">
              {/* 5 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  [selectedTransactions.length, 'Total Transactions'],
                  [selectedItem.totalReceipt, 'Receipt Total'],
                  [selectedItem.totalTransfer, 'Transfer Total'],
                  [selectedItem.totalIssue, 'Issue Total'],
                  [selectedItem.closingBalance, 'Closing Balance']
                ].map(([value, label]) => (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 p-3"
                  >
                    <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">{label}</div>
                    <div className="mt-1 text-lg font-black text-indigo-700 dark:text-cyan-300 font-mono">
                      {fmt(value as number | null)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                <table className="min-w-[900px] w-full text-left text-xs">
                  <thead className="bg-[#f2f6fc] dark:bg-slate-800 uppercase text-[10px] font-black text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">S.No</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Voucher / Reference</th>
                      <th className="p-3">Received From / Issued To</th>
                      <th className="p-3">Purpose / Particulars</th>
                      <th className="p-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20">Receipt</th>
                      <th className="p-3 text-right">Transfer</th>
                      <th className="p-3 text-right bg-amber-50/50 dark:bg-amber-950/20">Issue</th>
                      <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20 font-black">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    {selectedTransactions.map((transaction, index) => (
                      <tr key={`${transaction.rowNumber}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-right font-mono text-slate-500">{index + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{transaction.date}</td>
                        <td className="p-3 font-bold text-blue-700 dark:text-cyan-300">{transaction.voucher}</td>
                        <td className="p-3">{transaction.party}</td>
                        <td className="p-3 max-w-xs">{transaction.purpose}</td>
                        <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          {fmt(transaction.receipt)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">{fmt(transaction.transfer)}</td>
                        <td className="p-3 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                          {fmt(transaction.issue)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          {fmt(transaction.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. ADD / EDIT MATERIAL ITEM MODAL (Category Switching Supported)     */}
      {/* --------------------------------------------------------------------- */}
      {(isAddItemModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Item Master / Change Category' : 'Register New Material in Tally Book'}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsAddItemModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingItem ? handleSaveEditItem : handleSaveNewItem} className="space-y-3.5 text-xs">
              {/* Category / Source Switcher */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  Material Category / Item Type (श्रेणी) *
                </label>
                <select
                  value={itemFormData.source}
                  onChange={e => setItemFormData(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/60 rounded-xl text-slate-900 dark:text-white font-bold"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                  💡 Move between C&amp;P, T&amp;P, P.Way, Cash Imprest, or Uniform instantly.
                </p>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Item Name (वस्तु का नाम) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grease Cup / Rail Thermometer / Torch Light"
                  value={itemFormData.itemName}
                  onChange={e => setItemFormData(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                />
              </div>

              {/* SAP Code & UOM */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">SAP Material Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 5000102"
                    value={itemFormData.sapMaterial}
                    onChange={e => setItemFormData(prev => ({ ...prev, sapMaterial: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Unit of Measurement (UOM)</label>
                  <input
                    type="text"
                    placeholder="e.g. NOS, KG, LTR, SET"
                    value={itemFormData.sapUom}
                    onChange={e => setItemFormData(prev => ({ ...prev, sapUom: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* SAP Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">SAP Description</label>
                <input
                  type="text"
                  placeholder="Full SAP catalog specification description"
                  value={itemFormData.sapDescription}
                  onChange={e => setItemFormData(prev => ({ ...prev, sapDescription: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Ledger Page & Opening Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Tally Ledger Page No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 12 or 49"
                    value={itemFormData.ledgerPage}
                    onChange={e => setItemFormData(prev => ({ ...prev, ledgerPage: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                {!editingItem && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Opening Stock Qty</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={itemFormData.openingStock}
                      onChange={e => setItemFormData(prev => ({ ...prev, openingStock: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddItemModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Save Changes' : 'Register Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 7. ADD VOUCHER / TRANSACTION MODAL                                    */}
      {/* --------------------------------------------------------------------- */}
      {isAddTxnModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                <span className="text-base font-black text-slate-900 dark:text-white">
                  Add Voucher for {selectedItem.itemName}
                </span>
              </div>
              <button
                onClick={() => setIsAddTxnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Voucher Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxnFormData(prev => ({ ...prev, type: 'RECEIPT' }))}
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txnFormData.type === 'RECEIPT'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>+ Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnFormData(prev => ({ ...prev, type: 'ISSUE' }))}
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txnFormData.type === 'ISSUE'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>- Issue</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnFormData(prev => ({ ...prev, type: 'TRANSFER' }))}
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txnFormData.type === 'TRANSFER'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>⇄ Transfer</span>
                  </button>
                </div>
              </div>

              {/* Date & Voucher No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Date *</label>
                  <input
                    type="date"
                    required
                    value={txnFormData.date}
                    onChange={e => setTxnFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Voucher / Ref No.</label>
                  <input
                    type="text"
                    placeholder="e.g. Glass/771 Dated 10.09.2024"
                    value={txnFormData.voucher}
                    onChange={e => setTxnFormData(prev => ({ ...prev, voucher: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  Quantity ({selectedItem.sapUom || 'Nos'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="1.00"
                  value={txnFormData.quantity}
                  onChange={e => setTxnFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-black"
                />
              </div>

              {/* Received From / Issued To */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  {txnFormData.type === 'RECEIPT' ? 'Received From (Vendor / Store)' : 'Issued To (Staff / Gang)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. CIODW Ami Bartan Bhandar / Keyman Baljinder Singh"
                  value={txnFormData.party}
                  onChange={e => setTxnFormData(prev => ({ ...prev, party: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Purpose / Section</label>
                <input
                  type="text"
                  placeholder="e.g. IMSD/USED or Track Maintenance"
                  value={txnFormData.purpose}
                  onChange={e => setTxnFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTxnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Voucher</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
