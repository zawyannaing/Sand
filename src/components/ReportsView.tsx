import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Calendar, 
  Award, 
  Truck
} from 'lucide-react';
import { Trip, Driver } from '../types';

interface ReportsViewProps {
  trips?: Trip[];
  drivers?: Driver[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ trips = [], drivers = [] }) => {
  const safeTrips = trips || [];
  const safeDrivers = drivers || [];
  const totalVolume = safeTrips.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalRevenue = safeTrips.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

  // Group by material
  const materialTotals = {
    sand: safeTrips.filter(t => t.materialType === 'sand').reduce((a, b) => a + b.quantity, 0),
    soil: safeTrips.filter(t => t.materialType === 'soil').reduce((a, b) => a + b.quantity, 0),
    stone: safeTrips.filter(t => t.materialType === 'stone').reduce((a, b) => a + b.quantity, 0),
    gravel: safeTrips.filter(t => t.materialType === 'gravel').reduce((a, b) => a + b.quantity, 0),
  };

  // Driver performance rankings
  const driverPerformance = safeDrivers.map(drv => {
    const drvTrips = safeTrips.filter(t => t.driverName === drv.burmeseName || t.driverName === drv.name);
    const volume = drvTrips.reduce((acc, t) => acc + t.quantity, 0);
    const count = drvTrips.length;
    return {
      ...drv,
      tripsCount: count,
      volumeCount: volume,
    };
  }).sort((a, b) => b.volumeCount - a.volumeCount);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-xl text-[#151c27]">
            သယ်ယူပို့ဆောင်မှု အစီရင်ခံစာများ (Reports & Analytics)
          </h2>
          <p className="text-xs text-[#534434] mt-0.5">
            Logistics performance, aggregate volume trends, and driver leaderboard
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#f0f3ff] px-3 py-1.5 rounded-lg border border-[#d8c3ad] text-xs font-semibold text-[#855300]">
          <Calendar className="w-4 h-4" />
          <span>Today & Historical Analytics</span>
        </div>
      </div>

      {/* Top Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>စုစုပေါင်း သဲ/ကျောက် ကျင်း</span>
            <Layers className="w-4 h-4 text-[#855300]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#855300]">{totalVolume}</span>
            <span className="text-sm font-semibold text-[#534434]">ကျင်း</span>
          </div>
          <p className="text-xs text-emerald-700 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> High volume dispatch day
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>စုစုပေါင်း ရငွေပမာဏ</span>
            <span className="text-xs font-bold text-[#855300]">MMK</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#151c27]">{totalRevenue.toLocaleString()}</span>
            <span className="text-sm font-semibold text-[#534434]">ကျပ်</span>
          </div>
          <p className="text-xs text-[#534434] mt-2">
            {(totalRevenue / 100000).toFixed(2)} သိန်းကျပ်
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#534434] uppercase">
            <span>ခေါက်ရေအများဆုံး ကားသမား</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-900">
              {driverPerformance[0]?.burmeseName || 'N/A'}
            </span>
            <span className="text-xs font-bold text-amber-700">
              ({driverPerformance[0]?.volumeCount || 0} ကျင်း)
            </span>
          </div>
          <p className="text-xs text-[#534434] mt-2">
            ယာဉ်မောင်း {driverPerformance[0]?.licensePlate || ''}
          </p>
        </div>
      </div>

      {/* Material Breakdown & Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Shares */}
        <div className="bg-white p-6 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <h3 className="font-bold text-base text-[#151c27] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#855300]" />
            <span>ပစ္စည်းအမျိုးအစားအလိုက် ဖြန့်ဝေမှု (Material Share)</span>
          </h3>

          <div className="flex flex-col gap-4">
            {[
              { label: 'Sand (သဲ)', count: materialTotals.sand, color: 'bg-[#f59e0b]', text: 'text-[#855300]' },
              { label: 'Stone (ကျောက်)', count: materialTotals.stone, color: 'bg-[#565e74]', text: 'text-[#3f465c]' },
              { label: 'Gravel (ကျောက်စရစ်)', count: materialTotals.gravel, color: 'bg-[#005ac2]', text: 'text-[#00408f]' },
              { label: 'Soil (မြေ)', count: materialTotals.soil, color: 'bg-[#855300]', text: 'text-[#653e00]' },
            ].map(item => {
              const pct = totalVolume > 0 ? Math.round((item.count / totalVolume) * 100) : 0;
              return (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#151c27]">{item.label}</span>
                    <span className="text-[#534434]">{item.count} ကျင်း ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#e7eefe] h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Leaderboard */}
        <div className="bg-white p-6 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
          <h3 className="font-bold text-base text-[#151c27] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <span>ယာဉ်မောင်းစွမ်းဆောင်ရည် (Driver Leaderboard)</span>
          </h3>

          <div className="flex flex-col gap-3">
            {driverPerformance.map((drv, idx) => (
              <div
                key={drv.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[#d8c3ad]/40 bg-[#f9f9ff] hover:bg-[#f0f3ff] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    idx === 0 ? 'bg-[#f59e0b] text-[#613b00]' : 'bg-[#e7eefe] text-[#534434]'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#151c27]">{drv.burmeseName}</h4>
                    <p className="text-xs text-[#534434]">{drv.licensePlate} • {drv.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-[#855300]">
                    {drv.volumeCount} <span className="text-xs font-normal">ကျင်း</span>
                  </div>
                  <div className="text-[11px] text-[#534434]">{drv.tripsCount} ခေါက်</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
