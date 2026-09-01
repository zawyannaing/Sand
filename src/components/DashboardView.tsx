import React from 'react';
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
  Fuel
} from 'lucide-react';
import { Trip, Driver, MaterialType, TabType } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';

interface DashboardViewProps {
  trips: Trip[];
  drivers: Driver[];
  onSelectTab: (tab: TabType) => void;
  onViewReceipt: (trip: Trip) => void;
  onUpdateTripStatus: (tripId: string, status: Trip['status']) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trips,
  drivers,
  onSelectTab,
  onViewReceipt,
  onUpdateTripStatus,
}) => {
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

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Top Stat Cards */}
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

        {/* Active Trucks */}
        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
              Active Fleet (အလုပ်လုပ်နေသောကား)
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Navigation className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-800">{activeTrucks}</span>
            <span className="text-xs font-semibold text-[#534434] ml-1.5">/ {drivers.length} စီး</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            {pendingDeliveries.length} စီး လမ်းပေါ်ရောက်ရှိနေ
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
              Gross Value (ရောင်းရငွေစုစုပေါင်း)
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
          <div className="mt-2 text-xs text-[#534434] truncate">
            {totalRevenue.toLocaleString()} ကျပ်
          </div>
        </div>
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
          {/* Card 1: Fuel Expenses (ဆီဖိုး စုစုပေါင်း) */}
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

                <button
                  onClick={() => onUpdateTripStatus(trip.id, 'delivered')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ပို့ပြီး (Delivered)</span>
                </button>
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
            <p className="text-[11px] sm:text-xs text-[#534434]">ယနေ့ ပို့ဆောင်မှုနောက်ဆုံးမှတ်တမ်းများ</p>
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
          {trips.slice(0, 5).map((trip) => {
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

                  <div className="text-right">
                    <div className="font-extrabold text-[#855300] text-xs">
                      {trip.totalAmount.toLocaleString()} MMK
                    </div>
                    {(trip.fuelExpense || trip.carFee || trip.driverFee) ? (
                      <div className="text-[10px] text-gray-600 flex flex-col items-end">
                        {trip.fuelExpense ? (
                          <span className="text-amber-800 font-semibold">⛽ ဆီ: {trip.fuelExpense.toLocaleString()}</span>
                        ) : null}
                        <span>
                          {trip.carFee ? `ကား: ${trip.carFee.toLocaleString()}` : ''}
                          {trip.carFee && trip.driverFee ? ' | ' : ''}
                          {trip.driverFee ? `ဒရိုင်ဘာ: ${trip.driverFee.toLocaleString()}` : ''}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="text-[#534434] text-[11px] truncate max-w-[170px]" title={trip.destination}>
                    📍 {trip.destination}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateTripStatus(trip.id, trip.status === 'delivered' ? 'on_the_way' : 'delivered')}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border transition-all active:scale-95 ${
                        trip.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                      }`}
                    >
                      {trip.status === 'delivered' ? 'ပို့ပြီး' : 'ပို့ဆဲ'}
                    </button>

                    <button
                      onClick={() => onViewReceipt(trip)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#855300] font-bold bg-[#f0f3ff] hover:bg-[#e2e8f8] px-2.5 py-1 rounded-lg border border-[#d8c3ad]/70 active:scale-95"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Slip</span>
                    </button>
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
                <th className="px-4 py-3 text-right">စရိတ်များ (Expenses)</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8c3ad]/30">
              {trips.slice(0, 5).map((trip) => {
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
                      <button
                        onClick={() => onViewReceipt(trip)}
                        className="inline-flex items-center gap-1 text-xs text-[#855300] hover:text-[#653e00] font-semibold bg-[#f0f3ff] hover:bg-[#e2e8f8] px-2.5 py-1 rounded-md border border-[#d8c3ad]/60 transition-colors cursor-pointer"
                        title="Print / View Slip"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Slip</span>
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
  );
};
