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
  QrCode,
  Sliders,
  FileText,
  Paperclip,
  Eye
} from 'lucide-react';
import QRCode from 'qrcode';
import { StoreItemPublicQRView } from './StoreItemPublicQRView.tsx';
import { SAP_MATERIALS, type SapMaterial } from '../data/sapMaterialMaster.ts';
import { SapMaterialLookup } from './SapMaterialLookup.tsx';
import { ImsdSourceTallyBook } from './ImsdSourceTallyBook.tsx';
import { IMSD_TALLY_GZIP_BASE64 } from '../data/imsdTallyLedgerCompressed.ts';
import type { StoreItemRecord, StoreTransactionRecord, OfficerStaffRecord } from '../types/index.ts';

const decodeTallyData = async (): Promise<{ items: any[]; transactions: any[] }> => {
  const compressed = Uint8Array.from(atob(IMSD_TALLY_GZIP_BASE64), char => char.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
};

const DEFAULT_STORE_CATEGORIES = [
  { id: 'T&P', label: 'T&P (Tools & Plant)' },
  { id: 'C&P', label: 'C&P (Consumables & Petroleum)' },
  { id: 'P.way material', label: 'P.way material (Fittings, Rails, Turnouts)' },
  { id: 'Cash Imprest', label: 'Cash Imprest Material' },
  { id: 'Uniform', label: 'Uniform & Safety Gear' },
  { id: 'Furniture', label: 'Furniture & Office Equipment' },
  { id: 'P.way machines', label: 'P.way machines & Heavy Equipment' }
];

export const StoreInventoryManager: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOfficerOrAdmin = role === 'SUPER_ADMIN' || role === 'OFFICER';
  const isStoreKeeper = role === 'STORE_KEEPER' || role === 'SUPER_ADMIN' || role === 'OFFICER';

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'tally_book' | 'source_tally' | 'inward' | 'outward' | 'low_stock' | 'negative_stock'>('inventory');
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
  const [isSapLookupModalOpen, setIsSapLookupModalOpen] = useState(false);
  const [sapSuggestions, setSapSuggestions] = useState<SapMaterial[]>([]);
  const [isSapSuggestionOpen, setIsSapSuggestionOpen] = useState(false);
  const [txnSapSuggestions, setTxnSapSuggestions] = useState<SapMaterial[]>([]);
  const [isTxnSapSuggestionOpen, setIsTxnSapSuggestionOpen] = useState(false);

  // SAP Code Edit Modal (Requirement 5)
  const [isEditSapModalOpen, setIsEditSapModalOpen] = useState(false);
  const [selectedItemForSapEdit, setSelectedItemForSapEdit] = useState<StoreItemRecord | null>(null);
  const [sapEditCode, setSapEditCode] = useState('');
  const [sapEditSpec, setSapEditSpec] = useState('');
  const [sapModalSearch, setSapModalSearch] = useState('');

  const filteredSapModalMaterials = useMemo(() => {
    if (!sapModalSearch.trim()) return SAP_MATERIALS;
    const clean = sapModalSearch.toLowerCase().trim();
    const tokens = clean.split(' ').filter(Boolean);
    return SAP_MATERIALS.filter(m => {
      const hay = `${m.code} ${m.description} ${m.uom} ${m.plantDescription || ''}`.toLowerCase();
      return tokens.every(t => hay.includes(t)) || m.code.includes(clean);
    });
  }, [sapModalSearch]);

  // Min Buffer Edit Modal (Requirement 5)
  const [isEditBufferModalOpen, setIsEditBufferModalOpen] = useState(false);
  const [selectedItemForBufferEdit, setSelectedItemForBufferEdit] = useState<StoreItemRecord | null>(null);
  const [bufferEditValue, setBufferEditValue] = useState<number>(10);

  // Voucher Document Viewer Modal (Requirement 2)
  const [selectedVoucherDoc, setSelectedVoucherDoc] = useState<{
    url: string;
    isPdf: boolean;
    title: string;
    refNo: string;
  } | null>(null);
  const [isCompressingVoucher, setIsCompressingVoucher] = useState(false);

  // Client-Side WhatsApp Level Image Compression (< 300 KB)
  const compressImageWhatsAppLevel = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200; // Standard WhatsApp image width
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(e.target?.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72); // Produces ~100-250 KB
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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
  const [newItemData, setNewItemData] = useState<Partial<StoreItemRecord> & {
    voucherDocUrl?: string;
    voucherDocType?: 'IMAGE' | 'PDF';
    voucherDocName?: string;
  }>({
    category: 'T&P',
    unit: 'Nos',
    currentStock: 0,
    minBufferThreshold: 10,
    location: 'IMSD SMUN Central Store',
    priceListCode: '49',
    tallyCodeNo: '1',
    accountsFileNo: '3195'
  });

  const [txnFormData, setTxnFormData] = useState<{
    itemId: string;
    quantity: number;
    referenceNo: string;
    voucherDate: string;
    issuedToOrReceivedFrom: string;
    purposeOrSection: string;
    remarks?: string;
    voucherDocUrl?: string;
    voucherDocType?: 'IMAGE' | 'PDF';
    voucherDocName?: string;
  }>({
    itemId: '',
    quantity: 1,
    referenceNo: '',
    voucherDate: new Date().toISOString().split('T')[0],
    issuedToOrReceivedFrom: '',
    purposeOrSection: 'IMSD/USED',
    remarks: ''
  });

  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');
  const [isLedgerSearchOpen, setIsLedgerSearchOpen] = useState<boolean>(false);
  const [editingTxn, setEditingTxn] = useState<StoreTransactionRecord | null>(null);
  const [isEditTxnModalOpen, setIsEditTxnModalOpen] = useState<boolean>(false);
  const [editTxnFormData, setEditTxnFormData] = useState<{
    date: string;
    referenceNo: string;
    issuedToOrReceivedFrom: string;
    purposeOrSection: string;
    quantity: number;
    type: 'INWARD' | 'OUTWARD' | 'TRANSFER';
    remarks?: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    referenceNo: '',
    issuedToOrReceivedFrom: '',
    purposeOrSection: 'IMSD/USED',
    quantity: 1,
    type: 'INWARD',
    remarks: ''
  });

  // Calculate live available stock from transactions
  // Formula: Balance = Opening Stock + Receipts - Transfers - Issues
  const getItemLiveStock = (item: StoreItemRecord | null | undefined, txnsList?: StoreTransactionRecord[]): number => {
    if (!item) return 0;
    const itemCodeClean = String(item.itemCode || '').toLowerCase().trim();
    const priceListClean = String(item.priceListCode || '').toLowerCase().trim();
    const activeTxns = txnsList || transactions;

    const relatedTxns = activeTxns.filter(t => {
      if (t.itemId && t.itemId === item.id) return true;
      if (itemCodeClean && t.itemCode && String(t.itemCode).toLowerCase().trim() === itemCodeClean) return true;
      if (priceListClean && t.priceListCode && String(t.priceListCode).toLowerCase().trim() === priceListClean) return true;
      return false;
    });

    if (relatedTxns.length === 0) return Number(item.currentStock || item.openingStock || 0);

    let inward = 0;
    let outward = 0;
    let transfer = 0;
    relatedTxns.forEach(t => {
      const qty = Number(t.quantity || t.receiptQty || t.issueQty || t.transferQty || 0);
      if (t.type === 'INWARD' || (t.receiptQty != null && Number(t.receiptQty) > 0)) {
        inward += Number(t.receiptQty || qty);
      } else if (t.type === 'OUTWARD' || (t.issueQty != null && Number(t.issueQty) > 0)) {
        outward += Number(t.issueQty || qty);
      } else if (t.type === 'TRANSFER' || (t.transferQty != null && Number(t.transferQty) > 0)) {
        transfer += Number(t.transferQty || qty);
      }
    });

    const opening = item.openingStock != null ? Number(item.openingStock) : 0;
    const computed = opening + inward - outward - transfer;
    return computed;
  };

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      const [itemsList, txnList, catList, staff] = await Promise.all([
        db.getCollection<StoreItemRecord>('store_items'),
        db.getCollection<StoreTransactionRecord>('store_transactions'),
        db.getCollection<{ id: string; name: string; label: string }>('store_categories' as any),
        db.getCollection<OfficerStaffRecord>('officers_staff')
      ]);

      // Load custom locally saved items so newly added items are never lost
      let customSavedItems: StoreItemRecord[] = [];
      try {
        const savedRaw = localStorage.getItem('dfccil_custom_store_items');
        if (savedRaw) customSavedItems = JSON.parse(savedRaw);
      } catch {}

      // Decode baseline Tally items
      let tallyItems: StoreItemRecord[] = [];
      let tallyTxns: StoreTransactionRecord[] = [];
      try {
        const tallyData = await decodeTallyData();
        tallyItems = tallyData.items.map((tItem: any, idx: number) => {
          const code = tItem.sapMaterial || `IMSD-${tItem.ledgerPage}`;
          const cat = tItem.source === 'C&P Material' ? 'C&P'
            : tItem.source === 'T&P Material' ? 'T&P'
            : tItem.source === 'P.Way Material' ? 'P.way material'
            : tItem.source;

          return {
            id: `STR-IMSD-${idx + 1}`,
            itemCode: code,
            priceListCode: code,
            tallyCodeNo: tItem.ledgerPage,
            accountsFileNo: tItem.ledgerPage,
            name: tItem.itemName,
            category: cat,
            categoryLabel: tItem.source,
            specification: tItem.sapDescription ? `${tItem.sapDescription} (Page: ${tItem.ledgerPage})` : `Ledger Page: ${tItem.ledgerPage} • ${tItem.source}`,
            unit: tItem.sapUom || 'Nos',
            currentStock: tItem.closingBalance ?? 0,
            minBufferThreshold: 5,
            location: 'IMSD SMUN Central Store',
            inwardTotal: tItem.totalReceipt || 0,
            outwardTotal: tItem.totalIssue || 0,
            unitRate: 100,
            lastReceivedDate: '2024-09-18',
            lastIssuedDate: '2024-09-20',
            supplier: 'DFCCIL IMSD Depot',
            remarks: `${tItem.source} (Page ${tItem.ledgerPage}) • SAP: ${tItem.sapMaterial || 'Pending'}`
          };
        });

        tallyTxns = tallyData.transactions.map((tTxn: any, idx: number): StoreTransactionRecord => {
          const code = tTxn.sapMaterial || `IMSD-${tTxn.ledgerPage}`;
          const isOutward = (tTxn.issue || 0) > 0 || (tTxn.transfer || 0) > 0;
          const qty = (tTxn.receipt || 0) > 0 ? tTxn.receipt! : ((tTxn.issue || 0) > 0 ? tTxn.issue! : (tTxn.transfer || 0));

          return {
            id: `STXN-${idx + 1}`,
            date: tTxn.date || '2024-01-01',
            type: isOutward ? 'OUTWARD' : 'INWARD',
            itemId: `STR-IMSD-${idx + 1}`,
            itemCode: code,
            itemName: tTxn.itemName,
            quantity: qty,
            unit: tTxn.sapUom || 'Nos',
            referenceNo: tTxn.voucher || `VCH-${idx + 1}`,
            issuedToOrReceivedFrom: tTxn.party || 'IMSD SMUN Section',
            purposeOrSection: tTxn.purpose || 'Official Railway Maintenance',
            authorizedBy: 'Store Keeper / APM',
            receiptQty: tTxn.receipt || undefined,
            transferQty: tTxn.transfer || undefined,
            issueQty: tTxn.issue || undefined,
            balanceQty: tTxn.balance ?? 0,
            tallyPageNo: tTxn.ledgerPage,
            createdAt: tTxn.date ? `${tTxn.date}T10:00:00Z` : new Date().toISOString()
          };
        });
      } catch (e) {
        console.error('Error decoding tally data in loadStoreData:', e);
      }

      // Merge items: Tally Master + DB Items + Custom Saved Items (custom items take precedence)
      const itemMap = new Map<string, StoreItemRecord>();
      tallyItems.forEach(i => itemMap.set(i.id, i));
      (itemsList || []).forEach(i => itemMap.set(i.id, i));
      customSavedItems.forEach(i => itemMap.set(i.id, i));
      let finalItems = Array.from(itemMap.values());

      // Merge transactions: Tally Txns + DB Txns
      const txnMap = new Map<string, StoreTransactionRecord>();
      tallyTxns.forEach(t => txnMap.set(t.id, t));
      (txnList || []).forEach(t => txnMap.set(t.id, t));
      let finalTxns = Array.from(txnMap.values());

      // Reconcile live stock for all items dynamically from transactions
      finalItems = finalItems.map(item => {
        const itemCodeClean = String(item.itemCode || '').toLowerCase().trim();
        const priceListClean = String(item.priceListCode || '').toLowerCase().trim();

        const relatedTxns = finalTxns.filter(t => {
          if (t.itemId && t.itemId === item.id) return true;
          if (itemCodeClean && t.itemCode && String(t.itemCode).toLowerCase().trim() === itemCodeClean) return true;
          if (priceListClean && t.priceListCode && String(t.priceListCode).toLowerCase().trim() === priceListClean) return true;
          return false;
        });

        if (relatedTxns.length > 0) {
          let totalInward = 0;
          let totalOutward = 0;
          let totalTransfer = 0;
          relatedTxns.forEach(t => {
            const qty = Number(t.quantity || t.receiptQty || t.issueQty || t.transferQty || 0);
            if (t.type === 'INWARD' || (t.receiptQty != null && Number(t.receiptQty) > 0)) {
              totalInward += Number(t.receiptQty || qty);
            } else if (t.type === 'OUTWARD' || (t.issueQty != null && Number(t.issueQty) > 0)) {
              totalOutward += Number(t.issueQty || qty);
            } else if (t.type === 'TRANSFER' || (t.transferQty != null && Number(t.transferQty) > 0)) {
              totalTransfer += Number(t.transferQty || qty);
            }
          });

          const opening = item.openingStock != null ? Number(item.openingStock) : 0;
          const computed = opening + totalInward - totalOutward - totalTransfer;
          return {
            ...item,
            inwardTotal: totalInward,
            outwardTotal: totalOutward,
            currentStock: computed
          };
        }
        return item;
      });

      setItems(finalItems);
      setTransactions(finalTxns);
      setCustomCategories(catList || []);
      setStaffList(staff || []);

      if (finalItems.length > 0) {
        if (!selectedItemForTally || !finalItems.some(i => i.id === selectedItemForTally.id)) {
          setSelectedItemForTally(finalItems[0]);
        }
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

    const newItem: StoreItemRecord & {
      voucherDocUrl?: string;
      voucherDocType?: 'IMAGE' | 'PDF';
      voucherDocName?: string;
    } = {
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
      remarks: newItemData.remarks || '',
      voucherDocUrl: newItemData.voucherDocUrl,
      voucherDocType: newItemData.voucherDocType,
      voucherDocName: newItemData.voucherDocName
    };

    await db.addDocument('store_items', newItem);

    // If initial stock > 0 and attached voucher exists, log initial receipt transaction
    if (newItem.currentStock > 0) {
      const initialTxn: StoreTransactionRecord = {
        id: `TXN-${Date.now().toString().slice(-6)}-INIT`,
        date: new Date().toISOString().split('T')[0],
        type: 'INWARD',
        itemId: newItem.id,
        itemCode: newItem.itemCode,
        priceListCode: newItem.priceListCode,
        itemName: newItem.name,
        quantity: newItem.currentStock,
        unit: newItem.unit,
        referenceNo: `INIT-STOCK-${newItem.itemCode}`,
        issuedToOrReceivedFrom: newItem.supplier || 'Vendor Receipt',
        purposeOrSection: 'Initial Depot Stocking',
        authorizedBy: currentUser?.name || 'Store Incharge',
        receiptQty: newItem.currentStock,
        transferQty: 0,
        issueQty: 0,
        balanceQty: newItem.currentStock,
        voucherDocUrl: newItem.voucherDocUrl,
        voucherDocType: newItem.voucherDocType,
        voucherDocName: newItem.voucherDocName,
        createdAt: new Date().toISOString()
      };
      await db.addDocument('store_transactions', initialTxn);
    }

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

    // Reconcile live available stock from transactions to ensure 100% ledger accuracy
    const liveAvailable = getItemLiveStock(targetItem);
    const qty = Number(txnFormData.quantity);

    if (txnType === 'OUTWARD' && liveAvailable < qty) {
      alert(`⚠️ Insufficient Stock! Current Available in Ledger: ${liveAvailable} ${targetItem.unit}`);
      return;
    }

    const newStock = txnType === 'INWARD'
      ? liveAvailable + qty
      : (txnType === 'OUTWARD' ? liveAvailable - qty : liveAvailable);

    const newTxn: StoreTransactionRecord & {
      voucherDocUrl?: string;
      voucherDocType?: 'IMAGE' | 'PDF';
      voucherDocName?: string;
    } = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date: txnFormData.voucherDate || new Date().toISOString().split('T')[0],
      type: txnType,
      itemId: targetItem.id,
      itemCode: targetItem.itemCode,
      priceListCode: targetItem.priceListCode,
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
      voucherDocUrl: txnFormData.voucherDocUrl,
      voucherDocType: txnFormData.voucherDocType,
      voucherDocName: txnFormData.voucherDocName,
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
    setTxnFormData({
      itemId: '',
      quantity: 1,
      referenceNo: '',
      voucherDate: new Date().toISOString().split('T')[0],
      issuedToOrReceivedFrom: '',
      purposeOrSection: 'IMSD/USED',
      remarks: '',
      voucherDocUrl: undefined,
      voucherDocType: undefined,
      voucherDocName: undefined
    });
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

  const negativeStockItems = useMemo(() => {
    return items.filter(item => {
      if (item.currentStock >= 0) return false;
      if (selectedCategoryFilter !== 'ALL' && item.category !== selectedCategoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          (item.priceListCode && String(item.priceListCode).toLowerCase().includes(q)) ||
          item.specification?.toLowerCase().includes(q)
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

  // Helper to parse any date string to timestamp for ascending sort (oldest to newest)
  const parseDateToTimestamp = (dStr: string): number => {
    if (!dStr) return 0;
    const clean = dStr.trim();
    if (/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split(/[-/.]/).map(Number);
      return new Date(y, m - 1, d).getTime();
    }
    const t = new Date(clean).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Helper to format any date to DD-MM-YYYY strictly
  const formatDateDDMMYYYY = (dStr: string): string => {
    if (!dStr) return '-';
    const clean = dStr.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) return clean;
    if (/^\d{2}[/.]\d{2}[/.]\d{4}$/.test(clean)) {
      return clean.replace(/[/.]/g, '-');
    }
    const dt = new Date(clean);
    if (isNaN(dt.getTime())) return clean;
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Selected item transactions for Departmental Ledger & Tally Book (Sorted Oldest to Newest with Running Balance)
  // Filter items for Departmental Ledger Autocomplete Search
  const filteredLedgerItems = useMemo(() => {
    if (!ledgerSearchQuery.trim()) return items;
    const q = ledgerSearchQuery.toLowerCase().trim();
    return items.filter(i =>
      String(i.name || '').toLowerCase().includes(q) ||
      String(i.itemCode || '').toLowerCase().includes(q) ||
      String(i.priceListCode || '').toLowerCase().includes(q) ||
      String(i.specification || '').toLowerCase().includes(q)
    );
  }, [items, ledgerSearchQuery]);

  // Selected item transactions for Departmental Ledger & Tally Book (Sorted Oldest to Newest with Running Balance)
  const tallyTransactionsData = useMemo(() => {
    if (!selectedItemForTally) {
      return { rows: [], totalReceipts: 0, totalTransfers: 0, totalIssues: 0, closingBalance: 0 };
    }

    const itemCodeClean = String(selectedItemForTally.itemCode || '').toLowerCase().trim();
    const priceListClean = String(selectedItemForTally.priceListCode || '').toLowerCase().trim();

    const rawTxns = transactions.filter(t => {
      if (t.itemId && t.itemId === selectedItemForTally.id) return true;
      if (itemCodeClean && t.itemCode && String(t.itemCode).toLowerCase().trim() === itemCodeClean) return true;
      if (priceListClean && t.priceListCode && String(t.priceListCode).toLowerCase().trim() === priceListClean) return true;
      return false;
    });

    // Sort by date ascending (oldest to newest)
    const sorted = [...rawTxns].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.date || a.createdAt);
      const timeB = parseDateToTimestamp(b.date || b.createdAt);
      return timeA - timeB;
    });

    const opening = selectedItemForTally.openingStock != null ? Number(selectedItemForTally.openingStock) : 0;
    let runningBal = opening;
    let totalReceipts = 0;
    let totalTransfers = 0;
    let totalIssues = 0;

    const rows = sorted.map(tx => {
      const qty = Number(tx.quantity) || 0;
      if (tx.type === 'INWARD' || (tx.receiptQty != null && Number(tx.receiptQty) > 0)) {
        const rQty = Number(tx.receiptQty || qty);
        runningBal += rQty;
        totalReceipts += rQty;
      } else if (tx.type === 'OUTWARD' || (tx.issueQty != null && Number(tx.issueQty) > 0)) {
        const iQty = Number(tx.issueQty || qty);
        runningBal -= iQty;
        totalIssues += iQty;
      } else if (tx.type === 'TRANSFER' || (tx.transferQty != null && Number(tx.transferQty) > 0)) {
        const tQty = Number(tx.transferQty || qty);
        runningBal -= tQty;
        totalTransfers += tQty;
      }

      return {
        ...tx,
        formattedDate: formatDateDDMMYYYY(tx.date || tx.createdAt),
        calculatedBalance: runningBal
      };
    });

    return {
      rows,
      totalReceipts,
      totalTransfers,
      totalIssues,
      closingBalance: runningBal
    };
  }, [transactions, selectedItemForTally]);

  const handleDeleteTransaction = async (txn: StoreTransactionRecord) => {
    if (!window.confirm(`Are you sure you want to delete transaction "${txn.referenceNo || txn.id}" (${txn.quantity} ${txn.unit || 'Nos'})? This will update running ledger balances.`)) {
      return;
    }
    try {
      await db.deleteDocument('store_transactions', txn.id);
      setTransactions(prev => prev.filter(t => t.id !== txn.id));
      alert('✅ Transaction deleted successfully.');
      loadStoreData();
    } catch (err: any) {
      alert(`Failed to delete transaction: ${err.message}`);
    }
  };

  const handleOpenEditTransaction = (txn: StoreTransactionRecord) => {
    setEditingTxn(txn);
    setEditTxnFormData({
      date: txn.date || new Date().toISOString().split('T')[0],
      referenceNo: txn.referenceNo || '',
      issuedToOrReceivedFrom: txn.issuedToOrReceivedFrom || '',
      purposeOrSection: txn.purposeOrSection || 'IMSD/USED',
      quantity: Number(txn.quantity || txn.receiptQty || txn.issueQty || txn.transferQty || 1),
      type: txn.type || (txn.issueQty ? 'OUTWARD' : txn.transferQty ? 'TRANSFER' : 'INWARD'),
      remarks: txn.remarks || ''
    });
    setIsEditTxnModalOpen(true);
  };

  const handleSaveEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;
    try {
      const qty = Number(editTxnFormData.quantity);
      const updatedTxn: Partial<StoreTransactionRecord> = {
        date: editTxnFormData.date,
        referenceNo: editTxnFormData.referenceNo,
        issuedToOrReceivedFrom: editTxnFormData.issuedToOrReceivedFrom,
        purposeOrSection: editTxnFormData.purposeOrSection,
        quantity: qty,
        type: editTxnFormData.type,
        receiptQty: editTxnFormData.type === 'INWARD' ? qty : undefined,
        issueQty: editTxnFormData.type === 'OUTWARD' ? qty : undefined,
        transferQty: editTxnFormData.type === 'TRANSFER' ? qty : undefined,
        remarks: editTxnFormData.remarks
      };

      await db.updateDocument('store_transactions', editingTxn.id, updatedTxn);
      setTransactions(prev => prev.map(t => t.id === editingTxn.id ? { ...t, ...updatedTxn } : t));
      setIsEditTxnModalOpen(false);
      setEditingTxn(null);
      alert('✅ Transaction updated successfully in ledger.');
      loadStoreData();
    } catch (err: any) {
      alert(`Failed to update transaction: ${err.message}`);
    }
  };

  const tallyTransactions = useMemo(() => tallyTransactionsData.rows, [tallyTransactionsData]);

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
              onClick={() => setIsSapLookupModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md border border-cyan-400/40"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SAP Master (4,827 Items)</span>
            </button>

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
          onClick={() => setActiveSubTab('low_stock')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeSubTab === 'low_stock'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-700 shadow-md ring-2 ring-red-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-red-600/90 mt-0.5">
            Items below minimum stock threshold
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
      <div className="space-y-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2 w-full">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Master Inventory ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('source_tally')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'source_tally'
                ? 'bg-indigo-700 text-white shadow-md ring-2 ring-indigo-400'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>IMSD Source Tally Master (196)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tally_book')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'tally_book'
                ? 'bg-purple-700 text-white shadow-md ring-2 ring-purple-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>विभागीय खाता पुस्तक (Tally Book)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('low_stock')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'low_stock'
                ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400'
                : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>Low Stock Alert ({lowStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('negative_stock')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'negative_stock'
                ? 'bg-rose-700 text-white shadow-md ring-2 ring-rose-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900/50 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>⚠️ Negative Stock / Data Error ({negativeStockItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('inward')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'inward'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span>Inward Register</span>
          </button>

          <button
            onClick={() => setActiveSubTab('outward')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
              activeSubTab === 'outward'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
            <span>Outward Issue Register</span>
          </button>
        </div>

        {/* Search & Category Filter (Row 2) */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Code (e.g. 49), Name, Spec..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills Bar (Clean buttons matching exact screenshot, no delete buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">Categories:</span>
        <button
          onClick={() => setSelectedCategoryFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
            selectedCategoryFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {allCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryFilter(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
              selectedCategoryFilter === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 1. MASTER INVENTORY, LOW STOCK & NEGATIVE STOCK TABLE */}
      {/* ------------------------------------------------------------------------- */}
      {(activeSubTab === 'inventory' || activeSubTab === 'low_stock' || activeSubTab === 'negative_stock') && (
        <div className="space-y-3">
          {activeSubTab === 'low_stock' && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-red-900 dark:text-red-200 uppercase tracking-wide">
                    Critical Buffer &amp; Low Stock Warning ({lowStockItems.length} Items)
                  </h4>
                  <p className="text-[11px] text-red-700 dark:text-red-300">
                    The following items have available stock at or below their mandatory safety buffer threshold. Immediate inward requisition required.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('inventory')}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 text-red-800 dark:text-red-300 border border-red-300 rounded-xl text-xs font-bold shrink-0 hover:bg-red-100 transition"
              >
                View All Items ({items.length})
              </button>
            </div>
          )}

          {activeSubTab === 'negative_stock' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide flex items-center gap-2">
                    <span>⚠️ Data Input Discrepancy &amp; Negative Stock Items ({negativeStockItems.length} Items)</span>
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    नीचे दिए गए आइटम्स का बैलेंस ऋणात्मक (Negative) है। ऐसा गलत डेटा इनपुट, अधिक निर्गम (Excess Issues), या प्राप्ति (Receipt Voucher) छूट जाने के कारण हुआ है। संबंधित आइटम की Tally Book खोलकर ✏️ Edit से वाउचर सुधारें।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('inventory')}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 border border-rose-300 rounded-xl text-xs font-bold shrink-0 hover:bg-rose-100 transition"
              >
                View All Items ({items.length})
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#e8f1fb] dark:bg-slate-800 text-[#0f2b5c] dark:text-slate-200 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5">Code / Price List</th>
                    <th className="p-3.5">Item Description (वस्तु का विवरण)</th>
                    <th className="p-3.5">Category (श्रेणी)</th>
                    <th className="p-3.5">SAP Code / Catalog</th>
                    <th className="p-3.5">Available Stock</th>
                    <th className="p-3.5">Min Buffer (✏️ Edit)</th>
                    <th className="p-3.5 text-right">Tally Book Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {(activeSubTab === 'low_stock' ? lowStockItems : (activeSubTab === 'negative_stock' ? negativeStockItems : filteredItems)).map(item => {
                    const isNegative = item.currentStock < 0;
                    const isLow = !isNegative && item.currentStock <= item.minBufferThreshold;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                          isNegative
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-l-4 border-rose-600'
                            : (isLow ? 'bg-red-50/40 dark:bg-red-950/30' : '')
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
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.specification}</div>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryFilter(item.category || 'ALL')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 transition"
                          title="Filter by this Category"
                        >
                          {item.categoryLabel || item.category}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForSapEdit(item);
                            setSapEditCode(item.sapMaterialCode || '');
                            setSapEditSpec(item.specification || '');
                            setIsEditSapModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 transition inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Change / Edit SAP Material Code (Auto-Fetch from Catalog)"
                        >
                          <Edit className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          <span>{item.sapMaterialCode ? `${item.sapMaterialCode} (Edit)` : '✏️ Change SAP Code'}</span>
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-black font-mono ${
                            isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : (isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')
                          }`}>
                            {item.currentStock.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">{item.unit}</span>
                          {isNegative && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white animate-pulse">
                              ⚠️ NEGATIVE STOCK
                            </span>
                          )}
                          {isLow && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">
                              LOW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItemForBufferEdit(item);
                            setBufferEditValue(item.minBufferThreshold);
                            setIsEditBufferModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Click to update Minimum Buffer Stock Threshold"
                        >
                          <span>{item.minBufferThreshold.toLocaleString()} {item.unit}</span>
                          <Edit className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                        </button>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedItemForTally(item);
                            setActiveSubTab('tally_book');
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                          title="Open Departmental Tally Ledger for this item"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>📋 Open Tally Book</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 2. IMSD SOURCE TALLY MASTER (196 ITEMS & 638 TRANSACTIONS) */}
      {/* ------------------------------------------------------------------------- */}
      {activeSubTab === 'source_tally' && <ImsdSourceTallyBook />}

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

            {/* Quick Item Switcher with Live Search & Suggestions */}
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">🔍 Select / Search Item:</span>
                <div className="relative flex-1">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-600 rounded-xl px-3 py-1.5 shadow-sm">
                    <Search className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Type Item Name, SAP Code, or Price List..."
                      value={ledgerSearchQuery}
                      onChange={e => {
                        setLedgerSearchQuery(e.target.value);
                        setIsLedgerSearchOpen(true);
                      }}
                      onFocus={() => setIsLedgerSearchOpen(true)}
                      className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />
                    {ledgerSearchQuery && (
                      <button
                        onClick={() => {
                          setLedgerSearchQuery('');
                          setIsLedgerSearchOpen(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions Popover */}
                  {isLedgerSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLedgerItems.length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 text-center">No matching material items found</div>
                      ) : (
                        filteredLedgerItems.slice(0, 40).map(i => (
                          <button
                            key={i.id}
                            type="button"
                            onClick={() => {
                              setSelectedItemForTally(i);
                              setLedgerSearchQuery(`${i.priceListCode || i.itemCode} • ${i.name}`);
                              setIsLedgerSearchOpen(false);
                            }}
                            className={`w-full text-left p-3 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs transition flex items-center justify-between gap-2 ${
                              selectedItemForTally.id === i.id ? 'bg-purple-100/70 dark:bg-purple-950/70 font-black' : ''
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-red-600 dark:text-red-400">
                                  [{i.priceListCode || i.itemCode}]
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                  {i.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                Page: {i.tallyCodeNo || '1'} • Category: {i.categoryLabel || i.category}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 font-mono font-black text-xs">
                                {getItemLiveStock(i)} {i.unit}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  title="Add New Material Item"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New Item</span>
                </button>
                <button
                  onClick={() => {
                    setNewItemData({
                      ...selectedItemForTally,
                      itemCode: selectedItemForTally.itemCode,
                      priceListCode: selectedItemForTally.priceListCode || '',
                      tallyCodeNo: selectedItemForTally.tallyCodeNo || '',
                      accountsFileNo: selectedItemForTally.accountsFileNo || '',
                      name: selectedItemForTally.name,
                      category: selectedItemForTally.category,
                      categoryLabel: selectedItemForTally.categoryLabel,
                      unit: selectedItemForTally.unit,
                      currentStock: selectedItemForTally.currentStock,
                      minBufferThreshold: selectedItemForTally.minBufferThreshold,
                      unitRate: selectedItemForTally.unitRate,
                      location: selectedItemForTally.location,
                      specification: selectedItemForTally.specification,
                      sourceFile: selectedItemForTally.sourceFile || '',
                      sapMaterialCode: selectedItemForTally.sapMaterialCode || ''
                    });
                    setIsAddItemModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-sm"
                  title="Edit Master Details / Switch Category"
                >
                  <Edit className="w-3 h-3" />
                  <span>✏️ Edit / Switch Category</span>
                </button>
                <button
                  onClick={() => setSelectedItemForQR(selectedItemForTally)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  title="Generate Dynamic QR Code for Bin Label"
                >
                  <QrCode className="w-3 h-3" />
                  <span>QR Label</span>
                </button>
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
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteItem(selectedItemForTally)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition"
                    title="Delete Material Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ⚠️ Modification Required / Negative Stock Discrepancy Banner */}
          {(tallyTransactionsData.closingBalance < 0 || selectedItemForTally.currentStock < 0) && (
            <div className="m-4 p-4 bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-4 shadow-lg animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-black text-rose-900 dark:text-rose-200 text-sm flex items-center gap-2">
                    <span>⚠️ Modification Required / डेटा विसंगति चेतावनी:</span>
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-mono font-bold text-xs">
                      Closing Balance: {tallyTransactionsData.closingBalance.toFixed(2)} {selectedItemForTally.unit}
                    </span>
                  </h4>
                  <p className="text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
                    इस आइटम <strong>[{selectedItemForTally.priceListCode || selectedItemForTally.itemCode}] {selectedItemForTally.name}</strong> में गलत डेटा इनपुट हुआ है या अधिक निर्गम (Excess Issues) दर्ज हो गया है, जिससे बैलेंस ऋणात्मक (Negative) हो गया है।
                  </p>
                  <p className="text-rose-950 dark:text-rose-100 font-bold">
                    👉 कृपया नीचे दी गई टेबल में वाउचर के ✏️ Edit बटन से मात्रा/विवरण सही करें अथवा <strong>+ Add Receipt Voucher</strong> से प्राप्ति दर्ज करें।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedItemForTxn(selectedItemForTally);
                  setTxnType('INWARD');
                  setTxnFormData(prev => ({ ...prev, itemId: selectedItemForTally.id, quantity: Math.abs(tallyTransactionsData.closingBalance), purposeOrSection: 'IMSD/USED' }));
                  setIsTxnModalOpen(true);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition shadow-sm"
              >
                + Add Receipt to Balance
              </button>
            </div>
          )}

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
                  <th className="p-3 border border-slate-300 dark:border-slate-700 text-center">कार्रवाई<br/><span className="text-[10px] font-normal">Action</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium text-slate-800 dark:text-slate-200">
                {tallyTransactionsData.rows.length === 0 ? (
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
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-slate-400 text-[11px]">-</td>
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
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-slate-400 text-[11px]">-</td>
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
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-slate-400 text-[11px]">-</td>
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
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-slate-400 text-[11px]">-</td>
                    </tr>
                  </>
                ) : (
                  tallyTransactionsData.rows.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.formattedDate}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-bold">
                        {tx.referenceNo || 'Voucher'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700">
                        {tx.issuedToOrReceivedFrom || '-'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono">
                        {tx.purposeOrSection || 'IMSD/USED'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-black font-mono bg-emerald-50/20">
                        {tx.type === 'INWARD' ? Number(tx.quantity).toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-slate-500">
                        {tx.type === 'TRANSFER' ? Number(tx.quantity).toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 font-mono text-amber-600 font-bold bg-amber-50/20">
                        {tx.type === 'OUTWARD' ? Number(tx.quantity).toFixed(2) : '0.00'}
                      </td>
                      <td className="p-3 border border-slate-300 dark:border-slate-700 text-red-600 font-black font-mono bg-blue-50/40 text-sm">
                        {Number(tx.calculatedBalance).toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-300 dark:border-slate-700 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTransaction(tx)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition"
                            title="Modify Transaction"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Grand Total & Final Balance Footer */}
              <tfoot>
                <tr className="bg-[#0f2b5c] text-white font-black text-xs border-t-2 border-slate-900 text-center">
                  <td colSpan={4} className="p-3 border border-slate-600 text-right pr-4 uppercase tracking-wider">
                    कुल योग एवं वर्तमान शेष (Total &amp; Closing Balance):
                  </td>
                  <td className="p-3 border border-slate-600 text-emerald-300 font-mono font-black text-sm bg-emerald-950/60">
                    {tallyTransactionsData.rows.length === 0 ? '6.00' : tallyTransactionsData.totalReceipts.toFixed(2)}
                  </td>
                  <td className="p-3 border border-slate-600 text-slate-300 font-mono">
                    {tallyTransactionsData.rows.length === 0 ? '0.00' : tallyTransactionsData.totalTransfers.toFixed(2)}
                  </td>
                  <td className="p-3 border border-slate-600 text-amber-300 font-mono font-black text-sm bg-amber-950/60">
                    {tallyTransactionsData.rows.length === 0 ? '0.00' : tallyTransactionsData.totalIssues.toFixed(2)}
                  </td>
                  <td className="p-3 border border-slate-600 text-cyan-300 font-mono font-black text-base bg-blue-950">
                    {tallyTransactionsData.rows.length === 0 ? '6.00' : tallyTransactionsData.closingBalance.toFixed(2)}
                  </td>
                  <td className="p-3 border border-slate-600 text-center text-slate-400 font-mono text-[10px]">
                    {tallyTransactionsData.rows.length} Txns
                  </td>
                </tr>
              </tfoot>
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
                      <td className="p-3.5 font-mono font-bold text-blue-700 dark:text-cyan-400">
                        <div className="flex items-center gap-1.5">
                          <span>{txn.referenceNo}</span>
                          {(txn as any).voucherDocUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVoucherDoc({
                                  url: (txn as any).voucherDocUrl,
                                  isPdf: (txn as any).voucherDocType === 'PDF' || (txn as any).voucherDocUrl.includes('application/pdf'),
                                  title: txn.itemName,
                                  refNo: txn.referenceNo
                                });
                              }}
                              className="px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/60 dark:hover:bg-blue-800 text-blue-800 dark:text-cyan-300 text-[9px] font-bold inline-flex items-center gap-1"
                              title="Click to view attached voucher document"
                            >
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>Doc</span>
                            </button>
                          )}
                        </div>
                      </td>
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

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Material Name (वस्तु का विवरण) *</label>
                  <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Live SAP Auto-fetch (4,827 Items)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Type item name (e.g. ERC MK3, Rubber Pad, Fuse, Cable)..."
                  value={newItemData.name || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setNewItemData({ ...newItemData, name: val });
                    if (val.trim().length >= 2) {
                      const clean = val.toLowerCase().trim();
                      const tokens = clean.split(' ').filter(Boolean);
                      const matches = SAP_MATERIALS.filter(m => {
                        const hay = `${m.code} ${m.description} ${m.uom} ${m.plantDescription}`.toLowerCase();
                        return tokens.every(t => hay.includes(t)) || m.code.includes(clean);
                      }).slice(0, 8);
                      setSapSuggestions(matches);
                      setIsSapSuggestionOpen(matches.length > 0);
                    } else {
                      setIsSapSuggestionOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if ((newItemData.name || '').trim().length >= 2 && sapSuggestions.length > 0) {
                      setIsSapSuggestionOpen(true);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500"
                />

                {/* SAP Live Suggestions Popover */}
                {isSapSuggestionOpen && sapSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto animate-fadeIn">
                    <div className="bg-blue-50 dark:bg-blue-950/80 px-3 py-1.5 flex items-center justify-between text-[10px] font-black text-blue-800 dark:text-cyan-300">
                      <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Live SAP Master Matches ({sapSuggestions.length})</span>
                      <button type="button" onClick={() => setIsSapSuggestionOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    {sapSuggestions.map(mat => (
                      <button
                        key={`${mat.code}-${mat.plant}`}
                        type="button"
                        onClick={() => {
                          setNewItemData(prev => ({
                            ...prev,
                            name: mat.description.replace(/^"|"$/g, '').trim(),
                            itemCode: mat.code,
                            priceListCode: mat.code,
                            unit: mat.uom || prev.unit || 'Nos',
                            specification: `${mat.plantDescription || 'DFCCIL Standard'} (Group: ${mat.mainGroup}/${mat.subGroup})`
                          }));
                          setIsSapSuggestionOpen(false);
                        }}
                        className="w-full p-2.5 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{mat.description}</div>
                          <div className="text-[10px] text-slate-500">{mat.plantDescription || mat.plant} • Grp: {mat.mainGroup}/{mat.subGroup}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono font-black text-[11px] text-blue-700 dark:text-cyan-300">
                            {mat.code}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{mat.uom || 'Nos'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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

              {/* Voucher Photo & PDF Attachment (< 300 KB photo, <= 2MB PDF) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>Attach Official Voucher (Photo or PDF)</span>
                  </label>
                  {newItemData.voucherDocUrl && (
                    <button
                      type="button"
                      onClick={() => setNewItemData({ ...newItemData, voucherDocUrl: undefined, voucherDocType: undefined, voucherDocName: undefined })}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {newItemData.voucherDocUrl ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 min-w-0">
                      {newItemData.voucherDocType === 'PDF' ? (
                        <FileText className="w-6 h-6 text-red-500 shrink-0" />
                      ) : (
                        <img src={newItemData.voucherDocUrl} alt="Voucher Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{newItemData.voucherDocName || 'Attached Voucher'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {newItemData.voucherDocType === 'PDF' ? 'PDF Document (Max 300 KB)' : 'WhatsApp Compressed Photo (<300 KB)'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      Attached
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type.includes('pdf')) {
                          if (file.size > 300 * 1024) {
                            alert('⚠️ PDF size exceeds 300 KB limit! Please upload a PDF under 300 KB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setNewItemData(prev => ({
                              ...prev,
                              voucherDocUrl: evt.target?.result as string,
                              voucherDocType: 'PDF',
                              voucherDocName: file.name
                            }));
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setIsCompressingVoucher(true);
                          try {
                            const compressed = await compressImageWhatsAppLevel(file);
                            setNewItemData(prev => ({
                              ...prev,
                              voucherDocUrl: compressed,
                              voucherDocType: 'IMAGE',
                              voucherDocName: file.name
                            }));
                          } catch (err) {
                            console.error('Image compression error:', err);
                          } finally {
                            setIsCompressingVoucher(false);
                          }
                        }
                      }}
                      className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Supported: Photos (auto WhatsApp-compressed &lt; 300 KB) and PDFs (Max 2 MB limit).
                    </p>
                  </div>
                )}
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
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          Item Name (Live SAP Search) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. ERC MK3 / Liners"
                          value={onTheFlyMaterial.name}
                          onChange={e => {
                            const val = e.target.value;
                            setOnTheFlyMaterial({ ...onTheFlyMaterial, name: val });
                            if (val.trim().length >= 2) {
                              const clean = val.toLowerCase().trim();
                              const tokens = clean.split(' ').filter(Boolean);
                              const matches = SAP_MATERIALS.filter(m => {
                                const hay = `${m.code} ${m.description} ${m.uom} ${m.plantDescription}`.toLowerCase();
                                return tokens.every(t => hay.includes(t)) || m.code.includes(clean);
                              }).slice(0, 6);
                              setTxnSapSuggestions(matches);
                              setIsTxnSapSuggestionOpen(matches.length > 0);
                            } else {
                              setIsTxnSapSuggestionOpen(false);
                            }
                          }}
                          onFocus={() => {
                            if ((onTheFlyMaterial.name || '').trim().length >= 2 && txnSapSuggestions.length > 0) {
                              setIsTxnSapSuggestionOpen(true);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Txn SAP Live Suggestions Popover */}
                        {isTxnSapSuggestionOpen && txnSapSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto animate-fadeIn">
                            {txnSapSuggestions.map(mat => (
                              <button
                                key={`${mat.code}-${mat.plant}`}
                                type="button"
                                onClick={() => {
                                  setOnTheFlyMaterial(prev => ({
                                    ...prev,
                                    name: mat.description.replace(/^"|"$/g, '').trim(),
                                    itemCode: mat.code,
                                    priceListCode: mat.code,
                                    unit: mat.uom || 'Nos'
                                  }));
                                  setIsTxnSapSuggestionOpen(false);
                                }}
                                className="w-full p-2 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition flex items-start justify-between gap-1.5"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">{mat.description}</div>
                                  <div className="text-[9px] text-slate-500">{mat.plantDescription || mat.plant}</div>
                                </div>
                                <span className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono font-bold text-[10px] text-blue-700 dark:text-cyan-300">
                                  {mat.code}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Code / Price List *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 49 or SAP Code"
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

              {/* Voucher Photo & PDF Attachment (< 300 KB photo, <= 2MB PDF) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-cyan-400" />
                    <span>Attach Official Voucher (Photo or PDF)</span>
                  </label>
                  {txnFormData.voucherDocUrl && (
                    <button
                      type="button"
                      onClick={() => setTxnFormData({ ...txnFormData, voucherDocUrl: undefined, voucherDocType: undefined, voucherDocName: undefined })}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {txnFormData.voucherDocUrl ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 min-w-0">
                      {txnFormData.voucherDocType === 'PDF' ? (
                        <FileText className="w-6 h-6 text-red-500 shrink-0" />
                      ) : (
                        <img src={txnFormData.voucherDocUrl} alt="Voucher Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{txnFormData.voucherDocName || 'Attached Voucher'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {txnFormData.voucherDocType === 'PDF' ? 'PDF Document (Max 300 KB)' : 'WhatsApp Compressed Photo (<300 KB)'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      Attached
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type.includes('pdf')) {
                          if (file.size > 300 * 1024) {
                            alert('⚠️ PDF size exceeds 300 KB limit! Please upload a PDF under 300 KB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setTxnFormData(prev => ({
                              ...prev,
                              voucherDocUrl: evt.target?.result as string,
                              voucherDocType: 'PDF',
                              voucherDocName: file.name
                            }));
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setIsCompressingVoucher(true);
                          try {
                            const compressed = await compressImageWhatsAppLevel(file);
                            setTxnFormData(prev => ({
                              ...prev,
                              voucherDocUrl: compressed,
                              voucherDocType: 'IMAGE',
                              voucherDocName: file.name
                            }));
                          } catch (err) {
                            console.error('Image compression error:', err);
                          } finally {
                            setIsCompressingVoucher(false);
                          }
                        }
                      }}
                      className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Attach signed store receipt/issue voucher copy (Photos WhatsApp-compressed &lt;300 KB, PDFs Max 300 KB limit).
                    </p>
                  </div>
                )}
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
      {/* 5.3 EDIT / MODIFY TRANSACTION MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {isEditTxnModalOpen && editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Modify Transaction (वाउचर संशोधन)</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditTxnModalOpen(false);
                  setEditingTxn(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTransaction} className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{editingTxn.itemName}</div>
                <div className="font-mono text-slate-500 text-[11px]">
                  Voucher: {editingTxn.referenceNo || 'N/A'} • Transaction ID: {editingTxn.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Transaction Type</label>
                  <select
                    value={editTxnFormData.type}
                    onChange={e => setEditTxnFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="INWARD">Receipt (प्राप्ति)</option>
                    <option value="OUTWARD">Issue (निर्गम)</option>
                    <option value="TRANSFER">Transfer (स्थानांतरण)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Date (तारीख)</label>
                  <input
                    type="date"
                    value={editTxnFormData.date}
                    onChange={e => setEditTxnFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Quantity (मात्रा)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editTxnFormData.quantity}
                    onChange={e => setEditTxnFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Voucher No. & Date</label>
                  <input
                    type="text"
                    value={editTxnFormData.referenceNo}
                    onChange={e => setEditTxnFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                    placeholder="e.g. Glass/771 Dated 10.09.2024"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">From Whom Received / To Whom Issued</label>
                <input
                  type="text"
                  value={editTxnFormData.issuedToOrReceivedFrom}
                  onChange={e => setEditTxnFormData(prev => ({ ...prev, issuedToOrReceivedFrom: e.target.value }))}
                  placeholder="e.g. CIODW Ami Bartan Bhandar / Track Unit"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Purpose / Section</label>
                <input
                  type="text"
                  value={editTxnFormData.purposeOrSection}
                  onChange={e => setEditTxnFormData(prev => ({ ...prev, purposeOrSection: e.target.value }))}
                  placeholder="e.g. IMSD/USED"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-bold">Remarks (टिप्पणी)</label>
                <input
                  type="text"
                  value={editTxnFormData.remarks || ''}
                  onChange={e => setEditTxnFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Optional remarks..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTxnModalOpen(false);
                    setEditingTxn(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 5.5 EDIT MIN BUFFER THRESHOLD MODAL */}
      {/* ------------------------------------------------------------------------- */}
      {isEditBufferModalOpen && selectedItemForBufferEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Update Minimum Buffer Stock</span>
              </h3>
              <button onClick={() => setIsEditBufferModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{selectedItemForBufferEdit.name}</div>
              <div className="font-mono text-slate-500 text-[11px]">
                Code: {selectedItemForBufferEdit.itemCode} • Current Available: {selectedItemForBufferEdit.currentStock} {selectedItemForBufferEdit.unit}
              </div>
            </div>

            <div>
              <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">
                New Minimum Buffer Threshold ({selectedItemForBufferEdit.unit}) *
              </label>
              <input
                type="number"
                min="0"
                value={bufferEditValue}
                onChange={e => setBufferEditValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                When stock falls below this quantity, automatic low-stock alerts are triggered.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditBufferModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (selectedItemForBufferEdit) {
                    await db.updateDocument('store_items', selectedItemForBufferEdit.id, {
                      minBufferThreshold: bufferEditValue
                    });
                    try {
                      await db.updateDocument('store_inventory' as any, selectedItemForBufferEdit.id, {
                        minBufferThreshold: bufferEditValue
                      });
                    } catch (e) {}
                    setIsEditBufferModalOpen(false);
                    await loadStoreData();
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Update Threshold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 5.6 VOUCHER DOCUMENT VIEWER MODAL (PHOTO / PDF) */}
      {/* ------------------------------------------------------------------------- */}
      {selectedVoucherDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-scaleUp text-white flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Voucher Document • {selectedVoucherDoc.title}</span>
                </h4>
                <p className="text-xs text-slate-400 font-mono">Ref No: {selectedVoucherDoc.refNo}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedVoucherDoc.url}
                  download={`Voucher_${selectedVoucherDoc.refNo || 'Doc'}`}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedVoucherDoc(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto flex items-center justify-center bg-black/50">
              {selectedVoucherDoc.isPdf ? (
                <iframe
                  src={selectedVoucherDoc.url}
                  title="Voucher PDF Document"
                  className="w-full h-[580px] rounded-2xl border border-slate-800"
                />
              ) : (
                <img
                  src={selectedVoucherDoc.url}
                  alt="Voucher Document"
                  className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
                />
              )}
            </div>
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
                              {getItemLiveStock(selectedItemForQR)} {selectedItemForQR.unit}
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

      {/* ------------------------------------------------------------------------- */}
      {/* 8. SAP MATERIAL MASTER CATALOG LOOKUP MODAL (4,827 ITEMS) */}
      {/* ------------------------------------------------------------------------- */}
      {isSapLookupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Official DFCCIL SAP Material Master (4,827 Items)
                </h3>
              </div>
              <button onClick={() => setIsSapLookupModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Search by SAP Material Code, Item Name, or Plant to auto-fill its official Item Code, Description, UOM, and Specification into your store inventory.
            </p>

            <SapMaterialLookup
              onSelect={(material) => {
                const desc = material.description.toLowerCase();
                const isPway = desc.includes('rail') || desc.includes('clip') || desc.includes('liner') || desc.includes('plate') || desc.includes('pad') || desc.includes('turnout') || desc.includes('sleeper');
                setNewItemData({
                  category: isPway ? 'P.way material' : 'T&P',
                  name: material.description.replace(/^"|"$/g, '').trim(),
                  itemCode: material.code,
                  priceListCode: material.code,
                  unit: material.uom || 'Nos',
                  specification: `${material.plantDescription || 'DFCCIL Standard'} (Group: ${material.mainGroup}/${material.subGroup})`,
                  currentStock: 0,
                  minBufferThreshold: 10,
                  location: 'IMSD SMUN Store',
                  tallyCodeNo: '1',
                  accountsFileNo: '3195'
                });
                setIsSapLookupModalOpen(false);
                setIsAddItemModalOpen(true);
              }}
            />

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSapLookupModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* 9. CHANGE / EDIT SAP MATERIAL CODE MODAL (Requirement 5) */}
      {/* ------------------------------------------------------------------------- */}
      {isEditSapModalOpen && selectedItemForSapEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-scaleUp max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded-2xl border border-amber-300 dark:border-amber-800">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Change / Edit SAP Material Code
                  </h3>
                  <p className="text-xs text-slate-500">
                    Master Inventory · Auto-Fetch SAP Material Code &amp; Specifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSapModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Item Details Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Item</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#123b72] border border-blue-200 uppercase">
                  {selectedItemForSapEdit.category}
                </span>
              </div>
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {selectedItemForSapEdit.name}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between font-mono">
                <span>Stock: {getItemLiveStock(selectedItemForSapEdit)} {selectedItemForSapEdit.unit}</span>
                <span>PL: {selectedItemForSapEdit.priceListCode || selectedItemForSapEdit.itemCode}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Option 1: Live Search & Scrollable Selection from SAP Material Master */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ⚡ Search &amp; Select from Catalog:
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                    {filteredSapModalMaterials.length} Materials
                  </span>
                </div>
                
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search SAP Code, ERC, Liners, Switch, Jack, Torch, etc..."
                    value={sapModalSearch}
                    onChange={(e) => setSapModalSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  {sapModalSearch && (
                    <button
                      type="button"
                      onClick={() => setSapModalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Scrollable List with Smooth Scrolling */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  {filteredSapModalMaterials.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No SAP materials matching "{sapModalSearch}"
                    </div>
                  ) : (
                    filteredSapModalMaterials.map(mat => {
                      const isSelected = sapEditCode === mat.code;
                      return (
                        <button
                          key={`${mat.code}-${mat.plant}`}
                          type="button"
                          onClick={() => {
                            setSapEditCode(mat.code);
                            setSapEditSpec(mat.description.replace(/^"|"$/g, '').trim());
                          }}
                          className={`w-full p-2.5 text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 transition flex items-center justify-between gap-2 ${
                            isSelected ? 'bg-amber-100/70 dark:bg-amber-900/50 font-bold border-l-4 border-amber-600' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-900 dark:text-white truncate font-bold">
                              {mat.description.replace(/^"|"$/g, '').trim()}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>UOM: {mat.uom || 'Nos'}</span>
                              <span>•</span>
                              <span className="truncate">{mat.plantDescription || mat.plant}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono font-bold text-[11px] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                            {mat.code}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Option 2: Direct SAP Material Code Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Selected SAP Material Code (8 to 10 Digits) *
                </label>
                <input
                  type="text"
                  value={sapEditCode}
                  onChange={(e) => setSapEditCode(e.target.value)}
                  placeholder="e.g. 10001050"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 shadow-sm"
                />
              </div>

              {/* Specification / Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Specification / Drawing Reference
                </label>
                <input
                  type="text"
                  value={sapEditSpec}
                  onChange={(e) => setSapEditSpec(e.target.value)}
                  placeholder="e.g. RDSO/T-3701 Standard Drawing"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 shadow-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditSapModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedItemForSapEdit) return;
                  const trimmed = sapEditCode.trim();
                  const updatedSpec = sapEditSpec.trim() || selectedItemForSapEdit.specification;
                  
                  // Update local items state
                  setItems(prev => prev.map(i => i.id === selectedItemForSapEdit.id ? { ...i, sapMaterialCode: trimmed, specification: updatedSpec } : i));
                  
                  // Update database collections
                  try {
                    await Promise.all([
                      db.updateDocument('store_items' as any, selectedItemForSapEdit.id, { sapMaterialCode: trimmed, specification: updatedSpec }),
                      db.updateDocument('store_inventory' as any, selectedItemForSapEdit.id, { sapMaterialCode: trimmed, specification: updatedSpec })
                    ]);
                  } catch (err) {
                    console.error('Error updating SAP material code:', err);
                  }

                  if (selectedItemForTally && selectedItemForTally.id === selectedItemForSapEdit.id) {
                    setSelectedItemForTally(prev => prev ? { ...prev, sapMaterialCode: trimmed, specification: updatedSpec } : null);
                  }

                  setIsEditSapModalOpen(false);
                  setSelectedItemForSapEdit(null);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save SAP Code</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
