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
  Navigation,
  Banknote,
  Wallet,
  Coins,
  Fuel,
  Trash2,
  AlertTriangle,
  X,
  CreditCard,
  PhoneCall,
  Calendar,
  Sparkles,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Trip, Driver, MaterialType, TabType, PaymentStatus } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';

interface DashboardViewProps {
  trips: Trip[];
  drivers: Driver[];
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trips,
  drivers,
  onSelectTab,
  onViewReceipt,
  onUpdateTripStatus,
  onDeleteTrip,
  onUpdateTripPayment,
}) => {
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [settleTrip, setSettleTrip] = useState<Trip | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | ''>('');
  const [settleDueDate, setSettleDueDate] = useState<string>('');

  const todayTrips = trips;
  const totalTripsCount = todayTrips.length;
  const totalVolume = todayTrips.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const activeTrucks = drivers.filter(d => d.status !== 'offline').length;
  const totalRevenue = todayTrips.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  // Financial Breakdown: Fuel Expenses, Car Fees, and Driver Fees
  const totalFuelExpenses = todayTrips.reduce((acc, t) => acc + (t.fuelExpense || 0), 0);
  const totalCarFees = todayTrips.reduce((acc, t) => acc + (t.carFee || 0), 0);
  const totalDriverFees = todayTrips.reduce((acc, t) => acc + (t.driverFee || 0), 0);
  const totalExpenses = totalFuelExpenses + totalCarFees + totalDriverFees;
  const netEarnings = totalRevenue - totalExpenses;

  // Debt & Payment Breakdown
  const totalPaidRevenue = todayTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'paid') return acc + (t.totalAmount || 0);
    if (t.paymentStatus === 'unpaid') return acc + 0;
    return acc + (t.paidAmount !== undefined ? t.paidAmount : (t.totalAmount || 0));
  }, 0);

  const totalOutstandingDebt = todayTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'unpaid') return acc + (t.totalAmount || 0);
    if (t.paymentStatus === 'partial') return acc + (t.dueAmount !== undefined ? t.dueAmount : 0);
    return acc + (t.dueAmount || 0);
  }, 0);

  const unpaidTrips = todayTrips.filter(
    t => t.paymentStatus === 'unpaid' || t.paymentStatus === 'partial' || (t.dueAmount && t.dueAmount > 0)
  );
  const unpaidTripsCount = unpaidTrips.length;
  const collectionRate = totalRevenue > 0 ? Math.round((totalPaidRevenue / totalRevenue) * 100) : 100;

  // Group debts by customer
  const customerDebts = useMemo(() => {
    const map = new Map<string, { customerName: string; destination: string; phone: string; totalDebt: number; tripCount: number; dueDates: string[]; trips: Trip[] }>();
    
    unpaidTrips.forEach(trip => {
      const key = (trip.customerName || trip.destination || 'Unassigned Customer').trim();
      const existing = map.get(key) || {
        customerName: key,
        destination: trip.destination,
        phone: trip.phone || '-',
        totalDebt: 0,
        tripCount: 0,
        dueDates: [],
        trips: [],
      };
      
      const tripDebt = trip.paymentStatus === 'unpaid' 
        ? trip.totalAmount 
        : (trip.dueAmount || 0);

      existing.totalDebt += tripDebt;
      existing.tripCount += 1;
      if (trip.dueDate) existing.dueDates.push(trip.dueDate);
      existing.trips.push(trip);
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalDebt - a.totalDebt);
  }, [unpaidTrips]);

  const pendingDeliveries = trips.filter(t => t.status === 'on_the_way' || t.status === 'loading');

  // Material volume breakdown
  const materialVolumes: Record<MaterialType, number> = {
    sand: 0,
    soil: 0,
    stone: 0,
    gravel: 0,
  };
  trips.forEach(t => {
    if (materialVolumes[t.materialType] !== undefined) {
      materialVolumes[t.materialType] += t.quantity;
    }
  });

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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Top Stat Cards (Trips, Volume, Debt & Receivables, Gross Revenue) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trips */}
        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
              Today's Trips (ယနေ့ခေါက်ရေ)
            </span>
            <div className="p-2 bg-[#ffddb8]/60 text-[#855300] rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#151c27]">{totalTripsCount}</span>
            <span className="text-xs font-semibold text-[#534434] ml-1.5">ခေါက် (Trips)</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2 trips from yesterday</span>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
              Total Volume (ပို့ဆောင်ပြီးကျင်း)
            </span>
            <div className="p-2 bg-[#dae2fd] text-[#005ac2] rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#855300]">{totalVolume}</span>
            <span className="text-xs font-semibold text-[#534434] ml-1.5">ကျင်း (Kyin)</span>
          </div>
          <div className="mt-2 text-xs text-[#534434]">
            Avg {(totalTripsCount > 0 ? (totalVolume / totalTripsCount).toFixed(1) : 0)} ကျင်း / ခေါက်
          </div>
        </div>

        {/* Debt & Unpaid Stat Card (NEW Requested Feature) */}
        <div className="bg-[#fff5f5] p-5 rounded-xl border border-red-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1">
              <span>ရရန်ရှိ အကြွေးကျန် (Debt)</span>
            </span>
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-red-700">
              {(totalOutstandingDebt / 100000).toFixed(1)} <span className="text-xs sm:text-sm font-semibold">သိန်း</span>
            </span>
            <p className="text-xs font-bold text-red-900 mt-0.5">
              {totalOutstandingDebt.toLocaleString()} MMK
            </p>
          </div>
          <div className="mt-2 text-[11px] text-red-700 flex items-center justify-between font-semibold border-t border-red-200/70 pt-1.5">
            <span>{unpaidTripsCount} ခေါက် မရှင်းရသေး</span>
            <span className="bg-red-200/80 px-1.5 py-0.5 rounded text-red-950 font-bold">
              {100 - collectionRate}% Debt
            </span>
          </div>
        </div>

        {/* Gross Revenue & Cash Collection */}
        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
              ရောင်းရငွေ (Gross Revenue)
            </span>
            <div className="p-2 bg-[#ffddb8] text-[#855300] rounded-lg">
              <span className="font-bold text-sm">MMK</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#151c27]">
              {(totalRevenue / 100000).toFixed(1)} <span className="text-sm font-semibold">သိန်း</span>
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center justify-between">
            <span>ငွေရရှိပြီး: {totalPaidRevenue.toLocaleString()} Ks</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
              {collectionRate}% ရရှိ
            </span>
          </div>
        </div>
      </div>

      {/* Debt & Receivables Command Center + AI Recommendations */}
      <div className="bg-white rounded-2xl border border-red-200/80 p-5 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#d8c3ad]/40 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shadow-2xs">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#151c27]">
                  ဖောက်သည် အကြွေးစာရင်း & ကြွေးမြီစီမံခန့်ခွဲမှု (Customer Debt Tracker)
                </h3>
                {unpaidTripsCount > 0 && (
                  <span className="bg-red-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                    {unpaidTripsCount} စာရင်းကျန်
                  </span>
                )}
              </div>
              <p className="text-xs text-[#534434]">
                ဖောက်သည်အလိုက် မရှင်းရသေးသော ဘောက်ချာများနှင့် ငွေတောင်းခံရန် အကြံပြုချက်များ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left sm:text-right bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
              <span className="text-[11px] font-semibold text-red-900">စုစုပေါင်း အကြွေးကျန်ငွေ:</span>
              <div className="text-base font-black text-red-700">
                {totalOutstandingDebt.toLocaleString()} MMK
              </div>
            </div>
            <button
              onClick={() => onSelectTab('site-billing')}
              className="bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>ဆိုက်ဘေလ်ရှင်းတမ်း</span>
            </button>
          </div>
        </div>

        {/* AI Recommendations Bar (အကြံပြုချက်များ) */}
        <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-amber-950 block">
                💡 အကြံပြုချက် (Manager Recommendation):
              </span>
              <span className="text-amber-900">
                {customerDebts.length > 0 ? (
                  <>
                    အကြွေးအများဆုံးဖောက်သည် <strong>{customerDebts[0]?.customerName}</strong> ထံမှ ကြွေးကျန် <strong>{(customerDebts[0]?.totalDebt).toLocaleString()} MMK</strong> ကို အမြန်ဆုံးလိုက်လံကောက်ခံသင့်ပါသည်။ ငွေလက်ကျန်လည်ပတ်မှု ကောင်းမွန်စေရန် အကြွေးပေးချေမှုနှုန်းကို {collectionRate}% ထက် {Math.min(100, collectionRate + 15)}% အထိ မြှင့်တင်ပါ။
                  </>
                ) : (
                  <>
                    လက်ရှိတွင် အကြွေးကျန်မရှိပါ။ ငွေသားစီးဆင်းမှု ကျန်းမာရေး အလွန်ကောင်းမွန်ပါသည် (Cashflow 100% On Track)။
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Debts List Grid */}
        {customerDebts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
            {customerDebts.map((item, idx) => {
              const isTopDebt = idx === 0;
              return (
                <div
                  key={item.customerName}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isTopDebt 
                      ? 'bg-red-50/60 border-red-300 shadow-xs' 
                      : 'bg-[#fdfbf9] border-[#d8c3ad]/70 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#151c27]">
                          {item.customerName}
                        </span>
                        {isTopDebt && (
                          <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                            TOP DEBT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#534434] mt-0.5">
                        📍 {item.destination}
                      </p>
                      {item.phone && item.phone !== '-' && (
                        <p className="text-[11px] text-blue-700 font-medium mt-0.5 flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" /> {item.phone}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {item.tripCount} ခေါက်
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-red-200/70 flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">ကြွေးကျန်ငွေ:</span>
                    <span className="text-base font-black text-red-700">
                      {item.totalDebt.toLocaleString()} MMK
                    </span>
                  </div>

                  {/* Due date information */}
                  {item.dueDates.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-900 font-semibold bg-amber-50 px-2 py-1 rounded">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>ချိန်းရက်: {item.dueDates.join(', ')}</span>
                    </div>
                  )}

                  {/* Quick Settle Actions for this customer */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[#d8c3ad]/40">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.trips.length > 0) {
                          handleOpenSettleModal(item.trips[0]);
                        }
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>ငွေရှင်းမည် (Settle)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectTab('site-billing')}
                      className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                      title="ဘေလ်ရှင်းတမ်း ကြည့်မည်"
                    >
                      <span>အသေးစိတ်</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 p-6 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center flex flex-col items-center justify-center gap-1.5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <h4 className="font-bold text-emerald-950 text-sm">လက်ရှိတွင် ဖောက်သည် အကြွေးကျန်မရှိပါ</h4>
            <p className="text-xs text-emerald-800">ယနေ့ ပို့ဆောင်မှုအားလုံး ငွေသားရှင်းလင်းပြီးဖြစ်ပါသည် (All fully paid)</p>
          </div>
        )}
      </div>

      {/* Financial Expenses & Fuel Overview Section on Dashboard */}
      <div className="bg-white rounded-xl border border-[#d8c3ad]/70 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#d8c3ad]/40 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#ffddb8]/60 text-[#855300] rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#151c27]">
                ဆီဖိုး & စရိတ်စက စာရင်းချုပ် (Fuel & Expense Overview)
              </h3>
              <p className="text-xs text-[#534434]">ယနေ့ ဆီဖိုး၊ ကားခနှင့် ယာဉ်မောင်းခ ကုန်ကျစရိတ်များ ရှင်းတမ်း</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-medium text-[#534434]">စုစုပေါင်း ကုန်ကျစရိတ် (Total Expenses):</span>
            <div className="text-base font-extrabold text-red-700">
              {totalExpenses.toLocaleString()} MMK
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
          {/* Card 1: Fuel Expenses */}
          <div className="bg-[#fff8eb] p-4 rounded-xl border border-amber-300/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
              <span className="flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-700" /> ဆီဖိုး (Fuel Total)
              </span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-extrabold">ဆီစရိတ်</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-950">
                {totalFuelExpenses.toLocaleString()} <span className="text-xs font-medium text-amber-800">MMK</span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1">
                {(totalRevenue > 0 ? ((totalFuelExpenses / totalRevenue) * 100).toFixed(1) : 0)}% of gross sales
              </p>
            </div>
          </div>

          {/* Card 2: Car Fees */}
          <div className="bg-[#f9f9ff] p-4 rounded-xl border border-[#d8c3ad]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#534434] font-semibold">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#855300]" /> ကားခ (Car Fees)
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">ကားစရိတ်</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#855300]">
                {totalCarFees.toLocaleString()} <span className="text-xs font-medium text-[#534434]">MMK</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {(totalRevenue > 0 ? ((totalCarFees / totalRevenue) * 100).toFixed(1) : 0)}% of gross sales
              </p>
            </div>
          </div>

          {/* Card 3: Driver Fees */}
          <div className="bg-[#f9f9ff] p-4 rounded-xl border border-[#d8c3ad]/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#534434] font-semibold">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#005ac2]" /> ယာဉ်မောင်းခ (Driver)
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">ဒရိုင်ဘာခ</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#005ac2]">
                {totalDriverFees.toLocaleString()} <span className="text-xs font-medium text-[#534434]">MMK</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                {(totalRevenue > 0 ? ((totalDriverFees / totalRevenue) * 100).toFixed(1) : 0)}% of gross sales
              </p>
            </div>
          </div>

          {/* Card 4: Combined Expenses */}
          <div className="bg-[#fff7ed] p-4 rounded-xl border border-amber-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-700" /> စုစုပေါင်း စရိတ် (Expenses)
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">အသုံးစရိတ်</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-red-700">
                {totalExpenses.toLocaleString()} <span className="text-xs font-medium text-amber-900">MMK</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                ဆီဖိုး + ကားခ + ဒရိုင်ဘာ
              </p>
            </div>
          </div>

          {/* Card 5: Net Balance */}
          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-700" /> အသားတင် ကျန်ငွေ (Net)
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">လက်ကျန်</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-emerald-900">
                {netEarnings.toLocaleString()} <span className="text-xs font-medium text-emerald-700">MMK</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                ရောင်းရငွေ - စရိတ်စက အားလုံး
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Dispatches / In-Transit Alert Section */}
      {pendingDeliveries.length > 0 && (
        <div className="bg-[#ffddb8]/30 border border-[#f59e0b]/50 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <h3 className="font-bold text-base text-[#613b00]">
                လက်ရှိပို့ဆောင်နေဆဲ ကားစာရင်းများ (Active In-Transit Trucks - {pendingDeliveries.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('history')}
              className="text-xs font-bold text-[#855300] hover:underline flex items-center gap-1"
            >
              အားလုံးကြည့်မည် <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingDeliveries.map((trip) => (
              <div
                key={trip.id}
                className="bg-white p-4 rounded-lg border border-[#d8c3ad] flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#f0f3ff] rounded-lg border border-[#d8c3ad]/50 text-[#855300]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#151c27]">{trip.driverName}</span>
                      <span className="text-xs bg-[#f0f3ff] px-2 py-0.5 rounded border border-[#d8c3ad] font-semibold text-[#534434]">
                        {trip.licensePlate}
                      </span>
                    </div>
                    <p className="text-xs text-[#534434] mt-0.5">
                      📍 {trip.destination} • <span className="font-bold text-[#855300]">{trip.quantity} ကျင်း</span> ({MATERIAL_LABELS[trip.materialType]?.my || trip.materialType})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onUpdateTripStatus(trip.id, 'delivered')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ပို့ပြီး</span>
                  </button>

                  {onDeleteTrip && (
                    <button
                      type="button"
                      onClick={() => setTripToDelete(trip)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-[#d8c3ad]/50 hover:border-red-200 transition-colors cursor-pointer"
                      title="စာရင်းမှားယွင်းထည့်မိပါက ဖျက်မည် (Remove wrong item)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material Breakdown & Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Distribution */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <h3 className="font-bold text-base text-[#151c27] mb-4 flex items-center justify-between">
            <span>ပစ္စည်းအမျိုးအစားအလိုက် ပို့ဆောင်မှု (Material Breakdown)</span>
            <span className="text-xs font-normal text-[#534434]">စုစုပေါင်း {totalVolume} ကျင်း</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'sand' as MaterialType, name: 'သဲ (Sand)', color: 'bg-[#ffddb8] text-[#855300] border-[#f59e0b]' },
              { type: 'soil' as MaterialType, name: 'မြေ (Soil)', color: 'bg-[#e7eefe] text-[#653e00] border-[#adc6ff]' },
              { type: 'stone' as MaterialType, name: 'ကျောက် (Stone)', color: 'bg-[#dae2fd] text-[#3f465c] border-[#bec6e0]' },
              { type: 'gravel' as MaterialType, name: 'ကျောက်စရစ် (Gravel)', color: 'bg-[#d8e2ff] text-[#00408f] border-[#8ab0ff]' },
            ].map((mat) => {
              const vol = materialVolumes[mat.type];
              const pct = totalVolume > 0 ? Math.round((vol / totalVolume) * 100) : 0;
              return (
                <div
                  key={mat.type}
                  className={`p-4 rounded-xl border ${mat.color} flex flex-col justify-between`}
                >
                  <span className="text-xs font-bold">{mat.name}</span>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold">{vol}</span>
                    <span className="text-xs font-medium ml-1">ကျင်း</span>
                  </div>
                  <div className="mt-2 w-full bg-white/70 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-current h-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-[11px] font-semibold mt-1 opacity-80">{pct}% of total</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Add Banner */}
        <div className="bg-gradient-to-br from-[#855300] to-[#613b00] text-white p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <span>🚚 Dispatcher Portal</span>
            </div>
            <h3 className="font-extrabold text-xl leading-snug">
              ကားစာရင်းအသစ် ချက်ချင်းထည့်မည်
            </h3>
            <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">
              ကားမောင်းသမား၊ နံပါတ်ပြားနှင့် ကျင်းအရေအတွက်ကို အမြန်စာရင်းသွင်းပြီး ဘောက်ချာ ထုတ်ယူနိုင်ပါသည်။
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => onSelectTab('add-trip')}
              className="w-full bg-[#f59e0b] hover:bg-[#ffb95f] text-[#613b00] font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all text-sm cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Trip (စာရင်းထည့်ရန်)</span>
            </button>
            <button
              onClick={() => onSelectTab('site-billing')}
              className="w-full bg-[#f0f3ff] hover:bg-[#e7eefe] text-[#855300] border border-[#d8c3ad] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all text-xs cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#855300]" />
              <span>ဆိုက်အလိုက် ဘေလ်ရှင်းတမ်း ထုတ်ရန် (Site Billing)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Trips - Mobile Cards (< md) & Desktop Table (>= md) */}
      <div className="bg-white rounded-2xl border border-[#d8c3ad]/70 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 sm:py-4 border-b border-[#d8c3ad]/50 flex items-center justify-between bg-[#f0f3ff]/40">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#151c27]">
              မကြာသေးမီက ပို့ဆောင်မှုများ (Recent Trips)
            </h3>
            <p className="text-[11px] sm:text-xs text-[#534434]">ယနေ့ ပို့ဆောင်မှုနောက်ဆုံးမှတ်တမ်းများ & ငွေပေးချေမှုအခြေအနေ</p>
          </div>
          <button
            onClick={() => onSelectTab('history')}
            className="text-xs font-bold text-[#855300] hover:text-[#653e00] hover:underline flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>အားလုံး</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile View: High-contrast touchable cards */}
        <div className="md:hidden divide-y divide-[#d8c3ad]/30 p-2">
          {trips.slice(0, 6).map((trip) => {
            const mat = MATERIAL_LABELS[trip.materialType] || { my: trip.materialType, en: trip.materialType };
            return (
              <div key={trip.id} className="p-3 bg-white hover:bg-[#f9f9ff] rounded-xl transition-colors flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#855300] bg-[#f0f3ff] px-2 py-0.5 rounded border border-[#d8c3ad]/60">
                      {trip.tripNumber}
                    </span>
                    <span className="text-xs font-bold text-[#151c27]">{trip.driverName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({trip.licensePlate})</span>
                  </div>
                  <span className="text-[11px] text-gray-500">{trip.formattedTime}</span>
                </div>

                <div className="flex items-center justify-between bg-[#f9f9ff] p-2.5 rounded-lg border border-[#d8c3ad]/40 text-xs">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e7eefe] text-[#131b2e] border border-[#d8c3ad]/40 mr-1.5">
                      {mat.en} ({mat.my})
                    </span>
                    <span className="font-extrabold text-[#151c27] text-sm">{trip.quantity}</span>
                    <span className="text-[11px] text-[#534434] ml-0.5">ကျင်း</span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="font-extrabold text-[#855300] text-xs">
                      {trip.totalAmount.toLocaleString()} MMK
                    </div>

                    {/* Payment Status Tag */}
                    <div className="mt-0.5">
                      {trip.paymentStatus === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                          🟢 ရှင်းပြီး
                        </span>
                      ) : trip.paymentStatus === 'unpaid' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSettleModal(trip)}
                          className="text-[10px] font-bold text-red-800 bg-red-100 hover:bg-red-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          🔴 အကြွေး ({trip.dueAmount ? trip.dueAmount.toLocaleString() : trip.totalAmount.toLocaleString()} Ks)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenSettleModal(trip)}
                          className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          🟡 တစိတ်တပိုင်း (ကျန်: {trip.dueAmount?.toLocaleString()} Ks)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="text-[#534434] text-[11px] truncate max-w-[150px]" title={trip.destination}>
                    📍 {trip.destination}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateTripStatus(trip.id, trip.status === 'delivered' ? 'on_the_way' : 'delivered')}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border transition-all active:scale-95 cursor-pointer ${
                        trip.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                      }`}
                    >
                      {trip.status === 'delivered' ? 'ပို့ပြီး' : 'ပို့ဆဲ'}
                    </button>

                    <button
                      onClick={() => onViewReceipt(trip)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#855300] font-bold bg-[#f0f3ff] hover:bg-[#e2e8f8] px-2.5 py-1 rounded-lg border border-[#d8c3ad]/70 active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Slip</span>
                    </button>

                    {onDeleteTrip && (
                      <button
                        type="button"
                        onClick={() => setTripToDelete(trip)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-[#d8c3ad]/50 hover:border-red-200 transition-colors cursor-pointer"
                        title="စာရင်းမှားယွင်းထည့်မိပါက ဖျက်မည် (Delete from DB)"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f0f3ff] text-xs font-semibold text-[#534434] uppercase tracking-wider border-b border-[#d8c3ad]/40">
              <tr>
                <th className="px-4 py-3">Trip ID</th>
                <th className="px-4 py-3">Driver & Plate</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">ငွေပေးချေမှု (Payment)</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8c3ad]/30">
              {trips.slice(0, 6).map((trip) => {
                const mat = MATERIAL_LABELS[trip.materialType] || { my: trip.materialType, en: trip.materialType };
                return (
                  <tr key={trip.id} className="hover:bg-[#f9f9ff] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#855300]">
                      {trip.tripNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#151c27]">{trip.driverName}</div>
                      <div className="text-xs text-[#534434]">{trip.licensePlate}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-[#e7eefe] text-[#534434] border border-[#d8c3ad]/50">
                        {mat.en} ({mat.my})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-[#151c27] text-base">
                      {trip.quantity} <span className="text-xs font-normal text-[#534434]">ကျင်း</span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="font-extrabold text-xs text-[#855300]">
                        {trip.totalAmount.toLocaleString()} Ks
                      </div>
                      <div className="mt-0.5">
                        {trip.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            🟢 ရှင်းပြီး
                          </span>
                        ) : trip.paymentStatus === 'unpaid' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSettleModal(trip)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full border border-red-200 cursor-pointer transition-colors"
                            title="ကြွေးကျန်ငွေ ရှင်းမည်"
                          >
                            🔴 အကြွေး ({trip.dueAmount ? trip.dueAmount.toLocaleString() : trip.totalAmount.toLocaleString()} Ks)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSettleModal(trip)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 cursor-pointer transition-colors"
                            title="ကြွေးကျန်ငွေ ရှင်းမည်"
                          >
                            🟡 တစိတ်တပိုင်း ({trip.dueAmount?.toLocaleString()} Ks)
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#534434] max-w-[180px] truncate" title={trip.destination}>
                      {trip.destination}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#534434] whitespace-nowrap">
                      {trip.formattedTime}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {trip.status === 'delivered' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ပို့ပြီး
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" /> ပို့ဆောင်နေဆဲ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewReceipt(trip)}
                          className="inline-flex items-center gap-1 text-xs text-[#855300] hover:text-[#653e00] font-semibold bg-[#f0f3ff] hover:bg-[#e2e8f8] px-2.5 py-1 rounded-md border border-[#d8c3ad]/60 transition-colors cursor-pointer"
                          title="Print / View Slip"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Slip</span>
                        </button>

                        {onDeleteTrip && (
                          <button
                            type="button"
                            onClick={() => setTripToDelete(trip)}
                            className="inline-flex items-center p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-[#d8c3ad]/50 hover:border-red-200 transition-colors cursor-pointer"
                            title="စာရင်းမှားယွင်းထည့်မိပါက ဖျက်မည် (Delete from DB)"
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

      {/* Payment Settlement Modal (NEW: Directly settle debt from Dashboard) */}
      {settleTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-300 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-emerald-950 font-bold text-base">
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span>ငွေပေးချေမှု / အကြွေးစာရင်း ရှင်းမည်</span>
              </div>
              <button
                onClick={() => setSettleTrip(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5 text-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">ဘောက်ချာ:</span>
                  <span className="font-extrabold text-[#855300]">{settleTrip.tripNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">ဖောက်သည်/ဆိုက်:</span>
                  <span className="font-bold">{settleTrip.customerName || settleTrip.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">စုစုပေါင်းကျသင့်ငွေ:</span>
                  <span className="font-bold">{settleTrip.totalAmount.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-200">
                  <span className="text-red-900 font-bold">လက်ရှိ အကြွေးကျန်ငွေ:</span>
                  <span className="font-black text-red-700 text-sm">
                    {(settleTrip.dueAmount ?? (settleTrip.paymentStatus === 'unpaid' ? settleTrip.totalAmount : 0)).toLocaleString()} MMK
                  </span>
                </div>
              </div>

              {/* Partial Payment Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800">
                  ယခုလက်ခံရရှိငွေ ပမာဏ (Received Amount - Ks):
                </label>
                <input
                  type="number"
                  min="0"
                  max={settleTrip.dueAmount ?? settleTrip.totalAmount}
                  step="5000"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f9f9ff] border border-emerald-300 rounded-xl px-3.5 py-2.5 text-base font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Due date if still unpaid */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  ကြွေးဆပ်ရမည့်ရက် (Due Date / ချိန်းရက်):
                </label>
                <input
                  type="date"
                  value={settleDueDate}
                  onChange={(e) => setSettleDueDate(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-gray-300 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleConfirmSettlement('full')}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer text-center"
              >
                ✅ အကြွေးအားလုံးရှင်းပြီး (Mark Fully Paid)
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSettlement('partial')}
                className="w-full sm:flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer text-center"
              >
                🟡 တစိတ်တပိုင်းရှင်းမည် (Save Partial)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-red-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>ခေါက်စာရင်း ဖျက်ရန် အတည်ပြုပါ</span>
              </div>
              <button
                onClick={() => setTripToDelete(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-700">
                အောက်ပါခေါက်စာရင်းကို ဖျက်ရန် သေချာပါသလား?
              </p>

              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs space-y-1.5 text-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">ခေါက်နံပါတ်:</span>
                  <span className="font-extrabold text-[#855300]">{tripToDelete.tripNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">ယာဉ်မောင်း & ယာဉ်အမှတ်:</span>
                  <span className="font-bold">{tripToDelete.driverName} ({tripToDelete.licensePlate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">ပစ္စည်း & ပမာဏ:</span>
                  <span className="font-bold text-[#855300]">{tripToDelete.quantity} ကျင်း ({MATERIAL_LABELS[tripToDelete.materialType]?.my || tripToDelete.materialType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">ပို့ဆောင်သည့်နေရာ:</span>
                  <span className="font-bold">{tripToDelete.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">ကျသင့်ငွေ:</span>
                  <span className="font-black text-red-700">{tripToDelete.totalAmount.toLocaleString()} MMK</span>
                </div>
              </div>

              <p className="text-xs text-red-600 leading-relaxed font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
                ⚠️ ဤစာရင်းကို ဖျက်လိုက်ပါက စာရင်းချုပ်များမှ ချက်ချင်း နုတ်ပယ်သွားမည်ဖြစ်ပြီး <strong>Supabase Cloud Database</strong> မှပါ အလိုအလျောက် ပယ်ဖျက်သွားပါမည် (အော့ဖ်လိုင်းဖြစ်နေပါကလည်း အင်တာနက်ချိတ်ဆက်ချိန်တွင် Auto-Sync ဖြင့် ပယ်ဖျက်ပေးပါမည်)။
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTripToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                မဖျက်တော့ပါ (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTrip && tripToDelete) {
                    onDeleteTrip(tripToDelete.id);
                  }
                  setTripToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                သေချာသည် ဖျက်မည် (Confirm Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
