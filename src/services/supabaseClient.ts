/**
 * Supabase Database & Realtime Service for Sand & Gravel Logistics Tracker
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Trip, Driver, Vehicle, AppSettings } from '../types';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl: string | null = null;
let lastUsedKey: string | null = null;

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

/**
 * Get or create Supabase client singleton safely
 */
export function getSupabaseClient(customConfig?: SupabaseConfig): SupabaseClient | null {
  const url = customConfig?.supabaseUrl || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = customConfig?.supabaseAnonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key || url.includes('your-project-id') || key.includes('your-supabase-anon-key')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

/**
 * Test Supabase Database Connection
 */
export async function testSupabaseConnection(customConfig?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(customConfig);
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL နှင့် Anon Key ကို ထည့်သွင်းပေးပါ (Missing Supabase Credentials)',
    };
  }

  try {
    const { error } = await client.from('trips').select('id').limit(1);
    if (error) {
      // If table does not exist, return helpful guidance
      if (error.code === '42P01' || error.message.includes('relation "public.trips" does not exist') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Supabase ချိတ်ဆက်မှုရရှိသော်လည်း "trips" table မရှိသေးပါ။ အောက်ဖော်ပြပါ SQL Script ကို Supabase SQL Editor တွင် Run ပေးပါ။',
        };
      }
      return {
        success: false,
        message: `Supabase Error (${error.code || 'DB'}): ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Supabase Cloud Database သို့ အောင်မြင်စွာ ချိတ်ဆက်မိပါပြီ! (Connected Successfully)',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Supabase ချိတ်ဆက်မှု မအောင်မြင်ပါ',
    };
  }
}

// ----------------- TRIPS OPERATIONS -----------------

export async function fetchTripsFromSupabase(customConfig?: SupabaseConfig): Promise<Trip[] | null> {
  const client = getSupabaseClient(customConfig);
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trips from Supabase:', error);
      return null;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      tripNumber: row.trip_number || `TRK-${row.id.slice(0, 4)}`,
      driverName: row.driver_name || '',
      licensePlate: row.license_plate || '',
      quantity: Number(row.quantity) || 0,
      materialType: row.material_type || 'sand',
      destination: row.destination || '',
      phone: row.phone || '',
      customerName: row.customer_name || '',
      unitPrice: Number(row.unit_price) || 0,
      totalAmount: Number(row.total_amount) || 0,
      carFee: Number(row.car_fee) || 0,
      driverFee: Number(row.driver_fee) || 0,
      fuelExpense: Number(row.fuel_expense) || 0,
      paymentStatus: row.payment_status || (row.due_amount > 0 ? 'unpaid' : 'paid'),
      paidAmount: Number(row.paid_amount) || (row.payment_status === 'unpaid' ? 0 : Number(row.total_amount) || 0),
      dueAmount: row.due_amount !== undefined && row.due_amount !== null ? Number(row.due_amount) : (row.payment_status === 'unpaid' ? Number(row.total_amount) || 0 : 0),
      dueDate: row.due_date || undefined,
      status: row.status || 'delivered',
      createdAt: row.created_at || new Date().toISOString(),
      formattedTime: row.formatted_time || '',
      notes: row.notes || '',
    }));
  } catch (err) {
    console.error('Error fetching trips:', err);
    return null;
  }
}

export async function saveTripToSupabase(trip: Trip, customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const rowData = {
      id: trip.id,
      trip_number: trip.tripNumber,
      driver_name: trip.driverName,
      license_plate: trip.licensePlate,
      quantity: trip.quantity,
      material_type: trip.materialType,
      destination: trip.destination,
      phone: trip.phone,
      customer_name: trip.customerName || null,
      unit_price: trip.unitPrice,
      total_amount: trip.totalAmount,
      car_fee: trip.carFee || 0,
      driver_fee: trip.driverFee || 0,
      fuel_expense: trip.fuelExpense || 0,
      payment_status: trip.paymentStatus || 'paid',
      paid_amount: trip.paidAmount ?? trip.totalAmount,
      due_amount: trip.dueAmount ?? 0,
      due_date: trip.dueDate || null,
      status: trip.status,
      created_at: trip.createdAt,
      formatted_time: trip.formattedTime,
      notes: trip.notes || null,
    };

    const { error } = await client.from('trips').upsert(rowData, { onConflict: 'id' });
    if (error) {
      console.error('Error saving trip to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving trip to Supabase:', err);
    return false;
  }
}

export async function deleteTripFromSupabase(tripId: string, customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const { error } = await client.from('trips').delete().eq('id', tripId);
    if (error) {
      console.error('Error deleting trip from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting trip from Supabase:', err);
    return false;
  }
}

export async function updateTripStatusInSupabase(tripId: string, status: Trip['status'], customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const { error } = await client.from('trips').update({ status }).eq('id', tripId);
    if (error) {
      console.error('Error updating trip status in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating trip status in Supabase:', err);
    return false;
  }
}

export async function updateTripPaymentInSupabase(
  tripId: string, 
  paymentStatus: Trip['paymentStatus'], 
  paidAmount: number, 
  dueAmount: number, 
  customConfig?: SupabaseConfig
): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const { error } = await client
      .from('trips')
      .update({ 
        payment_status: paymentStatus, 
        paid_amount: paidAmount, 
        due_amount: dueAmount 
      })
      .eq('id', tripId);
    if (error) {
      console.error('Error updating trip payment in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating trip payment in Supabase:', err);
    return false;
  }
}

export async function syncAllTripsToSupabase(trips: Trip[], customConfig?: SupabaseConfig): Promise<{ success: boolean; count: number; message: string }> {
  const client = getSupabaseClient(customConfig);
  if (!client) {
    return { success: false, count: 0, message: 'Supabase credentials missing' };
  }

  try {
    const rows = trips.map(t => ({
      id: t.id,
      trip_number: t.tripNumber,
      driver_name: t.driverName,
      license_plate: t.licensePlate,
      quantity: t.quantity,
      material_type: t.materialType,
      destination: t.destination,
      phone: t.phone,
      customer_name: t.customerName || null,
      unit_price: t.unitPrice,
      total_amount: t.totalAmount,
      car_fee: t.carFee || 0,
      driver_fee: t.driverFee || 0,
      fuel_expense: t.fuelExpense || 0,
      payment_status: t.paymentStatus || 'paid',
      paid_amount: t.paidAmount ?? t.totalAmount,
      due_amount: t.dueAmount ?? 0,
      due_date: t.dueDate || null,
      status: t.status,
      created_at: t.createdAt,
      formatted_time: t.formattedTime,
      notes: t.notes || null,
    }));

    const { error } = await client.from('trips').upsert(rows, { onConflict: 'id' });
    if (error) {
      return { success: false, count: 0, message: error.message };
    }

    return {
      success: true,
      count: rows.length,
      message: `ကားခေါက်ရေ စုစုပေါင်း (${rows.length}) ခုကို Supabase သို့ အောင်မြင်စွာ တင်ပြီးပါပြီ!`,
    };
  } catch (err: any) {
    return { success: false, count: 0, message: err?.message || 'Sync failed' };
  }
}

// ----------------- DRIVERS OPERATIONS -----------------

export async function fetchDriversFromSupabase(customConfig?: SupabaseConfig): Promise<Driver[] | null> {
  const client = getSupabaseClient(customConfig);
  if (!client) return null;

  try {
    const { data, error } = await client.from('drivers').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Error fetching drivers from Supabase:', error);
      return null;
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      name: d.name || '',
      burmeseName: d.burmese_name || '',
      phone: d.phone || '',
      licensePlate: d.license_plate || '',
      avatarUrl: d.avatar_url || '',
      status: d.status || 'online',
      todayTrips: Number(d.today_trips) || 0,
      todayVolume: Number(d.today_volume) || 0,
      totalTrips: Number(d.total_trips) || 0,
    }));
  } catch (err) {
    console.error('Error fetching drivers:', err);
    return null;
  }
}

export async function saveDriverToSupabase(driver: Driver, customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const row = {
      id: driver.id,
      name: driver.name,
      burmese_name: driver.burmeseName,
      phone: driver.phone,
      license_plate: driver.licensePlate,
      avatar_url: driver.avatarUrl,
      status: driver.status,
    };
    const { error } = await client.from('drivers').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Error saving driver:', err);
    return false;
  }
}

export async function deleteDriverFromSupabase(driverId: string, customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const { error } = await client.from('drivers').delete().eq('id', driverId);
    return !error;
  } catch (err) {
    return false;
  }
}

// ----------------- VEHICLES OPERATIONS -----------------

export async function fetchVehiclesFromSupabase(customConfig?: SupabaseConfig): Promise<Vehicle[] | null> {
  const client = getSupabaseClient(customConfig);
  if (!client) return null;

  try {
    const { data, error } = await client.from('vehicles').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Error fetching vehicles from Supabase:', error);
      return null;
    }

    return (data || []).map((v: any) => ({
      id: v.id,
      plateNumber: v.plate_number || '',
      model: v.model || '',
      capacityKyin: Number(v.capacity_kyin) || 15,
      currentDriver: v.current_driver || '',
      status: v.status || 'active',
      todayTrips: Number(v.today_trips) || 0,
      totalTrips: Number(v.total_trips) || 0,
    }));
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    return null;
  }
}

export async function saveVehicleToSupabase(vehicle: Vehicle, customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const row = {
      id: vehicle.id,
      plate_number: vehicle.plateNumber,
      model: vehicle.model,
      capacity_kyin: vehicle.capacityKyin,
      current_driver: vehicle.currentDriver,
      status: vehicle.status,
    };
    const { error } = await client.from('vehicles').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.error('Error saving vehicle:', err);
    return false;
  }
}

export async function deleteVehicleFromSupabase(vehicleId: string, customConfig?: SupabaseConfig): Promise<boolean> {
  const client = getSupabaseClient(customConfig);
  if (!client) return false;

  try {
    const { error } = await client.from('vehicles').delete().eq('id', vehicleId);
    return !error;
  } catch (err) {
    return false;
  }
}

// ----------------- SQL SCHEMA SCRIPT -----------------

export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- Sand & Gravel Truck Logistics Tracker (Supabase Schema)
-- Copy and paste this script directly into Supabase SQL Editor
-- =========================================================

-- 1. Create Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    trip_number TEXT,
    driver_name TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    material_type TEXT NOT NULL DEFAULT 'sand',
    destination TEXT NOT NULL,
    phone TEXT,
    customer_name TEXT,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    car_fee NUMERIC DEFAULT 0,
    driver_fee NUMERIC DEFAULT 0,
    fuel_expense NUMERIC DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'paid',
    paid_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'delivered',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    formatted_time TEXT,
    notes TEXT
);

-- 2. Create Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    burmese_name TEXT NOT NULL,
    phone TEXT,
    license_plate TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'online',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL UNIQUE,
    model TEXT,
    capacity_kyin NUMERIC DEFAULT 15,
    current_driver TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 5. Create Public Policies (Allows full Read/Write access via anon key)
DROP POLICY IF EXISTS "Public access trips" ON public.trips;
CREATE POLICY "Public access trips" ON public.trips
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access drivers" ON public.drivers;
CREATE POLICY "Public access drivers" ON public.drivers
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Public access vehicles" ON public.vehicles;
CREATE POLICY "Public access vehicles" ON public.vehicles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Enable Realtime Publications (for live instant sync across all screens)
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;

-- Indexing for high speed analytics & history queries
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_driver_name ON public.trips(driver_name);
CREATE INDEX IF NOT EXISTS idx_trips_license_plate ON public.trips(license_plate);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
`;
