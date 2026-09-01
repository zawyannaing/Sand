import { Trip, Driver, Vehicle, AppSettings } from '../types';
import {
  saveTripToSupabase,
  deleteTripFromSupabase,
  updateTripStatusInSupabase,
  updateTripPaymentInSupabase,
  saveDriverToSupabase,
  deleteDriverFromSupabase,
  saveVehicleToSupabase,
  deleteVehicleFromSupabase,
  fetchTripsFromSupabase,
} from './supabaseClient';

export type OfflineActionType =
  | 'SAVE_TRIP'
  | 'UPDATE_TRIP_STATUS'
  | 'UPDATE_TRIP_PAYMENT'
  | 'DELETE_TRIP'
  | 'SAVE_DRIVER'
  | 'DELETE_DRIVER'
  | 'SAVE_VEHICLE'
  | 'DELETE_VEHICLE';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'sand_logistics_offline_queue';

// Listeners for sync state changes
type SyncListener = (state: { isOnline: boolean; pendingCount: number; isSyncing: boolean; lastSyncedAt: Date | null }) => void;
const listeners: Set<SyncListener> = new Set();
let isCurrentlySyncing = false;
let lastSyncedTime: Date | null = null;

export function getOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineAction[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (e) {
    console.error('Error writing offline queue:', e);
  }
}

export function getPendingCount(): number {
  return getOfflineQueue().length;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function notifyListeners() {
  const state = {
    isOnline: isOnline(),
    pendingCount: getPendingCount(),
    isSyncing: isCurrentlySyncing,
    lastSyncedAt: lastSyncedTime,
  };
  listeners.forEach(fn => {
    try {
      fn(state);
    } catch (err) {
      console.error(err);
    }
  });
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  // Immediate initial call
  listener({
    isOnline: isOnline(),
    pendingCount: getPendingCount(),
    isSyncing: isCurrentlySyncing,
    lastSyncedAt: lastSyncedTime,
  });
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Enqueue an action when offline or when an online sync failed
 */
export function enqueueOfflineAction(type: OfflineActionType, payload: any) {
  const queue = getOfflineQueue();

  // Optimization: If deleting a trip that was created offline and not yet synced, remove both
  if (type === 'DELETE_TRIP') {
    const tripId = payload.tripId || payload;
    const saveIndex = queue.findIndex(a => a.type === 'SAVE_TRIP' && a.payload?.id === tripId);
    if (saveIndex >= 0) {
      // It was never sent to the server, so just delete the pending SAVE action
      queue.splice(saveIndex, 1);
      saveOfflineQueue(queue);
      console.log(`[Offline Sync] Removed pending creation for deleted trip ${tripId}`);
      return;
    }
  }

  const action: OfflineAction = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
  };

  queue.push(action);
  saveOfflineQueue(queue);
  console.log(`[Offline Sync] Enqueued action: ${type}`, payload);
}

/**
 * Process all queued items when internet connection is available
 */
export async function flushOfflineQueue(settings: AppSettings): Promise<{ processed: number; failed: number }> {
  if (!isOnline()) {
    return { processed: 0, failed: 0 };
  }

  if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
    return { processed: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  if (isCurrentlySyncing) {
    return { processed: 0, failed: 0 };
  }

  isCurrentlySyncing = true;
  notifyListeners();

  console.log(`[Offline Sync] Flushing ${queue.length} pending offline actions to Supabase...`);

  const remainingQueue: OfflineAction[] = [];
  let processedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    let success = false;
    try {
      switch (item.type) {
        case 'SAVE_TRIP':
          success = await saveTripToSupabase(item.payload, settings);
          break;

        case 'UPDATE_TRIP_STATUS':
          success = await updateTripStatusInSupabase(item.payload.tripId, item.payload.status, settings);
          break;

        case 'UPDATE_TRIP_PAYMENT':
          success = await updateTripPaymentInSupabase(
            item.payload.tripId,
            item.payload.paymentStatus,
            item.payload.paidAmount,
            item.payload.dueAmount,
            settings
          );
          break;

        case 'DELETE_TRIP':
          success = await deleteTripFromSupabase(item.payload.tripId || item.payload, settings);
          break;

        case 'SAVE_DRIVER':
          success = await saveDriverToSupabase(item.payload, settings);
          break;

        case 'DELETE_DRIVER':
          success = await deleteDriverFromSupabase(item.payload.driverId || item.payload, settings);
          break;

        case 'SAVE_VEHICLE':
          success = await saveVehicleToSupabase(item.payload, settings);
          break;

        case 'DELETE_VEHICLE':
          success = await deleteVehicleFromSupabase(item.payload.vehicleId || item.payload, settings);
          break;

        default:
          success = true; // drop unknown
      }
    } catch (err) {
      console.error(`[Offline Sync] Failed to execute ${item.type}:`, err);
      success = false;
    }

    if (success) {
      processedCount++;
    } else {
      failedCount++;
      item.retryCount = (item.retryCount || 0) + 1;
      // Keep in queue if failed (unless retried more than 10 times)
      if (item.retryCount < 10) {
        remainingQueue.push(item);
      }
    }
  }

  saveOfflineQueue(remainingQueue);
  isCurrentlySyncing = false;
  lastSyncedTime = new Date();
  notifyListeners();

  console.log(`[Offline Sync] Flush complete. Processed: ${processedCount}, Remaining: ${remainingQueue.length}`);
  return { processed: processedCount, failed: failedCount };
}

/**
 * Dispatch an action: executes immediately if online with Supabase, or queues if offline/failed.
 */
export async function syncTripSave(trip: Trip, settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('SAVE_TRIP', trip);
    return;
  }

  try {
    const ok = await saveTripToSupabase(trip, settings);
    if (!ok) {
      enqueueOfflineAction('SAVE_TRIP', trip);
    } else {
      lastSyncedTime = new Date();
      notifyListeners();
    }
  } catch (err) {
    enqueueOfflineAction('SAVE_TRIP', trip);
  }
}

