import { Trip, MaterialType } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Format a trip into structured payload for Google Sheets Web App
 */
export function formatTripForSheet(trip: Trip, index?: number) {
  const mat = MATERIAL_LABELS[trip.materialType]?.en || trip.materialType;
  const matMy = MATERIAL_LABELS[trip.materialType]?.my || trip.materialType;
  const statusMy = trip.status === 'delivered' ? 'ပို့ဆောင်ပြီး (Delivered)' : 'ပို့ဆောင်ဆဲ (In Transit)';
  const dateStr = new Date(trip.createdAt).toISOString().split('T')[0];
  const fuelExpense = trip.fuelExpense || 0;
  const carFee = trip.carFee || 0;
  const driverFee = trip.driverFee || 0;
  const netAmount = trip.totalAmount - fuelExpense - carFee - driverFee;

  return {
    no: index !== undefined ? index + 1 : 1,
    id: trip.id,
    tripNumber: trip.tripNumber,
    date: dateStr,
    time: trip.formattedTime,
    fullDateTime: `${dateStr} ${trip.formattedTime}`,
    carNumber: trip.licensePlate,
    driverName: trip.driverName,
    phone: trip.phone,
    destination: trip.destination,
    site: trip.destination,
    customer: trip.customerName || '-',
    material: `${mat} (${matMy})`,
    materialType: trip.materialType,
    volumeKyin: trip.quantity,
    quantity: trip.quantity,
    unitPriceMMK: trip.unitPrice,
    rate: trip.unitPrice,
    totalAmountMMK: trip.totalAmount,
    totalAmount: trip.totalAmount,
    fuelExpense: fuelExpense,
    fuelExpenseMMK: fuelExpense,
    carFee: carFee,
    carFeeMMK: carFee,
    driverFee: driverFee,
    driverFeeMMK: driverFee,
    netAmount: netAmount,
    netAmountMMK: netAmount,
    status: statusMy,
    statusCode: trip.status,
    notes: trip.notes || '',
    // Array format for direct appendRow if script accepts row array
    rowArray: [
      index !== undefined ? index + 1 : '',
      dateStr,
      trip.formattedTime,
      trip.tripNumber,
      trip.licensePlate,
      trip.driverName,
      trip.phone,
      trip.destination,
      trip.customerName || '',
      `${mat} (${matMy})`,
      trip.quantity,
      trip.unitPrice,
      trip.totalAmount,
      fuelExpense,
      carFee,
      driverFee,
      netAmount,
      statusMy,
      trip.notes || ''
    ]
  };
}

/**
 * Send a single newly created/updated trip to the Google Sheets Web App
 */
export async function sendTripToGoogleSheet(trip: Trip, webAppUrl: string): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return {
      success: false,
      message: 'Google Sheets Web App URL not configured',
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  const payload = {
    action: 'addTrip',
    source: 'LogisticsProApp',
    timestamp: new Date().toISOString(),
    trip: formatTripForSheet(trip),
    ...formatTripForSheet(trip) // Also flatten top-level keys for simple Google Apps Scripts
  };

  try {
    // Send as text/plain to prevent CORS preflight blocking in standard browser environment
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `ဘောက်ချာ ${trip.tripNumber} ကို Google Sheet သို့ အောင်မြင်စွာ ပို့ပြီးပါပြီ`,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (error: any) {
    console.error('Failed to send trip to Google Sheets:', error);
    return {
      success: false,
      message: `Google Sheet သို့ ပို့ရာတွင် အမှားဖြစ်ပါသည်: ${error?.message || 'Network Error'}`,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}

/**
 * Bulk sync all trips to the Google Sheet Web App
 */
export async function syncAllTripsToGoogleSheet(trips: Trip[], webAppUrl: string): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return {
      success: false,
      message: 'Google Sheets Web App URL not configured',
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  const formattedTrips = trips.map((t, idx) => formatTripForSheet(t, idx));
  const headers = [
    'No (စဉ်)',
    'Date (ရက်စွဲ)',
    'Time (အချိန်)',
    'Voucher No (ဘောက်ချာ)',
    'Car Number (ကားနံပါတ်)',
    'Driver Name (ယာဉ်မောင်း)',
    'Phone (ဖုန်း)',
    'Site / Destination (ဆိုက်/နေရာ)',
    'Customer (ဝယ်သူ)',
    'Material (ပစ္စည်း)',
    'Volume Kyin (ကျင်း)',
    'Rate MMK (နှုန်း)',
    'Total Amount MMK (ကျသင့်ငွေ)',
    'Status (အခြေအနေ)',
    'Notes (မှတ်ချက်)'
  ];

  const payload = {
    action: 'syncAllTrips',
    source: 'LogisticsProApp',
    timestamp: new Date().toISOString(),
    totalTrips: trips.length,
    totalVolume: trips.reduce((sum, t) => sum + (t.quantity || 0), 0),
    totalAmount: trips.reduce((sum, t) => sum + (t.totalAmount || 0), 0),
    headers,
    trips: formattedTrips,
    rows: formattedTrips.map(t => t.rowArray)
  };

  try {
    await fetch(webAppUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `ကားခေါက်ရေ (${trips.length}) ခုလုံးကို Google Sheet သို့ အောင်မြင်စွာ Sync လုပ်ပြီးပါပြီ!`,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (error: any) {
    console.error('Failed to sync all trips to Google Sheet:', error);
    return {
      success: false,
      message: `Google Sheet Sync မအောင်မြင်ပါ: ${error?.message || 'Network Error'}`,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
