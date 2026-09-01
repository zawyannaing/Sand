import React, { useState, useMemo } from 'react';
import { Truck, Layers, Plus, X, Wrench, CheckCircle2, Trash2, AlertTriangle, Search, Activity, Gauge } from 'lucide-react';
import { Vehicle } from '../types';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'todayTrips' | 'totalTrips'>) => void;
  onDeleteVehicle: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ 
  vehicles, 
  onAddVehicle,
  onDeleteVehicle
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'in_transit' | 'maintenance'>('all');
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [capacityKyin, setCapacityKyin] = useState<number>(15);
  const [currentDriver, setCurrentDriver] = useState('');
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Total Fleet Metrics
  const totalTodayTrips = useMemo(() => {
    return vehicles.reduce((sum, v) => sum + (v.todayTrips || 0), 0);
  }, [vehicles]);

  const totalDispatches = useMemo(() => {
    return vehicles.reduce((sum, v) => sum + (v.totalTrips || 0), 0);
  }, [vehicles]);

  const inTransitCount = useMemo(() => {
    return vehicles.filter(v => v.status === 'in_transit').length;
  }, [vehicles]);

  const activeCount = useMemo(() => {
    return vehicles.filter(v => v.status === 'active').length;
  }, [vehicles]);

  // Filtered vehicles based on search plate / driver and status
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = 
        !searchTerm.trim() ||
        v.plateNumber.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        v.currentDriver.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.trim().toLowerCase());

      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;

    onAddVehicle({
      plateNumber: plateNumber.trim(),
      model: model.trim() || 'Heavy Tipper Truck',
      capacityKyin: Number(capacityKyin) || 15,
      currentDriver: currentDriver.trim() || 'မသတ်မှတ်ရသေးပါ',
      status: 'active',
    });

    setShowModal(false);
    setPlateNumber('');
    setModel('');
    setCapacityKyin(15);
    setCurrentDriver('');
  };

  const handleConfirmDelete = () => {
    if (vehicleToDelete) {
      onDeleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-xl text-[#151c27]">
            သဲတင်ကားများစာရင်း (Fleet & Trucks)
          </h2>
          <p className="text-xs text-[#534434] mt-0.5">
            ကားအစီးရေ {vehicles.length} စီး • ပြေးဆွဲဆဲ {inTransitCount} စီး • အဆင်သင့် {activeCount} စီး • စုစုပေါင်းထွက်ခွာမှု {totalDispatches} ခေါက်
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ ကားအသစ်ထည့်သွင်းမည်</span>
        </button>
      </div>

      {/* Fleet Live Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>စုစုပေါင်း ကား (Fleet)</span>
            <Truck className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="text-xl font-extrabold text-[#151c27] mt-1">
            {vehicles.length} <span className="text-xs font-normal text-gray-500">စီး</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>လက်ရှိ ပြေးဆွဲဆဲ</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-blue-700 mt-1">
            {inTransitCount} <span className="text-xs font-normal text-gray-500">စီး</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>ယနေ့ခေါက်ရေ (Today Trips)</span>
            <Gauge className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="text-xl font-extrabold text-[#855300] mt-1">
            {totalTodayTrips} <span className="text-xs font-normal text-gray-500">ခေါက်</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#534434] font-medium">
            <span>Total Dispatches</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-800 mt-1">
            {totalDispatches} <span className="text-xs font-normal text-gray-500">ခေါက်</span>
          </div>
        </div>
      </div>

      {/* Truck Check Search & Filter Box */}
      <div className="bg-white p-4 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#534434] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Truck Check: ကားနံပါတ် (Plate) သို့မဟုတ် ယာဉ်မောင်းအမည်ဖြင့် စစ်ဆေးရန်..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
          >
            <option value="all">အခြေအနေ အားလုံး (All Status)</option>
            <option value="active">● Ready (အဆင်သင့်)</option>
            <option value="in_transit">🚚 In Transit (ပြေးဆွဲဆဲ)</option>
            <option value="maintenance">🔧 Maintenance (ပြင်ဆင်ဆဲ)</option>
          </select>
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#d8c3ad] p-12 text-center text-[#534434] flex flex-col items-center justify-center gap-3">
          <Truck className="w-12 h-12 text-[#d8c3ad]" />
          <p className="font-semibold text-sm">
            {searchTerm ? `"${searchTerm}" နှင့် ကိုက်ညီသော ယာဉ်မရှိပါ` : 'ယာဉ်စာရင်း မရှိသေးပါ (No vehicles found)'}
          </p>
          {searchTerm ? (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="text-xs text-[#855300] font-bold hover:underline cursor-pointer"
            >
              ရှာဖွေမှု ပြန်လည်ရှင်းလင်းရန် (Reset Search)
            </button>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-xs font-bold text-[#855300] bg-[#f0f3ff] hover:bg-[#ffddb8]/60 px-4 py-2 rounded-lg border border-[#d8c3ad] transition-colors"
            >
              + ယာဉ်အသစ် ထည့်သွင်းရန်
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((veh) => (
            <div
              key={veh.id}
              className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs hover:border-[#855300]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#f0f3ff] text-[#855300] rounded-xl border border-[#d8c3ad]/50">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#151c27]">{veh.plateNumber}</h3>
                      <p className="text-xs text-[#534434]">{veh.model}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        veh.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : veh.status === 'in_transit'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {veh.status === 'in_transit' ? '🚚 In Transit' : veh.status === 'active' ? '● Ready' : '🔧 Maint.'}
                    </span>

                    {/* Delete Vehicle Button */}
                    <button
                      type="button"
                      onClick={() => setVehicleToDelete(veh)}
                      title="ယာဉ်မှတ်တမ်းဖျက်မည် (Delete Vehicle)"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Specs */}
                <div className="mt-4 pt-3 border-t border-[#d8c3ad]/40 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-[#534434]">
                    <span>တင်ဆောင်နိုင်မှု (Capacity):</span>
                    <span className="font-extrabold text-[#855300] text-sm">
                      {veh.capacityKyin} ကျင်း
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#534434]">
                    <span>ယာဉ်မောင်း (Assigned Driver):</span>
                    <span className="font-semibold text-[#151c27]">{veh.currentDriver}</span>
                  </div>
                </div>

                {/* Real-time Dynamic Stats Box */}
                <div className="mt-3 grid grid-cols-2 gap-2 bg-[#f9f9ff] p-2.5 rounded-lg border border-[#d8c3ad]/40 text-center">
                  <div>
                    <span className="text-[10px] text-[#534434] font-medium block">Today Trips (ယနေ့ခေါက်ရေ)</span>
                    <span className="font-extrabold text-sm text-[#855300]">{veh.todayTrips} ခေါက်</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#534434] font-medium block">Total Dispatches (စုစုပေါင်း)</span>
                    <span className="font-extrabold text-sm text-[#151c27]">{veh.totalTrips} ခေါက်</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#d8c3ad] max-w-md w-full p-6 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#d8c3ad]/50">
              <h3 className="font-bold text-lg text-[#151c27] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#855300]" />
                <span>ယာဉ်အသစ် ထည့်သွင်းခြင်း</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#534434] hover:bg-gray-100 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  နံပါတ်ပြား (License Plate) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ဥပမာ- 9ယ/99887"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  ကားအမျိုးအစား / မိုဒယ် (Vehicle Model)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nissan CW520 (10 Wheels)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  ဆံ့ဝင်ဆံ့မှု ကျင်း (Max Capacity in Kyin)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacityKyin}
                  onChange={(e) => setCapacityKyin(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#534434] block mb-1">
                  ပုံမှန်မောင်းမည့်သူ (Assigned Driver)
                </label>
                <input
                  type="text"
                  placeholder="ဥပမာ- ဦးဘမောင်"
                  value={currentDriver}
                  onChange={(e) => setCurrentDriver(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] focus:outline-none focus:border-[#855300]"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-[#d8c3ad]/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#534434] border border-[#d8c3ad] rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  မလုပ်တော့ပါ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#855300] text-white rounded-lg hover:bg-[#653e00] cursor-pointer shadow-sm"
                >
                  သိမ်းဆည်းမည် (Save Vehicle)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setVehicleToDelete(null)}
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
                  ယာဉ်မှတ်တမ်း ဖျက်ရန် သေချာပါသလား?
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  အောက်ပါ ကားမှတ်တမ်းကို စာရင်းမှ အပြီးတိုင် ဖျက်ပစ်ပါမည်။
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-800 flex flex-col gap-1">
                  <div><strong>ယာဉ်အမှတ်:</strong> {vehicleToDelete.plateNumber}</div>
                  <div><strong>မိုဒယ်:</strong> {vehicleToDelete.model}</div>
                  <div><strong>ဆံ့ဝင်ပမာဏ:</strong> {vehicleToDelete.capacityKyin} ကျင်း</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
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