export async function syncTripStatus(tripId: string, status: Trip['status'], settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('UPDATE_TRIP_STATUS', { tripId, status });
    return;
  }

  try {
    const ok = await updateTripStatusInSupabase(tripId, status, settings);
    if (!ok) {
      enqueueOfflineAction('UPDATE_TRIP_STATUS', { tripId, status });
    } else {
      lastSyncedTime = new Date();
      notifyListeners();
    }
  } catch (err) {
    enqueueOfflineAction('UPDATE_TRIP_STATUS', { tripId, status });
  }
}

export async function syncTripPayment(
  tripId: string, 
  paymentStatus: Trip['paymentStatus'], 
  paidAmount: number, 
  dueAmount: number, 
  settings: AppSettings
): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('UPDATE_TRIP_PAYMENT', { tripId, paymentStatus, paidAmount, dueAmount });
    return;
  }

  try {
    const ok = await updateTripPaymentInSupabase(tripId, paymentStatus, paidAmount, dueAmount, settings);
    if (!ok) {
      enqueueOfflineAction('UPDATE_TRIP_PAYMENT', { tripId, paymentStatus, paidAmount, dueAmount });
    } else {
      lastSyncedTime = new Date();
      notifyListeners();
    }
  } catch (err) {
    enqueueOfflineAction('UPDATE_TRIP_PAYMENT', { tripId, paymentStatus, paidAmount, dueAmount });
  }
}

export async function syncTripDelete(tripId: string, settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('DELETE_TRIP', { tripId });
    return;
  }

  try {
    const ok = await deleteTripFromSupabase(tripId, settings);
    if (!ok) {
      enqueueOfflineAction('DELETE_TRIP', { tripId });
    } else {
      lastSyncedTime = new Date();
      notifyListeners();
    }
  } catch (err) {
    enqueueOfflineAction('DELETE_TRIP', { tripId });
  }
}

export async function syncDriverSave(driver: Driver, settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('SAVE_DRIVER', driver);
    return;
  }

  try {
    const ok = await saveDriverToSupabase(driver, settings);
    if (!ok) enqueueOfflineAction('SAVE_DRIVER', driver);
  } catch (err) {
    enqueueOfflineAction('SAVE_DRIVER', driver);
  }
}

export async function syncDriverDelete(driverId: string, settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('DELETE_DRIVER', { driverId });
    return;
  }

  try {
    const ok = await deleteDriverFromSupabase(driverId, settings);
    if (!ok) enqueueOfflineAction('DELETE_DRIVER', { driverId });
  } catch (err) {
    enqueueOfflineAction('DELETE_DRIVER', { driverId });
  }
}

export async function syncVehicleSave(vehicle: Vehicle, settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('SAVE_VEHICLE', vehicle);
    return;
  }

  try {
    const ok = await saveVehicleToSupabase(vehicle, settings);
    if (!ok) enqueueOfflineAction('SAVE_VEHICLE', vehicle);
  } catch (err) {
    enqueueOfflineAction('SAVE_VEHICLE', vehicle);
  }
}

export async function syncVehicleDelete(vehicleId: string, settings: AppSettings): Promise<void> {
  if (settings.autoSyncSupabase === false || !settings.supabaseUrl || !settings.supabaseAnonKey) {
    return;
  }

  if (!isOnline()) {
    enqueueOfflineAction('DELETE_VEHICLE', { vehicleId });
    return;
  }

  try {
    const ok = await deleteVehicleFromSupabase(vehicleId, settings);
    if (!ok) enqueueOfflineAction('DELETE_VEHICLE', { vehicleId });
  } catch (err) {
    enqueueOfflineAction('DELETE_VEHICLE', { vehicleId });
  }
}
