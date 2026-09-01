import React, { useState, useMemo } from 'react';
import { Users, Phone, Truck, Plus, Check, ShieldCheck, X, Trash2, AlertTriangle, Search, Activity, Layers } from 'lucide-react';
import { Driver } from '../types';
import { DEFAULT_AVATAR } from '../data/mockData';

interface DriversViewProps {
  drivers: Driver[];
  onAddDriver: (driver: Omit<Driver, 'id' | 'todayTrips' | 'todayVolume' | 'totalTrips'>) => void;
  onDeleteDriver: (driverId: string) => void;
  onSelectDriverForTrip: (driver: Driver) => void;
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  onAddDriver,
  onDeleteDriver,
  onSelectDriverForTrip,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [burmeseName, setBurmeseName] = useState('');
  const [phone, setPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Driver summary metrics
  const totalTodayTrips = useMemo(() => {
    return drivers.reduce((sum, d) => sum + (d.todayTrips || 0), 0);
  }, [drivers]);

  const totalTodayVolume = useMemo(() => {
    return drivers.reduce((sum, d) => sum + (d.todayVolume || 0), 0);
  }, [drivers]);

  const activeOnlineCount = useMemo(() => {
    return drivers.filter(d => d.status === 'online' || d.status === 'busy').length;
  }, [drivers]);

  const totalDispatches = useMemo(() => {
    return drivers.reduce((sum, d) => sum + (d.totalTrips || 0), 0);
  }, [drivers]);

  // Filtered drivers based on search
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return drivers;
    const term = searchTerm.trim().toLowerCase();
    return drivers.filter(d => 
      d.burmeseName.toLowerCase().includes(term) ||
      d.name.toLowerCase().includes(term) ||
      d.licensePlate.toLowerCase().includes(term) ||
      d.phone.includes(term)
    );
  }, [drivers, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!burmeseName.trim() || !licensePlate.trim()) {
      return;
    }
    onAddDriver({
      name: name.trim() || burmeseName.trim(),
      burmeseName: burmeseName.trim(),
      phone: phone.trim() || '09-',
      licensePlate: licensePlate.trim(),
      avatarUrl: DEFAULT_AVATAR,
      status: 'online',
    });
    setShowAddModal(false);
    setName('');
    setBurmeseName('');
    setPhone('');
    setLicensePlate('');
  };

  const handleConfirmDelete = () => {
    if (driverToDelete) {
      onDeleteDriver(driverToDelete.id);
      setDriverToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-xl text-[#151c27]">
            ကားမောင်းသမားများ စာရင်း (Drivers Roster)
          </h2>
          <p className="text-xs text-[#534434] mt-0.5">
            ယာဉ်မောင်း {drivers.length} ဦး • တာဝန်ထမ်းဆောင်နေ {activeOnlineCount} ဦး • ယနေ့သယ်ယူမှု {totalTodayVolume} ကျင်း ({totalTodayTrips} ခေါက်)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ ကားသမားအသစ်ထည့်မည်</span>
        </button>
      </div>

      {/* Driver Live Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>စုစုပေါင်း ယာဉ်မောင်း</span>
            <Users className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="text-xl font-extrabold text-[#151c27] mt-1">
            {drivers.length} <span className="text-xs font-normal text-gray-500">ဦး</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>တာဝန်ထမ်းဆောင်ဆဲ</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1">
            {activeOnlineCount} <span className="text-xs font-normal text-gray-500">ဦး</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>ယနေ့သယ်ယူမှု (Volume)</span>
            <Layers className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="text-xl font-extrabold text-[#855300] mt-1">
            {totalTodayVolume} <span className="text-xs font-normal text-gray-500">ကျင်း</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>ယနေ့ခေါက်ရေ (Trips)</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-blue-700 mt-1">
            {totalTodayTrips} <span className="text-xs font-normal text-gray-500">ခေါက်</span>
          </div>
        </div>
      </div>

      {/* Driver Check Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#534434] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Driver Check: ယာဉ်မောင်းအမည် သို့မဟုတ် ကားနံပါတ် (Plate) ဖြင့် စစ်ဆေးရန်..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Driver Cards Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#d8c3ad] p-12 text-center text-[#534434] flex flex-col items-center justify-center gap-3">
          <Users className="w-12 h-12 text-[#d8c3ad]" />
          <p className="font-semibold text-sm">
            {searchTerm ? `"${searchTerm}" နှင့် ကိုက်ညီသော ယာဉ်မောင်းမရှိပါ` : 'ယာဉ်မောင်းစာရင်း မရှိသေးပါ (No drivers found)'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-[#855300] font-bold hover:underline cursor-pointer"
            >
              ရှာဖွေမှု ပြန်လည်ရှင်းလင်းရန် (Reset Search)
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 text-xs font-bold text-[#855300] bg-[#f0f3ff] hover:bg-[#ffddb8]/60 px-4 py-2 rounded-lg border border-[#d8c3ad] transition-colors"
            >
              + ယာဉ်မောင်းအသစ် ထည့်သွင်းရန်
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((drv) => (
            <div
              key={drv.id}
              className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs hover:border-[#855300]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={drv.avatarUrl || DEFAULT_AVATAR}
                      alt={drv.burmeseName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#d8c3ad]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-bold text-base text-[#151c27]">{drv.burmeseName}</h3>
                      <p className="text-xs text-[#534434]">{drv.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        drv.status === 'online'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : drv.status === 'busy'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      ● {drv.status}
                    </span>

                    {/* Delete Driver Button */}
                    <button
                      type="button"
                      onClick={() => setDriverToDelete(drv)}
                      title="ယာဉ်မောင်းစာရင်းဖျက်မည် (Delete Driver)"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 pt-3 border-t border-[#d8c3ad]/40 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-[#534434]">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#855300]" /> Assigned Truck:
                    </span>
                    <span className="font-bold text-[#151c27] bg-[#f0f3ff] px-2 py-0.5 rounded border border-[#d8c3ad]/60 font-mono">
                      {drv.licensePlate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#534434]">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#855300]" /> Phone:
                    </span>
                    <span className="font-semibold text-[#151c27]">{drv.phone}</span>
                  </div>
                </div>

                {/* Real-time Dynamic Stats Box */}
                <div className="mt-3 grid grid-cols-3 gap-1.5 bg-[#f9f9ff] p-2.5 rounded-lg border border-[#d8c3ad]/40 text-center">
                  <div>
                    <span className="text-[10px] text-[#534434] font-medium block">Today Trips</span>
                    <span className="font-extrabold text-xs sm:text-sm text-[#855300]">{drv.todayTrips} ခေါက်</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#534434] font-medium block">Today Volume</span>
                    <span className="font-extrabold text-xs sm:text-sm text-[#151c27]">{drv.todayVolume} ကျင်း</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#534434] font-medium block">Total Trips</span>
                    <span className="font-extrabold text-xs sm:text-sm text-[#151c27]">{drv.totalTrips} ခေါက်</span>
                  </div>
                </div>
              </div>

              {/* Quick Action */}
              <div className="mt-4 pt-3 border-t border-[#d8c3ad]/40 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectDriverForTrip(drv)}
                  className="w-full bg-[#f59e0b] hover:bg-[#855300] hover:text-white text-[#613b00] font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>🚚 ကားစာရင်းမှတ်မည်</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#d8c3ad] max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#d8c3ad]/50">
              <h3 className="font-bold text-lg text-[#151c27] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#855300]" />
                <span>ယာဉ်မောင်းအသစ် ထည့်သွင်းခြင်း</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#534434] hover:bg-gray-100 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  နာမည် (မြန်မာလို) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ဥပမာ- ဦးသန်းဌေး"
                  value={burmeseName}
                  onChange={(e) => setBurmeseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  English Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. U Than Htay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  နံပါတ်ပြား (License Plate) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ဥပမာ- 9က/98765"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  ဖုန်းနံပါတ် (Phone Number)
                </label>
                <input
                  type="tel"
                  placeholder="09-..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300]"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[#d8c3ad]/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#534434] border border-[#d8c3ad] rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#855300] text-white rounded-lg hover:bg-[#653e00] cursor-pointer shadow-sm"
                >
                  သိမ်းဆည်းမည် (Save Driver)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {driverToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setDriverToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-red-200 max-w-md w-full p-6 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">
                  ယာဉ်မောင်းစာရင်း ဖျက်ရန် သေချာပါသလား?
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  အောက်ပါ ယာဉ်မောင်းမှတ်တမ်းကို စာရင်းမှ အပြီးတိုင် ဖျက်ပစ်ပါမည်။
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-800 flex flex-col gap-1">
                  <div><strong>အမည်:</strong> {driverToDelete.burmeseName} ({driverToDelete.name})</div>
                  <div><strong>ယာဉ်အမှတ်:</strong> {driverToDelete.licensePlate}</div>
                  <div><strong>ဖုန်း:</strong> {driverToDelete.phone}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                မဖျက်တော့ပါ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>သေချာသည်၊ ဖျက်မည် (Delete)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
