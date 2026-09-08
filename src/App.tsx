/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TabType, Trip, Driver, Vehicle, AppSettings, PaymentStatus } from './types';
import { 
  INITIAL_TRIPS, 
  INITIAL_DRIVERS, 
  INITIAL_VEHICLES, 
  DEFAULT_SETTINGS 
} from './data/mockData';

// Helper function to dynamically recalculate driver stats based on live trips
function calculateDriverStats(baseDrivers: Driver[], currentTrips: Trip[]): Driver[] {
  const todayStr = new Date().toISOString().split('T')[0];
  
  return baseDrivers.map(drv => {
    const drvNameLower = (drv.name || '').trim().toLowerCase();
    const drvBurmeseLower = (drv.burmeseName || '').trim().toLowerCase();
    const drvPlateLower = (drv.licensePlate || '').trim().toLowerCase();

    // All trips matching this driver by Burmese name, English name, or assigned license plate
    const matchingTrips = currentTrips.filter(t => {
      const tDriver = (t.driverName || '').trim().toLowerCase();
      const tPlate = (t.licensePlate || '').trim().toLowerCase();
      return (
        (tDriver && (tDriver === drvBurmeseLower || tDriver === drvNameLower)) ||
        (drvPlateLower && tPlate === drvPlateLower)
      );
    });

    const todayTripsList = matchingTrips.filter(t => {
      if (!t.createdAt) return true;
      return t.createdAt.startsWith(todayStr);
    });

    const todayTrips = todayTripsList.length;
    const todayVolume = todayTripsList.reduce((acc, t) => acc + (Number(t.quantity) || 0), 0);
    const totalTrips = matchingTrips.length;

    // Check if there is any trip currently in transit or loading
    const hasActiveTrip = matchingTrips.some(t => t.status === 'on_the_way' || t.status === 'loading');
    let status: Driver['status'] = drv.status;
    if (status !== 'offline') {
      status = hasActiveTrip ? 'busy' : 'online';
    }

    return {
      ...drv,
      todayTrips,
      todayVolume,
      totalTrips,
      status,
    };
  });
}

// Helper function to dynamically recalculate vehicle stats based on live trips
function calculateVehicleStats(baseVehicles: Vehicle[], currentTrips: Trip[]): Vehicle[] {
  const todayStr = new Date().toISOString().split('T')[0];

  return baseVehicles.map(veh => {
    const vehPlateLower = (veh.plateNumber || '').trim().toLowerCase();

    const matchingTrips = currentTrips.filter(t => {
      const tPlate = (t.licensePlate || '').trim().toLowerCase();
      return tPlate === vehPlateLower;
    });

    const todayTripsList = matchingTrips.filter(t => {
      if (!t.createdAt) return true;
      return t.createdAt.startsWith(todayStr);
    });

    const todayTrips = todayTripsList.length;
    const totalTrips = matchingTrips.length;

    const hasActiveTrip = matchingTrips.some(t => t.status === 'on_the_way' || t.status === 'loading');
    let status: Vehicle['status'] = veh.status;
    if (status !== 'maintenance') {
      status = hasActiveTrip ? 'in_transit' : 'active';
    }

    return {
      ...veh,
      todayTrips,
      totalTrips,
      status,
    };
  });
}
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { AddTripView } from './components/AddTripView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView';
import { SiteBillingView } from './components/SiteBillingView';
import { ReportsView } from './components/ReportsView';
import { DriversView } from './components/DriversView';
import { VehiclesView } from './components/VehiclesView';
import { SettingsView } from './components/SettingsView';
import { InventoryView } from './components/InventoryView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { ReceiptModal } from './components/ReceiptModal';
import { NotificationModal } from './components/NotificationModal';
import { SupabaseIntegrationModal } from './components/SupabaseIntegrationModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { UserDataPreviewModal } from './components/UserDataPreviewModal';
import { AuthUser, RealtimeUpdateEvent, InventoryItem, StockLog, CustomerOrderRequest } from './types';
import { getCurrentUser, setCurrentUser, logoutUser } from './services/authService';
import { 
  getStoredInventory, 
  getStoredStockLogs, 
  getStoredCustomerOrders, 
  deductStockForTrip, 
  refundStockForTrip, 
  updateCustomerOrderStatus 
} from './services/inventoryService';
import { 
  syncTripSave, 
  syncTripDelete, 
  syncTripStatus, 
  syncTripPayment,
  syncDriverSave, 
  syncDriverDelete, 
  syncVehicleSave, 
  syncVehicleDelete, 
  flushOfflineQueue,
  isOnline,
  getPendingCount
} from './services/offlineSync';
import { fetchTripsFromSupabase, subscribeToRealtimeTrips } from './services/supabaseClient';

