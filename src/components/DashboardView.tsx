import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Layers, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  FileText,
  Building2,
  Package,
  Coins,
  AlertTriangle,
  PhoneCall,
  Calendar,
  Wallet,
  CheckCircle,
  X,
  CreditCard,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Trip, Driver, MaterialType, TabType, PaymentStatus, InventoryItem, CustomerOrderRequest } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';

interface DashboardViewProps {
  trips?: Trip[];
  drivers?: Driver[];
  inventory?: InventoryItem[];
  customerOrders?: CustomerOrderRequest[];
  onSelectTab: (tab: TabType) => void;
  onViewReceipt: (trip: Trip) => void;
  onUpdateTripStatus: (tripId: string, status: Trip['status']) => void;
  onDeleteTrip?: (tripId: string) => void;
  onUpdateTripPayment?: (
    tripId: string, 
    paymentStatus: PaymentStatus, 
    paidAmount: number, 
    dueAmount: number,
    dueDate?: string
  ) => void;
  onQuickDispatchOrder?: (order: CustomerOrderRequest) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trips = [],
  drivers = [],
  inventory = [],
  customerOrders = [],
  onSelectTab,
  onViewReceipt,
  onUpdateTripStatus,
  onDeleteTrip,
  onUpdateTripPayment,
  onQuickDispatchOrder,
}) => {
  const safeTrips = trips || [];
  const safeDrivers = drivers || [];
  const safeInventory = inventory || [];
  const safeOrders = customerOrders || [];

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [settleTrip, setSettleTrip] = useState<Trip | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | ''>('');
  const [settleDueDate, setSettleDueDate] = useState<string>('');
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  // Time-filtered trips
  const filteredTrips = useMemo(() => {
    const now = new Date();
    return safeTrips.filter(t => {
      const tripDate = new Date(t.createdAt);
      if (timeFilter === 'today') {
        return tripDate.toDateString() === now.toDateString();
      }
      if (timeFilter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
        return tripDate >= oneWeekAgo;
      }
      if (timeFilter === 'month') {
        return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [safeTrips, timeFilter]);

  // Key Calculations
  const totalTripsCount = filteredTrips.length;
  const totalVolume = filteredTrips.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalRevenue = filteredTrips.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  
  const totalExpenses = filteredTrips.reduce((acc, t) => {
    return acc + (t.fuelExpense || 0) + (t.carFee || 0) + (t.driverFee || 0);
  }, 0);
  const netEarnings = totalRevenue - totalExpenses;

  // Payments & Debts
  const totalPaidRevenue = filteredTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'paid') return acc + (t.totalAmount || 0);
    return acc + (t.paidAmount || 0);
  }, 0);

  const totalOutstandingDebt = filteredTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'unpaid') return acc + (t.totalAmount || 0);
    if (t.paymentStatus === 'partial') return acc + (t.dueAmount || 0);
    return acc + (t.dueAmount || 0);
  }, 0);

  const collectionRate = totalRevenue > 0 ? Math.round((totalPaidRevenue / totalRevenue) * 100) : 100;

  // Inventory Metrics
  const totalStockVolume = safeInventory.reduce((acc, item) => acc + Number(item.currentStock || 0), 0);
  const lowStockItems = safeInventory.filter(item => Number(item.currentStock) <= Number(item.minimumThreshold));

  // Active in-transit deliveries
  const inTransitTrips = safeTrips.filter(t => t.status === 'on_the_way' || t.status === 'loading');

  // Pending customer order requests
  const pendingOrders = safeOrders.filter(o => o.status === 'pending');

  const handleOpenSettleModal = (trip: Trip) => {
    setSettleTrip(trip);
    setSettleAmount(trip.dueAmount || (trip.paymentStatus === 'unpaid' ? trip.totalAmount : 0));
    setSettleDueDate(trip.dueDate || '');
  };

  const handleConfirmSettlement = (type: 'full' | 'partial') => {
    if (!settleTrip || !onUpdateTripPayment) return;

    if (type === 'full') {
      onUpdateTripPayment(settleTrip.id, 'paid', settleTrip.totalAmount, 0, undefined);
    } else {
      const payingNow = typeof settleAmount === 'number' ? settleAmount : 0;
      const currentPaid = settleTrip.paidAmount || (settleTrip.paymentStatus === 'paid' ? settleTrip.totalAmount : 0);
      const newPaid = Math.min(settleTrip.totalAmount, currentPaid + payingNow);
      const newDue = Math.max(0, settleTrip.totalAmount - newPaid);
      const newStatus: PaymentStatus = newDue === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      onUpdateTripPayment(settleTrip.id, newStatus, newPaid, newDue, settleDueDate || undefined);
    }

    setSettleTrip(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#151c27] tracking-tight">
              အဆင့်မြင့် စီမံခန့်ခွဲမှု ဒက်ရှ်ဘုတ် (Advanced Dashboard)
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            သဲ၊ ကျောက် သယ်ယူပို့ဆောင်မှု၊ စတိုလက်ကျန်၊ ယာဉ်လမ်းခရီးနှင့် ငွေစာရင်းများ အချိန်နှင့်တပြေးညီ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-white border border-[#d8c3ad] p-1 rounded-xl shadow-xs text-xs font-bold">
            {(['all', 'today', 'week', 'month'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  timeFilter === filter
                    ? 'bg-[#855300] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter === 'all' ? 'အားလုံး' : filter === 'today' ? 'ယနေ့' : filter === 'week' ? 'ယခုအပတ်' : 'ယခုလ'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('inventory')}
            className="px-3.5 py-2 bg-white border border-[#d8c3ad] hover:border-[#855300] text-[#151c27] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Package className="w-4 h-4 text-[#855300]" />
            <span>စတိုကြည့်မည်</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('add-trip')}
            className="px-4 py-2 bg-[#855300] hover:bg-[#653e00] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ကားခရီးစဉ်အသစ် (+ Dispatch)</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div 
          onClick={() => onSelectTab('inventory')}
          className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-amber-900 shadow-xs cursor-pointer hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">
              စတိုသတိပေးချက်: {lowStockItems.map(i => `${i.burmeseName} (${i.currentStock} ကျင်း)`).join(', ')} ကုန်လက်ကျန်နည်းနေပါသည်!
            </span>
          </div>
          <span className="text-xs font-black text-[#855300] flex items-center gap-1">
            <span>စတိုဖြည့်သွင်းရန်</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Delivered Volume */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ပို့ဆောင်ပြီးပမာဏ</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <Truck className="w-4 h-4 text-[#855300]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#151c27]">{totalVolume.toLocaleString()}</span>
            <span className="text-xs font-bold text-gray-500">ကျင်း (Kyin)</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            ခရီးစဉ်ပေါင်း {totalTripsCount} ကြိမ် • ယာဉ်မောင်း {drivers.length} ဦး
          </div>
        </div>

        {/* Live Yard Inventory */}
        <div 
          onClick={() => onSelectTab('inventory')}
          className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs cursor-pointer hover:border-[#855300] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">စတိုစုစုပေါင်းလက်ကျန်</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#151c27]">{totalStockVolume.toLocaleString()}</span>
            <span className="text-xs font-bold text-gray-500">ကျင်း (Kyin)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center justify-between">
            <span>{safeInventory.length} မျိုး လက်ကျန်ရှိ</span>
            <span className="underline">အသေးစိတ် →</span>
          </div>
        </div>

        {/* Revenue & Profit */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">စုစုပေါင်းရောင်းရငွေ</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{(totalRevenue / 100000).toFixed(1)}</span>
            <span className="text-xs font-bold text-gray-500">သိန်း ကျပ်</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-medium">
            အသားတင်: +{(netEarnings / 100000).toFixed(1)} သိန်း (စရိတ်နှုတ်ပြီး)
          </div>
        </div>

        {/* Debt & Collection Rate */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">အကြွေးကျန်ငွေ</span>
            <div className="p-2 bg-red-50 rounded-xl">
              <Coins className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-black ${totalOutstandingDebt > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {(totalOutstandingDebt / 100000).toFixed(1)}
            </span>
            <span className="text-xs font-bold text-gray-500">သိန်း ကျပ်</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            ရရှိမှုနှုန်း: <strong className="text-gray-700">{collectionRate}%</strong> (ရှင်းပြီး: {(totalPaidRevenue / 100000).toFixed(1)} သိန်း)
          </div>
        </div>
      </div>

      {/* Stock Health Quick Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#855300]" />
            <h2 className="font-extrabold text-[#151c27] text-sm sm:text-base">
              လက်ရှိ စတိုကုန်ကြမ်း လက်ကျန်အခြေအနေ (Real-Time Stock Health)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('inventory')}
            className="text-xs font-extrabold text-[#855300] hover:text-[#653e00] flex items-center gap-1 cursor-pointer"
          >
            <span>စတိုစီမံခန့်ခွဲမှုသို့ သွားမည်</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {safeInventory.map((item) => {
            const label = MATERIAL_LABELS[item.materialType];
            const isLow = Number(item.currentStock) <= Number(item.minimumThreshold);
            const pct = Math.min(100, Math.round((Number(item.currentStock) / Number(item.capacity || 200)) * 100));

            return (
              <div 
                key={item.id} 
                className={`p-3.5 rounded-xl border transition-all ${
                  isLow ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/70 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#151c27] truncate">{item.burmeseName}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                    isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.currentStock} {item.unit}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden my-1.5">
                  <div 
                    className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>အနိမ့်ဆုံး: {item.minimumThreshold} {item.unit}</span>
                  <span>{pct}% ပြည့်</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Live Dispatches + Customer Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active In-Transit Trucks */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
              <h3 className="font-extrabold text-[#151c27] text-sm sm:text-base">
                လမ်းခရီးရှိ ယာဉ်များ (Live In-Transit Deliveries)
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {inTransitTrips.length} Active
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {inTransitTrips.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                လက်ရှိ လမ်းခရီးရှိ ကားမရှိပါ။ အသစ်လွှတ်ရန် "+ ကားခရီးစဉ်အသစ်" ကို နှိပ်ပါ
              </div>
            ) : (
              inTransitTrips.map((trip) => {
                const label = MATERIAL_LABELS[trip.materialType];
                return (
                  <div 
                    key={trip.id}
                    className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-gray-800 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                          {trip.tripNumber}
                        </span>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: label.bg, color: label.color }}
                        >
                          {label.my} {trip.quantity} ကျင်း
                        </span>
                        <span className="font-semibold text-gray-900 truncate">
                          {trip.destination}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>ယာဉ်မောင်း: <strong>{trip.driverName}</strong> ({trip.licensePlate})</span>
                        <span>•</span>
                        <span>ထွက်ခွာချိန်: {trip.formattedTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {trip.phone && (
                        <a
                          href={`tel:${trip.phone}`}
                          title="Call Driver"
                          className="p-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onUpdateTripStatus(trip.id, 'delivered')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer"
                      >
                        ရောက်ရှိအတည်ပြု
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Customer Order Requests Queue */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#855300]" />
              <h3 className="font-extrabold text-[#151c27] text-sm sm:text-base">
                ဝယ်ယူသူများ မှာယူမှုတောင်းဆိုချက်များ (Customer Orders Queue)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('customer-portal')}
              className="text-xs font-bold text-[#855300] hover:text-[#653e00] flex items-center gap-1 cursor-pointer"
            >
              <span>ဆိုဒ်ဒက်ရှ်ဘုတ် →</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                စောင့်ဆိုင်းဆဲ ဝယ်ယူသူ မှာယူမှု မရှိပါ
              </div>
            ) : (
              pendingOrders.map((ord) => {
                const label = MATERIAL_LABELS[ord.materialType];
                return (
                  <div 
                    key={ord.id}
                    className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 truncate">{ord.customerName}</span>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: label.bg, color: label.color }}
                        >
                          {label.my} {ord.quantity} ကျင်း
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {ord.siteName} • လိုအပ်ရက်: <strong>{ord.preferredDate}</strong>
                      </div>
                      {ord.notes && (
                        <div className="text-[10px] text-gray-400 italic truncate mt-0.5">
                          "{ord.notes}"
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onQuickDispatchOrder) {
                            onQuickDispatchOrder(ord);
                          } else {
                            onSelectTab('add-trip');
                          }
                        }}
                        className="px-3 py-1.5 bg-[#855300] hover:bg-[#653e00] text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>ကားလွှတ်မည်</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Deliveries & Fast Settle Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-[#151c27] text-sm sm:text-base">
              လတ်တလော ခရီးစဉ်များနှင့် ငွေစာရင်း (Recent Dispatches & Billing)
            </h3>
            <p className="text-xs text-gray-400">ငွေပေးချေမှု ရှင်းရန် (Settle) ခလုတ်ကို နှိပ်ပါ</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('history')}
              className="text-xs font-bold text-[#855300] hover:underline cursor-pointer"
            >
              ခရီးစဉ်အားလုံး ကြည့်ရန် ({trips.length}) →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">ဘောက်ချာ</th>
                <th className="py-3 px-4">အချိန်</th>
                <th className="py-3 px-4">ယာဉ်မောင်း</th>
                <th className="py-3 px-4">ကုန်ကြမ်း</th>
                <th className="py-3 px-4">ပို့ဆောင်သည့်ဆိုဒ်</th>
                <th className="py-3 px-4 text-right">ကျသင့်ငွေ</th>
                <th className="py-3 px-4">ငွေရှင်းမှု</th>
                <th className="py-3 px-4 text-center">လုပ်ဆောင်ချက်</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredTrips.slice(0, 8).map((trip) => {
                const label = MATERIAL_LABELS[trip.materialType];
                const isPaid = trip.paymentStatus === 'paid';
                const isUnpaid = trip.paymentStatus === 'unpaid';

                return (
                  <tr key={trip.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{trip.tripNumber}</td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{trip.formattedTime}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{trip.driverName}</td>
                    <td className="py-3 px-4">
                      <span 
                        className="text-[10px] font-bold px-2 py-0.5 rounded inline-block"
                        style={{ backgroundColor: label.bg, color: label.color }}
                      >
                        {label.my} ({trip.quantity} ကျင်း)
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-medium text-gray-800">
                      {trip.destination}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#151c27]">
                      {trip.totalAmount?.toLocaleString()} MMK
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : isUnpaid ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPaid ? 'ရှင်းပြီး' : isUnpaid ? 'မရှင်းရသေး' : 'တစိတ်တပိုင်း'}
                      </span>
                      {trip.dueAmount && trip.dueAmount > 0 ? (
                        <div className="text-[10px] text-red-600 font-mono font-bold mt-0.5">
                          ကျန်: {(trip.dueAmount / 1000).toFixed(0)}k
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => handleOpenSettleModal(trip)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          >
                            ငွေရှင်း
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trip)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[#855300] font-bold text-[11px] rounded-lg border border-amber-200 transition-colors cursor-pointer"
                        >
                          ပြေစာ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Debt Modal */}
      {settleTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">ကြွေးကျန်ငွေရှင်းလင်းခြင်း</span>
                <h3 className="text-base font-black text-gray-900">{settleTrip.tripNumber} ({settleTrip.destination})</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSettleTrip(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">စုစုပေါင်းကျသင့်ငွေ:</span>
                  <span className="font-mono font-bold">{settleTrip.totalAmount.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ပေးချေရန် ကျန်ငွေ:</span>
                  <span className="font-mono font-bold text-red-600">
                    {(settleTrip.dueAmount || settleTrip.totalAmount).toLocaleString()} MMK
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ယခုပေးချေမည့် ငွေပမာဏ (MMK)
                </label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleConfirmSettlement('partial')}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200 cursor-pointer"
                >
                  တစိတ်တပိုင်းရှင်း
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSettlement('full')}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  အကြေရှင်းမည် (Full)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
