import React, { useState, useMemo } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Truck, 
  Building2, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  LogOut, 
  UserCheck, 
  FileText, 
  Sparkles, 
  Radio, 
  Zap,
  PhoneCall,
  Calendar,
  Fuel,
  Coins
} from 'lucide-react';
import { AuthUser, Trip, Driver, Vehicle, TabType, PaymentStatus } from '../types';
import { ROLE_DETAILS } from '../services/authService';
import { MATERIAL_LABELS } from '../data/mockData';
import { GoogleGIcon } from './LoginModal';

interface UserDataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onOpenLogin: () => void;
  onLogout: () => void;
  onSelectTab: (tab: TabType) => void;
  onViewReceipt: (trip: Trip) => void;
  onUpdateTripStatus?: (tripId: string, status: Trip['status']) => void;
  onSimulateRealtimeEvent?: () => void;
  isRealtimeActive: boolean;
}

export const UserDataPreviewModal: React.FC<UserDataPreviewModalProps> = ({
  isOpen,
  onClose,
  user,
  trips,
  drivers,
  vehicles,
  onOpenLogin,
  onLogout,
  onSelectTab,
  onViewReceipt,
  onUpdateTripStatus,
  onSimulateRealtimeEvent,
  isRealtimeActive,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'my-trips' | 'realtime-feed'>('overview');
  const [simulationTriggered, setSimulationTriggered] = useState(false);

  // Filter trips based on user role - MUST be called unconditionally before early return
  const userTrips = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'dispatcher' || user.role === 'viewer') {
      return trips;
    }
    if (user.role === 'driver') {
      const userPlateLower = (user.licensePlate || '').trim().toLowerCase();
      const userNameLower = (user.name || '').trim().toLowerCase();
      const userBurmeseLower = (user.burmeseName || '').trim().toLowerCase();

      return trips.filter(t => {
        const tPlate = (t.licensePlate || '').trim().toLowerCase();
        const tDriver = (t.driverName || '').trim().toLowerCase();
        return (
          (userPlateLower && tPlate === userPlateLower) ||
          (userNameLower && tDriver.includes(userNameLower)) ||
          (userBurmeseLower && tDriver.includes(userBurmeseLower)) ||
          tDriver.includes('ဘမောင်')
        );
      });
    }
    if (user.role === 'site_manager') {
      const siteName = (user.siteName || 'ရွှေနဂါး').toLowerCase();
      return trips.filter(t => 
        (t.customerName && t.customerName.toLowerCase().includes(siteName)) ||
        (t.destination && t.destination.toLowerCase().includes(siteName))
      );
    }
    return trips;
  }, [trips, user]);

  if (!isOpen || !user) return null;

  const roleInfo = ROLE_DETAILS[user.role] || ROLE_DETAILS.dispatcher;

  // Derived role metrics
  const totalVolume = userTrips.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
  const totalGrossAmount = userTrips.reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);
  const totalDueAmount = userTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'unpaid') return acc + (t.totalAmount || 0);
    return acc + (t.dueAmount || 0);
  }, 0);
  const totalPaidAmount = userTrips.reduce((acc, t) => {
    if (t.paymentStatus === 'paid') return acc + (t.totalAmount || 0);
    return acc + (t.paidAmount || 0);
  }, 0);

  // Driver-specific metrics
  const driverEarnedFees = userTrips.reduce((acc, t) => acc + (Number(t.driverFee) || 0), 0);
  const driverFuelHandled = userTrips.reduce((acc, t) => acc + (Number(t.fuelExpense) || 0), 0);

  // Site-specific metrics
  const siteTripsCount = userTrips.length;

  const handleSimulate = () => {
    if (onSimulateRealtimeEvent) {
      onSimulateRealtimeEvent();
      setSimulationTriggered(true);
      setTimeout(() => setSimulationTriggered(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#d8c3ad]/70 overflow-hidden my-auto animate-scale-in flex flex-col max-h-[92vh]">
        {/* Modal Header & User Profile Banner */}
        <div className="bg-gradient-to-r from-[#151c27] via-[#242e42] to-[#151c27] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/80 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#151c27] animate-pulse" title="Online"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">{user.name}</h2>
                  <span 
                    className="text-[11px] font-black px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: roleInfo.bg, color: roleInfo.color }}
                  >
                    {roleInfo.my}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-300 font-mono flex items-center gap-1.5">
                    <GoogleGIcon className="w-3.5 h-3.5" />
                    <span>{user.email}</span>
                  </p>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.2 rounded-full">
                    ✓ Gmail Authorized
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-300 mt-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Real-time Sync Active</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">ဝင်ရောက်ချိန်: {new Date(user.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Quick Switch / Sign Out Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => { onClose(); onOpenLogin(); }}
                className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Switch Account Role"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Switch Role</span>
              </button>
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Role Description Banner */}
          <div className="mt-4 p-2.5 bg-white/10 rounded-xl border border-white/10 text-xs text-gray-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] sm:text-xs">
              <strong className="text-amber-300">{roleInfo.en}:</strong> {roleInfo.description}
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex border-b border-[#d8c3ad]/50 bg-[#f9f9ff] px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'border-[#855300] text-[#855300] font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>My Data Summary (စာရင်းအကျဉ်း)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('my-trips')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'my-trips'
                ? 'border-[#855300] text-[#855300] font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>My Trips & Deliveries ({userTrips.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('realtime-feed')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'realtime-feed'
                ? 'border-[#855300] text-[#855300] font-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Live Real-Time Stream</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* TAB 1: OVERVIEW METRICS (CUSTOMIZED BY ROLE) */}
          {activeSubTab === 'overview' && (
            <div className="flex flex-col gap-4">
              {/* Role-Specific Banner Alert */}
              {user.role === 'driver' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        ယာဉ်မောင်း သီးသန့် အချက်အလက် (Driver Dashboard)
                      </h4>
                      <p className="text-xs text-emerald-800">
                        တာဝန်ကျယာဉ်နံပါတ်: <strong>{user.licensePlate || '9ယ/12345'}</strong> • ဖုန်း: {user.phone || '09-450012345'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onClose(); onSelectTab('add-trip'); }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-all"
                  >
                    + ခေါက်စာရင်းထည့်
                  </button>
                </div>
              )}

              {user.role === 'site_manager' && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#855300] text-white rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-950">
                        ဆောက်လုပ်ရေး ဆိုက်တာဝန်ခံ (Site Portal)
                      </h4>
                      <p className="text-xs text-amber-800">
                        ဆိုဒ်အမည်: <strong>{user.siteName || 'ရွှေနဂါး ဆောက်လုပ်ရေး'}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onClose(); onSelectTab('site-billing'); }}
                    className="bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer transition-all"
                  >
                    ဘေလ်ရှင်းတမ်း ကြည့်မည်
                  </button>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Metric 1 */}
                <div className="bg-white p-4 rounded-2xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-[#534434] uppercase tracking-wider">
                    {user.role === 'driver' ? 'ပို့ဆောင်ပြီးခေါက်ရေ' : 'Total Trips'}
                  </span>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-[#151c27]">{userTrips.length}</span>
                    <span className="text-xs font-bold text-[#534434] ml-1">ခေါက်</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-1">Live Synced</span>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-4 rounded-2xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-[#534434] uppercase tracking-wider">
                    {user.role === 'site_manager' ? 'လက်ခံရရှိပြီးကျင်း' : 'Volume (ကျင်း)'}
                  </span>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-[#855300]">{totalVolume}</span>
                    <span className="text-xs font-bold text-[#534434] ml-1">ကျင်း</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">Sand & Aggregates</span>
                </div>

                {/* Metric 3 */}
                {user.role === 'driver' ? (
                  <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" /> ယာဉ်မောင်းခ (Driver Fee)
                    </span>
                    <div className="mt-2">
                      <span className="text-xl font-black text-emerald-700">
                        {driverEarnedFees.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 ml-1">MMK</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 mt-1 font-semibold">ယနေ့ ရရှိငွေ</span>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-2xl border border-[#d8c3ad]/70 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-[#534434] uppercase tracking-wider">
                      စုစုပေါင်းငွေပမာဏ
                    </span>
                    <div className="mt-2">
                      <span className="text-xl font-black text-[#151c27]">
                        {(totalGrossAmount / 100000).toFixed(1)} <span className="text-xs">သိန်း</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 mt-1 font-semibold">
                      {totalPaidAmount.toLocaleString()} Ks ရရှိပြီး
                    </span>
                  </div>
                )}

                {/* Metric 4 */}
                {user.role === 'driver' ? (
                  <div className="bg-[#fff8eb] p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5" /> ဆီဖိုး (Fuel)
                    </span>
                    <div className="mt-2">
                      <span className="text-xl font-black text-amber-800">
                        {driverFuelHandled.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-amber-900 ml-1">MMK</span>
                    </div>
                    <span className="text-[10px] text-amber-800 mt-1">ထုတ်ယူသုံးစွဲပြီး</span>
                  </div>
                ) : (
                  <div className="bg-[#fff5f5] p-4 rounded-2xl border border-red-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> အကြွေးကျန်ငွေ
                    </span>
                    <div className="mt-2">
                      <span className="text-xl font-black text-red-700">
                        {(totalDueAmount / 100000).toFixed(1)} <span className="text-xs">သိန်း</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-red-700 mt-1 font-semibold">
                      {totalDueAmount.toLocaleString()} MMK
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Actions Shortcuts for this user */}
              <div className="bg-[#f0f3ff]/70 p-4 rounded-2xl border border-[#d8c3ad]/50 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
                  ⚡ အမြန်လုပ်ဆောင်ချက်များ (Quick Shortcuts)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => { onClose(); onSelectTab('add-trip'); }}
                    className="p-2.5 bg-white hover:bg-[#ffddb8]/60 text-[#855300] rounded-xl border border-[#d8c3ad]/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Truck className="w-4 h-4" />
                    <span>ခေါက်စာရင်းထည့်</span>
                  </button>

                  <button
                    onClick={() => { onClose(); onSelectTab('history'); }}
                    className="p-2.5 bg-white hover:bg-[#dae2fd] text-[#005ac2] rounded-xl border border-[#d8c3ad]/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>ဘောက်ချာမှတ်တမ်း</span>
                  </button>

                  <button
                    onClick={() => { onClose(); onSelectTab('site-billing'); }}
                    className="p-2.5 bg-white hover:bg-amber-100 text-amber-900 rounded-xl border border-[#d8c3ad]/70 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>ဆိုက်ဘေလ်ရှင်းတမ်း</span>
                  </button>

                  <button
                    onClick={handleSimulate}
                    className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Live Real-time စမ်းသပ်ရန်"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Real-time Test</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY TRIPS & DELIVERIES */}
          {activeSubTab === 'my-trips' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#534434]">
                  {user.role === 'driver' ? 'မိမိ တာဝန်ယူပို့ဆောင်ခဲ့သော ကားခေါက်များ' : 'ပို့ဆောင်မှု စာရင်းများ'} ({userTrips.length})
                </span>
                <span className="text-xs text-gray-500">Live Auto-Synced</span>
              </div>

              {userTrips.length > 0 ? (
                <div className="divide-y divide-[#d8c3ad]/30 border border-[#d8c3ad]/50 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {userTrips.slice(0, 8).map((trip) => {
                    const mat = MATERIAL_LABELS[trip.materialType] || { my: trip.materialType, en: trip.materialType };
                    return (
                      <div key={trip.id} className="p-3.5 hover:bg-[#f9f9ff] transition-colors flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-black text-xs text-[#855300] bg-[#f0f3ff] px-2 py-1 rounded-lg border border-[#d8c3ad]/60 shrink-0">
                            {trip.tripNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-[#151c27] truncate">
                                {trip.driverName}
                              </span>
                              <span className="text-xs font-mono text-gray-500">({trip.licensePlate})</span>
                            </div>
                            <p className="text-xs text-[#534434] truncate mt-0.5">
                              📍 {trip.destination} • <strong className="text-[#855300]">{trip.quantity} ကျင်း</strong> ({mat.my})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="font-extrabold text-xs text-[#855300]">
                              {trip.totalAmount.toLocaleString()} Ks
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              trip.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {trip.paymentStatus === 'paid' ? 'ရှင်းပြီး' : 'အကြွေး'}
                            </span>
                          </div>

                          <button
                            onClick={() => onViewReceipt(trip)}
                            className="p-1.5 bg-[#f0f3ff] hover:bg-[#e2e8f8] text-[#855300] rounded-lg border border-[#d8c3ad]/70 text-xs font-semibold cursor-pointer"
                            title="View Slip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 text-xs">
                  စာရင်းမရှိသေးပါ (No trips logged yet)
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REAL-TIME STREAM & SIMULATION */}
          {activeSubTab === 'realtime-feed' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs animate-bounce">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#151c27]">
                      Live Real-Time Data Pipeline
                    </h4>
                    <p className="text-xs text-[#534434]">
                      Supabase Realtime PostgreSQL Changefeed & Local Broadcast Channel ချိတ်ဆက်ထားပါသည်
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSimulate}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>Simulate Real-time Incoming Trip</span>
                </button>
              </div>

              {simulationTriggered && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>⚡ Real-time Data Packet Broadcasted! စာရင်းများ Live အချိန်နှင့်တပြေးညီ Update ဖြစ်သွားပါပြီ!</span>
                </div>
              )}

              {/* Live Event Feed Items */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#534434] uppercase tracking-wider">
                  မကြာသေးမီက Real-time လှုပ်ရှားမှုများ (Live Feed)
                </span>

                <div className="divide-y divide-[#d8c3ad]/30 border border-[#d8c3ad]/50 rounded-2xl bg-white shadow-2xs overflow-hidden">
                  {trips.slice(0, 5).map((t, idx) => (
                    <div key={t.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#f9f9ff]">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <div>
                          <div className="font-bold text-[#151c27]">
                            ခေါက်အမှတ် <strong>{t.tripNumber}</strong> ({t.driverName})
                          </div>
                          <p className="text-[11px] text-[#534434] mt-0.5">
                            {t.quantity} ကျင်း ({MATERIAL_LABELS[t.materialType]?.my}) ပို့ဆောင်မှု • {t.destination}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-500">{t.formattedTime || 'Just now'}</span>
                        <div className="font-extrabold text-[#855300] text-[11px]">{t.totalAmount.toLocaleString()} Ks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#f0f3ff]/60 px-6 py-4 border-t border-[#d8c3ad]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#534434]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Multi-Device Sync Active</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => { onClose(); onSelectTab('dashboard'); }}
              className="flex-1 sm:flex-none bg-[#855300] hover:bg-[#653e00] text-white font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer text-center"
            >
              ပင်မ Dashboard သို့သွားမည်
            </button>
            <button
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              ပိတ်မည် (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
