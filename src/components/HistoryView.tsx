import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Filter,
  Layers,
  ArrowUpDown,
  AlertTriangle,
  X,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { Trip, MaterialType, AppSettings } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';
import { syncAllTripsToGoogleSheet } from '../services/googleSheetsService';

interface HistoryViewProps {
  trips: Trip[];
  settings?: AppSettings;
  onViewReceipt: (trip: Trip) => void;
  onUpdateTripStatus: (tripId: string, status: Trip['status']) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddNewTrip: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  trips,
  settings,
  onViewReceipt,
  onUpdateTripStatus,
  onDeleteTrip,
  onAddNewTrip,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // In-App Delete Confirmation Modal state (Replaces window.confirm which fails in iframes)
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  // Memoized Filtering & Sorting to prevent render loops
  const filteredTrips = useMemo(() => {
    return trips
      .filter((trip) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          trip.tripNumber.toLowerCase().includes(query) ||
          trip.driverName.toLowerCase().includes(query) ||
          trip.licensePlate.toLowerCase().includes(query) ||
          trip.destination.toLowerCase().includes(query) ||
          (trip.customerName && trip.customerName.toLowerCase().includes(query));

        const matchesMaterial = selectedMaterial === 'all' || trip.materialType === selectedMaterial;
        const matchesStatus = selectedStatus === 'all' || trip.status === selectedStatus;

        return matchesSearch && matchesMaterial && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  }, [trips, searchTerm, selectedMaterial, selectedStatus, sortAsc]);

  const totalFilteredVolume = useMemo(() => {
    return filteredTrips.reduce((sum, t) => sum + (t.quantity || 0), 0);
  }, [filteredTrips]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [filteredTrips]);

  const totalFilteredFuelExpenses = useMemo(() => {
    return filteredTrips.reduce((sum, t) => sum + (t.fuelExpense || 0), 0);
  }, [filteredTrips]);

  const totalFilteredCarFees = useMemo(() => {
    return filteredTrips.reduce((sum, t) => sum + (t.carFee || 0), 0);
  }, [filteredTrips]);

  const totalFilteredDriverFees = useMemo(() => {
    return filteredTrips.reduce((sum, t) => sum + (t.driverFee || 0), 0);
  }, [filteredTrips]);

  // Execute confirmed deletion
  const handleConfirmDelete = () => {
    if (tripToDelete) {
      onDeleteTrip(tripToDelete.id);
      setTripToDelete(null);
    }
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Trip ID', 
      'Driver Name', 
      'License Plate', 
      'Material', 
      'Quantity (Kyin)', 
      'Destination', 
      'Customer', 
      'Unit Price', 
      'Total Amount (MMK)', 
      'Fuel Expense (MMK)',
      'Car Fee (MMK)',
      'Driver Fee (MMK)',
      'Net Amount (MMK)',
      'Status', 
      'Date Time'
    ];
    const rows = filteredTrips.map((t) => [
      t.tripNumber,
      `"${t.driverName}"`,
      t.licensePlate,
      t.materialType,
      t.quantity,
      `"${t.destination}"`,
      `"${t.customerName || ''}"`,
      t.unitPrice,
      t.totalAmount,
      t.fuelExpense || 0,
      t.carFee || 0,
      t.driverFee || 0,
      t.totalAmount - (t.fuelExpense || 0) - (t.carFee || 0) - (t.driverFee || 0),
      t.status,
      `"${t.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sand_trips_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      setSyncFeedback(res.success ? `✅ ${filteredTrips.length} records ကို Google Sheet သို့ ပို့ပြီးပါပြီ!` : `❌ ${res.message}`);
    } catch (e: any) {
      setSyncFeedback(`❌ Error: ${e.message}`);
    } finally {
      setIsSyncingSheet(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
        <div>
          <h2 className="font-extrabold text-xl text-[#151c27]">
            သဲကားစာရင်းမှတ်တမ်းများ (Trip History)
          </h2>
          <p className="text-xs text-[#534434] mt-0.5">
            စုစုပေါင်း {filteredTrips.length} ခေါက် • {totalFilteredVolume} ကျင်း • ရောင်းရငွေ: {totalFilteredAmount.toLocaleString()} Ks 
            {totalFilteredFuelExpenses > 0 || totalFilteredCarFees > 0 || totalFilteredDriverFees > 0 ? (
              <span className="ml-1 text-gray-700">
                (ဆီဖိုး: {totalFilteredFuelExpenses.toLocaleString()} Ks | ကားခ: {totalFilteredCarFees.toLocaleString()} Ks | ဒရိုင်ဘာ: {totalFilteredDriverFees.toLocaleString()} Ks)
              </span>
            ) : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {settings?.googleSheetUrl && (
            <button
              onClick={handleSyncToGoogleSheets}
              disabled={isSyncingSheet || filteredTrips.length === 0}
              className="inline-flex items-center gap-2 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#bbf7d0] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheet ? 'Syncing...' : 'Sync to Google Sheet'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-[#f0f3ff] hover:bg-[#e2e8f8] text-[#855300] font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-[#d8c3ad] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onAddNewTrip}
            className="inline-flex items-center gap-1.5 bg-[#855300] hover:bg-[#653e00] text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <span>+ စာရင်းအသစ်</span>
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

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#534434] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver, plate, site..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
          />
        </div>

        {/* Material Filter */}
        <div className="relative">
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
          >
            <option value="all">ပစ္စည်းအားလုံး (All Materials)</option>
            <option value="sand">သဲ (Sand)</option>
            <option value="soil">မြေ (Soil)</option>
            <option value="stone">ကျောက် (Stone)</option>
            <option value="gravel">ကျောက်စရစ် (Gravel)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
          >
            <option value="all">အခြေအနေအားလုံး (All Status)</option>
            <option value="delivered">ပို့ဆောင်ပြီး (Delivered)</option>
            <option value="on_the_way">ပို့ဆောင်နေဆဲ (On The Way)</option>
          </select>
        </div>

        {/* Sort Order */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-[#f9f9ff] hover:bg-[#e7eefe] border border-[#d8c3ad] rounded-lg text-[#534434] transition-colors"
        >
          <ArrowUpDown className="w-4 h-4 text-[#855300]" />
          <span>{sortAsc ? 'Oldest First (အရင်ဆုံးအရင်)' : 'Newest First (နောက်ဆုံးအရင်)'}</span>
        </button>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl border border-[#d8c3ad]/70 shadow-xs overflow-hidden">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Layers className="w-12 h-12 text-[#d8c3ad] mx-auto mb-3" />
            <h3 className="font-bold text-base text-[#151c27]">မှတ်တမ်းရှာမတွေ့ပါ (No Trips Found)</h3>
            <p className="text-xs text-[#534434] mt-1">သတ်မှတ်ထားသော filter နှင့် ကိုက်ညီသည့် စာရင်းမရှိပါ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f0f3ff] text-xs font-semibold text-[#534434] uppercase tracking-wider border-b border-[#d8c3ad]/40">
                <tr>
                  <th className="px-4 py-3">Trip ID</th>
                  <th className="px-4 py-3">Driver</th>
                  <th className="px-4 py-3">License Plate</th>
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3 text-right">Volume</th>
                  <th className="px-4 py-3 text-right">ရောင်းရငွေ</th>
                  <th className="px-4 py-3 text-right">စရိတ်များ (Expenses)</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8c3ad]/30">
                {filteredTrips.map((trip) => {
                  const mat = MATERIAL_LABELS[trip.materialType] || { my: trip.materialType, en: trip.materialType };
                  return (
                    <tr key={trip.id} className="hover:bg-[#f9f9ff] transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#855300] whitespace-nowrap">
                        {trip.tripNumber}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#151c27] whitespace-nowrap">
                        {trip.driverName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#534434] font-medium whitespace-nowrap">
                        {trip.licensePlate}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-[#e7eefe] text-[#131b2e] border border-[#d8c3ad]/50">
                          {mat.en} ({mat.my})
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-[#151c27]">
                        {trip.quantity} <span className="text-xs font-normal text-[#534434]">ကျင်း</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#855300] text-xs whitespace-nowrap">
                        {trip.totalAmount.toLocaleString()} Ks
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {(trip.fuelExpense || trip.carFee || trip.driverFee) ? (
                          <div className="text-xs space-y-0.5">
                            {trip.fuelExpense ? (
                              <div className="font-semibold text-amber-900">
                                ဆီ: {trip.fuelExpense.toLocaleString()} Ks
                              </div>
                            ) : null}
                            {trip.carFee ? (
                              <div className="font-medium text-[#855300]">
                                ကား: {trip.carFee.toLocaleString()} Ks
                              </div>
                            ) : null}
                            {trip.driverFee ? (
                              <div className="text-[11px] text-[#005ac2] font-medium">
                                ဒရိုင်ဘာ: {trip.driverFee.toLocaleString()} Ks
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#534434] max-w-[160px] truncate" title={trip.destination}>
                        {trip.destination}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {trip.status === 'delivered' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateTripStatus(trip.id, 'on_the_way')}
                            title="ပို့ဆောင်နေဆဲသို့ ပြောင်းမည်"
                            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 
                            <span>✓ ပို့ပြီး</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateTripStatus(trip.id, 'delivered')}
                            title="ပို့ဆောင်ပြီးအဖြစ် ပြောင်းမည်"
                            className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-300 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> 
                            <span>🚚 ပို့ဆောင်နေဆဲ</span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewReceipt(trip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#855300] bg-[#f0f3ff] hover:bg-[#ffddb8]/60 border border-[#d8c3ad] rounded-lg transition-colors"
                            title="View / Print Receipt Slip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Slip</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTripToDelete(trip)}
                            className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 border border-transparent hover:border-red-200 rounded-lg transition-colors"
                            title="စာရင်းဖျက်မည် (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* In-App Delete Confirmation Modal (100% Reliable in iframe preview) */}
      {tripToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setTripToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  စာရင်းဖျက်ရန် သေချာပါသလား?
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  အောက်ပါ ကားစာရင်းမှတ်တမ်းကို အပြီးတိုင် ဖျက်ပစ်ပါမည်။
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-800 flex flex-col gap-1">
                  <div><strong>ဘောက်ချာ ID:</strong> {tripToDelete.tripNumber}</div>
                  <div><strong>ယာဉ်မောင်း:</strong> {tripToDelete.driverName} ({tripToDelete.licensePlate})</div>
                  <div><strong>ပမာဏ:</strong> {tripToDelete.quantity} ကျင်း • {tripToDelete.totalAmount.toLocaleString()} Ks</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                မဖျက်တော့ပါ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>သေချာသည်၊ ဖျက်မည် (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
