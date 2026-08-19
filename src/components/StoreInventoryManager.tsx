/**
 * DFCCIL P-Way Store & Inventory Management ERP
 * IMSD SMUN Unit (Civil Engineering / Depot)
 * 
 * Features:
 * - Categories: T&P, C&P, Furniture, P.way material, P.way machines, and Custom
 * - Departmental Ledger and Tally Book (विभागीय खाता मिलान पुस्तक) view as per official Indian Railways / DFCCIL format
 * - Direct CSV Upload Toggle for bulk data fetching & inventory creation
 * - Automatic "Issued To" staff dropdown populated from Staff Directory
 * - Full category management (Add & Delete categories)
 * - Inward / Outward / Transfer tracking with live balance computation
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Upload,
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
  Box,
  FileSpreadsheet,
  BookOpen,
  Info,
  ChevronRight,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';
import { StoreItemPublicQRView } from './StoreItemPublicQRView.tsx';
import { SapMaterialLookup } from './SapMaterialLookup.tsx';
import { ImsdSourceTallyBook } from './ImsdSourceTallyBook.tsx';
import type { StoreItemRecord, StoreTransactionRecord, OfficerStaffRecord } from '../types/index.ts';

const DEFAULT_STORE_CATEGORIES = [
  { id: 'T&P', label: 'T&P (Tools & Plant)' },
  { id: 'C&P', label: 'C&P (Consumables & Petroleum)' },
  { id: 'Furniture', label: 'Furniture & Office Equipment' },
  { id: 'P.way material', label: 'P.way material (Fittings, Rails, Turnouts)' },
  { id: 'P.way machines', label: 'P.way machines & Heavy Equipment' }
];

export const StoreInventoryManager: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isStoreKeeper = role === 'STORE_KEEPER' || role === 'SUPER_ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'tally_book' | 'source_tally' | 'inward' | 'outward' | 'low_stock'>('inventory');
  const [items, setItems] = useState<StoreItemRecord[]>([]);
  const [transactions, setTransactions] = useState<StoreTransactionRecord[]>([]);
  const [staffList, setStaffList] = useState<OfficerStaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modals & QR State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isCsvUploadModalOpen, setIsCsvUploadModalOpen] = useState(false);
  const [selectedItemForTally, setSelectedItemForTally] = useState<StoreItemRecord | null>(null);
  const [selectedItemForQR, setSelectedItemForQR] = useState<StoreItemRecord | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isPreviewingLiveScan, setIsPreviewingLiveScan] = useState(false);

  const [txnType, setTxnType] = useState<'INWARD' | 'OUTWARD' | 'TRANSFER'>('OUTWARD');
  const [selectedItemForTxn, setSelectedItemForTxn] = useState<StoreItemRecord | null>(null);
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string; label: string }[]>([]);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [isOnTheFlyMaterialMode, setIsOnTheFlyMaterialMode] = useState(false);
  const [onTheFlyMaterial, setOnTheFlyMaterial] = useState({
    name: '',
    itemCode: '',
    unit: 'Nos',
    category: 'T&P',
    priceListCode: '49',
    tallyCodeNo: '1',
    accountsFileNo: '3195'
  });

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newItemData, setNewItemData] = useState<Partial<StoreItemRecord>>({
    category: 'T&P',
    unit: 'Nos',
    currentStock: 0,
    minBufferThreshold: 10,
    location: 'IMSD SMUN Central Store',
    priceListCode: '49',
    tallyCodeNo: '1',
    accountsFileNo: '3195'
  });

  const [txnFormData, setTxnFormData] = useState({
    itemId: '',
    quantity: 1,
    referenceNo: '',
    voucherDate: new Date().toISOString().split('T')[0],
    issuedToOrReceivedFrom: '',
    purposeOrSection: 'IMSD/USED',
    remarks: ''
  });

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const [itemsList, txnList, catList, staff] = await Promise.all([
        db.getCollection<StoreItemRecord>('store_items'),
        db.getCollection<StoreTransactionRecord>('store_transactions'),
        db.getCollection<{ id: string; name: string; label: string }>('store_categories' as any),
        db.getCollection<OfficerStaffRecord>('officers_staff')
      ]);

      let finalItems = itemsList || [];
      // If no store items, initialize with standard initial railway seed items
      if (finalItems.length === 0) {
        finalItems = [
          {
            id: 'STR-49',
            itemCode: '49',
            priceListCode: '49',
            tallyCodeNo: '1',
            accountsFileNo: '3195',
            name: 'Crockery Items',
            category: 'T&P',
            categoryLabel: 'T&P (Tools & Plant)',
            specification: 'IMSD Office & Inspection Crockery Set',
            unit: 'Nos',
            currentStock: 6,
            minBufferThreshold: 2,
            location: 'IMSD SMUN HQ Central Store',
            inwardTotal: 6,
            outwardTotal: 0,
            unitRate: 450,
            lastReceivedDate: '2024-09-18',
            supplier: 'CIODW Ami Bartan Bhandar'
          },
          {
            id: 'STR-001',
            itemCode: 'PWAY-ERC-MK3',
            priceListCode: '01',
            tallyCodeNo: '2',
            accountsFileNo: '3190',
            name: 'Elastic Rail Clip (ERC Mk-III)',
            category: 'P.way material',
            categoryLabel: 'P.way material',
            specification: 'RDSO/T-3701, 60kg Rail',
            unit: 'Nos',
            currentStock: 12500,
            minBufferThreshold: 2000,
            location: 'Bay A1 - Fitting Yard',
            inwardTotal: 15000,
            outwardTotal: 2500,
            unitRate: 115,
            lastReceivedDate: '2024-09-15',
            supplier: 'SAIL Bhilai Steel Plant'
          },
          {
            id: 'STR-002',
            itemCode: 'PWAY-GRSP-6MM',
            priceListCode: '02',
            tallyCodeNo: '3',
            accountsFileNo: '3191',
            name: 'Grooved Rubber Sole Plate (GRSP 6mm)',
            category: 'P.way material',
            categoryLabel: 'P.way material',
            specification: 'IRS T-47, 60kg Sleeper',
            unit: 'Nos',
            currentStock: 8200,
            minBufferThreshold: 1500,
            location: 'Bay B1 - Pad Stacking Yard',
            inwardTotal: 10000,
            outwardTotal: 1800,
            unitRate: 65,
            lastReceivedDate: '2024-09-12',
            supplier: 'Approved Rubber Components Vendor'
          }
        ];
      }

      setItems(finalItems);
      setTransactions(txnList || []);
      setCustomCategories(catList || []);
      setStaffList(staff || []);

      if (!selectedItemForTally && finalItems.length > 0) {
        setSelectedItemForTally(finalItems[0]);
      }
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Generate dynamic printable QR code for selected item
  useEffect(() => {
    if (!selectedItemForQR) {
      setQrCodeDataUrl(null);
      setIsPreviewingLiveScan(false);
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raildairy-dfcc.web.app';
    const scanUrl = `${origin}/?store_item=${encodeURIComponent(selectedItemForQR.id)}`;

    QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 260,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate Store QR Code:', err));
  }, [selectedItemForQR]);

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

  // Combined categories list (T&P, C&P, Furniture, P.way material, P.way machines + Custom)
  const allCategories = useMemo(() => {
    const customFormatted = customCategories.map(c => ({ id: c.name || c.id, label: c.label || c.name || c.id }));
    const map = new Map<string, string>();
    DEFAULT_STORE_CATEGORIES.forEach(d => map.set(d.id, d.label));
    customFormatted.forEach(c => map.set(c.id, c.label));
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [customCategories]);

  // Save new custom category to Firebase
  const handleSaveCustomCategory = async (name: string) => {
    if (!name.trim()) return;
    const catKey = name.trim();
    const newCat = {
      id: `CAT-${Date.now().toString().slice(-4)}`,
      name: catKey,
      label: catKey,
      createdAt: new Date().toISOString()
    };
    await db.addDocument('store_categories' as any, newCat);
    await loadStoreData();
    setIsCustomCategoryMode(false);
    setCustomCategoryName('');
    return catKey;
  };

  // Delete Category with confirmation
  const handleDeleteCategory = async (catId: string, label: string) => {
    if (!window.confirm(`⚠️ DELETE STORE CATEGORY:\n\nAre you sure you want to delete category "${label}"?`)) {
      return;
    }
    try {
      const matchCustom = customCategories.find(c => c.id === catId || c.name === catId);
      if (matchCustom) {
        await db.deleteDocument('store_categories' as any, matchCustom.id);
      }
      // Re-assign any items in this category to 'T&P'
      const itemsToUpdate = items.filter(i => i.category === catId);
      for (const itm of itemsToUpdate) {
        await db.updateDocument('store_items', itm.id, {
          category: 'T&P',
          categoryLabel: 'T&P (Tools & Plant)'
        });
      }
      await loadStoreData();
    } catch (err: any) {
      alert(`Delete category failed: ${err.message}`);
    }
  };

  // Handle Add Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name || !newItemData.itemCode) return;

    let finalCategory: any = newItemData.category || 'T&P';
    if (isCustomCategoryMode && customCategoryName.trim()) {
      const savedKey = await handleSaveCustomCategory(customCategoryName);
      if (savedKey) finalCategory = savedKey;
    }

    const newItem: StoreItemRecord = {
      id: `STR-${Date.now().toString().slice(-6)}`,
      itemCode: newItemData.itemCode,
      priceListCode: newItemData.priceListCode || newItemData.itemCode,
      tallyCodeNo: newItemData.tallyCodeNo || '1',
      accountsFileNo: newItemData.accountsFileNo || '3195',
      name: newItemData.name,
      category: finalCategory,
      categoryLabel: allCategories.find(c => c.id === finalCategory)?.label || finalCategory,
      specification: newItemData.specification || 'Standard RDSO / DFCCIL Specification',
      unit: newItemData.unit || 'Nos',
      currentStock: Number(newItemData.currentStock || 0),
      minBufferThreshold: Number(newItemData.minBufferThreshold || 10),
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

  // Handle Inward / Outward / Transfer Transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetItem = items.find(i => i.id === txnFormData.itemId) || selectedItemForTxn || selectedItemForTally;

    if (isOnTheFlyMaterialMode) {
      if (!onTheFlyMaterial.name.trim() || !onTheFlyMaterial.itemCode.trim()) {
        alert('Please enter Material Name and Item Code');
        return;
      }
      const newItemId = `STR-${Date.now().toString().slice(-6)}`;
      const createdItem: StoreItemRecord = {
        id: newItemId,
        itemCode: onTheFlyMaterial.itemCode.trim(),
        priceListCode: onTheFlyMaterial.priceListCode || onTheFlyMaterial.itemCode.trim(),
        tallyCodeNo: onTheFlyMaterial.tallyCodeNo || '1',
        accountsFileNo: onTheFlyMaterial.accountsFileNo || '3195',
        name: onTheFlyMaterial.name.trim(),
        category: onTheFlyMaterial.category || 'T&P',
        categoryLabel: allCategories.find(c => c.id === onTheFlyMaterial.category)?.label || onTheFlyMaterial.category,
        specification: 'RDSO / DFCCIL Standard Specification',
        unit: onTheFlyMaterial.unit || 'Nos',
        currentStock: 0,
        minBufferThreshold: 10,
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

    const newStock = txnType === 'INWARD'
      ? targetItem.currentStock + qty
      : (txnType === 'OUTWARD' ? targetItem.currentStock - qty : targetItem.currentStock);

    const newTxn: StoreTransactionRecord = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date: txnFormData.voucherDate || new Date().toISOString().split('T')[0],
      type: txnType,
      itemId: targetItem.id,
      itemName: targetItem.name,
      quantity: qty,
      unit: targetItem.unit,
      referenceNo: txnFormData.referenceNo || `VOUCHER-${Date.now().toString().slice(-4)}`,
      issuedToOrReceivedFrom: txnFormData.issuedToOrReceivedFrom || (txnType === 'INWARD' ? 'Vendor Receipt' : '1+15 Gang SMUN'),
      purposeOrSection: txnFormData.purposeOrSection || 'IMSD/USED',
      authorizedBy: currentUser?.name || 'Store Incharge',
      remarks: txnFormData.remarks,
      receiptQty: txnType === 'INWARD' ? qty : 0,
      transferQty: txnType === 'TRANSFER' ? qty : 0,
      issueQty: txnType === 'OUTWARD' ? qty : 0,
      balanceQty: newStock,
      createdAt: new Date().toISOString()
    };

    const updatedItem: StoreItemRecord = {
      ...targetItem,
      currentStock: newStock,
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
    setOnTheFlyMaterial({ name: '', itemCode: '', unit: 'Nos', category: 'T&P', priceListCode: '49', tallyCodeNo: '1', accountsFileNo: '3195' });
    loadStoreData();
  };

  // CSV Direct Parser & Uploader
  const handleCsvImport = async () => {
    if (!csvRawText.trim()) return;
    try {
      const lines = csvRawText.trim().split('\n').filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        alert('CSV file is empty or missing data rows');
        return;
      }

      let importedItemCount = 0;
      let importedTxnCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length >= 2) {
          const itemCode = cols[0] || `ITEM-${Date.now().toString().slice(-4)}`;
          const name = cols[1] || 'Imported Material';
          const category = cols[2] || 'T&P';
          const unit = cols[3] || 'Nos';
          const currentStock = Number(cols[4] || 0);
          const minBuffer = Number(cols[5] || 10);
          const location = cols[6] || 'IMSD SMUN Central Store';
          const voucherNo = cols[7] || '';
          const party = cols[8] || 'Vendor Receipt';
          const purpose = cols[9] || 'IMSD/USED';

          const existing = items.find(it => it.itemCode === itemCode || it.name.toLowerCase() === name.toLowerCase());
          let itemId = existing?.id;

          if (existing) {
            await db.updateDocument('store_items', existing.id, {
              currentStock: currentStock || existing.currentStock,
              unit,
              category,
              location
            });
          } else {
            const newItem: StoreItemRecord = {
              id: `STR-${Date.now().toString().slice(-6)}-${i}`,
              itemCode,
              priceListCode: itemCode,
              tallyCodeNo: String(i),
              accountsFileNo: '3195',
              name,
              category,
              categoryLabel: allCategories.find(c => c.id === category)?.label || category,
              specification: 'Imported P-Way Spec',
              unit,
              currentStock,
              minBufferThreshold: minBuffer,
              location,
              inwardTotal: currentStock,
              outwardTotal: 0,
              lastReceivedDate: new Date().toISOString().split('T')[0]
            };
            await db.addDocument('store_items', newItem);
            itemId = newItem.id;
            importedItemCount++;
          }

          // If voucher is present, record transaction
          if (voucherNo && itemId) {
            const newTxn: StoreTransactionRecord = {
              id: `TXN-${Date.now().toString().slice(-6)}-${i}`,
              date: new Date().toISOString().split('T')[0],
              type: 'INWARD',
              itemId,
              itemName: name,
              quantity: currentStock,
              unit,
              referenceNo: voucherNo,
              issuedToOrReceivedFrom: party,
              purposeOrSection: purpose,
              authorizedBy: currentUser?.name || 'Store Incharge',
              receiptQty: currentStock,
              transferQty: 0,
              issueQty: 0,
              balanceQty: currentStock,
              createdAt: new Date().toISOString()
            };
            await db.addDocument('store_transactions', newTxn);
            importedTxnCount++;
          }
        }
      }

      setCsvUploadSuccess(`✅ Successfully imported ${importedItemCount} material items and ${importedTxnCount} transactions!`);
      setTimeout(() => {
        setCsvUploadSuccess(null);
        setIsCsvUploadModalOpen(false);
        setCsvRawText('');
      }, 2000);
      loadStoreData();
    } catch (err: any) {
      alert(`CSV Parsing Error: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setCsvRawText(text);
    };
    reader.readAsText(file);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategoryFilter !== 'ALL' && item.category !== selectedCategoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          (item.priceListCode && String(item.priceListCode).toLowerCase().includes(q)) ||
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

  // Selected item transactions for Departmental Ledger & Tally Book
  const tallyTransactions = useMemo(() => {
    if (!selectedItemForTally) return [];
    return transactions.filter(t => t.itemId === selectedItemForTally.id || t.itemName.toLowerCase() === selectedItemForTally.name.toLowerCase());
  }, [transactions, selectedItemForTally]);

  const exportStoreCsv = () => {
    const headers = ['Item Code', 'Price List Code', 'Tally Code No', 'Item Name', 'Category', 'Specification', 'Current Stock', 'Unit', 'Min Buffer', 'Unit Rate (₹)', 'Location', 'Last Updated'];
    const rows = filteredItems.map(i => [
      `"${i.itemCode}"`,
      `"${i.priceListCode || i.itemCode}"`,
      `"${i.tallyCodeNo || 1}"`,
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
    link.setAttribute('download', `DFCCIL_Store_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950">
                📦 STORE &amp; DEPOT ERP
              </span>
              <span className="text-xs text-cyan-300 font-mono">IMSD SMUN Central Store</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-900/80 text-blue-200 border border-blue-700/50">
                विभागीय खाता मिलान पुस्तक
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              P-Way Store &amp; Departmental Tally Ledger
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-medium">
              Live tally book for T&amp;P, C&amp;P, Furniture, P.way material &amp; P.way machines with voucher-wise reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCsvUploadModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md border border-blue-400/40"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>

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
                    category: 'T&P',
                    unit: 'Nos',
                    currentStock: 0,
                    minBufferThreshold: 10,
                    location: 'IMSD SMUN Store',
                    priceListCode: '49',
                    tallyCodeNo: '1',
                    accountsFileNo: '3195'
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
          onClick={() => setActiveSubTab('tally_book')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'tally_book'
              ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 shadow-md ring-2 ring-purple-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">खाता पुस्तक (Tally Book)</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1 truncate">
            {selectedItemForTally?.name || 'Crockery Items'}
          </div>
          <div className="text-[11px] text-purple-600/90 mt-0.5">
            Code: {selectedItemForTally?.priceListCode || selectedItemForTally?.itemCode || '49'} • Bal: {selectedItemForTally?.currentStock ?? 6} {selectedItemForTally?.unit || 'Nos'}
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
            Issued to 1+15 Gangs &amp; Staff
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
            onClick={() => setActiveSubTab('tally_book')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'tally_book'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>विभागीय खाता पुस्तक (Tally Book)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('source_tally')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${ 
              activeSubTab === 'source_tally'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>IMSD Source Tally Master (196)</span>
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
            <span>Low Stock Alert ({lowStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('inward')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeSubTab === 'inward'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
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
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Outward Issue Register</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Code (e.g. 49), Name, Spec..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills Bar with Delete Category button */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">Categories:</span>
        <button
          onClick={() => setSelectedCategoryFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
            selectedCategoryFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {allCategories.map(cat => (
          <div key={cat.id} className="flex items-center shrink-0">
            <button
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-l-lg text-xs font-bold transition ${
                selectedCategoryFilter === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => handleDeleteCategory(cat.id, cat.label)}
                className="px-1.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-600 rounded-r-lg border-l border-slate-200 dark:border-slate-700 text-[10px] transition"
                title={`Delete Category ${cat.label}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 1. MASTER INVENTORY TABLE */}
      {/* ------------------------------------------------------------------------- */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Code / Price List</th>
                  <th className="p-3.5">Item Description (वस्तु का विवरण)</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Min Buffer</th>
                  <th className="p-3.5">Est. Rate (₹)</th>
                  <th className="p-3.5">Store Location</th>
                  <th className="p-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {filteredItems.map(item => {
                  const isLow = item.currentStock <= item.minBufferThreshold;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        isLow ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-blue-700 dark:text-cyan-400">
                        <div className="flex items-center gap-1.5">
                          <span>{item.priceListCode || item.itemCode}</span>
                          {item.tallyCodeNo && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              T-{item.tallyCodeNo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <button
                            onClick={() => {
                              setSelectedItemForTally(item);
                              setActiveSubTab('tally_book');
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
                            title="Open Departmental Tally Ledger for this item"
                          >
                            📋 Tally Book
                          </button>
                        </div>
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
                            onClick={() => setSelectedItemForQR(item)}
                            className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-300 rounded-lg text-[11px] font-bold transition border border-cyan-200 dark:border-cyan-800 flex items-center gap-1 shadow-sm"
                            title="Generate & Print Dynamic QR Code for Bin Label"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR Label</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedItemForTxn(item);
                              setTxnType('INWARD');
                              setTxnFormData(prev => ({ ...prev, itemId: item.id, quantity: 1, purposeOrSection: 'IMSD/USED' }));
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
                              setTxnFormData(prev => ({ ...prev, itemId: item.id, quantity: 1, purposeOrSection: 'Track Maintenance' }));
                              setIsTxnModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-bold transition border border-amber-200 dark:border-amber-800"
                            title="Issue to Staff / Gang"
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

      {/* ------------------------------------------------------------------------- */}
      {/* 2. DEPARTMENTAL LEDGER AND TALLY BOOK (विभागीय खाता मिलान पुस्तक) */}
      {/* ------------------------------------------------------------------------- */}
      {activeSubTab === 'source_tally' && <ImsdSourceTallyBook />}

      {activeSubTab === 'tally_book' && selectedItemForTally && (
        <div className="bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Official Indian Railways / DFCCIL Tally Book Header */}
          <div className="bg-gradient-to-r from-amber-50 via-purple-50/60 to-amber-50 dark:from-slate-900 dark:via-purple-950/40 dark:to-slate-900 p-5 border-b-2 border-slate-300 dark:border-slate-700">
            <div className="text-center space-y-1">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                विभागीय खाता मिलान पुस्तक
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#0f2b5c] dark:text-white uppercase">
                DEPARTMENTAL LEDGER AND TALLY BOOK
              </h2>
            </div>

            {/* Top 2 Rows Matching Authentic Sheet Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs font-bold border-t border-b border-slate-300 dark:border-slate-700 py-3 bg-white/70 dark:bg-slate-800/70 rounded-xl p-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">मूल्य सूची/कूट संख्या Price List / Code No.</span>
                <span className="text-base font-black text-red-600 font-mono">
                  {selectedItemForTally.priceListCode || selectedItemForTally.itemCode || '49'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">मिलान पत्र संख्या Tally Code No.</span>
                <span className="text-base font-black text-red-600 font-mono">
                  {selectedItemForTally.tallyCodeNo || '1'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">वस्तु का विवरण Description of Article</span>
                <span className="text-base font-black text-red-600">
                  {selectedItemForTally.name}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">लेखा कार्यालय पृष्ठ संख्या Accounts File No.</span>
                <span className="text-base font-black text-red-600 font-mono">
                  {selectedItemForTally.accountsFileNo || '3195'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">यूनिट Unit</span>
                <span className="text-base font-black text-red-600">
                  {selectedItemForTally.unit || 'Nos'}
                </span>
              </div>
            </div>

            {/* Quick Item Switcher */}
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Item:</span>
                <select
                  value={selectedItemForTally.id}
                  onChange={e => {
                    const sel = items.find(i => i.id === e.target.value);
                    if (sel) setSelectedItemForTally(sel);
                  }}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.priceListCode || i.itemCode} • {i.name} (Stock: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedItemForTxn(selectedItemForTally);
                    setTxnType('INWARD');
                    setTxnFormData(prev => ({ ...prev, itemId: selectedItemForTally.id, quantity: 1, purposeOrSection: 'IMSD/USED' }));
                    setIsTxnModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Receipt Voucher</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedItemForTxn(selectedItemForTally);
                    setTxnType('OUTWARD');
                    setTxnFormData(prev => ({ ...prev, itemId: selectedItemForTally.id, quantity: 1, purposeOrSection: 'IMSD/USED' }));
                    setIsTxnModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  <span>- Issue Voucher</span>
                </button>
              </div>
            </div>
          </div>

          {/* Authentic Tally Book Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700">
              <thead>
                <tr className="bg-[#f2f6fc] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 text-center">
                  <th className="p-3 border border-slate-300 dark:border-slate-700">माह और तारीख<br/><span className="text-[10px] font-normal">Month and Date</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700">प्राप्त या निर्गम वाउचर संख्या और तारीख<br/><span className="text-[10px] font-normal">No. and Date of Receipt or issue Voucher</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700">किससे प्राप्त हुआ या किसे जारी किया<br/><span className="text-[10px] font-normal">From Whom received or to whom issued</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700">प्राप्ति या निर्गम का उद्देश्य<br/><span className="text-[10px] font-normal">Purpose for which received or issue</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20">प्राप्ति<br/><span className="text-[10px] font-normal">Receipt ({selectedItemForTally.unit})</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700">स्थानांतरण<br/><span className="text-[10px] font-normal">Transfer</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/20">निर्गम<br/><span className="text-[10px] font-normal">Issues</span></th>
                  <th className="p-3 border border-slate-300 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20 font-black">शेष<br/><span className="text-[10px] font-normal">Balance</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium text-slate-800 dark:text-slate-200">
                {tallyTransactions.length === 0 ? (
                  <>
                    {/* Default Seed sample rows matching image */}
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">18-09-2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-bold">Dated: 18.09.2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700">CIODW Ami Bartan Bhandar/</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">IMSD/USED</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono">1.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono bg-blue-50/30">1.00</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">18-09-2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-bold">Glass/771 Dated 10.09.2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700">CIODW Ami Bartan Bhandar/</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">IMSD/USED</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono">2.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono bg-blue-50/30">3.00</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">18-09-2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-bold">Multi Tray/771 18.09.2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700">CIODW Ami Bartan Bhandar/</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">IMSD/USED</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono">1.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono bg-blue-50/30">4.00</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">18-09-2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-bold">Multi Cup/771 18.09.2024</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700">CIODW Ami Bartan Bhandar/</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">IMSD/USED</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono">2.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">0.00</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono bg-blue-50/30">6.00</td>
                    </tr>
                  </>
                ) : (
                  tallyTransactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">{tx.date}</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-bold">{tx.referenceNo}</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700">{tx.issuedToOrReceivedFrom}</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">{tx.purposeOrSection}</td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono">
                        {tx.type === 'INWARD' ? Number(tx.quantity).toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">
                        {tx.type === 'TRANSFER' ? Number(tx.quantity).toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-amber-600 font-bold">
                        {tx.type === 'OUTWARD' ? Number(tx.quantity).toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono bg-blue-50/30">
                        {Number(tx.balanceQty ?? selectedItemForTally.currentStock).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 3. INWARD / OUTWARD TRANSACTION LOGS */}
      {/* ------------------------------------------------------------------------- */}
      {(activeSubTab === 'inward' || activeSubTab === 'outward') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Ref / Voucher No.</th>
                  <th className="p-3.5">Material Description</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">{activeSubTab === 'inward' ? 'Received From / Vendor' : 'Issued To (Staff / Gang)'}</th>
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

      {/* ------------------------------------------------------------------------- */}
      {/* 4. CSV UPLOAD MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {isCsvUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>Direct CSV Upload &amp; Data Fetch</span>
              </h3>
              <button onClick={() => setIsCsvUploadModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Upload or paste your Store Inventory CSV file. Columns format: <br/>
              <code className="font-mono text-[11px] text-blue-600 dark:text-cyan-400 font-bold">
                ItemCode, ItemName, Category, Unit, CurrentStock, MinBuffer, Location, VoucherNo, FromParty, Purpose
              </code>
            </p>

            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Or Paste Raw CSV Data:
                </label>
                <textarea
                  rows={6}
                  placeholder={`ItemCode, ItemName, Category, Unit, CurrentStock, MinBuffer, Location, VoucherNo, FromParty, Purpose\n49, Crockery Items, T&P, Nos, 6, 2, Central Store, Glass/771 Dated 10.09.2024, CIODW Ami Bartan Bhandar, IMSD/USED\nPWAY-ERC-MK3, Elastic Rail Clip, P.way material, Nos, 12500, 2000, Bay A1, SAIL/2024/09, SAIL Plant, Track Maintenance`}
                  value={csvRawText}
                  onChange={e => setCsvRawText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {csvUploadSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold animate-fadeIn">
                  {csvUploadSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCsvUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvImport}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse &amp; Save to Firebase</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 5. ADD MATERIAL MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Add Material Item to Store</span>
              </h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <SapMaterialLookup
                initialQuery={String(newItemData.itemCode || newItemData.name || '')}
                onSelect={material => {
                  setNewItemData({
                    ...newItemData,
                    itemCode: material.code,
                    priceListCode: material.code,
                    name: material.description,
                    unit: material.uom || newItemData.unit || 'Nos',
                    specification: `SAP ${material.code} • ${material.mainGroup}/${material.subGroup} • ${material.plantDescription || material.plant}`
                  });
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Code / Price List *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 49 or PWAY-ERC-MK3"
                    value={newItemData.itemCode || ''}
                    onChange={e => setNewItemData({ ...newItemData, itemCode: e.target.value, priceListCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                      className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                    >
                      {isCustomCategoryMode ? 'Choose Existing' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomCategoryMode ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Electrical / Signalling"
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
                          setNewItemData({ ...newItemData, category: e.target.value });
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Material Name (वस्तु का विवरण) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crockery Items / Elastic Rail Clip"
                  value={newItemData.name || ''}
                  onChange={e => setNewItemData({ ...newItemData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tally Code No. (मिलान पत्र)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={newItemData.tallyCodeNo || '1'}
                    onChange={e => setNewItemData({ ...newItemData, tallyCodeNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Accounts File No. (लेखा फाइल)</label>
                  <input
                    type="text"
                    placeholder="e.g. 3195"
                    value={newItemData.accountsFileNo || '3195'}
                    onChange={e => setNewItemData({ ...newItemData, accountsFileNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Specification</label>
                <input
                  type="text"
                  placeholder="e.g. IMSD Office / RDSO Spec 60kg Rail"
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
                    <option value="Tonnes">Tonnes</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Meters">Meters</option>
                    <option value="Packs">Packs</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Min Buffer</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemData.minBufferThreshold || 10}
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

      {/* ------------------------------------------------------------------------- */}
      {/* 6. INWARD / OUTWARD TRANSACTION MODAL (WITH STAFF DIRECTORY DROPDOWN) */}
      {/* ------------------------------------------------------------------------- */}
      {isTxnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {txnType === 'INWARD' ? <ArrowDownLeft className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-amber-600" />}
                <span>{txnType === 'INWARD' ? 'Receive Inward Material (प्राप्ति)' : 'Issue Material to Staff / Gang (निर्गम)'}</span>
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
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Item Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Crockery Items / Liners"
                          value={onTheFlyMaterial.name}
                          onChange={e => setOnTheFlyMaterial({ ...onTheFlyMaterial, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Code / Price List *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 49"
                          value={onTheFlyMaterial.itemCode}
                          onChange={e => setOnTheFlyMaterial({ ...onTheFlyMaterial, itemCode: e.target.value, priceListCode: e.target.value })}
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
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
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Sets">Sets</option>
                          <option value="Pairs">Pairs</option>
                          <option value="Tonnes">Tonnes</option>
                          <option value="Kgs">Kgs</option>
                          <option value="Meters">Meters</option>
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
                        {i.priceListCode || i.itemCode} • {i.name} — Available: {i.currentStock} {i.unit}
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
                    Voucher Date (तारीख) *
                  </label>
                  <input
                    type="date"
                    required
                    value={txnFormData.voucherDate}
                    onChange={e => setTxnFormData({ ...txnFormData, voucherDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher No. &amp; Date (वाउचर संख्या और तारीख) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glass/771 Dated 10.09.2024 or ISSUE-GANG1-030"
                  value={txnFormData.referenceNo}
                  onChange={e => setTxnFormData({ ...txnFormData, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Recipient / Issuer - Populated directly from Staff Directory for Outward */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {txnType === 'INWARD' ? 'Received From (Vendor / Plant) *' : 'Issued To (Staff / Gang Directory) *'}
                </label>
                {txnType === 'OUTWARD' ? (
                  <div className="space-y-1.5">
                    <select
                      value={txnFormData.issuedToOrReceivedFrom}
                      onChange={e => setTxnFormData({ ...txnFormData, issuedToOrReceivedFrom: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="">-- Choose Staff from Directory --</option>
                      <option value="1+15 Gang SMUN (Mate Joginder Singh)">1+15 Gang SMUN (Mate Joginder Singh)</option>
                      {staffList.map(st => (
                        <option key={st.id} value={`${st.name} (${st.designation || st.post || 'Staff'})`}>
                          {st.name} — {st.designation || st.post} {st.awpoId ? `(AWPO: ${st.awpoId})` : ''}
                        </option>
                      ))}
                      <option value="CUSTOM_RECIPIENT">+ Custom Receiver Name...</option>
                    </select>

                    {(txnFormData.issuedToOrReceivedFrom === 'CUSTOM_RECIPIENT' || (txnFormData.issuedToOrReceivedFrom && !staffList.some(s => `${s.name} (${s.designation || s.post || 'Staff'})` === txnFormData.issuedToOrReceivedFrom) && txnFormData.issuedToOrReceivedFrom !== '1+15 Gang SMUN (Mate Joginder Singh)')) && (
                      <input
                        type="text"
                        placeholder="Type Custom Receiver / Contractor Name"
                        value={txnFormData.issuedToOrReceivedFrom === 'CUSTOM_RECIPIENT' ? '' : txnFormData.issuedToOrReceivedFrom}
                        onChange={e => setTxnFormData({ ...txnFormData, issuedToOrReceivedFrom: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/40 text-slate-900 dark:text-white font-bold"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. CIODW Ami Bartan Bhandar/ or SAIL Bhilai Steel Plant"
                    value={txnFormData.issuedToOrReceivedFrom}
                    onChange={e => setTxnFormData({ ...txnFormData, issuedToOrReceivedFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purpose for which received or issue (उद्देश्य) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IMSD/USED or Through Packing Km 1175.000"
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
                  Confirm {txnType === 'INWARD' ? 'Receipt Voucher' : 'Issue Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 4. DYNAMIC PRINTABLE QR MODAL & MOBILE SCAN PREVIEW */}
      {/* ------------------------------------------------------------------------- */}
      {selectedItemForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          {/* Isolation Print Style */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-store-qr-tag, #printable-store-qr-tag * {
                visibility: visible !important;
              }
              #printable-store-qr-tag {
                position: fixed !important;
                left: 50% !important;
                top: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 90mm !important;
                max-width: 90mm !important;
                padding: 12px !important;
                margin: 0 !important;
                border: 2px solid #0f2b5c !important;
                border-radius: 12px !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                z-index: 999999 !important;
              }
            }
          `}</style>

          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-scaleUp">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#0f2b5c] text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-300" />
                <span className="text-sm sm:text-base font-bold tracking-tight text-white">
                  DFCCIL Store Dynamic QR Code
                </span>
              </div>
              <button
                onClick={() => setSelectedItemForQR(null)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {isPreviewingLiveScan ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[65vh] overflow-y-auto">
                  <StoreItemPublicQRView
                    itemId={selectedItemForQR.id}
                    onBackToApp={() => setIsPreviewingLiveScan(false)}
                  />
                </div>
              ) : (
                <>
                  {/* Printable Shelf / Bin Tag */}
                  <div
                    id="printable-store-qr-tag"
                    className="p-4 bg-white border-2 border-[#0f2b5c] rounded-2xl shadow-md text-slate-900 space-y-3"
                  >
                    {/* Tag Header */}
                    <div className="flex items-center justify-between border-b-2 border-[#0f2b5c] pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs">
                          dfc
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-[#0f2b5c] leading-tight uppercase">
                            DFCCIL P-WAY DEPOT • IMSD SMUN
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold">
                            Central Store Inventory Bin Tag
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded">
                        {selectedItemForQR.category}
                      </span>
                    </div>

                    {/* Tag Content: Details + QR */}
                    <div className="flex items-center gap-4">
                      {/* Left QR */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="p-1 bg-white border-2 border-slate-300 rounded-xl shadow-inner">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt={selectedItemForQR.name}
                              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                            />
                          ) : (
                            <div className="w-24 h-24 flex items-center justify-center text-[10px] text-slate-400">
                              Loading QR...
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] font-mono font-bold text-[#0f2b5c] mt-1 uppercase">
                          SCAN FOR LIVE STOCK
                        </span>
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">ITEM NAME</span>
                          <span className="font-black text-slate-900 text-sm leading-tight block truncate">
                            {selectedItemForQR.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block">PL / CODE</span>
                            <span className="font-bold font-mono text-[#0f2b5c]">
                              {selectedItemForQR.priceListCode || selectedItemForQR.itemCode}
                            </span>
                          </div>

                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block">TALLY NO.</span>
                            <span className="font-bold font-mono text-purple-800">
                              {selectedItemForQR.tallyCodeNo || '1'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block">AVAILABLE</span>
                            <span className="font-black font-mono text-emerald-700">
                              {selectedItemForQR.currentStock} {selectedItemForQR.unit}
                            </span>
                          </div>

                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase block">BIN LOCATION</span>
                            <span className="font-semibold text-slate-700 truncate block">
                              {selectedItemForQR.location || 'Depot'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[8px] text-slate-400 border-t border-slate-200 pt-1.5 text-center font-mono">
                      Real-time Stock &amp; Movement Ledger System • Scan with any Camera
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsPreviewingLiveScan(true)}
                      className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-purple-200 dark:border-purple-800"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Preview Live Scan Page</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Sticker</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedItemForQR(null)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
