/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TabType, Trip, Driver, Vehicle, AppSettings } from './types';
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
import { GoogleSheetsIntegrationModal } from './components/GoogleSheetsIntegrationModal';
import { sendTripToGoogleSheet } from './services/googleSheetsService';
import { appendTripToGoogleSheet } from './services/googleSheetsApi';
import { getAccessToken } from './services/googleAuth';

export default function App() {
  // App navigation tab - default to 'add-trip' as shown in the mockup
  const [currentTab, setCurrentTab] = useState<TabType>('add-trip');
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState<boolean>(false);

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
        // Ensure the newly requested Apps Script URL is set if older or empty
        if (!parsed.googleSheetUrl || parsed.googleSheetUrl.includes('AKfycbwTn1_72FZOiU')) {
          parsed.googleSheetUrl = DEFAULT_SETTINGS.googleSheetUrl;
        }
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

  // Add Trip Handler
  const handleSaveTrip = (newTripData: Omit<Trip, 'id'>): Trip => {
    const newId = `trip-${Date.now()}`;
    const newTrip: Trip = {
      ...newTripData,
      id: newId,
    };

    setTrips(prev => [newTrip, ...prev]);

    // Auto-sync to Google Sheet (Direct Drive/Sheet API or WebApp Script)
    if (settings.autoSyncGoogleSheet !== false) {
      if (settings.activeGoogleSpreadsheetId) {
        getAccessToken().then((tok) => {
          if (tok) {
            appendTripToGoogleSheet(tok, settings.activeGoogleSpreadsheetId!, newTrip, trips.length).catch((err) => {
              console.warn('Direct Google Sheet API append error:', err);
            });
          }
        });
      }
      if (settings.googleSheetUrl) {
        sendTripToGoogleSheet(newTrip, settings.googleSheetUrl).then((res) => {
          console.log('Google Sheet WebApp sync result:', res);
        }).catch(err => {
          console.error('Google Sheet WebApp sync error:', err);
        });
      }
    }

    return newTrip;
  };

  // Update Trip Status (e.g., delivered)
  const handleUpdateTripStatus = (tripId: string, status: Trip['status']) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status } : t));
  };

  // Delete Trip (automatically triggers recalculation of Driver & Vehicle Today Trips, Volume, Dispatches, Status)
  const handleDeleteTrip = (tripId: string) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
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
  };

  // Delete Driver
  const handleDeleteDriver = (driverId: string) => {
    setBaseDrivers(prev => prev.filter(d => d.id !== driverId));
  };

  // Delete Vehicle
  const handleDeleteVehicle = (vehicleId: string) => {
    setBaseVehicles(prev => prev.filter(v => v.id !== vehicleId));
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
          onOpenGoogleSheets={() => setShowGoogleSheetsModal(true)}
          unreadNotificationsCount={pendingTripsCount}
          hasGoogleSheetConnected={Boolean(settings.activeGoogleSpreadsheetId || settings.googleSheetUrl)}
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
              onOpenGoogleSheets={() => setShowGoogleSheetsModal(true)}
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

      {/* Google Sheets & Drive Integration Modal */}
      <GoogleSheetsIntegrationModal
        isOpen={showGoogleSheetsModal}
        onClose={() => setShowGoogleSheetsModal(false)}
        settings={settings}
        trips={trips}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}
