import React, { useState } from 'react';
import { RefreshCw, Bell, Plus, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { TabType } from '../types';
import { DEFAULT_AVATAR } from '../data/mockData';

interface HeaderProps {
  onAddNewTrip: () => void;
  onOpenNotifications: () => void;
  onOpenGoogleSheets?: () => void;
  unreadNotificationsCount: number;
  currentTab: TabType;
  hasGoogleSheetConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onAddNewTrip,
  onOpenNotifications,
  onOpenGoogleSheets,
  unreadNotificationsCount,
  currentTab,
  hasGoogleSheetConnected,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedToast, setSyncedToast] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedToast(true);
      setTimeout(() => setSyncedToast(false), 2500);
    }, 800);
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
        
        <div className="flex items-center gap-1.5 bg-[#f0f3ff] px-2.5 py-1 rounded-full border border-[#d8c3ad]/50 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-[#534434] uppercase tracking-wider font-bold">
            ONLINE
          </span>
        </div>

        {syncedToast && (
          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Synced & Live</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Google Sheets Modal Trigger */}
        <button
          onClick={onOpenGoogleSheets}
          title="Google Sheets & Drive Integration"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Google Sheets</span>
          {hasGoogleSheetConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>

        {/* Sync/Refresh button */}
        <button
          onClick={handleSync}
          title="Sync fleet data"
          className="p-2 rounded-full text-[#534434] hover:bg-[#f0f3ff] active:bg-[#e2e8f8] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-[#855300]' : ''}`} />
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
          className="hidden md:inline-flex items-center gap-2 bg-[#855300] hover:bg-[#653e00] active:scale-[0.98] text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-all"
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
