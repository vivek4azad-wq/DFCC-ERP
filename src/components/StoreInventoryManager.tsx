/**
 * DFCCIL P-Way Store & Inventory Management ERP
 * IMSD SMUN Unit (Civil Engineering / Depot)
 * 
 * Features:
 * - Real-time track fittings & tool inventory (ERC Mk-III/V, GRSP pads, GFNL liners, fish plates, track gauges)
 * - Inward Stock Register (Receipt from Steel Plants / RDSO approved suppliers)
 * - Outward Issue Register (Material issued to 1+15 Gangs, Mates, Contractors)
 * - Minimum Buffer Safety Stock Warning alerts
 * - Instant Stock Reconciliation & CSV/Print Export
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  CheckCircle2,
  Trash2,
  Edit,
  Clock,
  Building2,
  ShieldCheck,
  HardHat,
  Sparkles,
  Layers,
  X,
  Check,
  RefreshCw,
  Box
} from 'lucide-react';
import type { StoreItemRecord, StoreTransactionRecord } from '../types/index.ts';

export const StoreInventoryManager: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isStoreKeeper = role === 'STORE_KEEPER' || role === 'SUPER_ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'inward' | 'outward' | 'low_stock'>('inventory');
  const [items, setItems] = useState<StoreItemRecord[]>([]);
  const [transactions, setTransactions] = useState<StoreTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modals
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'INWARD' | 'OUTWARD'>('OUTWARD');
  const [selectedItemForTxn, setSelectedItemForTxn] = useState<StoreItemRecord | null>(null);
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string; label: string }[]>([]);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isOnTheFlyMaterialMode, setIsOnTheFlyMaterialMode] = useState(false);
  const [onTheFlyMaterial, setOnTheFlyMaterial] = useState({
    name: '',
    itemCode: '',
    unit: 'Nos',
    category: 'FITTINGS'
  });

  // Form states
  const [newItemData, setNewItemData] = useState<Partial<StoreItemRecord>>({
    category: 'FITTINGS',
    unit: 'Nos',
    currentStock: 0,
    minBufferThreshold: 50,
    location: 'IMSD SMUN Central Store'
  });

  const [txnFormData, setTxnFormData] = useState({
    itemId: '',
    quantity: 100,
    referenceNo: '',
    issuedToOrReceivedFrom: '',
    purposeOrSection: '',
    remarks: ''
  });

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const [itemsList, txnList, catList] = await Promise.all([
        db.getCollection<StoreItemRecord>('store_items'),
        db.getCollection<StoreTransactionRecord>('store_transactions'),
        db.getCollection<{ id: string; name: string; label: string }>('store_categories' as any)
      ]);
      setItems(itemsList || []);
      setTransactions(txnList || []);
      setCustomCategories(catList || []);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  const lowStockItems = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minBufferThreshold);
  }, [items]);

  const totalAssetValue = useMemo(() => {
    return items.reduce((acc, i) => acc + (i.currentStock * (i.unitRate || 0)), 0);
  }, [items]);

  const totalInwardMonth = useMemo(() => {
    return transactions.filter(t => t.type === 'INWARD').reduce((acc, t) => acc + Number(t.quantity || 0), 0);
  }, [transactions]);

  const totalOutwardMonth = useMemo(() => {
    return transactions.filter(t => t.type === 'OUTWARD').reduce((acc, t) => acc + Number(t.quantity || 0), 0);
  }, [transactions]);

  // Combined categories
  const allCategories = useMemo(() => {
    const defaults = [
      { id: 'FITTINGS', label: 'P-Way Fittings (ERC, GRSP, GFNL)' },
      { id: 'FASTENERS', label: 'Fasteners & Fish Plates' },
      { id: 'TURNOUT_COMPONENTS', label: 'Turnouts & Insulated Joints' },
      { id: 'TOOLS', label: 'Tools & Track Gauges' },
      { id: 'SAFETY_GEAR', label: 'Safety Gear & Detonators' },
      { id: 'BALLAST_SLEEPER', label: 'Ballast & Sleepers' },
      { id: 'SIGNAL_ELECTRICAL', label: 'Signal & Electrical Fittings' }
    ];
    const customFormatted = customCategories.map(c => ({ id: c.name || c.id, label: c.label || c.name || c.id }));
    const map = new Map<string, string>();
    defaults.forEach(d => map.set(d.id, d.label));
    customFormatted.forEach(c => map.set(c.id, c.label));
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [customCategories]);

  // Save new custom category to Firebase
  const handleSaveCustomCategory = async (name: string) => {
    if (!name.trim()) return;
    const catKey = name.trim().toUpperCase().replace(/\s+/g, '_');
    const newCat = {
      id: `CAT-${catKey}`,
      name: catKey,
      label: name.trim(),
      createdAt: new Date().toISOString()
    };
    await db.addDocument('store_categories' as any, newCat);
    await loadStoreData();
    setIsCustomCategoryMode(false);
    setCustomCategoryName('');
    return catKey;
  };

  // Handle Add Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name || !newItemData.itemCode) return;

    let finalCategory: any = newItemData.category || 'FITTINGS';
    if (isCustomCategoryMode && customCategoryName.trim()) {
      const savedKey = await handleSaveCustomCategory(customCategoryName);
      if (savedKey) finalCategory = savedKey;
    }

    const newItem: StoreItemRecord = {
      id: `STR-${Date.now().toString().slice(-6)}`,
      itemCode: newItemData.itemCode,
      name: newItemData.name,
      category: finalCategory as any,
      categoryLabel: allCategories.find(c => c.id === finalCategory)?.label || finalCategory,
      specification: newItemData.specification || 'Standard RDSO / DFCCIL Specification',
      unit: newItemData.unit || 'Nos',
      currentStock: Number(newItemData.currentStock || 0),
      minBufferThreshold: Number(newItemData.minBufferThreshold || 50),
      location: newItemData.location || 'IMSD SMUN Central Store',
      unitRate: Number(newItemData.unitRate || 0),
      inwardTotal: Number(newItemData.currentStock || 0),
      outwardTotal: 0,
      lastReceivedDate: new Date().toISOString().split('T')[0],
      supplier: newItemData.supplier || 'Approved Vendor',
      remarks: newItemData.remarks || ''
    };

    await db.addDocument('store_items', newItem);
    setIsAddItemModalOpen(false);
    setIsCustomCategoryMode(false);
    setCustomCategoryName('');
    loadStoreData();
  };

  // Handle Delete Item
  const handleDeleteItem = async (item: StoreItemRecord) => {
    if (!window.confirm(`⚠️ DELETE MATERIAL ITEM:\n\nAre you sure you want to permanently delete "${item.name}" (${item.itemCode}) from Store Inventory?`)) {
      return;
    }
    try {
      await db.deleteDocument('store_items', item.id);
      loadStoreData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Handle Inward / Outward Transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetItem = items.find(i => i.id === txnFormData.itemId) || selectedItemForTxn;

    if (isOnTheFlyMaterialMode) {
      if (!onTheFlyMaterial.name.trim() || !onTheFlyMaterial.itemCode.trim()) {
        alert('Please enter Material Name and Item Code');
        return;
      }
      const newItemId = `STR-${Date.now().toString().slice(-6)}`;
      const createdItem: StoreItemRecord = {
        id: newItemId,
        itemCode: onTheFlyMaterial.itemCode.trim(),
        name: onTheFlyMaterial.name.trim(),
        category: onTheFlyMaterial.category as any || 'FITTINGS',
        categoryLabel: allCategories.find(c => c.id === onTheFlyMaterial.category)?.label || onTheFlyMaterial.category,
        specification: 'RDSO / DFCCIL Standard Specification',
        unit: onTheFlyMaterial.unit || 'Nos',
        currentStock: 0,
        minBufferThreshold: 50,
        location: 'IMSD SMUN Central Store',
        unitRate: 0,
        inwardTotal: 0,
        outwardTotal: 0,
        lastReceivedDate: new Date().toISOString().split('T')[0],
        supplier: 'Approved Supplier',
        remarks: 'Created on-the-fly during transaction'
      };
      await db.addDocument('store_items', createdItem);
      targetItem = createdItem;
    }

    if (!targetItem || txnFormData.quantity <= 0) {
      alert('Please select or specify a valid material item and quantity');
      return;
    }

    const qty = Number(txnFormData.quantity);
    if (txnType === 'OUTWARD' && targetItem.currentStock < qty) {
      alert(`⚠️ Insufficient Stock! Current Available: ${targetItem.currentStock} ${targetItem.unit}`);
      return;
    }

    const newTxn: StoreTransactionRecord = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      type: txnType,
      itemId: targetItem.id,
      itemName: targetItem.name,
      quantity: qty,
      unit: targetItem.unit,
      referenceNo: txnFormData.referenceNo || `REF-${Date.now().toString().slice(-4)}`,
      issuedToOrReceivedFrom: txnFormData.issuedToOrReceivedFrom || (txnType === 'OUTWARD' ? '1+15 Gang SMUN' : 'Vendor Receipt'),
      purposeOrSection: txnFormData.purposeOrSection || 'Track Maintenance',
      authorizedBy: currentUser?.name || 'Store Incharge',
      remarks: txnFormData.remarks,
      createdAt: new Date().toISOString()
    };

    const updatedStock = txnType === 'INWARD'
      ? targetItem.currentStock + qty
      : targetItem.currentStock - qty;

    const updatedItem: StoreItemRecord = {
      ...targetItem,
      currentStock: updatedStock,
      inwardTotal: txnType === 'INWARD' ? (targetItem.inwardTotal || 0) + qty : targetItem.inwardTotal,
      outwardTotal: txnType === 'OUTWARD' ? (targetItem.outwardTotal || 0) + qty : targetItem.outwardTotal,
      lastReceivedDate: txnType === 'INWARD' ? newTxn.date : targetItem.lastReceivedDate,
      lastIssuedDate: txnType === 'OUTWARD' ? newTxn.date : targetItem.lastIssuedDate
    };

    await Promise.all([
      db.addDocument('store_transactions', newTxn),
      db.updateDocument('store_items', targetItem.id, updatedItem)
    ]);

    setIsTxnModalOpen(false);
    setIsOnTheFlyMaterialMode(false);
    setOnTheFlyMaterial({ name: '', itemCode: '', unit: 'Nos', category: 'FITTINGS' });
    loadStoreData();
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategoryFilter !== 'ALL' && item.category !== selectedCategoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          item.specification?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, selectedCategoryFilter, searchQuery]);

  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      if (activeSubTab === 'inward' && t.type !== 'INWARD') return false;
      if (activeSubTab === 'outward' && t.type !== 'OUTWARD') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.itemName.toLowerCase().includes(q) ||
          t.referenceNo.toLowerCase().includes(q) ||
          t.issuedToOrReceivedFrom.toLowerCase().includes(q) ||
          t.purposeOrSection.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, activeSubTab, searchQuery]);

  const exportStoreCsv = () => {
    const headers = ['Item Code', 'Item Name', 'Category', 'Specification', 'Current Stock', 'Unit', 'Min Buffer', 'Unit Rate (₹)', 'Location', 'Last Updated'];
    const rows = filteredItems.map(i => [
      `"${i.itemCode}"`,
      `"${i.name}"`,
      `"${i.category}"`,
      `"${i.specification}"`,
      i.currentStock,
      `"${i.unit}"`,
      i.minBufferThreshold,
      i.unitRate || 0,
      `"${i.location}"`,
      `"${i.lastIssuedDate || i.lastReceivedDate || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DFCCIL_Store_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-slate-900 dark:text-slate-100">
      {/* Module Title & Hero Header */}
      <div className="p-6 bg-gradient-to-br from-[#0c234a] via-[#123b72] to-[#0c234a] text-white rounded-3xl shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                📦 STORE &amp; DEPOT ERP
              </span>
              <span className="text-xs text-cyan-300 font-mono">IMSD SMUN Central Store</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              P-Way Material Store &amp; Tool Inventory
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-medium">
              Live ledger for ERC clips, GRSP rubber pads, GFNL liners, fish plates, insulated joints, tamping gear &amp; gang tools.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportStoreCsv}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Stock</span>
            </button>

            {isStoreKeeper && (
              <button
                onClick={() => {
                  setNewItemData({
                    category: 'FITTINGS',
                    unit: 'Nos',
                    currentStock: 0,
                    minBufferThreshold: 100,
                    location: 'IMSD SMUN Store'
                  });
                  setIsAddItemModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Material Item</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveSubTab('inventory')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 shadow-md ring-2 ring-blue-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Items</span>
            <Package className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {items.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Est. Val: ₹{(totalAssetValue / 100000).toFixed(2)} Lakhs
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('low_stock')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'low_stock'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-700 shadow-md ring-2 ring-red-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {lowStockItems.length} Items
          </div>
          <div className="text-[11px] text-red-500/90 mt-0.5">
            Below safety buffer threshold
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('inward')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'inward'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 shadow-md ring-2 ring-emerald-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Inward Total</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalInwardMonth.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600/90 mt-0.5">
            Goods received from plants/vendors
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('outward')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'outward'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 shadow-md ring-2 ring-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Outward Total</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totalOutwardMonth.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600/90 mt-0.5">
            Issued to 1+15 Gangs &amp; Mates
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tab Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Master Inventory ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('low_stock')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'low_stock'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>Low Stock Alerts ({lowStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('inward')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'inward'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Inward Register</span>
          </button>

          <button
            onClick={() => setActiveSubTab('outward')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'outward'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Material Issue / Outward</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search code, name, spec..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            <option value="FITTINGS">Fittings (ERC, GRSP, GFNL)</option>
            <option value="FASTENERS">Fasteners &amp; Fish Plates</option>
            <option value="TURNOUT_COMPONENTS">Turnouts &amp; Glued Joints</option>
            <option value="TOOLS">Tools &amp; Gauges</option>
            <option value="SAFETY_GEAR">Safety &amp; Detonators</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {(activeSubTab === 'inventory' || activeSubTab === 'low_stock') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Item Description</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Min Buffer</th>
                  <th className="p-3.5">Est. Rate (₹)</th>
                  <th className="p-3.5">Store Location</th>
                  <th className="p-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {(activeSubTab === 'low_stock' ? lowStockItems : filteredItems).map(item => {
                  const isLow = item.currentStock <= item.minBufferThreshold;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isLow ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-blue-700 dark:text-cyan-400">
                        {item.itemCode}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.specification}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {item.categoryLabel || item.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-black font-mono ${
                            isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {item.currentStock.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">{item.unit}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">
                              LOW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {item.minBufferThreshold.toLocaleString()} {item.unit}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                        ₹{(item.unitRate || 0).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        {item.location}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedItemForTxn(item);
                              setTxnType('INWARD');
                              setTxnFormData(prev => ({ ...prev, itemId: item.id, quantity: 500 }));
                              setIsTxnModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg text-[11px] font-bold transition border border-emerald-200 dark:border-emerald-800"
                            title="Receive Inward Stock"
                          >
                            + Inward
                          </button>

                          <button
                            onClick={() => {
                              setSelectedItemForTxn(item);
                              setTxnType('OUTWARD');
                              setTxnFormData(prev => ({ ...prev, itemId: item.id, quantity: 100 }));
                              setIsTxnModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-bold transition border border-amber-200 dark:border-amber-800"
                            title="Issue to Gang / Section"
                          >
                            - Issue
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg border border-red-200 dark:border-red-800 transition"
                              title="Delete Material Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inward & Outward Register View */}
      {(activeSubTab === 'inward' || activeSubTab === 'outward') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Ref / Challan</th>
                  <th className="p-3.5">Material Description</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">{activeSubTab === 'inward' ? 'Received From / Vendor' : 'Issued To (Gang/Mate)'}</th>
                  <th className="p-3.5">Purpose / Section</th>
                  <th className="p-3.5">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredTxns.map(txn => {
                  const isInward = txn.type === 'INWARD';
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{txn.date}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-700 dark:text-cyan-400">{txn.referenceNo}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{txn.itemName}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isInward
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {isInward ? '📥 INWARD' : '📤 OUTWARD'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-black text-slate-900 dark:text-white">
                        {isInward ? '+' : '-'}{Number(txn.quantity).toLocaleString()} {txn.unit}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{txn.issuedToOrReceivedFrom}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 text-[11px]">{txn.purposeOrSection}</td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">{txn.authorizedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add P-Way Material to Store</span>
              </h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PWAY-ERC-MK3"
                    value={newItemData.itemCode || ''}
                    onChange={e => setNewItemData({ ...newItemData, itemCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                      className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                    >
                      {isCustomCategoryMode ? 'Choose Existing' : '+ Custom Category'}
                    </button>
                  </div>
                  {isCustomCategoryMode ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. TRACK_MACHINES"
                      value={customCategoryName}
                      onChange={e => setCustomCategoryName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 text-slate-900 dark:text-white font-bold"
                    />
                  ) : (
                    <select
                      value={newItemData.category}
                      onChange={e => {
                        if (e.target.value === 'CUSTOM_NEW') {
                          setIsCustomCategoryMode(true);
                        } else {
                          setNewItemData({ ...newItemData, category: e.target.value as any });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      {allCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                      <option value="CUSTOM_NEW">+ Add Custom Category...</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elastic Rail Clip (ERC Mk-III)"
                  value={newItemData.name || ''}
                  onChange={e => setNewItemData({ ...newItemData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Specification</label>
                <input
                  type="text"
                  placeholder="e.g. RDSO/T-3701, 60kg Rail"
                  value={newItemData.specification || ''}
                  onChange={e => setNewItemData({ ...newItemData, specification: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemData.currentStock || 0}
                    onChange={e => setNewItemData({ ...newItemData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <select
                    value={newItemData.unit || 'Nos'}
                    onChange={e => setNewItemData({ ...newItemData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Sets">Sets</option>
                    <option value="Pairs">Pairs</option>
                    <option value="Meters">Meters</option>
                    <option value="MT">Metric Ton (MT)</option>
                    <option value="Packs">Packs</option>
                    <option value="Bags">Bags</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Min Buffer</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemData.minBufferThreshold || 50}
                    onChange={e => setNewItemData({ ...newItemData, minBufferThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inward / Outward Transaction Modal */}
      {isTxnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {txnType === 'INWARD' ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-amber-600" />}
                <span>{txnType === 'INWARD' ? 'Receive Inward Material' : 'Issue Material to Gang / Mate'}</span>
              </h3>
              <button onClick={() => { setIsTxnModalOpen(false); setIsOnTheFlyMaterialMode(false); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Select Material *</label>
                  <button
                    type="button"
                    onClick={() => setIsOnTheFlyMaterialMode(!isOnTheFlyMaterialMode)}
                    className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                  >
                    {isOnTheFlyMaterialMode ? 'Choose from Inventory' : '+ Add New Item On-the-Fly'}
                  </button>
                </div>

                {isOnTheFlyMaterialMode ? (
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Item Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fish Plate 60kg Rail"
                          value={onTheFlyMaterial.name}
                          onChange={e => setOnTheFlyMaterial({ ...onTheFlyMaterial, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Item Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PWAY-FP-60KG"
                          value={onTheFlyMaterial.itemCode}
                          onChange={e => setOnTheFlyMaterial({ ...onTheFlyMaterial, itemCode: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Category</label>
                        <select
                          value={onTheFlyMaterial.category}
                          onChange={e => setOnTheFlyMaterial({ ...onTheFlyMaterial, category: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        >
                          {allCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Unit</label>
                        <select
                          value={onTheFlyMaterial.unit}
                          onChange={e => setOnTheFlyMaterial({ ...onTheFlyMaterial, unit: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Sets">Sets</option>
                          <option value="Pairs">Pairs</option>
                          <option value="Meters">Meters</option>
                          <option value="MT">Metric Ton (MT)</option>
                          <option value="Packs">Packs</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={txnFormData.itemId || selectedItemForTxn?.id}
                    onChange={e => {
                      if (e.target.value === 'ADD_ON_THE_FLY') {
                        setIsOnTheFlyMaterialMode(true);
                      } else {
                        const sel = items.find(i => i.id === e.target.value);
                        setSelectedItemForTxn(sel || null);
                        setTxnFormData({ ...txnFormData, itemId: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    {items.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.itemCode}) — Available: {i.currentStock} {i.unit}
                      </option>
                    ))}
                    <option value="ADD_ON_THE_FLY">+ Add New Material Item On-the-Fly...</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity ({isOnTheFlyMaterialMode ? onTheFlyMaterial.unit : (selectedItemForTxn?.unit || 'Nos')}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txnFormData.quantity}
                    onChange={e => setTxnFormData({ ...txnFormData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Challan / Ref No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ISSUE-GANG1-030"
                    value={txnFormData.referenceNo}
                    onChange={e => setTxnFormData({ ...txnFormData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {txnType === 'INWARD' ? 'Received From (Vendor/Plant) *' : 'Issued To (Gang/Mate) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={txnType === 'INWARD' ? 'e.g. SAIL Bhilai Steel Plant' : 'e.g. 1+15 Gang SMUN (Mate Joginder Singh)'}
                  value={txnFormData.issuedToOrReceivedFrom}
                  onChange={e => setTxnFormData({ ...txnFormData, issuedToOrReceivedFrom: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose / Section *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Through Packing &amp; Fitting renewal Km 1175.000"
                  value={txnFormData.purposeOrSection}
                  onChange={e => setTxnFormData({ ...txnFormData, purposeOrSection: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsTxnModalOpen(false); setIsOnTheFlyMaterialMode(false); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-md ${
                    txnType === 'INWARD' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm {txnType === 'INWARD' ? 'Inward Stock' : 'Issue Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
