import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Building2, DollarSign, Globe, Phone, Check, FileSpreadsheet, RefreshCw, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppSettings, Trip } from '../types';
import { syncAllTripsToGoogleSheet } from '../services/googleSheetsService';

interface SettingsViewProps {
  settings: AppSettings;
  trips?: Trip[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetData: () => void;
  onOpenGoogleSheets?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  trips = [],
  onUpdateSettings,
  onResetData,
  onOpenGoogleSheets,
}) => {
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formState);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleTestSync = async () => {
    if (!formState.googleSheetUrl) {
      setSyncStatus({ success: false, message: 'Google Sheets Web App URL ထည့်သွင်းပေးပါ' });
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const result = await syncAllTripsToGoogleSheet(trips, formState.googleSheetUrl);
      setSyncStatus({ success: result.success, message: result.message });
    } catch (err: any) {
      setSyncStatus({ success: false, message: err?.message || 'Sync Error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#d8c3ad]/70 shadow-xs">
        <h2 className="font-extrabold text-xl text-[#151c27]">
          စနစ်ဆက်တင်များ (System Settings)
        </h2>
        <p className="text-xs text-[#534434] mt-0.5">
          Configure default price per Kyin, site company name, Google Sheets sync, and languages
        </p>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-300 p-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>ဆက်တင်များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ! (Settings saved successfully)</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#d8c3ad]/70 shadow-xs p-6 flex flex-col gap-6">
        {/* Business Profile */}
        <div>
          <h3 className="font-bold text-base text-[#151c27] mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#855300]" />
            <span>လုပ်ငန်းအချက်အလက် (Company & Site Profile)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#534434] block mb-1">
                ကုမ္ပဏီ / ဆိုက် အမည် (Company Name)
              </label>
              <input
                type="text"
                value={formState.companyName}
                onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#534434] block mb-1">
                စာတန်းငယ် (Subtitle / Slogan)
              </label>
              <input
                type="text"
                value={formState.companySubtext}
                onChange={(e) => setFormState({ ...formState, companySubtext: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#534434] block mb-1">
                ရုံးချုပ်ဖုန်းနံပါတ် (Office Contact Phone)
              </label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>
          </div>
        </div>

        {/* Google Sheets Sync Integration */}
        <div className="pt-4 border-t border-[#d8c3ad]/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-[#151c27] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#0F9D58]" />
              <span>Google Sheets စာရင်းချိတ်ဆက်မှု (Google Sheets Integration)</span>
            </h3>
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Drive / Sheets Manager</span>
              </button>
            )}
          </div>

          {/* Connected Drive Sheet preview if available */}
          {formState.activeGoogleSpreadsheetId && (
            <div className="mb-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                  <span>Connected Drive Sheet:</span>
                  <span className="underline">{formState.activeGoogleSpreadsheetName || 'Sand & Gravel Delivery Records'}</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-mono">
                  ID: {formState.activeGoogleSpreadsheetId}
                </div>
              </div>
              {formState.activeGoogleSpreadsheetUrl && (
                <a
                  href={formState.activeGoogleSpreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-[#534434] block mb-1">
                Google Sheets Web App Script URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={formState.googleSheetUrl || ''}
                  onChange={(e) => setFormState({ ...formState, googleSheetUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] text-[#151c27] focus:outline-none focus:border-[#855300]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                ကားစာရင်း အသစ်ထည့်တိုင်း ဤ Google Sheet သို့ အလိုအလျောက် ပို့ဆောင်သိမ်းဆည်းပေးမည် ဖြစ်ပါသည်။
              </p>
            </div>

            {/* Auto-sync checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoSync"
                checked={formState.autoSyncGoogleSheet !== false}
                onChange={(e) => setFormState({ ...formState, autoSyncGoogleSheet: e.target.checked })}
                className="w-4 h-4 text-[#855300] rounded cursor-pointer"
              />
              <label htmlFor="autoSync" className="text-xs font-semibold text-[#151c27] cursor-pointer">
                ကားစာရင်းမှတ်တိုင်း Google Sheet သို့ အလိုအလျောက် ပို့မည် (Auto-Sync on Save)
              </label>
            </div>

            {/* Test Sync Button */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestSync}
                disabled={isSyncing || (!formState.googleSheetUrl && !formState.activeGoogleSpreadsheetId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f0f3ff] hover:bg-[#ffddb8]/60 text-[#855300] font-bold text-xs rounded-lg border border-[#d8c3ad] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing to Sheet...' : `Sync All Trips to Google Sheet (${trips.length} records)`}</span>
              </button>
            </div>

            {/* Sync Feedback */}
            {syncStatus && (
              <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                syncStatus.success 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}>
                {syncStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Units */}
        <div className="pt-4 border-t border-[#d8c3ad]/50">
          <h3 className="font-bold text-base text-[#151c27] mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#855300]" />
            <span>မူလဈေးနှုန်းနှင့် ငွေကြေးသတ်မှတ်ချက် (Pricing & Defaults)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#534434] block mb-1">
                ၁ ကျင်း ပုံမှန်ပေါက်ဈေး (Default Price per Kyin - MMK)
              </label>
              <input
                type="number"
                value={formState.defaultPricePerKyin}
                onChange={(e) => setFormState({ ...formState, defaultPricePerKyin: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] text-[#151c27] focus:outline-none focus:border-[#855300]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#534434] block mb-1">
                ဘာသာစကား (Display Language)
              </label>
              <select
                value={formState.language}
                onChange={(e) => setFormState({ ...formState, language: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-[#d8c3ad] rounded-lg bg-[#f9f9ff] text-[#151c27] focus:outline-none focus:border-[#855300]"
              >
                <option value="bilingual">မြန်မာ + English (Bilingual)</option>
                <option value="my">မြန်မာဘာသာ (Burmese Only)</option>
                <option value="en">English (အင်္ဂလိပ်)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[#d8c3ad]/50 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#855300] hover:bg-[#653e00] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings (သိမ်းမည်)</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset Data */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-xs">
        <h3 className="font-bold text-base text-red-900 mb-1 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-red-600" />
          <span>ဒေတာ ပြန်လည်သတ်မှတ်ခြင်း (Reset Sample Data)</span>
        </h3>
        <p className="text-xs text-[#534434] mb-4">
          စနစ်အတွင်းရှိ မှတ်တမ်းအားလုံးကို မူလစတင်သည့် ပုံစံအတိုင်း ပြန်ထားလိုပါက နှိပ်ပါ။
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('မူလဒေတာအတိုင်း ပြန်လည်သတ်မှတ်ရန် သေချာပါသလား?')) {
              onResetData();
            }
          }}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-300 transition-colors cursor-pointer"
        >
          Reset to Factory Initial Data
        </button>
      </div>
    </div>
  );
};
