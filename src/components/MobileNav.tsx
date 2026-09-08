import React from 'react';
import { LayoutDashboard, PlusCircle, History, Building2, Package, Settings } from 'lucide-react';
import { TabType } from '../types';

interface MobileNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingTripsCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  currentTab, 
  onSelectTab, 
  pendingTripsCount = 0 
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'ပင်မ',
      sub: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory' as TabType,
      label: 'စတို',
      sub: 'Stock',
      icon: Package,
    },
    {
      id: 'add-trip' as TabType,
      label: 'ကားလွှတ်',
      sub: 'Dispatch',
      icon: PlusCircle,
      isPrimary: true,
    },
    {
      id: 'customer-portal' as TabType,
      label: 'ဆိုဒ်ဘုတ်',
      sub: 'Portal',
      icon: Building2,
    },
    {
      id: 'history' as TabType,
      label: 'မှတ်တမ်း',
      sub: 'History',
      icon: History,
      badge: pendingTripsCount > 0 ? pendingTripsCount : undefined,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#d8c3ad]/60 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className="relative -top-3 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                  isActive 
                    ? 'bg-[#855300] text-white ring-4 ring-[#ffddb8] shadow-amber-900/30' 
                    : 'bg-gradient-to-tr from-[#855300] to-[#b47100] text-white shadow-amber-900/20'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] mt-0.5 font-bold tracking-tight transition-colors ${
                  isActive ? 'text-[#855300]' : 'text-[#534434]'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 relative active:scale-95 cursor-pointer focus:outline-none ${
                isActive ? 'text-[#855300]' : 'text-[#736353] hover:text-[#151c27]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${
                isActive ? 'font-extrabold text-[#855300]' : 'font-medium'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#855300] mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

