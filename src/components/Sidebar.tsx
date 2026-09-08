import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Building2, 
  BarChart3, 
  Users, 
  Truck, 
  Settings,
  Sparkles,
  LogIn,
  Package,
  ShieldCheck
} from 'lucide-react';
import { TabType, AuthUser } from '../types';
import { DEFAULT_AVATAR } from '../data/mockData';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingTripsCount: number;
  currentUser?: AuthUser | null;
  onOpenUserPreview?: () => void;
  onOpenLogin?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  pendingTripsCount,
  currentUser,
  onOpenUserPreview,
  onOpenLogin,
}) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', sub: 'ပင်မ', icon: LayoutDashboard },
    { id: 'inventory' as TabType, label: 'Inventory', sub: 'စတိုလက်ကျန်', icon: Package },
    { id: 'customer-portal' as TabType, label: 'Site Portal', sub: 'ဆိုဒ်ဒက်ရှ်ဘုတ်', icon: Building2 },
    { id: 'add-trip' as TabType, label: 'Add Trip', sub: 'ခရီးစဉ်ထုတ်', icon: PlusCircle, badge: null },
    { id: 'history' as TabType, label: 'History', sub: 'မှတ်တမ်း', icon: History },
    { id: 'site-billing' as TabType, label: 'Billing & Debt', sub: 'ငွေစာရင်း', icon: BarChart3 },
    { id: 'drivers' as TabType, label: 'Drivers', sub: 'ယာဉ်မောင်း', icon: Users },
    { id: 'vehicles' as TabType, label: 'Vehicles', sub: 'ယာဉ်များ', icon: Truck },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-r border-[#d8c3ad]/50 bg-white z-30 p-4 gap-2 select-none shadow-sm">
      {/* Brand Header */}
      <div 
        onClick={() => onSelectTab('dashboard')}
        className="flex items-center gap-3 mb-6 px-4 py-2 cursor-pointer transition-opacity hover:opacity-90"
      >
        <div className="bg-[#f59e0b]/15 text-[#855300] p-2 rounded-xl flex items-center justify-center">
          <Truck className="w-7 h-7 text-[#855300]" />
        </div>
        <div>
          <h1 className="font-bold text-[22px] tracking-tight text-[#855300] leading-tight">Logistics Pro</h1>
          <p className="text-[12px] font-medium text-[#534434]/80">Sand & Aggregate Admin</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          if (item.id === 'add-trip' && isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-[#f59e0b] text-[#613b00] font-semibold transition-all duration-150 hover:bg-[#f59e0b]/90 shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#613b00]" />
                  <span className="text-[15px] font-bold">{item.label}</span>
                </div>
                <span className="text-[11px] bg-[#613b00]/10 px-2 py-0.5 rounded-full font-bold">New</span>
              </button>
            );
          }

          if (item.id === 'add-trip' && !isActive) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[#855300] bg-[#ffddb8]/40 hover:bg-[#ffddb8]/70 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#855300]" />
                  <span className="text-[15px] font-semibold">{item.label}</span>
                </div>
                <span className="text-[10px] bg-[#855300] text-white px-1.5 py-0.5 rounded font-bold">+</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-[#e7eefe] text-[#005ac2] font-semibold'
                  : 'text-[#534434] hover:bg-[#f0f3ff] font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#005ac2]' : 'text-[#565e74]'}`} />
                <span className="text-[15px]">{item.label}</span>
              </div>
              {item.id === 'history' && pendingTripsCount > 0 && (
                <span className="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  {pendingTripsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Area */}
      <div className="mt-auto pt-2 flex flex-col gap-2">
        <button
          onClick={() => onSelectTab('settings')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left w-full ${
            currentTab === 'settings'
              ? 'bg-[#e7eefe] text-[#005ac2] font-semibold'
              : 'text-[#534434] hover:bg-[#f0f3ff] font-medium'
          }`}
        >
          <Settings className="w-5 h-5 text-[#565e74]" />
          <span className="text-[15px]">Settings</span>
        </button>

        {/* User Profile Card with Live Data Preview trigger */}
        {currentUser ? (
          <div 
            onClick={onOpenUserPreview}
            className="flex items-center gap-3 mt-2 px-3 py-2.5 border border-[#d8c3ad]/50 pt-3 bg-[#fdfbf9] hover:bg-[#ffddb8]/30 rounded-2xl cursor-pointer transition-all shadow-2xs group"
            title="Click to preview your personalized data & real-time feed"
          >
            <div className="relative">
              <img
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-[#d8c3ad]"
                src={currentUser.avatarUrl || DEFAULT_AVATAR}
                referrerPolicy="no-referrer"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border-2 border-white animate-pulse"></span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#151c27] truncate group-hover:text-[#855300]">
                  {currentUser.name}
                </span>
                <span className="shrink-0" title="Account Verified">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#855300] truncate">
                  {currentUser.roleLabel?.my || 'အသုံးပြုသူ'}
                </span>
                <span className="text-gray-300 shrink-0">•</span>
                <span className="text-[10px] font-bold text-emerald-700 shrink-0">Active</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center justify-center gap-2 mt-2 px-4 py-3 bg-[#855300] hover:bg-[#653e00] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>အကောင့်ဝင်မည် (Sign In)</span>
          </button>
        )}
      </div>
    </aside>
  );
};

