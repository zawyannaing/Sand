import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Truck, 
  Package, 
  PhoneCall, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText, 
  ArrowRight, 
  Layers, 
  MapPin, 
  CreditCard, 
  Send,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Trip, MaterialType, CustomerOrderRequest, AuthUser } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';
import { createCustomerOrder } from '../services/inventoryService';

interface CustomerPortalViewProps {
  trips?: Trip[];
  customerOrders?: CustomerOrderRequest[];
  currentUser: AuthUser | null;
  onRefreshOrders: () => void;
  onViewReceipt: (trip: Trip) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  trips = [],
  customerOrders = [],
  currentUser,
  onRefreshOrders,
  onViewReceipt,
}) => {
  const safeTrips = trips || [];
  const safeOrders = customerOrders || [];

  // Discover all unique customers from trips & orders
  const customerList = useMemo(() => {
    const set = new Set<string>();
    safeTrips.forEach(t => {
      if (t.customerName) set.add(t.customerName.trim());
    });
    safeOrders.forEach(o => {
      if (o.customerName) set.add(o.customerName.trim());
    });
    const list = Array.from(set);
    return list.length > 0 ? list : ['ရွှေနဂါး ဆောက်လုပ်ရေး', 'Asia World Logistics', 'ဒေါ်ခင်သန်းနွယ်'];
  }, [safeTrips, safeOrders]);

  // If currentUser is a site_manager, pre-match their customer name
  const defaultSelectedCustomer = useMemo(() => {
    if (currentUser?.siteName) {
      const match = customerList.find(c => c.toLowerCase().includes(currentUser.siteName!.toLowerCase()) || currentUser.siteName!.toLowerCase().includes(c.toLowerCase()));
      if (match) return match;
    }
    return customerList[0] || 'ရွှေနဂါး ဆောက်လုပ်ရေး';
  }, [currentUser, customerList]);

  const [selectedCustomer, setSelectedCustomer] = useState<string>(defaultSelectedCustomer);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderSubmittedNotice, setOrderSubmittedNotice] = useState<string | null>(null);

  // New Order Form State
  const [orderMaterial, setOrderMaterial] = useState<MaterialType>('sand');
  const [orderQuantity, setOrderQuantity] = useState<number | ''>(15);
  const [orderSiteName, setOrderSiteName] = useState('');
  const [orderPhone, setOrderPhone] = useState(currentUser?.phone || '09-970987654');
  const [orderDate, setOrderDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [orderNotes, setOrderNotes] = useState('');

  // Trips belonging to selected customer
  const customerTrips = useMemo(() => {
    return safeTrips.filter(t => (t.customerName || '').toLowerCase().trim() === selectedCustomer.toLowerCase().trim());
  }, [safeTrips, selectedCustomer]);

  // In-transit deliveries currently heading to this customer
  const inTransitTrips = useMemo(() => {
    return customerTrips.filter(t => t.status === 'on_the_way' || t.status === 'loading');
  }, [customerTrips]);

  // Delivered trips
  const deliveredTrips = useMemo(() => {
    return customerTrips.filter(t => t.status === 'delivered');
  }, [customerTrips]);

  // Customer specific orders
  const myOrders = useMemo(() => {
    return safeOrders.filter(o => o.customerName.toLowerCase().trim() === selectedCustomer.toLowerCase().trim());
  }, [safeOrders, selectedCustomer]);

  // Financials for this customer
  const totalVolumeReceived = deliveredTrips.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalBilled = customerTrips.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  const totalPaid = customerTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'paid') return acc + (t.totalAmount || 0);
    return acc + (t.paidAmount || 0);
  }, 0);
  const totalOutstandingDue = customerTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'unpaid') return acc + (t.totalAmount || 0);
    if (t.paymentStatus === 'partial') return acc + (t.dueAmount || 0);
    return acc + (t.dueAmount || 0);
  }, 0);

  // Volume by material type
  const materialVolumeMap = useMemo(() => {
    const map: Record<MaterialType, number> = { sand: 0, stone: 0, gravel: 0, soil: 0 };
    deliveredTrips.forEach(t => {
      map[t.materialType] = (map[t.materialType] || 0) + (t.quantity || 0);
    });
    return map;
  }, [deliveredTrips]);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuantity || Number(orderQuantity) <= 0) return;

    createCustomerOrder({
      customerName: selectedCustomer,
      siteName: orderSiteName.trim() || `${selectedCustomer} ပင်မဆိုဒ်ခွဲ`,
      phone: orderPhone.trim() || '09-450012345',
      materialType: orderMaterial,
      quantity: Number(orderQuantity),
      preferredDate: orderDate,
      notes: orderNotes.trim() || 'အဆောက်အဦဆောက်လုပ်ရေးအတွက် အမြန်ပို့ပေးပါရန်',
    });

    onRefreshOrders();
    setShowOrderModal(false);
    setOrderSubmittedNotice(`မှာယူမှု အောင်မြင်ပါသည်: ${orderQuantity} ကျင်း ပို့ဆောင်ရန် စာရင်းသွင်းပြီးပါပြီ`);
    setTimeout(() => setOrderSubmittedNotice(null), 6000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Customer Header & Switcher */}
      <div className="bg-gradient-to-r from-[#1b2533] via-[#212d3d] to-[#161e2b] rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full text-[11px] font-bold text-amber-300">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Customer Portal & Site Manager Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>{selectedCustomer}</span>
            </h1>
            <p className="text-xs text-gray-300 max-w-xl font-medium">
              သင်၏ ဆောက်လုပ်ရေးဆိုဒ်များသို့ သဲ/ကျောက် ပို့ဆောင်မှု အခြေအနေ၊ ကားလမ်းခရီးနှင့် ကုန်ကျငွေစာရင်းများ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Customer Switcher */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20">
              <span className="text-xs text-gray-300 font-bold whitespace-nowrap">ဆိုဒ်ရွေးရန်:</span>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer"
              >
                {customerList.map((cust) => (
                  <option key={cust} value={cust} className="text-gray-900 bg-white font-medium">
                    {cust}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action: Request Order */}
            <button
              type="button"
              onClick={() => {
                setOrderSiteName(`${selectedCustomer} စီမံကိန်းဆိုဒ်`);
                setShowOrderModal(true);
              }}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>ပစ္စည်းအသစ် မှာယူမည် (+ Order Sand)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {orderSubmittedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-2xl font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{orderSubmittedNotice}</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Delivered Total */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">လက်ခံရရှိပြီးပမာဏ</span>
            <div className="p-2 bg-amber-50 rounded-xl">
              <Package className="w-4 h-4 text-[#855300]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#151c27]">{totalVolumeReceived}</span>
            <span className="text-xs font-bold text-gray-500">ကျင်း (Kyin)</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            ခရီးစဉ်ပေါင်း {deliveredTrips.length} ကြိမ် ပို့ဆောင်ပြီး
          </div>
        </div>

        {/* Live In Transit Trucks */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">လမ်းခရီးရှိယာဉ်များ</span>
            <div className={`p-2 rounded-xl ${inTransitTrips.length > 0 ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#151c27]">{inTransitTrips.length}</span>
            <span className="text-xs font-bold text-gray-500">စီး (Active)</span>
          </div>
          <div className="mt-2 text-[11px] font-bold text-emerald-700">
            {inTransitTrips.length > 0 ? 'ယခု ဆိုဒ်သို့ ဦးတည်မောင်းနှင်နေသည်' : 'လက်ရှိ လမ်းခရီးယာဉ် မရှိပါ'}
          </div>
        </div>

        {/* Total Billed */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ကျသင့်ငွေစုစုပေါင်း</span>
            <div className="p-2 bg-blue-50 rounded-xl">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[#151c27]">{(totalBilled / 100000).toFixed(1)}</span>
            <span className="text-xs font-bold text-gray-500">သိန်း ကျပ်</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-bold">
            ပေးချေပြီး: {(totalPaid / 100000).toFixed(1)} သိန်း
          </div>
        </div>

        {/* Outstanding Due Debt */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ကျန်ရှိသည့် ငွေပမာဏ</span>
            <div className={`p-2 rounded-xl ${totalOutstandingDue > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-black ${totalOutstandingDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {(totalOutstandingDue / 100000).toFixed(1)}
            </span>
            <span className="text-xs font-bold text-gray-500">သိန်း ကျပ်</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 font-medium">
            {totalOutstandingDue > 0 ? 'ငွေရှင်းရန် ကျန်ရှိနေသေးပါသည်' : 'စာရင်းရှင်းပြီး ဖြစ်ပါသည်'}
          </div>
        </div>
      </div>

      {/* Live Dispatches Section (Active Trucks on the Road) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
            <h2 className="font-extrabold text-[#151c27] text-sm sm:text-base">
              လက်ရှိ လမ်းခရီးရှိ ကုန်တင်ယာဉ်များ (Live In-Transit Deliveries)
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            {inTransitTrips.length} trucks heading to site
          </span>
        </div>

        {inTransitTrips.length === 0 ? (
          <div className="py-8 text-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs">
            ယခုအချိန်တွင် ဆိုဒ်သို့ လာနေသော ကားမရှိသေးပါ။ အသစ်မှာယူလိုပါက အပေါ်ရှိ "ပစ္စည်းအသစ် မှာယူမည်" ကို နှိပ်ပါ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inTransitTrips.map((trip) => {
              const label = MATERIAL_LABELS[trip.materialType];
              return (
                <div 
                  key={trip.id}
                  className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs bg-white px-2 py-0.5 rounded border text-gray-700">
                          {trip.tripNumber}
                        </span>
                        <span 
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded"
                          style={{ backgroundColor: label.bg, color: label.color }}
                        >
                          {label.my} ({trip.quantity} ကျင်း)
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        လမ်းခရီးတွင် (On The Way)
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-gray-400 block">ယာဉ်မောင်း</span>
                        <span className="font-extrabold text-gray-900">{trip.driverName}</span>
                        <span className="font-mono text-[10px] text-gray-500 block">({trip.licensePlate})</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-gray-400 block">ပို့ဆောင်မည့်နေရာ</span>
                        <span className="font-semibold text-gray-800 truncate block">{trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">ထွက်ခွာချိန်: {trip.formattedTime}</span>

                    {trip.phone && (
                      <a
                        href={`tel:${trip.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>ယာဉ်မောင်း ဖုန်းခေါ်မည်</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Material Breakdown & Pending Order Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Material Quantities Delivered */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
          <h3 className="font-extrabold text-[#151c27] text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#855300]" />
            <span>ဆိုဒ်သို့ ရောက်ရှိပြီး ပစ္စည်းအမျိုးအစားများ</span>
          </h3>

          <div className="space-y-2.5">
            {(['sand', 'stone', 'gravel', 'soil'] as MaterialType[]).map((mat) => {
              const label = MATERIAL_LABELS[mat];
              const qty = materialVolumeMap[mat] || 0;
              const pct = totalVolumeReceived > 0 ? Math.round((qty / totalVolumeReceived) * 100) : 0;

              return (
                <div key={mat} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-gray-800">{label.my} ({label.en})</span>
                    <span className="font-mono text-[#151c27]">{qty} ကျင်း ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: label.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer's Submitted Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#151c27] text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#855300]" />
              <span>မှာယူထားသော စာရင်းများ (My Material Orders)</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">({myOrders.length} records)</span>
          </div>

          <div className="overflow-y-auto max-h-64 space-y-2">
            {myOrders.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 font-medium">
                မှာယူထားသည့် မှတ်တမ်း မရှိသေးပါ
              </div>
            ) : (
              myOrders.map((ord) => {
                const label = MATERIAL_LABELS[ord.materialType];
                return (
                  <div key={ord.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: label.bg, color: label.color }}
                        >
                          {label.my} {ord.quantity} ကျင်း
                        </span>
                        <span className="font-bold text-gray-900 truncate">{ord.siteName}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1 truncate">
                        ချိန်းရက်: {ord.preferredDate} {ord.notes && `• ${ord.notes}`}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase shrink-0 ${
                      ord.status === 'pending' 
                        ? 'bg-amber-100 text-amber-800' 
                        : ord.status === 'dispatched' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ord.status === 'pending' ? 'စောင့်ဆိုင်းဆဲ (Pending)' : ord.status === 'dispatched' ? 'ယာဉ်ထွက်ခွာ (Dispatched)' : 'ပြီးစီး (Delivered)'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Delivery Receipt History Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-[#151c27] text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#855300]" />
            <span>ပို့ဆောင်ပြီး စာရင်းနှင့် ပြေစာများ (Delivery Slips & Vouchers)</span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">({deliveredTrips.length} slips)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">ဘောက်ချာနံပါတ်</th>
                <th className="py-3 px-4">ရက်စွဲ / အချိန်</th>
                <th className="py-3 px-4">ပစ္စည်း</th>
                <th className="py-3 px-4">ပမာဏ</th>
                <th className="py-3 px-4">ယာဉ်မောင်း</th>
                <th className="py-3 px-4 text-right">စုစုပေါင်းကျသင့်ငွေ</th>
                <th className="py-3 px-4">ငွေပေးချေမှု</th>
                <th className="py-3 px-4 text-center">ပြေစာ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {deliveredTrips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-normal">
                    မှတ်တမ်း မရှိသေးပါ
                  </td>
                </tr>
              ) : (
                deliveredTrips.map((trip) => {
                  const label = MATERIAL_LABELS[trip.materialType];
                  const isPaid = trip.paymentStatus === 'paid';
                  const isUnpaid = trip.paymentStatus === 'unpaid';

                  return (
                    <tr key={trip.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">{trip.tripNumber}</td>
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{trip.formattedTime}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold">{label?.my || trip.materialType}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-gray-900">{trip.quantity} ကျင်း</td>
                      <td className="py-3 px-4 text-gray-600">{trip.driverName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#151c27]">
                        {trip.totalAmount?.toLocaleString()} MMK
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : isUnpaid ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPaid ? 'ရှင်းပြီး' : isUnpaid ? 'မရှင်းရသေး' : 'တစိတ်တပိုင်း'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trip)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#855300] font-bold text-[11px] rounded-lg border border-amber-200 transition-colors cursor-pointer"
                        >
                          ပြေစာကြည့်
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Customer Request Delivery Order */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-[#fcfaf7] border-b border-[#ebdccd] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#855300] uppercase tracking-wider">Customer Order Request</span>
                <h3 className="text-base font-black text-[#151c27]">သဲ/ကျောက် ပစ္စည်းအသစ် မှာယူရန်</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  မှာယူသူ / ကုမ္ပဏီ (Customer Name)
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedCustomer}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-xs font-bold text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ကုန်ကြမ်းပစ္စည်း အမျိုးအစား (Material) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['sand', 'stone', 'gravel', 'soil'] as MaterialType[]).map((mat) => {
                    const label = MATERIAL_LABELS[mat];
                    const isSelected = orderMaterial === mat;
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setOrderMaterial(mat)}
                        className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-[#855300] bg-amber-50 text-[#855300] ring-2 ring-amber-200' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div>{label.my}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{label.en}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  မှာယူလိုသည့် ပမာဏ (ကျင်း / Kyin) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="15"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-sm focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ပို့ဆောင်ရမည့် ဆိုဒ်တည်နေရာ (Site Location) *
                </label>
                <input
                  type="text"
                  required
                  value={orderSiteName}
                  onChange={(e) => setOrderSiteName(e.target.value)}
                  placeholder="ဥပမာ - လှိုင်သာယာ စက်မှုဇုန် (၃) ကွန်ကရစ်ဖျော်စက်အနီး"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#855300] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ချိန်းဆိုမည့် ရက်စွဲ
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ဆက်သွယ်ရန် ဖုန်းနံပါတ်
                  </label>
                  <input
                    type="tel"
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder="09-xxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#855300] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  အထူးမှာကြားချက် (Drop point / Special instructions)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="ဥပမာ - ဂိတ်ပေါက်အမှတ် ၂ မှ ဝင်၍ သဲပုံအနီး သွန်ပေးပါရန်"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#855300] focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#855300] hover:bg-[#653e00] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>မှာယူမှု ပေးပို့မည် (Submit Order)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
