import React from 'react';
import { Bell, CheckCircle2, Clock, X, Truck } from 'lucide-react';
import { Trip } from '../types';

interface NotificationModalProps {
  trips: Trip[];
  onClose: () => void;
  onViewReceipt: (trip: Trip) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  trips,
  onClose,
  onViewReceipt,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-end p-4 md:p-6">
      <div className="bg-white rounded-2xl border border-[#d8c3ad] max-w-sm w-full p-5 shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-[#d8c3ad]/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#855300]" />
            <h3 className="font-bold text-base text-[#151c27]">အသိပေးချက်များ (Notifications)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 py-3 flex flex-col gap-2.5">
          {trips.slice(0, 8).map((trip) => (
            <div
              key={trip.id}
              onClick={() => {
                onViewReceipt(trip);
                onClose();
              }}
              className="p-3 rounded-xl border border-[#d8c3ad]/40 bg-[#f9f9ff] hover:bg-[#f0f3ff] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#855300]" />
                  <span className="font-bold text-xs text-[#151c27]">{trip.tripNumber}</span>
                </div>
                <span className="text-[10px] text-gray-500">{trip.formattedTime}</span>
              </div>
              <p className="text-xs text-[#534434] mt-1 font-medium">
                {trip.driverName} ({trip.quantity} ကျင်း) → {trip.destination}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  trip.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {trip.status === 'delivered' ? '✓ ပို့ဆောင်ပြီး' : '🚚 လမ်းပေါ်ရောက်ရှိဆဲ'}
                </span>
                <span className="text-[10px] text-[#855300] font-semibold">ကြည့်မည် →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
