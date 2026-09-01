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
  RefreshCw
} from 'lucide-react';
import { Trip, AppSettings, MaterialType } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';
import { syncAllTripsToGoogleSheet } from '../services/googleSheetsService';

interface SiteBillingViewProps {
  trips: Trip[];
  settings: AppSettings;
  onViewReceipt: (trip: Trip) => void;
}

export const SiteBillingView: React.FC<SiteBillingViewProps> = ({
  trips,
  settings,
  onViewReceipt,
}) => {
  // Extract unique site / destination names from trips
  const uniqueSites = useMemo(() => {
    const siteMap = new Map<string, number>();
    trips.forEach(t => {
      const site = t.destination?.trim() || 'Unspecified';
      siteMap.set(site, (siteMap.get(site) || 0) + 1);
    });
    return Array.from(siteMap.entries()).map(([site, count]) => ({ site, count }));
  }, [trips]);

  // State
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [showPrintStatementModal, setShowPrintStatementModal] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncToGoogleSheets = async () => {
    const url = settings?.googleSheetUrl;
    if (!url) {
      setSyncFeedback('⚠️ Google Sheet URL မရှိသေးပါ။ Settings တွင် ထည့်သွင်းပေးပါ။');
      setTimeout(() => setSyncFeedback(null), 4000);
      return;
    }
    setIsSyncingSheet(true);
    try {
      const res = await syncAllTripsToGoogleSheet(filteredTrips, url);
      setSyncFeedback(res.success ? `✅ ဆိုက်ဘေလ်စာရင်း (${filteredTrips.length} ခု) ကို Google Sheet သို့ ပို့ပြီးပါပြီ!` : `❌ ${res.message}`);
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

    return trips
      .filter((trip) => {
        // Site filter
        if (selectedSite !== 'all' && trip.destination !== selectedSite) {
          return false;
        }

        // Search query (matches site, customer, voucher, car number, driver)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesQuery =
            trip.destination.toLowerCase().includes(q) ||
            (trip.customerName && trip.customerName.toLowerCase().includes(q)) ||
            trip.tripNumber.toLowerCase().includes(q) ||
            trip.licensePlate.toLowerCase().includes(q) ||
            trip.driverName.toLowerCase().includes(q);
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

        // Status filter
        if (selectedStatus !== 'all' && trip.status !== selectedStatus) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [trips, selectedSite, searchQuery, dateFilter, startDate, endDate, selectedMaterial, selectedStatus, sortAsc]);

  // Aggregate totals
  const totalTripsCount = filteredTrips.length;
  const totalVolume = useMemo(() => filteredTrips.reduce((sum, t) => sum + (t.quantity || 0), 0), [filteredTrips]);
  const totalBillingAmount = useMemo(() => filteredTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0), [filteredTrips]);

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
      'Total Amount MMK (ကျသင့်ငွေ)',
      'Destination / Site (ဆိုက်/နေရာ)',
      'Customer (ဝယ်သူ)',
      'Status (အခြေအနေ)',
      'Notes (မှတ်ချက်)'
    ];

    const rows = filteredTrips.map((t, index) => {
      const mat = MATERIAL_LABELS[t.materialType]?.en || t.materialType;
      const statusLabel = t.status === 'delivered' ? 'Delivered (ပို့ပြီး)' : 'In Transit (ပို့ဆောင်နေဆဲ)';
      return [
        index + 1,
        `"${new Date(t.createdAt).toLocaleDateString()} ${t.formattedTime}"`,
        `"${t.tripNumber}"`,
        `"${t.licensePlate}"`,
        `"${t.driverName}"`,
        `"${mat}"`,
        t.quantity,
        t.unitPrice,
        t.totalAmount,
        `"${t.destination}"`,
        `"${t.customerName || ''}"`,
        `"${statusLabel}"`,
        `"${t.notes || ''}"`
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
      `"Total Trips: ${totalTripsCount}"`,
      '',
      '',
      ''
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${siteLabel}_Billing_Statement_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#f59e0b]/20 text-[#855300] p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-[#855300]" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-[#151c27]">
                ဆိုက်အလိုက် ဘေလ်ရှင်းတမ်း စာရင်း (Site Billing & Vouchers)
              </h2>
              <p className="text-xs text-[#534434] mt-0.5">
                Search site, calculate total delivered volumes, export CSV or print billing vouchers
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Print Statement */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {settings?.googleSheetUrl && (
            <button
              type="button"
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncingSheet || filteredTrips.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Sync current site billing data directly to Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheet ? 'Syncing...' : 'Sync to Google Sheet'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredTrips.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#f0f3ff] hover:bg-[#e7eefe] text-[#855300] border border-[#d8c3ad] rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Download Site Billing list as CSV Excel file"
          >
            <Download className="w-4 h-4 text-[#855300]" />
            <span>CSV ဒေါင်းလုဒ်</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintStatementModal(true)}
            disabled={filteredTrips.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#855300] hover:bg-[#653e00] text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            title="Print Site Billing Voucher & Statement Slip"
          >
            <Printer className="w-4 h-4" />
            <span>ဘေလ်ရှင်းတမ်း ပရင့်ထုတ်မည် (Print Voucher)</span>
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

      {/* Site Quick Select Bar & Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col gap-4">
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
              className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap font-bold shrink-0 cursor-pointer ${
                selectedSite === 'all' && !searchQuery
                  ? 'bg-[#855300] text-white border-[#855300] shadow-xs'
                  : 'bg-[#f9f9ff] text-[#534434] border-[#d8c3ad] hover:bg-[#f0f3ff]'
              }`}
            >
              ဆိုက်အားလုံး (All Sites - {trips.length})
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
                  className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 cursor-pointer ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#d8c3ad]/40">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ဆိုက် / ဝယ်သူ / ကားနံပါတ် ရှာရန်..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg focus:outline-none focus:border-[#855300] text-[#151c27]"
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

          {/* Date Period Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg focus:outline-none focus:border-[#855300] text-[#151c27] font-medium cursor-pointer"
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
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg focus:outline-none focus:border-[#855300] text-[#151c27] font-medium cursor-pointer"
            >
              <option value="all">ပစ္စည်းအားလုံး (All Materials)</option>
              <option value="sand">သဲ (Sand)</option>
              <option value="soil">မြေကြီး (Soil)</option>
              <option value="stone">ကျောက် (Stone)</option>
              <option value="gravel">ကျောက်စရစ် (Gravel)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg focus:outline-none focus:border-[#855300] text-[#151c27] font-medium cursor-pointer"
            >
              <option value="all">အခြေအနေ အားလုံး (All Status)</option>
              <option value="delivered">✓ ပို့ဆောင်ပြီး (Delivered)</option>
              <option value="on_the_way">🚚 ပို့ဆောင်ဆဲ (In Transit)</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker (Shown when dateFilter === 'custom') */}
        {dateFilter === 'custom' && (
          <div className="bg-[#f0f3ff] p-3 rounded-lg border border-[#d8c3ad] flex flex-wrap items-center gap-3 text-xs animate-fade-in">
            <span className="font-bold text-[#534434] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#855300]" /> ရက်စွဲ သတ်မှတ်ရန်:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">မှ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#d8c3ad] rounded-md text-xs text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">ထိ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-[#d8c3ad] rounded-md text-xs text-[#151c27] focus:outline-none focus:border-[#855300]"
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

      {/* Summary KPI Cards for Selected Site Billing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selected Site Name */}
        <div className="bg-white p-4 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>ဆိုက် / တည်နေရာ</span>
            <MapPin className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-2 font-extrabold text-base text-[#151c27] truncate" title={selectedSite === 'all' ? 'All Selected Sites' : selectedSite}>
            {selectedSite === 'all' ? (searchQuery ? `Search: "${searchQuery}"` : 'ဆိုက်အားလုံး (All Sites)') : selectedSite}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {totalTripsCount} ခေါက်စာရင်း တွက်ချက်ထားသည်
          </p>
        </div>

        {/* Total Trips */}
        <div className="bg-white p-4 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>ပို့ဆောင်မှု ခေါက်ရေ</span>
            <Truck className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#151c27]">{totalTripsCount}</span>
            <span className="text-xs font-semibold text-[#534434]">ခေါက်</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            ✓ {filteredTrips.filter(t => t.status === 'delivered').length} ပို့ဆောင်ပြီး
          </p>
        </div>

        {/* Total Delivered Volume in Kyin */}
        <div className="bg-white p-4 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>စုစုပေါင်း ပမာဏ</span>
            <Layers className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#855300]">{totalVolume.toLocaleString()}</span>
            <span className="text-xs font-semibold text-[#534434]">ကျင်း</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            1 ကျင်း = 100 Cu.Ft (ကုဗပေ)
          </p>
        </div>

        {/* Total Billing Amount */}
        <div className="bg-[#ffddb8]/30 p-4 rounded-xl border border-[#f59e0b]/50 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#653e00] uppercase">
            <span>စုစုပေါင်း ကျသင့်ငွေ (Billing Total)</span>
            <DollarSign className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#855300]">
              {totalBillingAmount.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#653e00]">MMK</span>
          </div>
          <p className="text-[11px] text-[#653e00] mt-1 font-semibold">
            {(totalBillingAmount / 100000).toFixed(2)} သိန်းကျပ်
          </p>
        </div>
      </div>

      {/* Main Itemized Billing Table */}
      <div className="bg-white rounded-xl border border-[#d8c3ad]/70 shadow-xs overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="px-5 py-3.5 bg-[#f0f3ff] border-b border-[#d8c3ad]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#855300]" />
            <span className="font-bold text-sm text-[#151c27]">
              ဆိုက်ပြေစာစာရင်း (Site Itemized Billing Vouchers)
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
                  <th className="px-4 py-3 text-center w-12">စဉ် (No.)</th>
                  <th className="px-4 py-3">ရက်စွဲ/အချိန် (Date & Time)</th>
                  <th className="px-4 py-3">ဘောက်ချာ (Voucher ID)</th>
                  <th className="px-4 py-3">ကားနံပါတ် (Car Number)</th>
                  <th className="px-4 py-3">ယာဉ်မောင်း (Driver)</th>
                  <th className="px-4 py-3">ပစ္စည်း (Material)</th>
                  <th className="px-4 py-3 text-center">ပမာဏ (Volume)</th>
                  <th className="px-4 py-3 text-right">၁ ကျင်းနှုန်း (Rate)</th>
                  <th className="px-4 py-3 text-right">ကျသင့်ငွေ (Total MMK)</th>
                  <th className="px-4 py-3 text-center">အခြေအနေ</th>
                  <th className="px-4 py-3 text-center">Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8c3ad]/40 text-[#151c27]">
                {filteredTrips.map((trip, idx) => {
                  const mat = MATERIAL_LABELS[trip.materialType] || { en: trip.materialType, my: trip.materialType };
                  return (
                    <tr 
                      key={trip.id}
                      className="hover:bg-[#f0f3ff]/60 transition-colors"
                    >
                      {/* No. (စဉ်) */}
                      <td className="px-4 py-3.5 text-center font-bold text-gray-500">
                        {idx + 1}
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {trip.formattedTime}
                        </div>
                      </td>

                      {/* Voucher ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#855300] bg-[#ffddb8]/40 px-2 py-0.5 rounded border border-[#f59e0b]/40">
                          {trip.tripNumber}
                        </span>
                      </td>

                      {/* Car / License Plate */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-300">
                          {trip.licensePlate}
                        </span>
                      </td>

                      {/* Driver */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-[#151c27]">{trip.driverName}</div>
                        {trip.customerName && (
                          <div className="text-[10px] text-gray-500 truncate max-w-[140px]">
                            {trip.customerName}
                          </div>
                        )}
                      </td>

                      {/* Material */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-800">
                          {mat.en} ({mat.my})
                        </span>
                      </td>

                      {/* Volume (Quantity in Kyin) */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="font-extrabold text-sm text-[#855300]">
                          {trip.quantity}
                        </span>
                        <span className="text-[11px] text-gray-600 ml-1">ကျင်း</span>
                      </td>

                      {/* Unit Price (Rate) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap font-medium text-gray-700">
                        {trip.unitPrice.toLocaleString()} Ks
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap font-extrabold text-gray-900">
                        {trip.totalAmount.toLocaleString()} Ks
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {trip.status === 'delivered' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ပို့ပြီး
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> ပို့ဆဲ
                          </span>
                        )}
                      </td>

                      {/* Action: View Individual Receipt Slip */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trip)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#855300] bg-[#f0f3ff] hover:bg-[#ffddb8]/60 border border-[#d8c3ad] rounded-lg transition-colors cursor-pointer"
                          title="View Single Trip Voucher"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer with Consolidated Totals */}
              <tfoot className="bg-[#f0f3ff] font-extrabold text-xs text-[#151c27] border-t-2 border-[#d8c3ad]">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-gray-700">
                    စုစုပေါင်း (TOTAL SUMMARY - {totalTripsCount} Trips):
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-[#855300] font-black">
                    {totalVolume.toLocaleString()} ကျင်း
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 font-normal">
                    Avg Rate
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#855300] font-black">
                    {totalBillingAmount.toLocaleString()} MMK
                  </td>
                  <td colSpan={2} className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Printable Site Billing Statement & Voucher Modal */}
      {showPrintStatementModal && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowPrintStatementModal(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-[#d8c3ad] max-w-3xl w-full p-5 sm:p-8 shadow-2xl animate-scale-up relative my-6 max-h-[94vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-[#d8c3ad]/60 print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#855300]" />
                <span className="font-bold text-base text-[#855300]">
                  ဆိုက်အလိုက် သဲသယ်ယူပို့ဆောင်ခ ရှင်းတမ်းဘောက်ချာ (Site Billing Statement)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="inline-flex items-center gap-1.5 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintStatementModal(false)}
                  className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-gray-300 cursor-pointer"
                >
                  <X className="w-4 h-4 text-red-600" />
                  <span>ပိတ်မည်</span>
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="overflow-y-auto flex-1 my-3 pr-1">
              <div className="p-4 sm:p-6 bg-white print:p-0 flex flex-col gap-5 border border-dashed border-[#d8c3ad] rounded-xl print:border-none">
                {/* Statement Header */}
                <div className="text-center pb-4 border-b-2 border-gray-900">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Truck className="w-7 h-7 text-[#855300]" />
                    <h1 className="font-extrabold text-2xl text-[#855300] tracking-tight">
                      {settings.companyName}
                    </h1>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">{settings.companySubtext}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Hotline: {settings.phone}</p>
                  
                  <div className="mt-3 inline-block bg-[#f0f3ff] text-[#855300] border-2 border-[#855300] px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    SITE BILLING STATEMENT • သဲ/ကျောက် သယ်ယူပို့ဆောင်ခ ရှင်းတမ်းဘောက်ချာ
                  </div>
                </div>

                {/* Site & Billing Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-gray-500 block">ဆိုက်အမည် / တည်နေရာ (Site / Destination):</span>
                    <span className="font-extrabold text-sm text-gray-900">
                      {selectedSite === 'all' ? (searchQuery || 'ဆိုက်အားလုံး (Consolidated Sites)') : selectedSite}
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
                        <th className="p-2 text-center">ပမာဏ (ကျင်း)</th>
                        <th className="p-2 text-right">နှုန်း (Ks)</th>
                        <th className="p-2 text-right">ကျသင့်ငွေ (MMK)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {filteredTrips.map((trip, idx) => {
                        const mat = MATERIAL_LABELS[trip.materialType] || { en: trip.materialType, my: trip.materialType };
                        return (
                          <tr key={trip.id}>
                            <td className="p-2 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="p-2 whitespace-nowrap">{new Date(trip.createdAt).toLocaleDateString()}</td>
                            <td className="p-2 font-mono font-bold text-gray-900">{trip.tripNumber}</td>
                            <td className="p-2 font-mono">{trip.licensePlate} ({trip.driverName})</td>
                            <td className="p-2">{mat.en} ({mat.my})</td>
                            <td className="p-2 text-center font-bold text-[#855300]">{trip.quantity}</td>
                            <td className="p-2 text-right">{trip.unitPrice.toLocaleString()}</td>
                            <td className="p-2 text-right font-bold text-gray-900">{trip.totalAmount.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-amber-50 font-black text-xs text-gray-900 border-t-2 border-gray-400">
                      <tr>
                        <td colSpan={5} className="p-2.5 text-right font-bold">
                          စုစုပေါင်း ပမာဏ နှင့် ငွေပမာဏ (GRAND TOTAL):
                        </td>
                        <td className="p-2.5 text-center text-sm text-[#855300]">
                          {totalVolume.toLocaleString()} ကျင်း
                        </td>
                        <td className="p-2.5 text-right text-gray-500 font-normal">
                          Total Amount
                        </td>
                        <td className="p-2.5 text-right text-sm text-[#855300]">
                          {totalBillingAmount.toLocaleString()} MMK
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Amount in words banner */}
                <div className="bg-[#f0f3ff] p-3 rounded-lg border border-[#d8c3ad] flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">ရှင်းတမ်းငွေပမာဏ (Total In Words / Lakhs):</span>
                  <span className="font-extrabold text-sm text-[#855300]">
                    {(totalBillingAmount / 100000).toFixed(2)} သိန်းကျပ်တိတိ ({totalBillingAmount.toLocaleString()} MMK)
                  </span>
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

                {/* Footer Disclaimer */}
                <div className="text-center text-[10px] text-gray-400 pt-3 border-t border-dashed border-gray-200">
                  ဤရှင်းတမ်းအား စစ်ဆေးလက်ခံပြီးပါက ငွေပေးချေမှုအတွက် ဆောင်ရွက်ပေးပါရန် • Logistics Pro System
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
