import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Truck, 
  Eye, 
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';
import { AuthUser, AppSettings } from '../types';
import { 
  loginWithSpecialGmail, 
  isGmailAddress, 
  getAllowedSpecialEmails,
  WhitelistEntry
} from '../services/authService';
import { GoogleGIcon } from './LoginModal';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  settings: AppSettings;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, settings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showWhitelistInfo, setShowWhitelistInfo] = useState(false);

  const allowedList = getAllowedSpecialEmails();
  const isInputGmail = email.trim().length > 0 && isGmailAddress(email);
  const isInputInvalidDomain = email.includes('@') && !isGmailAddress(email);

  const handleQuickMasterLogin = async () => {
    setEmail('zawyannaing.yanrx4@gmail.com');
    executeLogin('zawyannaing.yanrx4@gmail.com', '');
  };

  const executeLogin = async (loginEmail: string, pass: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await loginWithSpecialGmail(loginEmail, pass, settings);
      if (res.success && res.user) {
        setSuccessMessage(`ခွင့်ပြုချက်ရရှိပါသည်: ${res.user.name} (${res.user.roleLabel.my}) အဖြစ် ဝင်ရောက်နေပါသည်...`);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || 'စနစ်အတွင်းသို့ ဝင်ရောက်ခွင့် မရရှိပါ');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Login request failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ သင်၏ Gmail လိပ်စာ ထည့်သွင်းပါ');
      return;
    }
    executeLogin(email, password);
  };

  const handleAppendGmailDomain = () => {
    const raw = email.trim();
    if (!raw) {
      setEmail('zawyannaing.yanrx4@gmail.com');
      return;
    }
    const clean = raw.includes('@') ? raw.split('@')[0] : raw;
    setEmail(`${clean}@gmail.com`);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121824] via-[#1a2332] to-[#0f141d] flex flex-col items-center justify-center p-4 sm:p-6 text-[#151c27]">
      {/* Brand & Security Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl mb-3">
          <Truck className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Sand & Logistics Pro
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 mt-1 font-medium">
          သဲ/ကျောက် သယ်ယူပို့ဆောင်ရေး လုပ်ငန်းသုံး စီမံခန့်ခွဲမှုစနစ်
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[11px] font-bold text-emerald-300 shadow-inner">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Restricted Access: Authorized Gmail Only</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#d8c3ad]/50 overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#fcfaf7] border-b border-[#ebdccd] p-6 text-center">
          <div className="inline-flex items-center gap-2 p-2 bg-white rounded-xl shadow-xs border border-gray-200 mb-2">
            <GoogleGIcon className="w-5 h-5" />
            <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
              Google Account Sign In
            </span>
          </div>
          <h2 className="text-lg font-black text-[#151c27]">
            စနစ်အတွင်းသို့ ဝင်ရောက်ရန်
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            ခွင့်ပြုချက်ရရှိထားသော Gmail ဖြင့်သာ ဝင်ရောက်အသုံးပြုနိုင်ပါသည်
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Quick One-Click for Master Admin */}
          <button
            type="button"
            onClick={handleQuickMasterLogin}
            disabled={isLoading}
            className="w-full mb-4 py-3 px-4 bg-amber-50 hover:bg-amber-100/80 border-2 border-amber-300/80 hover:border-amber-400 text-amber-950 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-between cursor-pointer group shadow-2xs disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GoogleGIcon className="w-4 h-4 shrink-0" />
              <div className="text-left truncate">
                <div className="flex items-center gap-1.5">
                  <span className="truncate">Zaw Yan Naing (Master Admin)</span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">1-Click</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono font-normal">
                  zawyannaing.yanrx4@gmail.com
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              သို့မဟုတ် သင့် Gmail ရိုက်ထည့်ပါ
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl font-semibold flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#534434] uppercase tracking-wider">
                  Gmail လိပ်စာ (Gmail Address) *
                </label>
                <button
                  type="button"
                  onClick={handleAppendGmailDomain}
                  className="text-[10px] text-[#855300] hover:text-[#653e00] font-bold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                >
                  + @gmail.com ထည့်မည်
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <GoogleGIcon className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="yourname@gmail.com"
                  className={`w-full pl-10 pr-24 py-3 rounded-xl border text-sm focus:outline-none bg-white font-medium transition-all ${
                    isInputGmail
                      ? 'border-emerald-500 ring-2 ring-emerald-100'
                      : isInputInvalidDomain
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-[#d8c3ad] focus:ring-2 focus:ring-[#855300]'
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                  {isInputGmail ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Gmail OK
                    </span>
                  ) : isInputInvalidDomain ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                      @gmail.com သာ
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Password Field (Optional if using Supabase or Master Auth) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#534434] uppercase tracking-wider">
                  လျှို့ဝှက်နံပါတ် (Password)
                </label>
                <span className="text-[10px] text-gray-400">
                  {settings.supabaseUrl ? 'Supabase Auth' : 'Special Whitelist Auth'}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-[#855300] hover:bg-[#653e00] text-white font-black text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>ခွင့်ပြုချက် စစ်ဆေးနေပါသည်...</span>
                </>
              ) : (
                <>
                  <span>ဝင်ရောက်မည် (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Whitelist Quick View Toggle */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowWhitelistInfo(!showWhitelistInfo)}
              className="text-xs text-[#855300] hover:text-[#653e00] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>ခွင့်ပြုထားသော အီးမေးလ်စာရင်း ကြည့်ရန် ({allowedList.length} ဦး)</span>
            </button>
          </div>

          {showWhitelistInfo && (
            <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] text-gray-700 flex flex-col gap-1.5 animate-fade-in">
              <span className="font-bold text-[#855300]">Special Allowed Gmail Accounts:</span>
              <div className="flex flex-col gap-1">
                {allowedList.map((entry) => (
                  <button
                    key={entry.email}
                    type="button"
                    onClick={() => {
                      setEmail(entry.email);
                      setShowWhitelistInfo(false);
                    }}
                    className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-amber-100 hover:border-amber-300 text-left cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-gray-800 truncate">{entry.email}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                      {entry.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center text-[11px] text-gray-500 font-medium">
          Sand Logistics & Supply Co., Ltd • Secured by Google Identity & Supabase
        </div>
      </div>
    </div>
  );
};
