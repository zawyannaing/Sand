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
import { ReceiptModal } from './components/ReceiptModal';
import { NotificationModal } from './components/NotificationModal';
import { SupabaseIntegrationModal } from './components/SupabaseIntegrationModal';
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
import { fetchTripsFromSupabase } from './services/supabaseClient';

export default function App() {
  // App navigation tab - default to 'add-trip' as shown in the mockup
  const [currentTab, setCurrentTab] = useState<TabType>('add-trip');
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);

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
          }
        }).catch(err => console.warn('Supabase auto-fetch:', err));
      });
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#151c27] flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        pendingTripsCount={pendingTripsCount}
      />

      {/* Main Content Area */}
      <div className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onAddNewTrip={() => setCurrentTab('add-trip')}
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenSupabase={() => setShowSupabaseModal(true)}
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
              onCancel={() => setCurrentTab('dashboard')}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
              nextTripId={computeNextTripId()}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              trips={trips}
              drivers={drivers}
              onSelectTab={setCurrentTab}
              onViewReceipt={(trip) => setReceiptTrip(trip)}
              onUpdateTripStatus={handleUpdateTripStatus}
              onDeleteTrip={handleDeleteTrip}
              onUpdateTripPayment={handleUpdateTripPayment}
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
    </div>
  );
}
