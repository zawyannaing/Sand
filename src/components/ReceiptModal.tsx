import React, { useEffect } from 'react';
import { Printer, X, Truck, CheckCircle, ArrowLeft } from 'lucide-react';
import { Trip, AppSettings } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';

interface ReceiptModalProps {
  trip: Trip | null;
  settings: AppSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ trip, settings, onClose }) => {
  // Listen for Escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!trip) return null;

  const handlePrint = () => {
    window.print();
  };

  const mat = MATERIAL_LABELS[trip.materialType] || { en: trip.materialType, my: trip.materialType };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl border border-[#d8c3ad] max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-scale-up relative my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls - Top Navigation & Exit */}
        <div className="flex items-center justify-between pb-3 border-b border-[#d8c3ad]/50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#855300]">သယ်ယူပို့ဆောင်ရေး ပြေစာ / ဘောက်ချာ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-gray-300"
              title="Close (ESC)"
            >
              <X className="w-4 h-4 text-red-600" />
              <span>ပိတ်မည် (Exit)</span>
            </button>
          </div>
        </div>

        {/* Printable Delivery Voucher Area */}
        <div className="overflow-y-auto flex-1 my-2 pr-1">
          <div className="p-4 sm:p-6 bg-white print:p-0 flex flex-col gap-5 border border-dashed border-[#d8c3ad] rounded-xl print:mt-0 print:border-none">
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-[#151c27]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Truck className="w-6 h-6 text-[#855300]" />
                <h2 className="font-extrabold text-xl text-[#855300] tracking-tight">
                  {settings.companyName}
                </h2>
              </div>
              <p className="text-xs text-[#534434] font-medium">{settings.companySubtext}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">ဖုန်း - {settings.phone}</p>
              <div className="inline-block mt-2 bg-[#f0f3ff] text-[#855300] border border-[#d8c3ad] px-3 py-0.5 rounded-full text-xs font-bold">
                DELIVERY SLIP • ပို့ကုန်ဘောက်ချာ
              </div>
            </div>

            {/* Slip Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">ဘောက်ချာအမှတ် (Voucher No.):</span>
                <span className="font-extrabold text-sm text-[#151c27]">{trip.tripNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block">ရက်စွဲ/အချိန် (Date & Time):</span>
                <span className="font-semibold text-[#151c27]">{trip.formattedTime} ({new Date(trip.createdAt).toLocaleDateString()})</span>
              </div>

              <div>
                <span className="text-gray-500 block">ယာဉ်မောင်း (Driver):</span>
                <span className="font-bold text-[#151c27]">{trip.driverName}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block">ယာဉ်အမှတ် (Plate No.):</span>
                <span className="font-bold text-[#151c27] bg-[#f0f3ff] px-2 py-0.5 rounded border border-[#d8c3ad]">
                  {trip.licensePlate}
                </span>
              </div>

              <div className="col-span-2 pt-1">
                <span className="text-gray-500 block">ဝယ်ယူသူ / ဆိုက်အမည် (Customer):</span>
                <span className="font-semibold text-[#151c27]">{trip.customerName || 'အထွေထွေ ပို့ဆောင်မှု'}</span>
              </div>

              <div className="col-span-2">
                <span className="text-gray-500 block">ပို့ဆောင်မည့်နေရာ (Destination):</span>
                <span className="font-semibold text-[#151c27]">{trip.destination}</span>
              </div>
            </div>

            {/* Item Table */}
            <div className="border border-[#d8c3ad] rounded-lg overflow-hidden mt-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f0f3ff] border-b border-[#d8c3ad] font-bold text-[#151c27]">
                  <tr>
                    <th className="p-2">အမျိုးအမည် (Item)</th>
                    <th className="p-2 text-center">အရေအတွက် (Qty)</th>
                    <th className="p-2 text-right">နှုန်း (Rate)</th>
                    <th className="p-2 text-right">ကျသင့်ငွေ (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d8c3ad]/40">
                  <tr>
                    <td className="p-2.5 font-bold text-[#151c27]">
                      {mat.en} ({mat.my})
                      {trip.notes && <div className="text-[10px] text-gray-500 font-normal mt-0.5">{trip.notes}</div>}
                    </td>
                    <td className="p-2.5 text-center font-extrabold text-sm text-[#855300]">
                      {trip.quantity} <span className="text-xs font-normal">ကျင်း</span>
                    </td>
                    <td className="p-2.5 text-right font-medium">
                      {trip.unitPrice.toLocaleString()} Ks
                    </td>
                    <td className="p-2.5 text-right font-bold text-[#151c27]">
                      {trip.totalAmount.toLocaleString()} Ks
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#ffddb8]/30 font-extrabold text-xs text-[#855300] border-t border-[#d8c3ad]">
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right">
                      စုစုပေါင်း ကျသင့်ငွေ (Total):
                    </td>
                    <td className="p-2.5 text-right text-sm">
                      {trip.totalAmount.toLocaleString()} MMK
                    </td>
                  </tr>
                  {((trip.fuelExpense && trip.fuelExpense > 0) || (trip.carFee && trip.carFee > 0) || (trip.driverFee && trip.driverFee > 0)) && (
                    <tr className="bg-white/80 font-normal text-[11px] text-gray-700 border-t border-dashed border-[#d8c3ad]">
                      <td colSpan={2} className="p-2 text-left">
                        စရိတ်ခွဲဝေမှု (Expenses):
                      </td>
                      <td colSpan={2} className="p-2 text-right space-x-1">
                        {trip.fuelExpense ? (
                          <span>ဆီဖိုး: <span className="font-bold text-amber-900">{trip.fuelExpense.toLocaleString()} Ks</span> | </span>
                        ) : null}
                        {trip.carFee ? (
                          <span>ကားခ: <span className="font-bold text-[#855300]">{trip.carFee.toLocaleString()} Ks</span> | </span>
                        ) : null}
                        {trip.driverFee ? (
                          <span>ယာဉ်မောင်းခ: <span className="font-bold text-[#005ac2]">{trip.driverFee.toLocaleString()} Ks</span></span>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 mt-2 border-t border-[#d8c3ad]/50 text-center text-xs">
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1 font-semibold text-[#151c27]">
                  {trip.driverName}
                </div>
                <span className="text-[11px] text-gray-500">ယာဉ်မောင်းလက်မှတ် (Driver)</span>
              </div>
              <div>
                <div className="border-b border-gray-400 pb-1 mb-1 text-transparent">.</div>
                <span className="text-[11px] text-gray-500">လက်ခံသူလက်မှတ် (Receiver)</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-dashed border-gray-200">
              စစ်ဆေးလက်ခံပြီးပါက ပြေစာအား သိမ်းဆည်းထားပါ • Generated by Logistics Pro
            </div>
          </div>
        </div>

        {/* Bottom Exit Bar - High Visibility */}
        <div className="pt-3 border-t border-[#d8c3ad]/50 print:hidden flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold py-2.5 px-4 rounded-xl border border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ပိတ်မည် / ပြန်ထွက်မည် (Exit Slip)</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#855300] hover:bg-[#653e00] text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>ပရင့်ထုတ်မည် (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
