import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  DownloadCloud, 
  Code, 
  Key, 
  Link as LinkIcon, 
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, Trip, Driver, Vehicle } from '../types';
import { 
  testSupabaseConnection, 
  syncAllTripsToSupabase, 
  fetchTripsFromSupabase,
  SUPABASE_SQL_SCHEMA 
} from '../services/supabaseClient';

interface SupabaseIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onSetTrips: (newTrips: Trip[]) => void;
}

export const SupabaseIntegrationModal: React.FC<SupabaseIntegrationModalProps> = ({
  isOpen,
  onClose,
  settings,
  trips,
  drivers,
  vehicles,
  onUpdateSettings,
  onSetTrips,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [autoSync, setAutoSync] = useState(settings.autoSyncSupabase !== false);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success?: boolean; message?: string } | null>(null);
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'sql'>('config');

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    onUpdateSettings({
      ...settings,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      autoSyncSupabase: autoSync,
    });
    setTestResult({ success: true, message: 'Supabase credentials saved in settings!' });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection({
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
      });
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  const handleUploadAllToSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setUploadResult({ success: false, message: 'Supabase URL နှင့် Anon Key ကို အရင်ဖြည့်ပါ' });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await syncAllTripsToSupabase(trips, {
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
      });
      setUploadResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setUploadResult({ success: false, message: err?.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAllFromSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setDownloadResult({ success: false, message: 'Supabase URL နှင့် Anon Key ကို အရင်ဖြည့်ပါ' });
      return;
    }

    setIsDownloading(true);
    setDownloadResult(null);
    try {
      const cloudTrips = await fetchTripsFromSupabase({
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
      });

      if (!cloudTrips || cloudTrips.length === 0) {
        setDownloadResult({
          success: false,
          message: 'Supabase ထဲတွင် ကားခေါက်ရေ မှတ်တမ်း မတွေ့ရှိပါ (No trips found in database)',
        });
      } else {
        onSetTrips(cloudTrips);
        setDownloadResult({
          success: true,
          message: `Supabase မှ ကားခေါက်ရေ (${cloudTrips.length}) ခုကို Local သို့ အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!`,
        });
      }
    } catch (err: any) {
      setDownloadResult({ success: false, message: err?.message || 'Download failed' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#d8c3ad] overflow-hidden my-auto animate-fade-in">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c1917] to-[#292524] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg">Supabase Cloud Database ချိတ်ဆက်မှု</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                သဲကားစာရင်းများကို Supabase PostgreSQL Cloud Database ဖြင့် တိုက်ရိုက်ချိတ်ဆက်ခြင်း
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#d8c3ad]/50 bg-[#f9f9ff] px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#855300] text-[#855300]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connection & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-[#855300] text-[#855300]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>လုပ်ဆောင်ရန် အဆင့်များ (Setup Guide)</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sql'
                ? 'border-[#855300] text-[#855300]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>SQL Schema Script</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          
          {/* TAB 1: CONFIG & SYNC */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              {/* Credentials Inputs */}
              <div className="bg-[#f9f9ff] p-4 rounded-xl border border-[#d8c3ad] space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[#151c27] flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#855300]" />
                      <span>Supabase Project URL</span>
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal">Settings &gt; API &gt; Project URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#151c27] flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-[#855300]" />
                      <span>Supabase Anon Public API Key</span>
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal">Settings &gt; API &gt; anon public key</span>
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#d8c3ad] rounded-lg text-[#151c27] focus:outline-none focus:border-[#855300]"
                  />
                </div>

                {/* Auto Sync Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="supabaseAutoSync"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="w-4 h-4 text-[#855300] rounded cursor-pointer"
                  />
                  <label htmlFor="supabaseAutoSync" className="text-xs font-semibold text-[#151c27] cursor-pointer">
                    ကားစာရင်းအသစ်ထည့်တိုင်း Supabase Cloud Database သို့ အလိုအလျောက် ပို့မည် (Auto-Sync)
                  </label>
                </div>

                {/* Buttons: Test Connection & Save */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#d8c3ad]/40">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting || !supabaseUrl || !supabaseAnonKey}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing Connection...' : 'Test Connection (ချိတ်ဆက်မှု စမ်းသပ်မည်)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-4 py-2 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Credentials (သိမ်းမည်)</span>
                  </button>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-xs text-[#855300] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Supabase Dashboard ဖွင့်ရန်</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Cloud Sync Tools */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c3ad] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-[#151c27] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#855300]" />
                    <span>Data Synchronization Tools</span>
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    Local Records: {trips.length} trips
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload to Supabase */}
                  <div className="p-3 bg-[#f9f9ff] rounded-lg border border-[#d8c3ad]/60 flex flex-col justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-[#151c27] flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-emerald-600" />
                        <span>Upload Local to Supabase</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1">
                        လက်ရှိစနစ်ထဲရှိ ခေါက်ရေ ({trips.length}) ခုလုံးကို Supabase Cloud DB သို့ အားလုံးတင်မည်။
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadAllToSupabase}
                      disabled={isUploading}
                      className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
                      <span>{isUploading ? 'Uploading...' : 'Upload All Trips to Supabase'}</span>
                    </button>
                  </div>

                  {/* Download from Supabase */}
                  <div className="p-3 bg-[#f9f9ff] rounded-lg border border-[#d8c3ad]/60 flex flex-col justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-[#151c27] flex items-center gap-1.5">
                        <DownloadCloud className="w-4 h-4 text-blue-600" />
                        <span>Download from Supabase</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-1">
                        Supabase Cloud DB ရှိ အချက်အလက်များကို ရယူပြီး စနစ်ထဲသို့ တိုက်ရိုက် ထည့်သွင်းမည်။
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadAllFromSupabase}
                      disabled={isDownloading}
                      className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <DownloadCloud className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                      <span>{isDownloading ? 'Downloading...' : 'Fetch All from Supabase'}</span>
                    </button>
                  </div>
                </div>

                {uploadResult && (
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    uploadResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                    {uploadResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    <span>{uploadResult.message}</span>
                  </div>
                )}

                {downloadResult && (
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    downloadResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                  }`}>
                    {downloadResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    <span>{downloadResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-[#151c27]">
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-amber-900">
                <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  <span>Supabase တွင် လုပ်ဆောင်ရန် လိုအပ်သော အဆင့် (၄) ဆင့်</span>
                </div>
                <p>
                  Supabase Database ချိတ်ဆက်အသုံးပြုရန်အတွက် သင်၏ Supabase Account ထဲတွင် အောက်ပါအဆင့်များကို ပြုလုပ်ပေးရန် လိုအပ်ပါသည်-
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#855300] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#151c27]">Supabase Project အသစ်တစ်ခု ဖန်တီးပါ</h4>
                    <p className="text-gray-600 mt-0.5">
                      <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#855300] underline font-bold">Supabase.com</a> သို့သွားပြီး အကောင့်ဖွင့်ကာ <strong>New Project</strong> တစ်ခု ဖန်တီးပါ (ဥပမာ- <code>sand-logistics-db</code>)။
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#855300] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#151c27]">SQL Editor ထဲတွင် Database Schema ကို Run ပါ</h4>
                    <p className="text-gray-600 mt-0.5">
                      Supabase Dashboard ၏ ဘယ်ဘက် Menu ရှိ <strong>SQL Editor</strong> &gt; <strong>New Query</strong> သို့သွားပါ။ အထက်ပါ <strong>"SQL Schema Script"</strong> tab မှ Script အားလုံးကို Copy ယူပြီး Paste လုပ်ကာ <strong>RUN</strong> ခလုတ်ကို နှိပ်ပါ။ ၎င်းသည် <code>trips</code>, <code>drivers</code>, <code>vehicles</code> table များနှင့် RLS Security Policies များကို ဖန်တီးပေးပါမည်။
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#855300] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#151c27]">Project API Keys များကို ကူးယူပါ</h4>
                    <p className="text-gray-600 mt-0.5">
                      Supabase ဘယ်ဘက်အောက်ရှိ <strong>Project Settings</strong> (စက်သွားပုံ) &gt; <strong>API</strong> သို့သွားပြီး:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
                      <li><strong>Project URL</strong> (ဥပမာ- <code>https://xyz.supabase.co</code>)</li>
                      <li><strong>Project API Keys &gt; anon public key</strong> (ဥပမာ- <code>eyJhbGciOi...</code>)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 bg-[#f9f9ff] border border-[#d8c3ad] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#855300] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#151c27]">ဤစနစ်ထဲတွင် Paste ထည့်ပြီး ချိတ်ဆက်ပါ</h4>
                    <p className="text-gray-600 mt-0.5">
                      ကူးယူလာသော Project URL နှင့် Anon Key ကို <strong>"Connection &amp; Sync"</strong> tab တွင် ထည့်သွင်းပြီး <strong>Test Connection</strong> နှိပ်၍ ချိတ်ဆက်စစ်ဆေးပါ။
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SQL SCHEMA SCRIPT */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-[#151c27] flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#855300]" />
                    <span>Supabase SQL Migration Script</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Supabase Dashboard &gt; SQL Editor တွင် Run ရန်အတွက် အောက်ပါ script ကို ကူးယူပါ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-stone-900 text-emerald-400 font-mono text-[11px] leading-relaxed rounded-xl overflow-x-auto max-h-[340px] border border-stone-800 select-all">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f9f9ff] border-t border-[#d8c3ad]/50 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Instant Realtime & Cloud Backup ready</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close (ပိတ်မည်)
          </button>
        </div>

      </div>
    </div>
  );
};
