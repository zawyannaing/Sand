import React, { useState } from 'react';
import { 
  Truck, 
  User, 
  Hash, 
  Layers, 
  Info, 
  ChevronDown, 
  MapPin, 
  Phone, 
  Building2, 
  DollarSign, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  PlusCircle, 
  Banknote, 
  Coins, 
  Wallet,
  Fuel,
  Plus,
  Minus
} from 'lucide-react';
import { Trip, Driver, MaterialType, AppSettings } from '../types';

interface AddTripViewProps {
  onSaveTrip: (trip: Omit<Trip, 'id'>) => Trip;
  drivers: Driver[];
  settings: AppSettings;
  onCancel?: () => void;
  onViewReceipt: (trip: Trip) => void;
  nextTripId: string;
}

export const AddTripView: React.FC<AddTripViewProps> = ({
  onSaveTrip,
  drivers,
  settings,
  onCancel,
  onViewReceipt,
  nextTripId,
}) => {
  const [driverName, setDriverName] = useState(drivers[0]?.burmeseName || 'ဦးဘမောင်');
  const [licensePlate, setLicensePlate] = useState(drivers[0]?.licensePlate || '9ယ/12345');
  const [quantity, setQuantity] = useState<number>(15);
  const [showDetails, setShowDetails] = useState(true);
  const [materialType, setMaterialType] = useState<MaterialType>('sand');
  const [destination, setDestination] = useState('လှိုင်သာယာ စက်မှုဇုန် (Site A)');
  const [phone, setPhone] = useState(drivers[0]?.phone || '09-450012345');
  const [customerName, setCustomerName] = useState('ရွှေနဂါး ဆောက်လုပ်ရေး');
  const [unitPrice, setUnitPrice] = useState<number>(settings.defaultPricePerKyin || 45000);
  const [carFee, setCarFee] = useState<number>(0);
  const [driverFee, setDriverFee] = useState<number>(0);
  const [fuelExpense, setFuelExpense] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status] = useState<'on_the_way' | 'delivered'>('on_the_way');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success Feedback Modal
  const [savedTrip, setSavedTrip] = useState<Trip | null>(null);

  // Auto-sync license plate and phone when choosing known driver
  const handleDriverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDriverName(val);
    setErrorMessage(null);
    const matched = drivers.find(
      d => d.burmeseName.toLowerCase() === val.toLowerCase() || d.name.toLowerCase() === val.toLowerCase()
    );
    if (matched) {
      setLicensePlate(matched.licensePlate);
      if (matched.phone && matched.phone !== '-') {
        setPhone(matched.phone);
      }
    }
  };

  const handleQuickDriverClick = (d: Driver) => {
    setDriverName(d.burmeseName);
    setLicensePlate(d.licensePlate);
    if (d.phone && d.phone !== '-') {
      setPhone(d.phone);
    }
    setErrorMessage(null);
  };

  const presetQuantities = [10, 15, 20, 25, 30];
  const totalAmount = (quantity || 0) * (unitPrice || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!driverName.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ ကားမောင်းသမားနာမည် ထည့်သွင်းပါ (Please enter driver name)');
      return;
    }
    if (!licensePlate.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ နံပါတ်ပြား ထည့်သွင်းပါ (Please enter license plate)');
      return;
    }
    if (!quantity || quantity <= 0) {
      setErrorMessage('ကျေးဇူးပြု၍ သဲအရေအတွက် (ကျင်း) ထည့်သွင်းပါ');
      return;
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTripData: Omit<Trip, 'id'> = {
      tripNumber: nextTripId,
      driverName: driverName.trim(),
      licensePlate: licensePlate.trim(),
      quantity: Number(quantity),
      materialType,
      destination: destination.trim() || 'တည်နေရာ မသတ်မှတ်ရသေးပါ (Unspecified)',
      phone: phone.trim() || '-',
      customerName: customerName.trim(),
      unitPrice: Number(unitPrice),
      totalAmount,
      carFee: Number(carFee) || 0,
      driverFee: Number(driverFee) || 0,
      fuelExpense: Number(fuelExpense) || 0,
      status,
      createdAt: now.toISOString(),
      formattedTime,
      notes: notes.trim(),
    };

    const created = onSaveTrip(newTripData);
    setSavedTrip(created);
  };

  const handleResetForNextTrip = () => {
    setSavedTrip(null);
    setNotes('');
    setCarFee(0);
    setDriverFee(0);
    setFuelExpense(0);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-2 md:py-4">
      {/* Inline Validation Error Message */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-300 text-red-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Add Trip Card */}
      <div className="bg-white rounded-xl border border-[#d8c3ad]/70 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#f0f3ff] px-6 py-4 border-b border-[#d8c3ad]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#f59e0b] text-[#613b00] p-2 rounded-lg shadow-xs flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-[20px] text-[#151c27] leading-tight">
                ကားစာရင်းအသစ်ထည့်ရန်
              </h2>
              <p className="text-xs text-[#534434]/75">Add New Sand / Aggregate Trip</p>
            </div>
          </div>
          <span className="font-semibold text-xs text-[#534434] bg-white px-3 py-1.5 rounded-md border border-[#d8c3ad] shadow-xs">
            ID: {nextTripId}
          </span>
        </div>

        {/* Card Body Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* Quick Driver Suggestion Bar */}
          <div className="bg-[#f0f3ff]/70 p-3 rounded-xl border border-[#d8c3ad]/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#534434] font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#855300]" />
                <span>အမြန်ရွေးရန် (Quick Select Driver):</span>
              </span>
              <span className="text-[11px] text-[#534434]/80 font-medium">
                စုစုပေါင်း {drivers.length} ဦး
              </span>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {drivers.map((d) => {
                const isSelected = driverName.trim() === d.burmeseName.trim() || driverName.trim() === d.name.trim();
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleQuickDriverClick(d)}
                    className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[#855300] text-white border-[#855300] font-bold shadow-xs scale-[1.02]'
                        : 'bg-white text-[#534434] border-[#d8c3ad] hover:bg-[#e7eefe] hover:border-[#855300]/40'
                    }`}
                  >
                    <span>{d.burmeseName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-[#f0f3ff] text-[#534434]'}`}>
                      {d.licensePlate}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Driver Name & License Plate Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#151c27] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#855300]" />
                <span>ကားမောင်းသမားနာမည် (Driver Name)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={driverName}
                onChange={handleDriverSelect}
                placeholder="ကားမောင်းသူအမည် ရိုက်ထည့်ပါ..."
                className="w-full bg-[#f9f9ff] border border-[#d8c3ad] focus:border-[#855300] focus:ring-1 focus:ring-[#855300] rounded-lg px-4 py-3 text-base text-[#151c27] transition-all outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#151c27] flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-[#855300]" />
                <span>နံပါတ်ပြား (License Plate)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => {
                  setLicensePlate(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="ဥပမာ- 9ယ/12345"
                className="w-full bg-[#f9f9ff] border border-[#d8c3ad] focus:border-[#855300] focus:ring-1 focus:ring-[#855300] rounded-lg px-4 py-3 text-base text-[#151c27] transition-all outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Sand Quantity (ကျင်း) Section - Mobile Optimized */}
          <div className="flex flex-col gap-3.5 bg-[#f0f3ff] p-4 sm:p-5 rounded-2xl border border-[#d8c3ad]/70">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#151c27] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#855300]" />
                <span>သဲအရေအတွက် / ပမာဏ (Quantity in Kyin)</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-[#855300] bg-white px-2.5 py-1 rounded-md border border-[#d8c3ad] shadow-xs">
                ၁ ကျင်း = ၁၀၀ ကုဗပေ
              </span>
            </div>

            {/* Stepper + Big Prominent Number Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuantity(prev => Math.max(0.5, (prev || 0) - 1));
                  setErrorMessage(null);
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white hover:bg-[#e7eefe] active:scale-95 border-2 border-[#d8c3ad] text-[#855300] flex items-center justify-center font-extrabold text-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="Decrease 1 Kyin"
              >
                <Minus className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(parseFloat(e.target.value) || 0);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-white border-2 border-[#d8c3ad] focus:border-[#855300] rounded-xl py-3 px-3 sm:px-5 text-2xl sm:text-3xl font-black text-[#855300] text-center shadow-xs transition-all outline-none"
                  required
                />
                <span className="absolute right-3 sm:right-4 font-bold text-sm sm:text-base text-[#534434] pointer-events-none">
                  ကျင်း
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQuantity(prev => (prev || 0) + 1);
                  setErrorMessage(null);
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#855300] hover:bg-[#653e00] active:scale-95 text-white flex items-center justify-center font-extrabold text-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="Increase 1 Kyin"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick Preset Buttons (10, 15, 20, 25, 30) */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs text-[#534434] font-medium whitespace-nowrap mr-1">အမြန်ရွေးရန်:</span>
              {presetQuantities.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset)}
                  className={`flex-1 min-w-[52px] py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border active:scale-95 ${
                    quantity === preset
                      ? 'bg-[#855300] text-white border-[#855300] shadow-xs'
                      : 'bg-white text-[#534434] border-[#d8c3ad] hover:bg-[#e7eefe]'
                  }`}
                >
                  {preset} ကျင်း
                </button>
              ))}
            </div>
          </div>

          {/* Expandable Details Container */}
          <div className="border border-[#d8c3ad]/70 rounded-xl overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-5 py-3.5 bg-[#f0f3ff] hover:bg-[#e7eefe] flex items-center justify-between text-left transition-colors border-b border-[#d8c3ad]/50 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#855300]" />
                <span className="font-bold text-sm text-[#151c27]">
                  အသေးစိတ်အချက်အလက်များ (Delivery Details & Pricing)
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#534434] transition-transform duration-200 ${
                  showDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showDetails && (
              <div className="p-5 flex flex-col gap-4 bg-white animate-fade-in">
                {/* Material Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-[#534434]">
                    သယ်ယူမည့် ပစ္စည်းအမျိုးအစား (Material Type)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['sand', 'soil', 'stone', 'gravel'] as MaterialType[]).map((mat) => {
                      const labels: Record<MaterialType, { en: string; my: string }> = {
                        sand: { en: 'Sand', my: 'သဲ' },
                        soil: { en: 'Soil', my: 'မြေကြီး' },
                        stone: { en: 'Stone', my: 'ကျောက်' },
                        gravel: { en: 'Gravel', my: 'ကျောက်စရစ်' },
                      };
                      const active = materialType === mat;
                      return (
                        <button
                          key={mat}
                          type="button"
                          onClick={() => setMaterialType(mat)}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                            active
                              ? 'bg-[#855300] text-white border-[#855300] shadow-xs'
                              : 'bg-[#f9f9ff] text-[#534434] border-[#d8c3ad] hover:bg-[#f0f3ff]'
                          }`}
                        >
                          {labels[mat].en} ({labels[mat].my})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Destination & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#534434] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#855300]" /> Destination (ပို့ဆောင်မည့်နေရာ/ဆိုက်)
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. လှိုင်သာယာ စက်မှုဇုန် (Site A)"
                      className="w-full bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:border-[#855300]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#534434] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#855300]" /> Phone (ဖုန်းနံပါတ်)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09..."
                      className="w-full bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:border-[#855300]"
                    />
                  </div>
                </div>

                {/* Customer Name & Price Calculation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#534434] flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#855300]" /> Customer / Site Owner (ဝယ်သူအမည်)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. ရွှေနဂါး ဆောက်လုပ်ရေး"
                      className="w-full bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:border-[#855300]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#534434] flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#855300]" /> Unit Price (၁ ကျင်းဈေးနှုန်း - MMK)
                    </label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:border-[#855300]"
                    />
                  </div>
                </div>

                {/* Estimated Total Calculation Preview */}
                <div className="bg-[#ffddb8]/30 rounded-lg p-3 border border-[#f59e0b]/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#653e00]">
                    စုစုပေါင်းကျသင့်ငွေ (Total Calculated Fee):
                  </span>
                  <span className="text-base font-extrabold text-[#855300]">
                    {totalAmount.toLocaleString()} MMK ({quantity} ကျင်း × {unitPrice.toLocaleString()})
                  </span>
                </div>

                {/* Car Fees, Driver Fees & Fuel Expenses Section (Placed above Remark and note) */}
                <div className="pt-2 border-t border-[#d8c3ad]/70 flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#151c27] flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-[#855300]" />
                      <span>စရိတ် & ရှင်းတမ်းများ (Trip Expenses & Allowances)</span>
                    </span>
                    <span className="text-[11px] text-[#534434] bg-[#f0f3ff] px-2 py-0.5 rounded border border-[#d8c3ad]/60">
                      ကားခ • ယာဉ်မောင်းခ • ဆီဖိုး
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Fuel Expense Input (ဆီဖိုး / စက်သုံးဆီစရိတ်) */}
                    <div className="flex flex-col gap-1.5 bg-[#fff8eb] p-3 rounded-xl border border-amber-300/80 shadow-xs">
                      <label className="text-xs font-bold text-amber-950 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Fuel className="w-3.5 h-3.5 text-amber-700" /> ဆီဖိုး (Fuel Expense)
                        </span>
                        <span className="text-[10px] text-amber-800 font-mono">MMK</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={fuelExpense || ''}
                          onChange={(e) => setFuelExpense(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-white border border-amber-300 focus:border-amber-600 rounded-lg px-3 py-2 text-sm font-bold text-amber-950 focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-amber-800 pointer-events-none">
                          ကျပ်
                        </span>
                      </div>
                      {/* Quick preset buttons for Fuel */}
                      <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                        {[20000, 30000, 45000, 60000, 80000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFuelExpense(preset)}
                            className={`px-2 py-0.5 text-[10px] rounded border transition-colors whitespace-nowrap active:scale-95 ${
                              fuelExpense === preset
                                ? 'bg-amber-700 text-white border-amber-700 font-bold'
                                : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            {(preset / 10000).toFixed(1)} သောင်း
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Car Fee Input */}
                    <div className="flex flex-col gap-1.5 bg-[#f9f9ff] p-3 rounded-xl border border-[#d8c3ad]/60">
                      <label className="text-xs font-semibold text-[#534434] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#855300]" /> ကားခ (Car / Vehicle Fee)
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">MMK</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={carFee || ''}
                          onChange={(e) => setCarFee(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-white border border-[#d8c3ad] focus:border-[#855300] rounded-lg px-3 py-2 text-sm font-bold text-[#151c27] focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-[#534434] pointer-events-none">
                          ကျပ်
                        </span>
                      </div>
                      {/* Quick preset buttons for Car Fee */}
                      <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                        {[50000, 70000, 80000, 100000, 120000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCarFee(preset)}
                            className={`px-2 py-0.5 text-[10px] rounded border transition-colors whitespace-nowrap active:scale-95 ${
                              carFee === preset
                                ? 'bg-[#855300] text-white border-[#855300] font-bold'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {(preset / 10000).toFixed(0)} သောင်း
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Driver Fee Input */}
                    <div className="flex flex-col gap-1.5 bg-[#f9f9ff] p-3 rounded-xl border border-[#d8c3ad]/60">
                      <label className="text-xs font-semibold text-[#534434] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-[#855300]" /> ယာဉ်မောင်းခ (Driver Fee)
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">MMK</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={driverFee || ''}
                          onChange={(e) => setDriverFee(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-white border border-[#d8c3ad] focus:border-[#855300] rounded-lg px-3 py-2 text-sm font-bold text-[#151c27] focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-[#534434] pointer-events-none">
                          ကျပ်
                        </span>
                      </div>
                      {/* Quick preset buttons for Driver Fee */}
                      <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                        {[15000, 20000, 25000, 30000, 40000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDriverFee(preset)}
                            className={`px-2 py-0.5 text-[10px] rounded border transition-colors whitespace-nowrap active:scale-95 ${
                              driverFee === preset
                                ? 'bg-[#855300] text-white border-[#855300] font-bold'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {(preset / 10000).toFixed(1)} သောင်း
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Net Profit & Expenses Breakdown Card */}
                  {(fuelExpense > 0 || carFee > 0 || driverFee > 0) && (
                    <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/90 text-xs flex flex-col gap-1.5 animate-fade-in shadow-xs">
                      <div className="flex items-center justify-between text-gray-700">
                        <span>ရောင်းရငွေ (Gross Revenue):</span>
                        <span className="font-bold">{totalAmount.toLocaleString()} MMK</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-red-700 gap-1">
                        <span>ကုန်ကျစရိတ်များ (Total Expenses):</span>
                        <span className="font-semibold">
                          - {((fuelExpense || 0) + (carFee || 0) + (driverFee || 0)).toLocaleString()} MMK
                          <span className="text-[10px] text-gray-600 font-normal ml-1">
                            (ဆီဖိုး: {(fuelExpense || 0).toLocaleString()} | ကားခ: {(carFee || 0).toLocaleString()} | ဒရိုင်ဘာ: {(driverFee || 0).toLocaleString()})
                          </span>
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between text-emerald-950 font-bold text-sm">
                        <span>ကျန်ရှိ အသားတင်ငွေ (Net Remaining):</span>
                        <span className="text-emerald-800">
                          {(totalAmount - (fuelExpense || 0) - (carFee || 0) - (driverFee || 0)).toLocaleString()} MMK
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Note (Remark and note section) */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#d8c3ad]/70">
                  <label className="text-xs font-semibold text-[#534434]">
                    မှတ်ချက် (Trip Note / Remarks)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ဥပမာ- သဲနု၊ ညပိုင်းပို့ရန်"
                    className="w-full bg-[#f9f9ff] border border-[#d8c3ad] rounded-lg px-3 py-2 text-sm text-[#151c27] focus:outline-none focus:border-[#855300]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-2 pt-4 border-t border-[#d8c3ad]/60 flex flex-col sm:flex-row gap-4 justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-lg font-semibold text-[#534434] border border-[#d8c3ad] hover:bg-[#f0f3ff] transition-colors text-center w-full sm:w-auto cursor-pointer"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="px-8 py-3.5 rounded-lg font-bold text-white shadow-md bg-[#855300] hover:bg-[#653e00] hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto text-base active:scale-[0.98] cursor-pointer"
            >
              <span>🚚</span>
              <span>စာရင်းသွင်းမည် (Save Trip)</span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal on Save (Instant Feedback + Options) */}
      {savedTrip && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={handleResetForNextTrip}
        >
          <div 
            className="bg-white rounded-2xl border border-emerald-300 max-w-md w-full p-6 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-xs">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-emerald-950 text-lg">
                  ကားစာရင်း အောင်မြင်စွာ မှတ်ပြီးပါပြီ!
                </h3>
                <p className="text-xs text-emerald-800">Trip successfully recorded in history.</p>
              </div>
            </div>

            <div className="mt-4 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 text-xs flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-600">ဘောက်ချာအမှတ်:</span>
                <span className="font-extrabold text-emerald-900">{savedTrip.tripNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ယာဉ်မောင်း:</span>
                <span className="font-bold text-gray-900">{savedTrip.driverName} ({savedTrip.licensePlate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">သယ်ယူမှု:</span>
                <span className="font-bold text-[#855300]">{savedTrip.quantity} ကျင်း • {savedTrip.totalAmount.toLocaleString()} MMK</span>
              </div>
              {((savedTrip.fuelExpense && savedTrip.fuelExpense > 0) || (savedTrip.carFee && savedTrip.carFee > 0) || (savedTrip.driverFee && savedTrip.driverFee > 0)) && (
                <div className="flex flex-col gap-1 text-gray-700 bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="font-semibold text-gray-900">စရိတ်များ (Trip Expenses):</span>
                  <div className="flex flex-wrap gap-x-2 text-[11px]">
                    {savedTrip.fuelExpense ? (
                      <span className="text-amber-900 font-semibold">⛽ ဆီဖိုး: {savedTrip.fuelExpense.toLocaleString()} Ks</span>
                    ) : null}
                    {savedTrip.carFee ? (
                      <span className="text-[#855300]">🚚 ကားခ: {savedTrip.carFee.toLocaleString()} Ks</span>
                    ) : null}
                    {savedTrip.driverFee ? (
                      <span className="text-[#005ac2]">👤 ဒရိုင်ဘာ: {savedTrip.driverFee.toLocaleString()} Ks</span>
                    ) : null}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">ပို့မည့်နေရာ:</span>
                <span className="font-medium text-gray-800">{savedTrip.destination}</span>
              </div>
              {settings.googleSheetUrl && (
                <div className="flex items-center gap-1.5 pt-1 text-emerald-800 text-[11px] font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Google Sheet သို့ စာရင်း အလိုအလျောက် ပို့ဆောင်ပြီးပါပြီ</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  const t = savedTrip;
                  handleResetForNextTrip();
                  onViewReceipt(t);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>ပြေစာ/ဘောက်ချာ ထုတ်မည် (Print Slip)</span>
              </button>
              <button
                type="button"
                onClick={handleResetForNextTrip}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold py-3 px-4 rounded-xl transition-colors border border-emerald-300 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>နောက်တစ်စီး ထပ်ထည့်မည် (+)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
