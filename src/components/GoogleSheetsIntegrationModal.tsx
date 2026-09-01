import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  LogOut,
  Sparkles,
  Link2,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppSettings, Trip } from '../types';
import {
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  initAuth
} from '../services/googleAuth';
import {
  listUserSpreadsheets,
  createDeliverySpreadsheet,
  syncAllTripsToGoogleSheetAPI,
  DriveSpreadsheetFile
} from '../services/googleSheetsApi';
import { syncAllTripsToGoogleSheet } from '../services/googleSheetsService';

interface GoogleSheetsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  trips: Trip[];
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const GoogleSheetsIntegrationModal: React.FC<GoogleSheetsIntegrationModalProps> = ({
  isOpen,
  onClose,
  settings,
  trips,
  onUpdateSettings,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState<boolean>(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [newSheetTitle, setNewSheetTitle] = useState<string>('သဲကားစာရင်း - Sand Logistics Records');
  const [confirmSyncOpen, setConfirmSyncOpen] = useState<boolean>(false);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch spreadsheets from Drive when token is available
  useEffect(() => {
    if (isOpen && token) {
      loadDriveSpreadsheets(token);
    }
  }, [isOpen, token]);

  const loadDriveSpreadsheets = async (accessToken: string) => {
    setIsLoadingSheets(true);
    try {
      const files = await listUserSpreadsheets(accessToken);
      setDriveSheets(files);
    } catch (err: any) {
      console.warn('Could not load spreadsheets from Drive:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setFeedback(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setToken(result.accessToken);
        setFeedback({
          type: 'success',
          message: `Google အကောင့် (${result.user.email}) ဖြင့် အောင်မြင်စွာ ချိတ်ဆက်ပြီးပါပြီ!`,
        });
        loadDriveSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Google ဖြင့် Sign-in ဝင်ရောက်ခြင်း မအောင်မြင်ပါ',
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setToken(null);
    setDriveSheets([]);
    setFeedback({
      type: 'info',
      message: 'Google အကောင့်မှ ထွက်ခွာပြီးပါပြီ',
    });
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!token) {
      setFeedback({ type: 'error', message: 'ကျေးဇူးပြု၍ Google အကောင့် အရင်ဝင်ပါ' });
      return;
    }

    setIsCreatingSheet(true);
    setFeedback(null);
    try {
      const res = await createDeliverySpreadsheet(token, newSheetTitle, trips);
      onUpdateSettings({
        ...settings,
        activeGoogleSpreadsheetId: res.spreadsheetId,
        activeGoogleSpreadsheetName: newSheetTitle,
        activeGoogleSpreadsheetUrl: res.spreadsheetUrl,
      });

      setFeedback({
        type: 'success',
        message: `Google Sheet "${newSheetTitle}" အသစ်ကို Google Drive တွင် အောင်မြင်စွာ ဖန်တီးပြီး ကားစာရင်း (${trips.length} ခု) ကို ထည့်သွင်းပြီးပါပြီ!`,
      });

      loadDriveSpreadsheets(token);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sheet အသစ် ဖန်တီးရာတွင် အမှားဖြစ်ပါသည်: ${err?.message || 'Error'}`,
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSelectSpreadsheet = (file: DriveSpreadsheetFile) => {
    const url = file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
    onUpdateSettings({
      ...settings,
      activeGoogleSpreadsheetId: file.id,
      activeGoogleSpreadsheetName: file.name,
      activeGoogleSpreadsheetUrl: url,
    });
    setFeedback({
      type: 'success',
      message: `"${file.name}" ကို အသုံးပြုမည့် Google Sheet အဖြစ် သတ်မှတ်ပြီးပါပြီ`,
    });
  };

  // Perform full sync with user confirmation
  const handleConfirmFullSync = async () => {
    setConfirmSyncOpen(false);
    setIsSyncing(true);
    setFeedback(null);

    try {
      if (settings.activeGoogleSpreadsheetId && token) {
        await syncAllTripsToGoogleSheetAPI(token, settings.activeGoogleSpreadsheetId, trips);
        setFeedback({
          type: 'success',
          message: `ကားစာရင်း (${trips.length}) ခုလုံးကို "${settings.activeGoogleSpreadsheetName || 'Google Sheet'}" သို့ အောင်မြင်စွာ Sync လုပ်ပြီးပါပြီ!`,
        });
      } else if (settings.googleSheetUrl) {
        const res = await syncAllTripsToGoogleSheet(trips, settings.googleSheetUrl);
        setFeedback({
          type: res.success ? 'success' : 'error',
          message: res.message,
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'ချိတ်ဆက်ထားသော Google Sheet သို့မဟုတ် WebApp URL မရှိသေးပါ',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sync မအောင်မြင်ပါ: ${err?.message || 'Error'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#d8c3ad]/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#855300] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Google Sheets ချိတ်ဆက်မှု (Integration)</h2>
              <p className="text-xs text-[#ffddb8]/90">သဲကားခေါက်ရေ စာရင်းများကို Google Sheets & Drive ဖြင့် တိုက်ရိုက်ချိတ်ဆက်ခြင်း</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Feedback alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : feedback.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-blue-50 text-blue-800 border-blue-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Google Account Sign-in Section */}
          <div className="p-4 rounded-xl bg-[#fdfcfb] border border-[#d8c3ad]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-10 h-10 rounded-full border border-[#855300]/30 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#855300] text-white font-bold flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-[#151c27]">
                      {currentUser.displayName || 'Google User'}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">{currentUser.email}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs font-bold text-[#151c27]">Google Workspace အကောင့် ချိတ်ဆက်ရန်</div>
                  <div className="text-[11px] text-gray-500">Google Drive & Sheets API ကို အသုံးပြုရန် Sign-in ဝင်ပါ</div>
                </div>
              )}
            </div>

            <div>
              {currentUser ? (
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  className="inline-flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs text-xs font-bold text-gray-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoadingAuth ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Connected Spreadsheet Details */}
          {settings.activeGoogleSpreadsheetId && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>လက်ရှိချိတ်ထားသော Sheet:</span>
                    <span className="underline font-semibold">{settings.activeGoogleSpreadsheetName || 'Sand & Gravel Delivery Sheet'}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                    ID: {settings.activeGoogleSpreadsheetId}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {settings.activeGoogleSpreadsheetUrl && (
                  <a
                    href={settings.activeGoogleSpreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmSyncOpen(true)}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All Records'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Option A: Create New Spreadsheet */}
          {token && (
            <div className="p-4 rounded-xl bg-white border border-[#d8c3ad]/70 flex flex-col gap-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#151c27]">
                <Plus className="w-4 h-4 text-[#855300]" />
                <span>Google Drive ထဲတွင် Sheet အသစ်ဖန်တီးပြီး ချိတ်ဆက်မည်</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Sheet ခေါင်းစဉ် (ဥပမာ- သဲကားစာရင်း ၂၀၂၆)"
                  className="flex-1 px-3 py-2 text-xs border border-[#d8c3ad] rounded-lg focus:outline-none focus:border-[#855300]"
                />
                <button
                  type="button"
                  onClick={handleCreateNewSpreadsheet}
                  disabled={isCreatingSheet || !newSheetTitle.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#855300] hover:bg-[#653e00] text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isCreatingSheet ? 'Creating Sheet...' : 'Create & Sync Now'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Option B: Pick from Drive */}
          {token && (
            <div className="p-4 rounded-xl bg-white border border-[#d8c3ad]/70 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-[#151c27]">
                  <FolderOpen className="w-4 h-4 text-[#855300]" />
                  <span>Google Drive ရှိ ရှိပြီးသား Sheet များမှ ရွေးချယ်မည်</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadDriveSpreadsheets(token)}
                  disabled={isLoadingSheets}
                  className="text-xs text-[#855300] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                  <span>Refresh List</span>
                </button>
              </div>

              {isLoadingSheets ? (
                <div className="py-4 text-center text-xs text-gray-500">Google Drive မှ ဖိုင်များကို ရှာဖွေနေပါသည်...</div>
              ) : driveSheets.length > 0 ? (
                <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {driveSheets.map((file) => {
                    const isSelected = settings.activeGoogleSpreadsheetId === file.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectSpreadsheet(file)}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-[#fcfaf8] hover:bg-[#ffddb8]/30 border-[#d8c3ad]/50 text-[#151c27]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] text-[#855300] hover:underline px-2 py-0.5 rounded border border-[#d8c3ad]"
                          >
                            ရွေးမည်
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-gray-400">
                  Google Drive ထဲတွင် Spreadsheet များ မတွေ့ရှိပါ။ အထက်ပါ အသစ်ဖန်တီးရန် ခလုတ်ကို အသုံးပြုပါ။
                </div>
              )}
            </div>
          )}

          {/* Option C: Google Sheets Apps Script WebApp URL */}
          <div className="p-4 rounded-xl bg-white border border-[#d8c3ad]/70 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#151c27]">
              <Link2 className="w-4 h-4 text-[#855300]" />
              <span>Google Sheets Web App Script URL ဖြင့် ချိတ်ဆက်ခြင်း</span>
            </div>
            <input
              type="url"
              value={settings.googleSheetUrl || ''}
              onChange={(e) => onUpdateSettings({ ...settings, googleSheetUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs font-mono border border-[#d8c3ad] rounded-lg focus:outline-none focus:border-[#855300]"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="modalAutoSync"
                checked={settings.autoSyncGoogleSheet !== false}
                onChange={(e) => onUpdateSettings({ ...settings, autoSyncGoogleSheet: e.target.checked })}
                className="w-4 h-4 text-[#855300] rounded cursor-pointer"
              />
              <label htmlFor="modalAutoSync" className="text-xs font-medium text-[#151c27] cursor-pointer">
                ကားစာရင်းအသစ်မှတ်တိုင်း အလိုအလျောက် ပို့မည် (Real-time Auto-Sync)
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#fbf9f6] border-t border-[#d8c3ad]/60 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            စုစုပေါင်း ကားခေါက်ရေ: <span className="font-bold text-[#855300]">{trips.length}</span> records
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#855300] hover:bg-[#653e00] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Done (ပြီးပါပြီ)
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive / Mutating Operation (Workspace API rule) */}
      {confirmSyncOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-amber-300 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Google Sheet စာရင်းကို အသစ်ပြင်ဆင်ရေးသားမည်လား?</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  လက်ရှိ ရောက်ရှိနေသော ကားခေါက်ရေ ({trips.length}) ခုလုံးဖြင့် Google Sheet အချက်အလက်များကို အသစ်ပြင်ဆင်ရေးသား (Update/Overwrite) ပါမည်။
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmSyncOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel (မလုပ်တော့ပါ)
              </button>
              <button
                type="button"
                onClick={handleConfirmFullSync}
                className="px-4 py-2 rounded-lg bg-[#855300] hover:bg-[#653e00] text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Confirm & Sync (အတည်ပြုသည်)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
