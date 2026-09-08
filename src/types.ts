export type TabType = 
  | 'dashboard' 
  | 'inventory' 
  | 'customer-portal'
  | 'add-trip' 
  | 'history' 
  | 'site-billing' 
  | 'reports' 
  | 'drivers' 
  | 'vehicles' 
  | 'settings';

export type MaterialType = 'sand' | 'soil' | 'stone' | 'gravel' | (string & {});

export type TripStatus = 'loading' | 'on_the_way' | 'delivered' | 'cancelled';

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'site_manager' | 'viewer';

export interface InventoryItem {
  id: string;
  materialType: MaterialType;
  name: string;
  burmeseName: string;
  category?: string; // 'aggregates' | 'cement_brick' | 'earthwork' | 'steel' | 'other' | string
  unit: string; // 'ကျင်း', 'အိတ်', 'ချောင်း', 'ချပ်', 'တန်', 'ကား', etc.
  currentStock: number;
  minimumThreshold: number;
  capacity: number;
  purchaseCostPerUnit: number; // in MMK
  sellingPricePerUnit: number; // in MMK
  location: string;
  lastRestocked: string;
  color?: string;
  bgColor?: string;
}

export interface StockLog {
  id: string;
  inventoryItemId: string;
  materialType: MaterialType;
  type: 'in' | 'out' | 'adjust'; // 'in' = Intake, 'out' = Delivery/Dispatch, 'adjust' = Physical count correction
  quantity: number; // in Kyin
  unitPrice?: number;
  totalCost?: number;
  referenceTripId?: string;
  supplierName?: string;
  notes?: string;
  date: string;
  performedBy: string;
}

export interface CustomerOrderRequest {
  id: string;
  customerName: string;
  siteName: string;
  phone: string;
  materialType: MaterialType;
  quantity: number;
  preferredDate: string;
  notes?: string;
  status: 'pending' | 'dispatched' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  burmeseName?: string;
  role: UserRole;
  roleLabel: { en: string; my: string };
  phone?: string;
  licensePlate?: string; // Assigned vehicle plate for drivers
  siteName?: string; // Assigned project site for site managers
  avatarUrl: string;
  lastLoginAt: string;
}

export interface RealtimeUpdateEvent {
  id: string;
  type: 'trip_created' | 'trip_updated' | 'trip_deleted' | 'payment_settled' | 'driver_updated';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

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
  paymentStatus?: PaymentStatus; // 'paid' (ရှင်းပြီး), 'unpaid' (အကြွေး/မရှင်းရသေး), 'partial' (တစိတ်တပိုင်း)
  paidAmount?: number; // ပေးချေပြီးငွေ (MMK)
  dueAmount?: number; // ကျန်ရှိသည့်ကြွေးကျန်ငွေ (MMK)
  dueDate?: string; // ကြွေးဆပ်ရမည့်ရက် / ချိန်းရက်
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
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSyncSupabase?: boolean;
}
