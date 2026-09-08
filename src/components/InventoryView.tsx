import React, { useState, useMemo } from 'react';
import { 
  Package, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertTriangle, 
  Plus, 
  SlidersHorizontal, 
  Building2, 
  Clock, 
  Layers, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  Warehouse, 
  History,
  Coins,
  Search,
  Edit3,
  Trash2,
  Tag,
  Box,
  DollarSign,
  Filter,
  Check
} from 'lucide-react';
import { InventoryItem, StockLog, MaterialType, TabType } from '../types';
import { MATERIAL_LABELS, INVENTORY_CATEGORIES, getMaterialLabel } from '../data/mockData';
import { 
  addStockIntake, 
  adjustStockLevel, 
  createInventoryProduct, 
  updateInventoryProduct, 
  deleteInventoryProduct 
} from '../services/inventoryService';

interface InventoryViewProps {
  inventory?: InventoryItem[];
  stockLogs?: StockLog[];
  logs?: StockLog[];
  onRefresh: () => void;
  onNavigateToDispatch?: () => void;
  onQuickDispatch?: () => void;
  userName?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory = [],
  stockLogs = [],
  logs = [],
  onRefresh,
  onNavigateToDispatch,
  onQuickDispatch,
  userName = 'Admin'
}) => {
  const safeInventory = inventory || [];
  const safeLogs = (stockLogs && stockLogs.length > 0 ? stockLogs : logs) || [];
  const handleDispatch = onNavigateToDispatch || onQuickDispatch;

  // Modals state
  const [selectedItemForIntake, setSelectedItemForIntake] = useState<InventoryItem | null>(null);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLogFilter, setActiveLogFilter] = useState<'all' | 'in' | 'out' | 'adjust'>('all');

  // Intake Form State
  const [intakeItemId, setIntakeItemId] = useState<string>('');
  const [intakeQty, setIntakeQty] = useState<number | ''>('');
  const [intakeCost, setIntakeCost] = useState<number | ''>('');
  const [intakeSupplier, setIntakeSupplier] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');

  // Adjust Form State
  const [adjustCount, setAdjustCount] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('Physical Inventory Count Audit');

  // Product Add / Edit Form State
  const [prodName, setProdName] = useState('');
  const [prodBurmeseName, setProdBurmeseName] = useState('');
  const [prodCategory, setProdCategory] = useState<string>('aggregates');
  const [prodUnit, setProdUnit] = useState<string>('ကျင်း');
  const [prodCurrentStock, setProdCurrentStock] = useState<number | ''>(50);
  const [prodMinThreshold, setProdMinThreshold] = useState<number | ''>(20);
  const [prodCapacity, setProdCapacity] = useState<number | ''>(200);
  const [prodPurchaseCost, setProdPurchaseCost] = useState<number | ''>(30000);
  const [prodSellingPrice, setProdSellingPrice] = useState<number | ''>(45000);
  const [prodLocation, setProdLocation] = useState('ရန်ကုန် ဂိတ်ဝင်း စတို');

  // Summary Metrics
  const totalVolumeInStock = safeInventory.reduce((acc, item) => acc + Number(item.currentStock || 0), 0);
  const totalInventoryCost = safeInventory.reduce((acc, item) => acc + (Number(item.currentStock || 0) * Number(item.purchaseCostPerUnit || 0)), 0);
  const totalRetailValue = safeInventory.reduce((acc, item) => acc + (Number(item.currentStock || 0) * Number(item.sellingPricePerUnit || 0)), 0);
  const potentialGrossProfit = totalRetailValue - totalInventoryCost;
  const lowStockItems = safeInventory.filter(item => Number(item.currentStock) <= Number(item.minimumThreshold));

  // Filtered Products
  const filteredInventory = useMemo(() => {
    return safeInventory.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        item.name.toLowerCase().includes(q) ||
        item.burmeseName.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [safeInventory, selectedCategory, searchQuery]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: safeInventory.length };
    INVENTORY_CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = safeInventory.filter(i => (i.category || 'aggregates') === cat.id).length;
      }
    });
    return counts;
  }, [safeInventory]);

  // Handlers for Stock In
  const handleOpenIntake = (item?: InventoryItem | null) => {
    const target = item || safeInventory[0] || null;
    if (!target) {
      // If no inventory exists, prompt user to add a product first
      setIsAddingProduct(true);
      return;
    }
    setSelectedItemForIntake(target);
    setIntakeItemId(target.id);
    setIntakeQty('');
    setIntakeCost(target.purchaseCostPerUnit || '');
    setIntakeSupplier('');
    setIntakeNotes('');
  };

  const handleIntakeProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setIntakeItemId(selectedId);
    const target = safeInventory.find(i => i.id === selectedId);
    if (target) {
      setSelectedItemForIntake(target);
      setIntakeCost(target.purchaseCostPerUnit || '');
    }
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItemForAdjust(item);
    setAdjustCount(item.currentStock);
    setAdjustReason('Physical Stock Count Audit (လစဉ်စတိုစာရင်းစစ်)');
  };

  // Handlers for Add / Edit Product
  const handleOpenAddProduct = () => {
    setProdName('');
    setProdBurmeseName('');
    setProdCategory('aggregates');
    setProdUnit('ကျင်း');
    setProdCurrentStock(100);
    setProdMinThreshold(25);
    setProdCapacity(300);
    setProdPurchaseCost(30000);
    setProdSellingPrice(45000);
    setProdLocation('လှိုင်သာယာ ဘုရင့်နောင် ဂိတ်ဝင်း');
    setIsAddingProduct(true);
  };

  const handleOpenEditProduct = (item: InventoryItem) => {
    setItemToEdit(item);
    setProdName(item.name);
    setProdBurmeseName(item.burmeseName);
    setProdCategory(item.category || 'aggregates');
    setProdUnit(item.unit || 'ကျင်း');
    setProdCurrentStock(item.currentStock);
    setProdMinThreshold(item.minimumThreshold);
    setProdCapacity(item.capacity);
    setProdPurchaseCost(item.purchaseCostPerUnit);
    setProdSellingPrice(item.sellingPricePerUnit);
    setProdLocation(item.location);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodBurmeseName.trim()) return;

    if (itemToEdit) {
      // Update existing product
      updateInventoryProduct(itemToEdit.id, {
        name: prodName.trim() || prodBurmeseName.trim(),
        burmeseName: prodBurmeseName.trim(),
        category: prodCategory,
        unit: prodUnit.trim() || 'ကျင်း',
        currentStock: Number(prodCurrentStock) || 0,
        minimumThreshold: Number(prodMinThreshold) || 10,
        capacity: Number(prodCapacity) || 100,
        purchaseCostPerUnit: Number(prodPurchaseCost) || 0,
        sellingPricePerUnit: Number(prodSellingPrice) || 0,
        location: prodLocation.trim() || 'ပင်မစတို',
      });
      setItemToEdit(null);
    } else {
      // Create new product
      const rawType = prodBurmeseName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) || `custom_${Date.now()}`;
      createInventoryProduct({
        materialType: rawType as MaterialType,
        name: prodName.trim() || prodBurmeseName.trim(),
        burmeseName: prodBurmeseName.trim(),
        category: prodCategory,
        unit: prodUnit.trim() || 'ကျင်း',
        currentStock: Number(prodCurrentStock) || 0,
        minimumThreshold: Number(prodMinThreshold) || 10,
        capacity: Number(prodCapacity) || 100,
        purchaseCostPerUnit: Number(prodPurchaseCost) || 0,
        sellingPricePerUnit: Number(prodSellingPrice) || 0,
        location: prodLocation.trim() || 'ပင်မစတို',
      });
      setIsAddingProduct(false);
    }

    onRefresh();
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    deleteInventoryProduct(itemToDelete.id);
    setItemToDelete(null);
    onRefresh();
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentItem = safeInventory.find(i => i.id === intakeItemId) || selectedItemForIntake;
    if (!currentItem || !intakeQty || Number(intakeQty) <= 0) return;

    addStockIntake({
      inventoryItemId: currentItem.id,
      quantity: Number(intakeQty),
      unitPrice: Number(intakeCost) || currentItem.purchaseCostPerUnit,
      supplierName: intakeSupplier.trim() || 'ဒေသတွင်း ပေးသွင်းသူ',
      notes: intakeNotes.trim() || 'စတိုသို့ ပစ္စည်းသွင်းယူမှု အောင်မြင်ပါသည်',
      performedBy: userName,
    });

    setSelectedItemForIntake(null);
    onRefresh();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust || adjustCount === '' || Number(adjustCount) < 0) return;

    adjustStockLevel({
      inventoryItemId: selectedItemForAdjust.id,
      newStockCount: Number(adjustCount),
      reason: adjustReason.trim(),
      performedBy: userName,
    });

    setSelectedItemForAdjust(null);
    onRefresh();
  };

  const filteredLogs = safeLogs.filter(log => {
    if (activeLogFilter === 'all') return true;
    return log.type === activeLogFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
              စတိုနှင့် ကုန်ပစ္စည်း စီမံခန့်ခွဲမှု (Store Inventory)
            </h1>
            <span className="px-2.5 py-0.5 bg-amber-100 text-[#855300] font-black text-xs rounded-full">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            သဲ၊ ကျောက်၊ မြေနီ၊ ဘိလပ်မြေ၊ အုတ်၊ သံချောင်း နှင့် စတိုပစ္စည်းအသစ်များ စိတ်ကြိုက်ထည့်သွင်း စီမံနိုင်ပါသည်
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {handleDispatch && (
            <button
              type="button"
              onClick={handleDispatch}
              className="px-3.5 py-2 bg-white border border-[#d8c3ad] hover:border-[#855300] text-[#151c27] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <span>ခရီးစဉ် ထုတ်ပေးမည်</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="px-3.5 py-2 bg-white border-2 border-[#855300] text-[#855300] hover:bg-amber-50 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ကုန်ပစ္စည်းအသစ် ထည့်မည်</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenIntake(null)}
            className="px-4 py-2 bg-[#855300] hover:bg-[#653e00] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ စတိုပစ္စည်း သွင်းမည် (+ Stock In)</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-extrabold text-amber-950">
              သတိပြုရန်: စတိုကုန်လက်ကျန် အနည်းဆုံးသတ်မှတ်ချက်အောက် ရောက်နေသော ပစ္စည်း {lowStockItems.length} မျိုးရှိပါသည်!
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <span key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900">
                  <span>{item.burmeseName}</span>
                  <span className="text-red-600 font-mono">({item.currentStock} {item.unit} သာကျန်)</span>
                  <button 
                    type="button"
                    onClick={() => handleOpenIntake(item)}
                    className="underline text-[#855300] hover:text-[#653e00] ml-1 cursor-pointer font-extrabold"
                  >
                    ဖြည့်သွင်းမည်
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">စတိုကုန်ပစ္စည်းအမျိုးအမည်</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <Package className="w-4 h-4 text-[#855300]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#151c27]">{safeInventory.length}</span>
            <span className="text-xs font-bold text-gray-500">မျိုး (Products)</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            စုစုပေါင်း လက်ကျန် {totalVolumeInStock.toLocaleString()}
          </div>
        </div>

        {/* Stock Valuation (Cost) */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ကုန်ကြမ်းအရင်းတန်ဖိုး</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Coins className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[#151c27]">{(totalInventoryCost / 100000).toFixed(1)}</span>
            <span className="text-xs font-bold text-gray-500">သိန်း ကျပ်</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium truncate font-mono">
            {totalInventoryCost.toLocaleString()} MMK
          </div>
        </div>

        {/* Retail Expected Revenue */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ရောင်းဈေးတန်ဖိုး</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{(totalRetailValue / 100000).toFixed(1)}</span>
            <span className="text-xs font-bold text-gray-500">သိန်း ကျပ်</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-bold">
            ခန့်မှန်းအမြတ်: +{(potentialGrossProfit / 100000).toFixed(1)} သိန်း
          </div>
        </div>

        {/* Stock Health */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">စတိုကြံ့ခိုင်မှု</span>
            <div className={`p-2 rounded-xl ${lowStockItems.length > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {lowStockItems.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-black ${lowStockItems.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {lowStockItems.length === 0 ? 'Normal' : `${lowStockItems.length} လျော့နည်း`}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            {lowStockItems.length === 0 ? 'ကုန်ပစ္စည်းအားလုံး လုံလောက်ပါသည်' : 'အမြန်ဖြည့်ရန် လိုအပ်ပါသည်'}
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {INVENTORY_CATEGORIES.map(cat => {
              const count = categoryCounts[cat.id] || 0;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-[#855300] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <span>{cat.label.my}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ရှာဖွေမည် (အမည်၊ နေရာ)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f9f9ff] border border-gray-200 rounded-xl focus:outline-none focus:border-[#855300]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#151c27] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#855300]" />
            <span>စတို ကုန်ပစ္စည်းလက်ကျန် အခြေအနေ ({filteredInventory.length} မျိုး)</span>
          </h2>

          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="text-xs font-bold text-[#855300] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ကုန်ပစ္စည်းအသစ် ထည့်မည်</span>
          </button>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-700">ရှာဖွေတွေ့ရှိသော ကုန်ပစ္စည်း မရှိပါ</h4>
            <p className="text-xs text-gray-400 mt-1">အခြား အမျိုးအစား ရွေးချယ်ပါ သို့မဟုတ် ကုန်ပစ္စည်းအသစ် ထည့်သွင်းပါ</p>
            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="mt-4 px-4 py-2 bg-[#855300] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#653e00] inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ကုန်ပစ္စည်းအသစ် ထည့်မည်</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredInventory.map((item) => {
              const label = getMaterialLabel(item.materialType, safeInventory);
              const percentage = Math.min(100, Math.round((Number(item.currentStock) / Number(item.capacity || 200)) * 100));
              const isLow = Number(item.currentStock) <= Number(item.minimumThreshold);

              // Category label text
              const matchedCategory = INVENTORY_CATEGORIES.find(c => c.id === item.category);
              const categoryBadge = matchedCategory ? matchedCategory.label.my : 'အထွေထွေ';

              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                    isLow ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200/90'
                  }`}
                >
                  <div>
                    {/* Top Row: Category badge & Low Stock Pill & Action Menu */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span 
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block"
                          style={{ backgroundColor: label.bg, color: label.color }}
                        >
                          {label.my}
                        </span>
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          {categoryBadge}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>

                        <button
                          type="button"
                          title="ပြင်ဆင်မည် (Edit Product)"
                          onClick={() => handleOpenEditProduct(item)}
                          className="p-1 text-gray-400 hover:text-[#855300] hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          title="ဖျက်မည် (Delete Product)"
                          onClick={() => setItemToDelete(item)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-extrabold text-[#151c27] text-base leading-tight mt-1">
                      {item.burmeseName}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium">{item.name}</p>

                    {/* Stock Gauge */}
                    <div className="my-3 p-3 bg-gray-50/90 rounded-xl border border-gray-100">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-medium">လက်ကျန် / ဆံ့ဝင်မှု</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-xl font-black ${isLow ? 'text-red-600' : 'text-[#151c27]'}`}>
                            {Number(item.currentStock).toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-gray-500">/ {Number(item.capacity || 100).toLocaleString()} {item.unit}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isLow ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                        <span>အနည်းဆုံး {item.minimumThreshold} {item.unit}</span>
                        <span>{percentage}% full</span>
                      </div>
                    </div>

                    {/* Location & Pricing info */}
                    <div className="space-y-1.5 text-xs text-gray-600 mb-4 bg-white p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#855300]" /> နေရာ:
                        </span>
                        <span className="font-semibold text-gray-800 truncate max-w-[150px]">{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">ဝယ်အရင်း (1 {item.unit}):</span>
                        <span className="font-mono font-medium">{item.purchaseCostPerUnit?.toLocaleString()} MMK</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[11px]">ရောင်းဈေး (1 {item.unit}):</span>
                        <span className="font-mono font-bold text-[#855300]">{item.sellingPricePerUnit?.toLocaleString()} MMK</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenIntake(item)}
                      className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-[#855300] border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ပစ္စည်းသွင်း</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAdjust(item)}
                      className="py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>စာရင်းညှိ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock Movement Log / Audit Trail */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#855300]" />
            <h3 className="font-black text-[#151c27] text-sm">
              စတို အဝင်/အထွက် မှတ်တမ်း (Stock Movement Logs)
            </h3>
            <span className="text-xs text-gray-400">({filteredLogs.length} entries)</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'in', 'out', 'adjust'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveLogFilter(filter)}
                className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                  activeLogFilter === filter
                    ? 'bg-white text-[#151c27] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {filter === 'all' ? 'အားလုံး' : filter === 'in' ? 'သွင်းယူ (+ In)' : filter === 'out' ? 'ထုတ်ယူ (- Out)' : 'စာရင်းညှိ (Adjust)'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/75 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="py-3 px-4">အချိန် / ရက်စွဲ</th>
                <th className="py-3 px-4">လုပ်ဆောင်ချက်</th>
                <th className="py-3 px-4">ကုန်ကြမ်းပစ္စည်း</th>
                <th className="py-3 px-4 text-right">ပမာဏ</th>
                <th className="py-3 px-4">ပေးသွင်းသူ / အကြောင်းအရာ</th>
                <th className="py-3 px-4">ဆောင်ရွက်သူ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-normal">
                    မှတ်တမ်း မရှိသေးပါ
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 20).map((log) => {
                  const isIncoming = log.type === 'in';
                  const isOutgoing = log.type === 'out';
                  const label = getMaterialLabel(log.materialType, safeInventory);
                  const matchedItem = safeInventory.find(i => i.id === log.inventoryItemId || i.materialType === log.materialType);
                  const unitText = matchedItem ? matchedItem.unit : 'ကျင်း';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          isIncoming 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isOutgoing 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isIncoming && <ArrowDownRight className="w-3 h-3 text-emerald-600" />}
                          {isOutgoing && <ArrowUpRight className="w-3 h-3 text-blue-600" />}
                          {!isIncoming && !isOutgoing && <SlidersHorizontal className="w-3 h-3 text-amber-600" />}
                          <span>{isIncoming ? 'Stock In (အဝင်)' : isOutgoing ? 'Dispatch (အထွက်)' : 'Adjust (ညှိ)'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-[#151c27]">{label?.my || log.materialType}</span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={`font-mono font-extrabold text-sm ${
                          isIncoming ? 'text-emerald-700' : isOutgoing ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                          {isIncoming ? '+' : isOutgoing ? '-' : '±'}{log.quantity.toLocaleString()} {unitText}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="truncate text-gray-900 font-semibold">{log.supplierName || log.notes}</div>
                        {log.unitPrice && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            @{log.unitPrice.toLocaleString()} MMK (စုစုပေါင်း {(log.totalCost || 0).toLocaleString()} MMK)
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-[11px]">
                        {log.performedBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Stock In Form (Enhanced with dynamic Product Selector Dropdown) */}
      {selectedItemForIntake && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#d8c3ad] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-[#fdf9f4] border-b border-[#ebdccd] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#855300] uppercase tracking-wider">စတိုကုန်ပစ္စည်း သွင်းယူခြင်း (+ Stock In)</span>
                <h3 className="text-base font-black text-[#151c27]">{selectedItemForIntake.burmeseName}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedItemForIntake(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="p-6 space-y-4">
              {/* Product Selector Dropdown (Solves "only one category" problem!) */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  သွင်းယူမည့် စတိုကုန်ပစ္စည်း ရွေးချယ်ပါ (Select Store Product) *
                </label>
                <select
                  value={intakeItemId}
                  onChange={handleIntakeProductChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none bg-white"
                >
                  {safeInventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.burmeseName} ({item.name}) - လက်ရှိ: {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    လက်ရှိ: {selectedItemForIntake.currentStock} {selectedItemForIntake.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItemForIntake(null);
                      handleOpenAddProduct();
                    }}
                    className="text-[11px] font-bold text-[#855300] hover:underline"
                  >
                    + အသစ်ထည့်သွင်းမည်
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  သွင်းယူမည့် ပမာဏ ({selectedItemForIntake.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={intakeQty}
                  onChange={(e) => setIntakeQty(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`ဥပမာ - 50 ${selectedItemForIntake.unit}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  လက်ရှိ: {selectedItemForIntake.currentStock} → သွင်းပြီးပါက: {Number(selectedItemForIntake.currentStock) + (Number(intakeQty) || 0)} {selectedItemForIntake.unit}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ပေးသွင်းသည့် ကုမ္ပဏီ / ရင်းမြစ် (Supplier Name)
                </label>
                <input
                  type="text"
                  value={intakeSupplier}
                  onChange={(e) => setIntakeSupplier(e.target.value)}
                  placeholder="ဥပမာ - ဧရာဝတီ သောင်တူးလုပ်ငန်းစု / စက်ရုံ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  တစ်{selectedItemForIntake.unit} ဝယ်ယူအရင်းဈေး (MMK)
                </label>
                <input
                  type="number"
                  value={intakeCost}
                  onChange={(e) => setIntakeCost(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={selectedItemForIntake.purchaseCostPerUnit?.toString() || '30000'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  မှတ်ချက် (Notes / Boat / Truck Reference)
                </label>
                <input
                  type="text"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder="ဥပမာ - ကုန်တင်စက်လှေအမှတ် ၅ ဆိုက်ရောက်"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedItemForIntake(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#855300] hover:bg-[#653e00] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  စတိုသို့ သွင်းမည် (Confirm Stock In)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adjust Stock Count Form */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">စတိုစာရင်း ပြင်ဆင်ညှိနှိုင်းခြင်း</span>
                <h3 className="text-base font-black text-[#151c27]">{selectedItemForAdjust.burmeseName}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedItemForAdjust(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  မှန်ကန်သော စတိုလက်ကျန် ({selectedItemForAdjust.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  value={adjustCount}
                  onChange={(e) => setAdjustCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  လက်ရှိစနစ်ထဲရှိစာရင်း: {selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ပြင်ဆင်ရသည့် အကြောင်းပြချက် (Reason) *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#855300] focus:outline-none bg-white font-medium"
                >
                  <option value="Physical Inventory Count Audit">Physical Inventory Count Audit (လစဉ်စတိုစာရင်းစစ်)</option>
                  <option value="Material Settling / Compaction Loss">Material Settling / Compaction (မြေ/သဲ သိပ်သည်းမှု လျော့ကျခြင်း)</option>
                  <option value="Spoilage / Waste / Spillage">Spoilage / Spillage (သယ်ယူတင်ချ လွင့်စဉ်ပျက်စီးမှု)</option>
                  <option value="Manual Dispatch Correction">Manual Dispatch Correction (ခရီးစဉ်အမှား ပြင်ဆင်ခြင်း)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#855300] hover:bg-[#653e00] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  စာရင်း အတည်ပြုပြင်ဆင်မည် (Save Adjustment)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Store Product Form (Complete Customization) */}
      {(isAddingProduct || itemToEdit) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-[#fdf9f4] border-b border-[#ebdccd] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-[#855300] uppercase tracking-wider">
                  {itemToEdit ? 'ကုန်ပစ္စည်း အချက်အလက် ပြင်ဆင်ခြင်း' : 'စတို ကုန်ပစ္စည်းအသစ် ထည့်သွင်းခြင်း'}
                </span>
                <h3 className="text-base font-black text-[#151c27]">
                  {itemToEdit ? itemToEdit.burmeseName : 'ကုန်ပစ္စည်းအသစ် ဖန်တီးမည် (New Product)'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setIsAddingProduct(false);
                  setItemToEdit(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ကုန်ပစ္စည်း မြန်မာအမည် *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodBurmeseName}
                    onChange={(e) => setProdBurmeseName(e.target.value)}
                    placeholder="ဥပမာ - ဆင်တံဆိပ် ဘိလပ်မြေ"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    အင်္ဂလိပ် အမည် (English Name)
                  </label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Portland Cement (50kg)"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    အမျိုးအစား အမျိုးအစား (Category) *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-[#855300] focus:outline-none bg-white"
                  >
                    <option value="aggregates">သဲနှင့် ကျောက် (Aggregates & Sand)</option>
                    <option value="earthwork">မြေနီ / ဖို့မြေ (Earth & Soil)</option>
                    <option value="cement_brick">ဘိလပ်မြေနှင့် အုတ် (Cement & Brick)</option>
                    <option value="steel">သံချောင်း / သံထည် (Steel & Rebar)</option>
                    <option value="other">အခြား / အထွေထွေ (General / Other)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ရေတွက်သည့် ယူနစ် (Unit) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      placeholder="ကျင်း / အိတ် / ချပ်..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none font-bold"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) setProdUnit(e.target.value);
                      }}
                      className="px-2 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 text-gray-600"
                    >
                      <option value="">အမြန်ရွေး</option>
                      <option value="ကျင်း">ကျင်း (Kyin)</option>
                      <option value="အိတ်">အိတ် (Bag)</option>
                      <option value="ချောင်း">ချောင်း (Rod)</option>
                      <option value="ချပ်">ချပ် (Sheet)</option>
                      <option value="တန်">တန် (Ton)</option>
                      <option value="ကား">ကား (Truckload)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    လက်ရှိစတို ({prodUnit || 'ယူနစ်'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={prodCurrentStock}
                    onChange={(e) => setProdCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    အနည်းဆုံး သတိပေး ({prodUnit || 'ယူနစ်'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={prodMinThreshold}
                    onChange={(e) => setProdMinThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    အများဆုံးဆံ့ဝင်မှု ({prodUnit || 'ယူနစ်'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={prodCapacity}
                    onChange={(e) => setProdCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ဝယ်ယူအရင်းဈေး (1 {prodUnit || 'ယူနစ်'} လျှင် - MMK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prodPurchaseCost}
                    onChange={(e) => setProdPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="30000"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ရောင်းဈေး (1 {prodUnit || 'ယူနစ်'} လျှင် - MMK) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="45000"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-mono font-bold text-sm text-[#855300] focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  စတိုရုံ / ကွင်းတည်နေရာ (Warehouse / Yard Location)
                </label>
                <input
                  type="text"
                  value={prodLocation}
                  onChange={(e) => setProdLocation(e.target.value)}
                  placeholder="ဥပမာ - လှိုင်သာယာ စတိုရုံ (Bay 1)"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingProduct(false);
                    setItemToEdit(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#855300] hover:bg-[#653e00] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  {itemToEdit ? 'အတည်ပြု ပြင်ဆင်မည် (Save Changes)' : 'ကုန်ပစ္စည်းအသစ် သိမ်းမည် (Add Product)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Product Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-red-200 overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#151c27]">
                ကုန်ပစ္စည်း ဖျက်ပယ်မည်လား?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-bold text-gray-800">{itemToDelete.burmeseName}</span> ကို စတိုစာရင်းမှ ဖျက်ပယ်ပါမည်။ ဤလုပ်ဆောင်ချက်ကို နောက်ပြန်ပြင်၍ မရနိုင်ပါ။
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                မဖျက်တော့ပါ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                ဖျက်ပယ်မည် (Confirm Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
