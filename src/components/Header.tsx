import React, { useState, useEffect } from 'react';
import { RefreshCw, Bell, Plus, CheckCircle2, Database, Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { TabType } from '../types';
import { DEFAULT_AVATAR } from '../data/mockData';
import { subscribeSyncStatus, getPendingCount, isOnline as checkIsOnline } from '../services/offlineSync';

interface HeaderProps {
  onAddNewTrip: () => void;
  onOpenNotifications: () => void;
  onOpenSupabase?: () => void;
  onManualSync?: () => Promise<void>;
  unreadNotificationsCount: number;
  currentTab: TabType;
  hasSupabaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAddNewTrip,
  onOpenNotifications,
  onOpenSupabase,
  onManualSync,
  unreadNotificationsCount,
  currentTab,
  hasSupabaseConnected,
}) => {
  const [syncState, setSyncState] = useState({
    isOnline: checkIsOnline(),
    pendingCount: getPendingCount(),
    isSyncing: false,
    lastSyncedAt: null as Date | null,
  });
  const [syncedToast, setSyncedToast] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const handleSyncClick = async () => {
    if (onManualSync) {
      await onManualSync();
    }
    setSyncedToast(true);
    setTimeout(() => setSyncedToast(false), 3000);
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { en: 'Logistics Management', my: 'ပင်မစာမျက်နှာ' };
      case 'add-trip':
        return { en: 'Logistics Management', my: 'သဲကားစာရင်းမှတ်' };
      case 'history':
        return { en: 'Trip History & Records', my: 'မှတ်တမ်းဟောင်းများ' };
      case 'site-billing':
        return { en: 'Site Billing & Invoicing', my: 'ဆိုက်အလိုက်ဘေလ်ရှင်းတမ်း' };
      case 'reports':
        return { en: 'Analytics & Reports', my: 'အစီရင်ခံစာများ' };
      case 'drivers':
        return { en: 'Fleet Drivers', my: 'ကားသမားများစာရင်း' };
      case 'vehicles':
        return { en: 'Vehicles & Trucks', my: 'ယာဉ်များစာရင်း' };
      case 'settings':
        return { en: 'System Settings', my: 'စနစ်ဆက်တင်များ' };
      default:
        return { en: 'Logistics Management', my: 'သဲကားစာရင်းမှတ်' };
    }
  };

  const title = getPageTitle();

  return (
    <header className="sticky top-0 z-20 flex justify-between items-center w-full px-4 md:px-8 py-3.5 bg-white/95 backdrop-blur-sm border-b border-[#d8c3ad]/30">
      <div className="flex items-center gap-3">
        <h2 className="font-extrabold text-[20px] md:text-[22px] tracking-tight text-[#855300] hidden md:block">
          {title.en}
        </h2>
        <h2 className="font-bold text-[18px] text-[#855300] md:hidden">
          {title.my}
        </h2>
        
        {/* Dynamic Online / Offline & Sync Queue Pill */}
        {syncState.isOnline ? (
          <div 
            onClick={handleSyncClick}
            title={syncState.pendingCount > 0 ? `${syncState.pendingCount} offline changes syncing to cloud` : "Connected to internet (Online Mode)"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xs transition-all cursor-pointer ${
              syncState.pendingCount > 0
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-[#f0f3ff] border-[#d8c3ad]/50 text-[#534434]'
            }`}
          >
            {syncState.isSyncing ? (
              <RefreshCw className="w-3 h-3 text-[#855300] animate-spin" />
            ) : (
              <span className={`w-2.5 h-2.5 rounded-full ${syncState.pendingCount > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
            )}
            <span className="text-[10px] uppercase tracking-wider font-bold">
              {syncState.isSyncing
                ? 'Syncing...'
                : syncState.pendingCount > 0
                ? `Syncing (${syncState.pendingCount})`
                : 'ONLINE'}
            </span>
          </div>
        ) : (
          <div 
            title="App is working offline. All additions and removals are saved locally and will auto-sync when internet connects."
            className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-rose-800 shadow-xs"
          >
            <WifiOff className="w-3 h-3 text-rose-600" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold">
              OFFLINE {syncState.pendingCount > 0 ? `(${syncState.pendingCount})` : 'MODE'}
            </span>
          </div>
        )}

        {syncedToast && (
          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Database Synced</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Supabase Cloud DB Trigger */}
        <button
          onClick={onOpenSupabase}
          title="Supabase PostgreSQL Cloud DB"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <Database className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Supabase DB</span>
          {hasSupabaseConnected ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Not configured"></span>
          )}
        </button>

        {/* Sync/Refresh button */}
        <button
          onClick={handleSyncClick}
          title="Sync offline queue & reload from Supabase"
          className="p-2 rounded-full text-[#534434] hover:bg-[#f0f3ff] active:bg-[#e2e8f8] transition-colors cursor-pointer relative"
        >
          <RefreshCw className={`w-5 h-5 ${syncState.isSyncing ? 'animate-spin text-[#855300]' : ''}`} />
          {syncState.pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
              {syncState.pendingCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          title="Notifications"
          className="p-2 rounded-full text-[#534434] hover:bg-[#f0f3ff] active:bg-[#e2e8f8] transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>

        {/* Add New Trip button (Desktop) */}
        <button
          onClick={onAddNewTrip}
          className="hidden md:inline-flex items-center gap-2 bg-[#855300] hover:bg-[#653e00] active:scale-[0.98] text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Trip</span>
        </button>

        {/* Mobile profile avatar */}
        <img
          alt="Operator Avatar"
          className="w-8 h-8 rounded-full object-cover md:hidden border border-[#d8c3ad] ml-1"
          src={DEFAULT_AVATAR}
          referrerPolicy="no-referrer"
        />
      </div>
    </header>
  );
};

