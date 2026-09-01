export type TabType = 'dashboard' | 'add-trip' | 'history' | 'site-billing' | 'reports' | 'drivers' | 'vehicles' | 'settings';

export type MaterialType = 'sand' | 'soil' | 'stone' | 'gravel';

export type TripStatus = 'loading' | 'on_the_way' | 'delivered' | 'cancelled';

export interface Trip {
  id: string;
  tripNumber: string; // e.g. TRK-084
  driverName: string;
  licensePlate: string;
  quantity: number; // in ကျင်း (Kyin / cubic yards)
  materialType: MaterialType;
  destination: string;
  phone: string;
  customerName?: string;
  unitPrice: number; // in MMK per Kyin
  totalAmount: number;
  carFee?: number; // in MMK (ကားခ)
  driverFee?: number; // in MMK (ယာဉ်မောင်းခ / ဒရိုင်ဘာခ)
  fuelExpense?: number; // in MMK (ဆီဖိုး / စက်သုံးဆီစရိတ်)
  status: TripStatus;
  createdAt: string; // ISO string
  formattedTime: string;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  burmeseName: string;
  phone: string;
  licensePlate: string;
  avatarUrl: string;
  status: 'online' | 'busy' | 'offline';
  todayTrips: number;
  todayVolume: number;
  totalTrips: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  capacityKyin: number;
  currentDriver: string;
  status: 'active' | 'in_transit' | 'maintenance';
  todayTrips: number;
  totalTrips: number;
}

export interface AppSettings {
  language: 'my' | 'en' | 'bilingual';
  defaultPricePerKyin: number;
  currency: string;
  companyName: string;
  companySubtext: string;
  phone: string;
  autoPrintSlip: boolean;
  googleSheetUrl?: string;
  autoSyncGoogleSheet?: boolean;
  activeGoogleSpreadsheetId?: string;
  activeGoogleSpreadsheetName?: string;
  activeGoogleSpreadsheetUrl?: string;
}
