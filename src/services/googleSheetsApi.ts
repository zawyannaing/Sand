import { Trip } from '../types';
import { MATERIAL_LABELS } from '../data/mockData';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

const SHEET_HEADERS = [
  'စဉ် (No.)',
  'ရက်စွဲ (Date)',
  'အချိန် (Time)',
  'ဘောက်ချာအမှတ် (Voucher No.)',
  'ကားနံပါတ် (Car No.)',
  'ယာဉ်မောင်း (Driver)',
  'ဖုန်း (Phone)',
  'ဆိုက် / ပို့မည့်နေရာ (Destination/Site)',
  'ဝယ်သူ (Customer)',
  'ပစ္စည်း (Material)',
  'ပမာဏ ကျင်း (Quantity in Kyin)',
  '၁ ကျင်းနှုန်း (Rate MMK)',
  'စုစုပေါင်း ကျသင့်ငွေ (Total Amount MMK)',
  'ဆီဖိုး (Fuel Expense MMK)',
  'ကားခ (Car Fee MMK)',
  'ယာဉ်မောင်းခ (Driver Fee MMK)',
  'အသားတင် ကျန်ငွေ (Net Remaining MMK)',
  'အခြေအနေ (Status)',
  'မှတ်ချက် (Notes)'
];

export function tripToSheetRow(trip: Trip, index: number): (string | number)[] {
  const mat = MATERIAL_LABELS[trip.materialType]?.my || trip.materialType;
  const statusMy = trip.status === 'delivered' ? 'ပို့ဆောင်ပြီး (Delivered)' : 'ပို့ဆောင်ဆဲ (In Transit)';
  const dateStr = new Date(trip.createdAt).toISOString().split('T')[0];
  const fuelExpense = trip.fuelExpense || 0;
  const carFee = trip.carFee || 0;
  const driverFee = trip.driverFee || 0;
  const netAmount = trip.totalAmount - fuelExpense - carFee - driverFee;

  return [
    index + 1,
    dateStr,
    trip.formattedTime,
    trip.tripNumber,
    trip.licensePlate,
    trip.driverName,
    trip.phone,
    trip.destination,
    trip.customerName || '-',
    mat,
    trip.quantity,
    trip.unitPrice,
    trip.totalAmount,
    fuelExpense,
    carFee,
    driverFee,
    netAmount,
    statusMy,
    trip.notes || ''
  ];
}

/**
 * List existing spreadsheets from user's Google Drive
 */
export async function listUserSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Google Drive မှ Sheet စာရင်း ယူ၍ မရပါ');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Create a new styled Google Sheet in the user's Drive and populate with trips
 */
export async function createDeliverySpreadsheet(
  accessToken: string,
  title: string = 'သဲကားစာရင်း - Sand & Gravel Delivery Records',
  trips: Trip[] = []
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Trip Records',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Google Sheet အသစ်ဖန်တီး၍ မရပါ');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Populate Header and Data
  const rows = [SHEET_HEADERS, ...trips.map((t, idx) => tripToSheetRow(t, idx))];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Trip Records!A1:O${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Trip Records!A1:O${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Could not populate initial data into created sheet');
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Append a single newly added trip to Google Sheet
 */
export async function appendTripToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  trip: Trip,
  currentIndex: number = 0
): Promise<boolean> {
  const row = tripToSheetRow(trip, currentIndex);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Google Sheet သို့ စာရင်းထည့်သွင်း၍ မရပါ');
  }

  return true;
}

/**
 * Full Sync: Overwrite or update the sheet with all latest trips
 */
export async function syncAllTripsToGoogleSheetAPI(
  accessToken: string,
  spreadsheetId: string,
  trips: Trip[]
): Promise<boolean> {
  // 1. Fetch spreadsheet metadata to get first sheet title
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let sheetName = 'Trip Records';
  if (metaRes.ok) {
    const meta = await metaRes.json();
    if (meta.sheets && meta.sheets.length > 0) {
      sheetName = meta.sheets[0].properties?.title || 'Trip Records';
    }
  }

  // 2. Clear old values in the range
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z5000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // 3. Write complete fresh rows
  const rows = [SHEET_HEADERS, ...trips.map((t, idx) => tripToSheetRow(t, idx))];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:O${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${sheetName}!A1:O${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Google Sheet သို့ စာရင်းအားလုံး Sync လုပ်၍ မရပါ');
  }

  return true;
}
