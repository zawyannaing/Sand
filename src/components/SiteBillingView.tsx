import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Download, 
  Printer, 
  Calendar, 
  Layers, 
  DollarSign, 
  Truck, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  X,
  ArrowUpDown,
  Sparkles,
  MapPin,
  RefreshCw,
  AlertCircle,
  CreditCard,
  Check
} from 'lucide-react';
import { Trip, AppSettings, MaterialType, PaymentStatus, InventoryItem } from '../types';
import { MATERIAL_LABELS, getMaterialLabel } from '../data/mockData';
import { syncAllTripsToSupabase } from '../services/supabaseClient';

interface SiteBillingViewProps {
  trips?: Trip[];
  settings: AppSettings;
  onViewReceipt: (trip: Trip) => void;
  onUpdateTripPayment?: (
    tripId: string, 
    paymentStatus: PaymentStatus, 
    paidAmount: number, 
    dueAmount: number, 
    dueDate?: string
  ) => void;
  inventory?: InventoryItem[];
}

export const SiteBillingView: React.FC<SiteBillingViewProps> = ({
  trips = [],
  settings,
  onViewReceipt,
  onUpdateTripPayment,
  inventory = [],
}) => {
  const safeTrips = trips || [];

  // Extract unique site / destination names from trips
  const uniqueSites = useMemo(() => {
    const siteMap = new Map<string, number>();
    safeTrips.forEach(t => {
      const site = t.destination?.trim() || 'Unspecified';
      siteMap.set(site, (siteMap.get(site) || 0) + 1);
    });
    return Array.from(siteMap.entries()).map(([site, count]) => ({ site, count }));
  }, [safeTrips]);

  // State
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showPrintStatementModal, setShowPrintStatementModal] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Settlement Modal State
  const [settleTrip, setSettleTrip] = useState<Trip | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | string>('');
  const [settleDueDate, setSettleDueDate] = useState<string>('');
  const [settleMode, setSettleMode] = useState<'full' | 'partial'>('full');

  const handleOpenSettleModal = (trip: Trip) => {
    setSettleTrip(trip);
    const remainingDebt = trip.paymentStatus === 'paid' 
      ? 0 
      : trip.paymentStatus === 'partial' 
        ? (trip.dueAmount || 0) 
        : (trip.dueAmount !== undefined ? trip.dueAmount : (trip.totalAmount || 0));
    setSettleAmount(remainingDebt);
    setSettleDueDate(trip.dueDate || '');
    setSettleMode('full');
  };

  const handleConfirmSettlement = (type: 'full' | 'partial') => {
    if (!settleTrip || !onUpdateTripPayment) return;

    if (type === 'full') {
      onUpdateTripPayment(settleTrip.id, 'paid', settleTrip.totalAmount || 0, 0, undefined);
    } else {
      const payingNow = typeof settleAmount === 'number' ? settleAmount : parseFloat(settleAmount) || 0;
      const currentPaid = settleTrip.paidAmount || (settleTrip.paymentStatus === 'paid' ? (settleTrip.totalAmount || 0) : 0);
      const total = settleTrip.totalAmount || 0;
      const newPaid = Math.min(total, currentPaid + Math.max(0, payingNow));
      const newDue = Math.max(0, total - newPaid);
      const newStatus: PaymentStatus = newDue === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      onUpdateTripPayment(settleTrip.id, newStatus, newPaid, newDue, settleDueDate || undefined);
    }
    setSettleTrip(null);
  };

  const handleSyncToSupabase = async () => {
    if (!settings?.supabaseUrl || !settings?.supabaseAnonKey) {
      setSyncFeedback('⚠️ Supabase URL နှင့် Key မရှိသေးပါ။ Settings တွင် ထည့်သွင်းပေးပါ။');
      setTimeout(() => setSyncFeedback(null), 4000);
      return;
    }
    setIsSyncingSheet(true);
    try {
      const res = await syncAllTripsToSupabase(filteredTrips, settings);
      setSyncFeedback(res.success ? `✅ ဆိုက်ဘေလ်နှင့် အကြွေးစာရင်း (${filteredTrips.length} ခု) ကို Supabase သို့ ပို့ပြီးပါပြီ!` : `❌ ${res.message}`);
    } catch (e: any) {
      setSyncFeedback(`❌ Error: ${e.message}`);
    } finally {
      setIsSyncingSheet(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - (now.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return safeTrips
      .filter((trip) => {
        // Site filter
        if (selectedSite !== 'all' && trip.destination !== selectedSite) {
          return false;
        }

        // Search query (matches site, customer, voucher, car number, driver)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesQuery =
            (trip.destination || '').toLowerCase().includes(q) ||
            (trip.customerName && trip.customerName.toLowerCase().includes(q)) ||
            (trip.tripNumber || '').toLowerCase().includes(q) ||
            (trip.licensePlate || '').toLowerCase().includes(q) ||
            (trip.driverName || '').toLowerCase().includes(q);
          if (!matchesQuery) return false;
        }

        // Date filter
        const tripTime = new Date(trip.createdAt).getTime();
        if (dateFilter === 'today' && tripTime < startOfToday) return false;
        if (dateFilter === 'this_week' && tripTime < startOfWeek) return false;
        if (dateFilter === 'this_month' && tripTime < startOfMonth) return false;
        if (dateFilter === 'custom') {
          if (startDate) {
            const start = new Date(startDate).getTime();
            if (tripTime < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
            if (tripTime > end) return false;
          }
        }

        // Material filter
        if (selectedMaterial !== 'all' && trip.materialType !== selectedMaterial) return false;

        // Delivery Status filter
        if (selectedStatus !== 'all' && trip.status !== selectedStatus) return false;

        // Payment / Debt status filter
        if (selectedPaymentStatus === 'debt_only') {
          if (trip.paymentStatus === 'paid') return false;
        } else if (selectedPaymentStatus !== 'all' && trip.paymentStatus !== selectedPaymentStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [safeTrips, selectedSite, searchQuery, dateFilter, startDate, endDate, selectedMaterial, selectedStatus, selectedPaymentStatus, sortAsc]);

  // Aggregate totals
  const totalTripsCount = filteredTrips.length;
  const totalVolume = useMemo(() => filteredTrips.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0), [filteredTrips]);
  const totalBillingAmount = useMemo(() => filteredTrips.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0), [filteredTrips]);
  
  const totalPaidAmount = useMemo(() => filteredTrips.reduce((sum, t) => {
    if (t.paymentStatus === 'paid') return sum + (Number(t.totalAmount) || 0);
    if (t.paymentStatus === 'partial') return sum + (Number(t.paidAmount) || 0);
    return sum + (Number(t.paidAmount) || 0);
  }, 0), [filteredTrips]);

  const totalOutstandingDebt = useMemo(() => filteredTrips.reduce((sum, t) => {
    if (t.paymentStatus === 'paid') return sum;
    if (t.paymentStatus === 'unpaid') return sum + (t.dueAmount !== undefined ? Number(t.dueAmount) : (Number(t.totalAmount) || 0));
    if (t.paymentStatus === 'partial') return sum + (Number(t.dueAmount) || 0);
    return sum;
  }, 0), [filteredTrips]);

  const collectionRate = totalBillingAmount > 0 
    ? Math.round((totalPaidAmount / totalBillingAmount) * 100) 
    : 100;

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTrips.length === 0) return;

    const siteLabel = selectedSite === 'all' ? 'All_Sites' : selectedSite.replace(/[^a-zA-Z0-9]/g, '_');
    const headers = [
      'No (စဉ်)',
      'Date (ရက်စွဲ)',
      'Voucher No (ဘောက်ချာအမှတ်)',
      'Car Number (ကားနံပါတ်)',
      'Driver Name (ယာဉ်မောင်း)',
      'Material (ပစ္စည်း)',
      'Volume Kyin (ကျင်း)',
      'Rate MMK (နှုန်း)',
      'Total Billing MMK (စုစုပေါင်းကျသင့်ငွေ)',
      'Paid MMK (ရှင်းပြီးငွေ)',
      'Debt Due MMK (ကျန်အကြွေး)',
      'Payment Status (ငွေပေးချေမှု)',
      'Destination / Site (ဆိုက်/နေရာ)',
      'Customer (ဝယ်သူ)',
      'Delivery Status (ပို့ဆောင်မှု)'
    ];

    const rows = filteredTrips.map((t, index) => {
      const mat = getMaterialLabel(t.materialType, inventory);
      const payLabel = t.paymentStatus === 'paid' ? 'Paid (ရှင်းပြီး)' : t.paymentStatus === 'partial' ? 'Partial (တစိတ်တပိုင်း)' : 'Unpaid (မရှင်းရသေး)';
      const statusLabel = t.status === 'delivered' ? 'Delivered (ပို့ပြီး)' : 'In Transit (ပို့ဆောင်နေဆဲ)';
      const paid = t.paidAmount || (t.paymentStatus === 'paid' ? t.totalAmount : 0) || 0;
      const due = t.paymentStatus === 'paid' ? 0 : (t.dueAmount !== undefined ? t.dueAmount : t.totalAmount) || 0;

      return [
        index + 1,
        `"${new Date(t.createdAt).toLocaleDateString()} ${t.formattedTime || ''}"`,
        `"${t.tripNumber}"`,
        `"${t.licensePlate}"`,
        `"${t.driverName}"`,
        `"${mat.en} (${mat.my})"`,
        t.quantity || 0,
        t.unitPrice || 0,
        t.totalAmount || 0,
        paid,
        due,
        `"${payLabel}"`,
        `"${t.destination}"`,
        `"${t.customerName || ''}"`,
        `"${statusLabel}"`
      ].join(',');
    });

    // Summary row
    const summaryRow = [
      'TOTAL (စုစုပေါင်း)',
      '',
      '',
      '',
      '',
      '',
      totalVolume,
      '',
      totalBillingAmount,
      totalPaidAmount,
      totalOutstandingDebt,
      `"Collection: ${collectionRate}%"`,
      `"Total Trips: ${totalTripsCount}"`,
      '',
      ''
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${siteLabel}_Billing_Debt_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Browser Print
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8c3ad]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#f59e0b]/20 text-[#855300] p-2.5 rounded-xl">
              <Building2 className="w-5 h-5 text-[#855300]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-xl text-[#151c27]">
                  ဆိုက်ဘေလ်နှင့် အကြွေးစာရင်း (Site Billing & Debt Settlement)
                </h2>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  Real-time Accounts
                </span>
              </div>
              <p className="text-xs text-[#534434] mt-0.5">
                ဆိုက်အလိုက် ဘေလ်ရှင်းတမ်း၊ ကောက်ခံပြီးငွေနှင့် ကျန်ရှိသောအကြွေးစာရင်းများကို စီမံခန့်ခွဲပါ
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Print Statement */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {settings?.supabaseUrl && (
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncingSheet || filteredTrips.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Sync current site billing data directly to Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheet ? 'Syncing...' : 'Sync to Supabase'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredTrips.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#f0f3ff] hover:bg-[#e7eefe] text-[#855300] border border-[#d8c3ad] rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Download Site Billing list as CSV Excel file"
          >
            <Download className="w-4 h-4 text-[#855300]" />
            <span>CSV ဒေါင်းလုဒ်</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintStatementModal(true)}
            disabled={filteredTrips.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#855300] hover:bg-[#653e00] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            title="Print Site Billing Voucher & Statement Slip"
          >
            <Printer className="w-4 h-4" />
            <span>ဘေလ်ရှင်းတမ်း ပရင့်ထုတ်မည်</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards for Billing & Outstanding Debt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billing Amount */}
        <div className="bg-white p-4 rounded-2xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#653e00] uppercase">
            <span>စုစုပေါင်း ကျသင့်ငွေ (Total Billing)</span>
            <DollarSign className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#151c27]">
              {totalBillingAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-500">MMK</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            {totalTripsCount} ခေါက် • {totalVolume.toLocaleString()} ကျင်း
          </p>
        </div>

        {/* Total Collected / Paid */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase">
            <span>ကောက်ခံရရှိငွေ (Paid / Collected)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-700">
              {totalPaidAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-800">MMK</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${collectionRate}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">{collectionRate}%</span>
          </div>
        </div>

        {/* Total Outstanding Debt */}
        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-red-800 uppercase">
            <span>ကျန်ရှိ အကြွေးစာရင်း (Outstanding Debt)</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-red-700">
              {totalOutstandingDebt.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-red-800">MMK</span>
          </div>
          <p className="text-[11px] text-red-600 mt-1 font-semibold">
            {totalOutstandingDebt > 0 ? `${(totalOutstandingDebt / 100000).toFixed(2)} သိန်းကျပ် ကျန်ရှိဆဲ` : '✓ အကြွေးအားလုံး ရှင်းပြီး'}
          </p>
        </div>

        {/* Selected Site / Filter Status */}
        <div className="bg-white p-4 rounded-2xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>ရွေးချယ်ထားသော ဆိုက်</span>
            <MapPin className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-2 font-extrabold text-base text-[#151c27] truncate" title={selectedSite === 'all' ? 'ဆိုက်အားလုံး' : selectedSite}>
            {selectedSite === 'all' ? (searchQuery ? `"${searchQuery}"` : 'ဆိုက်အားလုံး (All Sites)') : selectedSite}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {filteredTrips.filter(t => t.paymentStatus !== 'paid').length} ခု ငွေရှင်းရန် ကျန်ရှိ
          </p>
        </div>
      </div>

      {/* Site Quick Select Bar & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-[#d8c3ad]/70 shadow-xs flex flex-col gap-4">
        {/* Quick Select Pills for Unique Sites */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#534434] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#855300]" />
              <span>ဆိုက်အမြန်ရွေးရန် (Quick Select Site):</span>
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {uniqueSites.length} ဆိုက်တွေ့ရှိသည်
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedSite('all');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap font-bold shrink-0 cursor-pointer ${
                selectedSite === 'all' && !searchQuery
                  ? 'bg-[#855300] text-white border-[#855300] shadow-xs'
                  : 'bg-[#f9f9ff] text-[#534434] border-[#d8c3ad] hover:bg-[#f0f3ff]'
              }`}
            >
              ဆိုက်အားလုံး (All - {safeTrips.length})
            </button>

            {uniqueSites.map(({ site, count }) => {
              const isSelected = selectedSite === site;
              return (
                <button
                  key={site}
                  type="button"
                  onClick={() => {
                    setSelectedSite(site);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#855300] text-white border-[#855300] font-bold shadow-xs'
                      : 'bg-[#f9f9ff] text-[#534434] border-[#d8c3ad] hover:bg-[#e7eefe]'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-[#f59e0b]" />
                  <span>{site}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/25 text-white' : 'bg-[#e7eefe] text-[#005ac2]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[#d8c3ad]/40">
          {/* Search Input */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ဆိုက် / ဝယ်သူ / ကားနံပါတ်..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl focus:outline-none focus:border-[#855300] text-[#151c27]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment & Debt Status Filter */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl focus:outline-none focus:border-[#855300] text-[#151c27] font-bold cursor-pointer"
            >
              <option value="all">ငွေပေးချေမှု အားလုံး</option>
              <option value="debt_only">⚠️ အကြွေးကျန်များသာ (Debt Only)</option>
              <option value="unpaid">❌ မရှင်းရသေး (Unpaid)</option>
              <option value="partial">⏳ တစိတ်တပိုင်း (Partial)</option>
              <option value="paid">✓ ရှင်းပြီး (Paid)</option>
            </select>
          </div>

          {/* Date Period Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl focus:outline-none focus:border-[#855300] text-[#151c27] font-medium cursor-pointer"
            >
              <option value="all">ကာလအားလုံး (All Time)</option>
              <option value="today">ယနေ့ (Today)</option>
              <option value="this_week">ဒီအပတ် (This Week)</option>
              <option value="this_month">ဒီလ (This Month)</option>
              <option value="custom">စိတ်ကြိုက်ရက်စွဲ (Custom Date)</option>
            </select>
          </div>

          {/* Material Type */}
          <div>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl focus:outline-none focus:border-[#855300] text-[#151c27] font-medium cursor-pointer"
            >
              <option value="all">ပစ္စည်း အားလုံး</option>
              {Object.entries(MATERIAL_LABELS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.en} ({item.my})
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl focus:outline-none focus:border-[#855300] text-[#151c27] font-medium cursor-pointer"
            >
              <option value="all">ပို့ဆောင်မှု အားလုံး</option>
              <option value="delivered">✓ ပို့ဆောင်ပြီး (Delivered)</option>
              <option value="on_the_way">🚚 ပို့ဆောင်ဆဲ (In Transit)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateFilter === 'custom' && (
          <div className="bg-[#f0f3ff] p-3 rounded-xl border border-[#d8c3ad] flex flex-wrap items-center gap-3 text-xs animate-fade-in">
            <span className="font-bold text-[#534434] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#855300]" /> ရက်စွဲ သတ်မှတ်ရန်:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">မှ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#d8c3ad] rounded-lg text-xs text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">ထိ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#d8c3ad] rounded-lg text-xs text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-red-600 hover:underline ml-auto cursor-pointer"
              >
                Reset Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Itemized Billing & Debt Table */}
      <div className="bg-white rounded-2xl border border-[#d8c3ad]/70 shadow-xs overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="px-5 py-3.5 bg-[#f0f3ff] border-b border-[#d8c3ad]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#855300]" />
            <span className="font-bold text-sm text-[#151c27]">
              ဆိုက်ပြေစာနှင့် အကြွေးစာရင်းများ (Site Billing & Debt Records)
            </span>
            <span className="text-xs text-gray-500">
              ({filteredTrips.length} records)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-gray-50 border border-[#d8c3ad] rounded-lg text-[#534434] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#855300]" />
            <span>{sortAsc ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>

        {/* Table Content */}
        {filteredTrips.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Building2 className="w-10 h-10 text-gray-300" />
            <p className="font-semibold text-sm">ရှာဖွေမှုနှင့် ကိုက်ညီသော စာရင်းမရှိပါ</p>
            <p className="text-xs text-gray-400">ဆိုက်အမည် သို့မဟုတ် စစ်ထုတ်မှုများကို ပြန်လည်စစ်ဆေးပါ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f9f9ff] text-[#534434] font-bold border-b border-[#d8c3ad]">
                <tr>
                  <th className="px-4 py-3 text-center w-10">စဉ်</th>
                  <th className="px-4 py-3">ရက်စွဲ/အချိန်</th>
                  <th className="px-4 py-3">ဘောက်ချာ</th>
                  <th className="px-4 py-3">ဆိုက်/ဝယ်သူ</th>
                  <th className="px-4 py-3">ယာဉ်/ယာဉ်မောင်း</th>
                  <th className="px-4 py-3">ပစ္စည်း/ပမာဏ</th>
                  <th className="px-4 py-3 text-right">ကျသင့်ငွေ</th>
                  <th className="px-4 py-3 text-center">ငွေပေးချေမှု/အကြွေး</th>
                  <th className="px-4 py-3 text-center">လုပ်ဆောင်ချက်</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8c3ad]/40 text-[#151c27]">
                {filteredTrips.map((trip, idx) => {
                  const mat = getMaterialLabel(trip.materialType, inventory);
                  const isPaid = trip.paymentStatus === 'paid';
                  const isUnpaid = trip.paymentStatus === 'unpaid';
                  const paid = trip.paidAmount || (isPaid ? (trip.totalAmount || 0) : 0);
                  const due = isPaid ? 0 : (trip.dueAmount !== undefined ? trip.dueAmount : (trip.totalAmount || 0));

                  return (
                    <tr 
                      key={trip.id}
                      className={`hover:bg-[#f0f3ff]/60 transition-colors ${
                        isUnpaid ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* No. */}
                      <td className="px-4 py-3.5 text-center font-bold text-gray-500">
                        {idx + 1}
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {trip.formattedTime || ''}
                        </div>
                      </td>

                      {/* Voucher ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#855300] bg-[#ffddb8]/40 px-2 py-0.5 rounded border border-[#f59e0b]/40">
                          {trip.tripNumber}
                        </span>
                      </td>

                      {/* Site / Customer */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[#151c27] truncate max-w-[180px]">
                          {trip.destination}
                        </div>
                        {trip.customerName && (
                          <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
                            {trip.customerName}
                          </div>
                        )}
                      </td>

                      {/* Car / Driver */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">{trip.driverName}</div>
                        <span className="font-mono text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          {trip.licensePlate}
                        </span>
                      </td>

                      {/* Material & Volume */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded inline-block"
                          style={{ backgroundColor: mat.bg, color: mat.color }}
                        >
                          {mat.my} ({trip.quantity} ကျင်း)
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          @ {(trip.unitPrice || 0).toLocaleString()} Ks
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap font-extrabold text-gray-900 font-mono">
                        {(trip.totalAmount || 0).toLocaleString()} Ks
                      </td>

                      {/* Payment Status & Debt */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isUnpaid 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? '✓ ရှင်းပြီး' : isUnpaid ? '❌ မရှင်းရသေး' : '⏳ တစိတ်တပိုင်း'}
                          </span>

                          {!isPaid && (
                            <div className="text-[11px] font-mono font-bold text-red-600">
                              ကျန်ငွေ: {due.toLocaleString()} Ks
                            </div>
                          )}
                          {trip.paymentStatus === 'partial' && (
                            <div className="text-[10px] font-mono text-gray-500">
                              ပေးပြီး: {paid.toLocaleString()} Ks
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onUpdateTripPayment && !isPaid && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettleModal(trip)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                              title="Settle Debt or record payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>ငွေရှင်းမည်</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onViewReceipt(trip)}
                            className="px-2.5 py-1 bg-[#f0f3ff] hover:bg-[#e7eefe] text-[#855300] font-bold text-[11px] rounded-lg border border-[#d8c3ad] transition-colors cursor-pointer flex items-center gap-1"
                            title="View Voucher Receipt"
                          >
                            <FileText className="w-3 h-3" />
                            <span>ပြေစာ</span>
                          </button>
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

      {/* Settle Debt / Payment Modal */}
      {settleTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-[#151c27] via-[#242e42] to-[#151c27] p-5 text-white relative">
              <button
                onClick={() => setSettleTrip(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/40">
                  <CreditCard className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-black text-base">ဘေလ်နှင့် အကြွေးရှင်းလင်းရန် (Debt Settlement)</h3>
                  <p className="text-xs text-gray-300 font-mono">
                    ဘောက်ချာ: {settleTrip.tripNumber} • {settleTrip.destination}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Trip Details Card */}
              <div className="bg-[#f9f9ff] p-3.5 rounded-xl border border-[#d8c3ad]/60 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">စုစုပေါင်း ကျသင့်ငွေ:</span>
                  <span className="font-extrabold text-gray-900 font-mono">{(settleTrip.totalAmount || 0).toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ပေးသွင်းပြီးငွေ:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {(settleTrip.paidAmount || (settleTrip.paymentStatus === 'paid' ? settleTrip.totalAmount : 0) || 0).toLocaleString()} MMK
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="font-bold text-red-700">လက်ရှိကျန်ရှိ အကြွေး:</span>
                  <span className="font-black text-red-600 font-mono">
                    {(settleTrip.paymentStatus === 'paid' ? 0 : (settleTrip.dueAmount !== undefined ? settleTrip.dueAmount : settleTrip.totalAmount) || 0).toLocaleString()} MMK
                  </span>
                </div>
              </div>

              {/* Settle Mode Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettleMode('full')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settleMode === 'full'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>အကြေရှင်းမည် (Full)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettleMode('partial')}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settleMode === 'partial'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>တစိတ်တပိုင်း (Partial)</span>
                </button>
              </div>

              {/* Partial Payment Amount Input */}
              {settleMode === 'partial' && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ယခု ပေးသွင်းမည့်ငွေ ပမာဏ (Amount Paying Now - MMK) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={settleTrip.paymentStatus === 'paid' ? 0 : (settleTrip.dueAmount !== undefined ? settleTrip.dueAmount : settleTrip.totalAmount) || 0}
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[#855300]"
                      placeholder="ပေးသွင်းမည့် ငွေပမာဏ ရိုက်ထည့်ပါ"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      နောက်ဆုံး ပေးချေရမည့်ရက် (Next Due Date)
                    </label>
                    <input
                      type="date"
                      value={settleDueDate}
                      onChange={(e) => setSettleDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#855300]"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSettleTrip(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSettlement(settleMode)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  အတည်ပြုပြီး စာရင်းသွင်းမည်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Statement Modal */}
      {showPrintStatementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col p-6 shadow-2xl border border-gray-200 my-auto">
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#855300]" />
                <h3 className="font-extrabold text-base text-[#151c27]">
                  ဆိုက်ဘေလ်နှင့် အကြွေးရှင်းတမ်း ပြေစာ (Site Billing & Debt Statement)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintStatementModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Statement Body */}
            <div className="overflow-y-auto py-4 pr-1 flex-1">
              <div className="p-6 bg-white border border-gray-300 rounded-xl space-y-5 print:border-none print:p-0">
                {/* Header */}
                <div className="text-center pb-4 border-b border-gray-300">
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">
                    {settings.companyName || 'Sand Logistics Pro'}
                  </h1>
                  <p className="text-xs text-gray-600 mt-1">
                    ဆိုက်အလိုက် ပစ္စည်းပို့ဆောင်မှု ဘေလ်ရှင်းတမ်း (Site Delivery & Billing Statement)
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {settings.companyPhone && `ဖုန်း: ${settings.companyPhone}`} {settings.companyAddress && `• လိပ်စာ: ${settings.companyAddress}`}
                  </p>
                </div>

                {/* Statement Summary Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">ဆိုက် / လုပ်ငန်းခွင် (Site Name):</span>
                    <span className="font-extrabold text-sm text-gray-900">
                      {selectedSite === 'all' ? 'ဆိုက်အားလုံး (All Recorded Sites)' : selectedSite}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-500 block">ထုတ်ပေးသည့်ရက်စွဲ (Issue Date):</span>
                    <span className="font-bold text-gray-900">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block">စုစုပေါင်း ကားခေါက်ရေ (Total Trips):</span>
                    <span className="font-bold text-gray-900">{totalTripsCount} ခေါက်</span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-500 block">ကာလ (Billing Period):</span>
                    <span className="font-medium text-gray-900">
                      {dateFilter === 'all' ? 'All Records' : dateFilter === 'today' ? 'Today' : dateFilter === 'this_week' ? 'This Week' : dateFilter === 'this_month' ? 'This Month' : `${startDate || 'Start'} to ${endDate || 'End'}`}
                    </span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 border-b border-gray-300 font-bold text-gray-900">
                      <tr>
                        <th className="p-2 text-center w-10">စဉ်</th>
                        <th className="p-2">ရက်စွဲ</th>
                        <th className="p-2">ဘောက်ချာ</th>
                        <th className="p-2">ကားနံပါတ်</th>
                        <th className="p-2">ပစ္စည်း</th>
                        <th className="p-2 text-center">ပမာဏ</th>
                        <th className="p-2 text-right">နှုန်း (Ks)</th>
                        <th className="p-2 text-right">ကျသင့်ငွေ (MMK)</th>
                        <th className="p-2 text-center">ငွေပေးချေမှု</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {filteredTrips.map((trip, idx) => {
                        const mat = getMaterialLabel(trip.materialType, inventory);
                        const isPaid = trip.paymentStatus === 'paid';
                        const isUnpaid = trip.paymentStatus === 'unpaid';

                        return (
                          <tr key={trip.id}>
                            <td className="p-2 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="p-2 whitespace-nowrap">{new Date(trip.createdAt).toLocaleDateString()}</td>
                            <td className="p-2 font-mono font-bold text-gray-900">{trip.tripNumber}</td>
                            <td className="p-2 font-mono">{trip.licensePlate} ({trip.driverName})</td>
                            <td className="p-2">{mat.en} ({mat.my})</td>
                            <td className="p-2 text-center font-bold text-[#855300]">{trip.quantity || 0} ကျင်း</td>
                            <td className="p-2 text-right">{(trip.unitPrice || 0).toLocaleString()}</td>
                            <td className="p-2 text-right font-bold text-gray-900">{(trip.totalAmount || 0).toLocaleString()}</td>
                            <td className="p-2 text-center font-semibold">
                              {isPaid ? 'ရှင်းပြီး' : isUnpaid ? 'မရှင်းရသေး' : 'တစိတ်တပိုင်း'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-amber-50 font-black text-xs text-gray-900 border-t-2 border-gray-400">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right font-bold">
                          စုစုပေါင်း ပမာဏ နှင့် ငွေပမာဏ:
                        </td>
                        <td className="p-2.5 text-center text-sm text-[#855300]">
                          {totalVolume.toLocaleString()} ကျင်း
                        </td>
                        <td className="p-2.5 text-right text-gray-500 font-normal">
                          Total Billing:
                        </td>
                        <td className="p-2.5 text-right text-sm text-[#855300]">
                          {totalBillingAmount.toLocaleString()} MMK
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Amount and Debt Summary Banner */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f0f3ff] p-3 rounded-xl border border-[#d8c3ad] text-xs">
                    <span className="text-gray-600 font-medium block">ကောက်ခံရရှိပြီးငွေ (Total Paid):</span>
                    <span className="font-extrabold text-sm text-emerald-700">
                      {totalPaidAmount.toLocaleString()} MMK ({collectionRate}%)
                    </span>
                  </div>

                  <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-right">
                    <span className="text-red-700 font-medium block">ကျန်ရှိသည့် အကြွေး (Outstanding Debt):</span>
                    <span className="font-extrabold text-sm text-red-700">
                      {totalOutstandingDebt.toLocaleString()} MMK
                    </span>
                  </div>
                </div>

                {/* Dual Signature Block */}
                <div className="grid grid-cols-2 gap-12 pt-8 mt-4 border-t border-gray-300 text-center text-xs">
                  <div>
                    <div className="border-b border-gray-500 pb-1 mb-1 font-semibold text-gray-900 h-8 flex items-end justify-center">
                      ................................................
                    </div>
                    <span className="text-[11px] text-gray-600 font-bold block">ဆိုက်တာဝန်ခံ / အင်ဂျင်နီယာ လက်မှတ်</span>
                    <span className="text-[10px] text-gray-400">(Site Supervisor / Project Engineer)</span>
                  </div>

                  <div>
                    <div className="border-b border-gray-500 pb-1 mb-1 font-semibold text-gray-900 h-8 flex items-end justify-center">
                      ................................................
                    </div>
                    <span className="text-[11px] text-gray-600 font-bold block">သဲသယ်ယူပို့ဆောင်ရေး မန်နေဂျာ လက်မှတ်</span>
                    <span className="text-[10px] text-gray-400">(Logistics & Dispatch Manager)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-[#d8c3ad]/60 print:hidden flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowPrintStatementModal(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-gray-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>ပိတ်မည် (Close)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintStatement}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>ပရင့်ထုတ်မည် / PDF သိမ်းမည် (Print / Save PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