export default function App() {
  // App navigation tab - default to 'add-trip' as shown in the mockup
  const [currentTab, setCurrentTab] = useState<TabType>('add-trip');
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showUserPreviewModal, setShowUserPreviewModal] = useState<boolean>(false);

  // Auth User State
  const [currentUser, setCurrentUserState] = useState<AuthUser | null>(() => getCurrentUser());

  // Realtime Live Toast & Events
  const [liveEventBanner, setLiveEventBanner] = useState<RealtimeUpdateEvent | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUserState(getCurrentUser());
    };
    window.addEventListener('auth_user_change', handleAuthChange);
    return () => window.removeEventListener('auth_user_change', handleAuthChange);
  }, []);

  // Persistence State
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('sand_logistics_trips');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TRIPS;
  });

  const [baseDrivers, setBaseDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('sand_logistics_drivers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_DRIVERS;
  });

  const [baseVehicles, setBaseVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('sand_logistics_vehicles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_VEHICLES;
  });

  // Dynamically calculated drivers & vehicles statistics derived directly from live trips
  // Any deletion, creation, or status change of trips instantly auto-resets Today Trip, Today Volume, Total Dispatches & Status
  const drivers = useMemo(() => {
    return calculateDriverStats(baseDrivers, trips);
  }, [baseDrivers, trips]);

  const vehicles = useMemo(() => {
    return calculateVehicleStats(baseVehicles, trips);
  }, [baseVehicles, trips]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sand_logistics_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Modal states
  const [receiptTrip, setReceiptTrip] = useState<Trip | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Persisted Stock Inventory & Customer Orders State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredInventory());
  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => getStoredStockLogs());
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderRequest[]>(() => getStoredCustomerOrders());

  const refreshInventoryState = () => {
    setInventory(getStoredInventory());
    setStockLogs(getStoredStockLogs());
    setCustomerOrders(getStoredCustomerOrders());
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('sand_logistics_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('sand_logistics_drivers', JSON.stringify(baseDrivers));
  }, [baseDrivers]);

  useEffect(() => {
    localStorage.setItem('sand_logistics_vehicles', JSON.stringify(baseVehicles));
  }, [baseVehicles]);

  useEffect(() => {
    localStorage.setItem('sand_logistics_settings', JSON.stringify(settings));
  }, [settings]);

  // Initial cloud fetch on startup if Supabase configured & online
  useEffect(() => {
    if (settings.supabaseUrl && settings.supabaseAnonKey && isOnline()) {
      flushOfflineQueue(settings).then(() => {
        fetchTripsFromSupabase(settings).then((cloudTrips) => {
          if (cloudTrips && cloudTrips.length > 0) {
            console.log(`Loaded ${cloudTrips.length} trips from Supabase DB`);
            setTrips(cloudTrips);
          }
        }).catch(err => console.warn('Supabase auto-fetch:', err));
      });
    }
  }, []);

  // Supabase Real-Time live channel subscription
  useEffect(() => {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) return;

    const unsubscribe = subscribeToRealtimeTrips(({ eventType, newRecord, oldRecordId }) => {
      console.log(`⚡ Real-time Postgres Change: [${eventType}]`, newRecord || oldRecordId);

      if (eventType === 'INSERT' && newRecord) {
        setTrips(prev => {
          if (prev.some(t => t.id === newRecord.id)) return prev;
          return [newRecord, ...prev];
        });
        setLiveEventBanner({
          id: `rt-${Date.now()}`,
          type: 'trip_created',
          title: '🚚 Live Delivery Dispatch',
          message: `New trip ${newRecord.tripNumber} (${newRecord.quantity} ကျင်း ${newRecord.materialType}) by ${newRecord.driverName} logged live!`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (eventType === 'UPDATE' && newRecord) {
        setTrips(prev => prev.map(t => t.id === newRecord.id ? newRecord : t));
        setLiveEventBanner({
          id: `rt-${Date.now()}`,
          type: 'trip_updated',
          title: '✨ Live Status Update',
          message: `Trip ${newRecord.tripNumber} updated to ${newRecord.status.toUpperCase()} (${newRecord.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'})`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (eventType === 'DELETE' && oldRecordId) {
        setTrips(prev => prev.filter(t => t.id !== oldRecordId));
        setLiveEventBanner({
          id: `rt-${Date.now()}`,
          type: 'trip_deleted',
          title: '🗑️ Live Record Removed',
          message: `Record ${oldRecordId} removed across network in real-time.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }, settings);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [settings.supabaseUrl, settings.supabaseAnonKey]);

  // Auto-dismiss live event banner after 5 seconds
  useEffect(() => {
    if (liveEventBanner) {
      const timer = setTimeout(() => setLiveEventBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [liveEventBanner]);

  // Simulate Real-time incoming trip event (for instant interactive demo)
  const handleSimulateRealtimeTrip = () => {
    const nextNum = computeNextTripId();
    const demoDriver = drivers[Math.floor(Math.random() * drivers.length)] || drivers[0];
    const materials: Trip['materialType'][] = ['sand', 'stone', 'gravel', 'soil'];
    const selectedMat = materials[Math.floor(Math.random() * materials.length)];
    const qty = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
    const unitPrice = 45000;
    const total = qty * unitPrice;

    const simulatedTrip: Trip = {
      id: `trip-sim-${Date.now()}`,
      tripNumber: nextNum,
      driverName: demoDriver.burmeseName || demoDriver.name,
      licensePlate: demoDriver.licensePlate,
      quantity: qty,
      materialType: selectedMat,
      destination: 'ရွှေနဂါး ဆောက်လုပ်ရေး (လှိုင်သာယာ စက်မှုဇုန်)',
      phone: demoDriver.phone,
      customerName: 'ရွှေနဂါး ဆောက်လုပ်ရေး',
      unitPrice: unitPrice,
      totalAmount: total,
      carFee: 80000,
      driverFee: 30000,
      fuelExpense: 45000,
      paymentStatus: 'unpaid',
      paidAmount: 0,
      dueAmount: total,
      status: 'on_the_way',
      createdAt: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: 'Real-time live broadcast test packet',
    };

    setTrips(prev => [simulatedTrip, ...prev]);
    setLiveEventBanner({
      id: `rt-sim-${Date.now()}`,
      type: 'trip_created',
      title: '⚡ Real-time Live Event',
      message: `ယာဉ်မောင်း ${simulatedTrip.driverName} မှ ခေါက်အမှတ် ${simulatedTrip.tripNumber} (${simulatedTrip.quantity} ကျင်း) အား စာရင်းသွင်းလိုက်ပါသည်!`,
      timestamp: simulatedTrip.formattedTime,
    });
  };

  // Auto-sync when device regains internet connection
  useEffect(() => {
    const handleOnline = () => {
      console.log('App came online! Flushing offline sync queue...');
      flushOfflineQueue(settings).then((syncedResult) => {
        if (syncedResult.processed > 0 && settings.supabaseUrl && settings.supabaseAnonKey) {
          fetchTripsFromSupabase(settings).then((cloudTrips) => {
            if (cloudTrips && cloudTrips.length > 0) {
              setTrips(cloudTrips);
            }
          }).catch(err => console.warn('Post-sync reload:', err));
        }
      });
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [settings]);

  // Manual sync handler
  const handleManualSync = async () => {
    const flushedResult = await flushOfflineQueue(settings);
    if (settings.supabaseUrl && settings.supabaseAnonKey && isOnline()) {
      try {
        const cloudTrips = await fetchTripsFromSupabase(settings);
        if (cloudTrips && cloudTrips.length > 0) {
          setTrips(cloudTrips);
        }
      } catch (err) {
        console.warn('Manual sync fetch:', err);
      }
    }
  };

  // Compute Next Trip ID (e.g. TRK-084)
  const computeNextTripId = (): string => {
    if (trips.length === 0) return 'TRK-084';
    const numbers = trips
      .map(t => {
        const match = t.tripNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 83;
    const nextNum = maxNum + 1;
    return `TRK-${String(nextNum).padStart(3, '0')}`;
  };

  // Add Trip Handler (Offline-First + Auto Supabase Sync)
  const handleSaveTrip = (newTripData: Omit<Trip, 'id'>): Trip => {
    const newId = `trip-${Date.now()}`;
    const newTrip: Trip = {
      ...newTripData,
      id: newId,
    };

    setTrips(prev => [newTrip, ...prev]);

    // Inventory Deduction Logic (Auto-updates stock and logs movement)
    deductStockForTrip({
      materialType: newTrip.materialType,
      quantity: newTrip.quantity,
      tripId: newTrip.tripNumber,
      destination: newTrip.destination,
      performedBy: currentUser?.name || newTrip.driverName || 'Dispatcher',
    });
    refreshInventoryState();

    // Auto-sync wrapper (direct if online, offline queue if offline)
    if (settings.autoSyncSupabase !== false) {
      syncTripSave(newTrip, settings).catch(err => {
        console.warn('Trip save sync note:', err);
      });
    }

    return newTrip;
  };

  // Update Trip Status (e.g., delivered)
  const handleUpdateTripStatus = (tripId: string, status: Trip['status']) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status } : t));
    if (settings.autoSyncSupabase !== false) {
      syncTripStatus(tripId, status, settings);
    }
  };

  // Update Trip Payment / Settle Debt
  const handleUpdateTripPayment = (
    tripId: string, 
    paymentStatus: PaymentStatus, 
    paidAmount: number, 
    dueAmount: number,
    dueDate?: string
  ) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          paymentStatus,
          paidAmount,
          dueAmount,
          dueDate: dueDate !== undefined ? dueDate : t.dueDate,
        };
      }
      return t;
    }));
    if (settings.autoSyncSupabase !== false) {
      syncTripPayment(tripId, paymentStatus, paidAmount, dueAmount, settings);
    }
  };

  // Delete Trip (instantly updates UI & auto-syncs deletion to Supabase or offline queue)
  const handleDeleteTrip = (tripId: string) => {
    const deletedTrip = trips.find(t => t.id === tripId);
    if (deletedTrip) {
      refundStockForTrip(deletedTrip.materialType, deletedTrip.quantity, deletedTrip.tripNumber);
      refreshInventoryState();
    }
    setTrips(prev => prev.filter(t => t.id !== tripId));
    if (settings.autoSyncSupabase !== false) {
      syncTripDelete(tripId, settings);
    }
  };

  // Add Driver
  const handleAddDriver = (newDriverData: Omit<Driver, 'id' | 'todayTrips' | 'todayVolume' | 'totalTrips'>) => {
    const newDriver: Driver = {
      ...newDriverData,
      id: `drv-${Date.now()}`,
      todayTrips: 0,
      todayVolume: 0,
      totalTrips: 0,
    };
    setBaseDrivers(prev => [newDriver, ...prev]);
    if (settings.autoSyncSupabase !== false) {
      syncDriverSave(newDriver, settings);
    }
  };

  // Add Vehicle
  const handleAddVehicle = (newVehData: Omit<Vehicle, 'id' | 'todayTrips' | 'totalTrips'>) => {
    const newVeh: Vehicle = {
      ...newVehData,
      id: `veh-${Date.now()}`,
      todayTrips: 0,
      totalTrips: 0,
    };
    setBaseVehicles(prev => [newVeh, ...prev]);
    if (settings.autoSyncSupabase !== false) {
      syncVehicleSave(newVeh, settings);
    }
  };

  // Delete Driver
  const handleDeleteDriver = (driverId: string) => {
    setBaseDrivers(prev => prev.filter(d => d.id !== driverId));
    if (settings.autoSyncSupabase !== false) {
      syncDriverDelete(driverId, settings);
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = (vehicleId: string) => {
    setBaseVehicles(prev => prev.filter(v => v.id !== vehicleId));
    if (settings.autoSyncSupabase !== false) {
      syncVehicleDelete(vehicleId, settings);
    }
  };

  // Reset to initial mock data
  const handleResetData = () => {
    setTrips(INITIAL_TRIPS);
    setBaseDrivers(INITIAL_DRIVERS);
    setBaseVehicles(INITIAL_VEHICLES);
    setSettings(DEFAULT_SETTINGS);
    localStorage.clear();
  };

  const pendingTripsCount = trips.filter(t => t.status === 'on_the_way').length;

  // Gate the entire application: anyone entering the website sees ONLY the LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => setCurrentUserState(user)}
        settings={settings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#151c27] flex flex-col md:flex-row antialiased relative">
      {/* Real-time Live Event Floating Toast Notification */}
      {liveEventBanner && (
        <div className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md bg-white border-2 border-amber-500 rounded-2xl p-3.5 shadow-2xl animate-bounce-subtle flex items-start gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-1 animate-ping"></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-[#151c27]">{liveEventBanner.title}</h4>
              <span className="text-[10px] text-gray-400 font-mono">{liveEventBanner.timestamp}</span>
            </div>
            <p className="text-xs text-[#534434] mt-0.5 leading-snug">{liveEventBanner.message}</p>
          </div>
          <button 
            onClick={() => setLiveEventBanner(null)}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        pendingTripsCount={pendingTripsCount}
        currentUser={currentUser}
        onOpenUserPreview={() => setShowUserPreviewModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Content Area */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onAddNewTrip={() => setCurrentTab('add-trip')}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenSupabase={() => setShowSupabaseModal(true)}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenUserPreview={() => setShowUserPreviewModal(true)}
          currentUser={currentUser}
          onManualSync={handleManualSync}
          unreadNotificationsCount={pendingTripsCount}
          hasSupabaseConnected={Boolean(settings.supabaseUrl && settings.supabaseAnonKey)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
          {currentTab === 'add-trip' && (
            <AddTripView
              onSaveTrip={handleSaveTrip}
              drivers={drivers}
              settings={settings}
              inventory={inventory}
              onCancel={() => setCurrentTab('dashboard')}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
              nextTripId={computeNextTripId()}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              trips={trips}
              drivers={drivers}
              inventory={inventory}
              customerOrders={customerOrders}
              onSelectTab={setCurrentTab}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
              onUpdateTripStatus={handleUpdateTripStatus}
              onDeleteTrip={handleDeleteTrip}
              onUpdateTripPayment={handleUpdateTripPayment}
              onQuickDispatchOrder={(ord) => {
                updateCustomerOrderStatus(ord.id, 'dispatched');
                refreshInventoryState();
                setCurrentTab('add-trip');
              }}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              inventory={inventory}
              stockLogs={stockLogs}
              logs={stockLogs}
              onRefresh={refreshInventoryState}
              onNavigateToDispatch={() => setCurrentTab('add-trip')}
              onQuickDispatch={() => setCurrentTab('add-trip')}
              userName={currentUser?.name || 'Admin'}
            />
          )}

          {currentTab === 'customer-portal' && (
            <CustomerPortalView
              trips={trips}
              customerOrders={customerOrders}
              currentUser={currentUser}
              onRefreshOrders={refreshInventoryState}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              trips={trips}
              settings={settings}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
              onUpdateTripStatus={handleUpdateTripStatus}
              onDeleteTrip={handleDeleteTrip}
              onAddNewTrip={() => setCurrentTab('add-trip')}
            />
          )}

          {currentTab === 'site-billing' && (
            <SiteBillingView
              trips={trips}
              settings={settings}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              trips={trips}
              drivers={drivers}
            />
          )}

          {currentTab === 'drivers' && (
            <DriversView
              drivers={drivers}
              onAddDriver={handleAddDriver}
              onDeleteDriver={handleDeleteDriver}
              onSelectDriverForTrip={(d) => {
                setCurrentTab('add-trip');
              }}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesView
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              trips={trips}
              onUpdateSettings={setSettings}
              onResetData={handleResetData}
              onOpenSupabase={() => setShowSupabaseModal(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        pendingTripsCount={pendingTripsCount}
      />

      {/* Printable Receipt Modal */}
      {receiptTrip && (
        <ReceiptModal
          trip={receiptTrip}
          settings={settings}
          onClose={() => setReceiptTrip(null)}
        />
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <NotificationModal
          trips={trips}
          onClose={() => setShowNotifications(false)}
          onViewReceipt={(t) => setReceiptTrip(t)}
        />
      )}

      {/* Supabase Database Integration Modal */}
      <SupabaseIntegrationModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        settings={settings}
        trips={trips}
        drivers={baseDrivers}
        vehicles={baseVehicles}
        onUpdateSettings={setSettings}
        onSetTrips={setTrips}
      />

      {/* Authentication / Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUserState(user);
          setShowUserPreviewModal(true);
        }}
        currentUser={currentUser}
        settings={settings}
      />

      {/* User Data Preview & Live Real-Time Dashboard Modal */}
      <UserDataPreviewModal
        isOpen={showUserPreviewModal}
        onClose={() => setShowUserPreviewModal(false)}
        user={currentUser}
        trips={trips}
        drivers={drivers}
        vehicles={vehicles}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={() => {
          logoutUser(settings);
          setCurrentUserState(null);
        }}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setShowUserPreviewModal(false);
        }}
        onViewReceipt={(trip) => {
          setReceiptTrip(trip);
          setShowUserPreviewModal(false);
        }}
        onUpdateTripStatus={handleUpdateTripStatus}
        onSimulateRealtimeEvent={handleSimulateRealtimeTrip}
        isRealtimeActive={Boolean(settings.supabaseUrl && settings.supabaseAnonKey)}
      />
    </div>
  );
}
