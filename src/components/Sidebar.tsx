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
} from 'lucide-react';
import { TabType } from '../types';
import { DEFAULT_AVATAR } from '../data/mockData';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingTripsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, pendingTripsCount }) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-trip' as TabType, label: 'Add Trip', icon: PlusCircle, badge: null },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'site-billing' as TabType, label: 'Site Billing', icon: Building2 },
    { id: 'reports' as TabType, label: 'Reports', icon: BarChart3 },
    { id: 'drivers' as TabType, label: 'Drivers', icon: Users },
    { id: 'vehicles' as TabType, label: 'Vehicles', icon: Truck },
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

        {/* User Card */}
        <div className="flex items-center gap-3 mt-2 px-3 py-2.5 border-t border-[#d8c3ad]/40 pt-3 bg-[#f9f9ff] rounded-xl">
          <img
            alt="Admin User Profile"
            className="w-10 h-10 rounded-full object-cover border border-[#d8c3ad]"
            src={DEFAULT_AVATAR}
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-[#151c27] truncate">Admin User</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-medium text-emerald-700">Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
