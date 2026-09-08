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
  User,
  Users,
  Building2
} from 'lucide-react';
import { AuthUser, AppSettings, UserRole } from '../types';
import { 
  loginWithSpecialGmail, 
  getAllowedSpecialEmails,
  ROLE_DETAILS
} from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  settings: AppSettings;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, settings }) => {
  const [email, setEmail] = useState('zawyannaing.yanrx4@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('all');

  const allowedList = getAllowedSpecialEmails();

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
        }, 400);
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
      setErrorMessage('ကျေးဇူးပြု၍ အီးမေးလ် သို့မဟုတ် အသုံးပြုသူအမည် ထည့်သွင်းပါ');
      return;
    }
    executeLogin(email, password);
  };

  const handleSelectQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    executeLogin(quickEmail, '');
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
          သဲ/ကျောက် သယ်ယူပို့ဆောင်ရေးနှင့် ငွေစာရင်း စီမံခန့်ခွဲမှုစနစ်
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[11px] font-bold text-emerald-300 shadow-inner">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>System Portal: Secure Authentication</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#d8c3ad]/50 overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#fcfaf7] border-b border-[#ebdccd] p-6 text-center">
          <div className="inline-flex items-center gap-2 p-2 bg-white rounded-xl shadow-xs border border-gray-200 mb-2">
            <User className="w-4 h-4 text-[#855300]" />
            <span className="text-xs font-black text-gray-800 tracking-wide uppercase">
              Staff & User Sign In
            </span>
          </div>
          <h2 className="text-lg font-black text-[#151c27]">
            စနစ်အတွင်းသို့ ဝင်ရောက်ရန်
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            ဝန်ထမ်းအကောင့် အီးမေးလ် သို့မဟုတ် အောက်ပါ အမြန်ဝင်ရောက်မှုစနစ်ကို အသုံးပြုပါ
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {/* Quick Account Switcher */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#534434] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#855300]" />
                <span>အမြန်ဝင်ရောက်ရန် ရွေးချယ်ပါ (Quick Access):</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {allowedList.slice(0, 4).map((entry) => {
                const isSelected = email.toLowerCase() === entry.email.toLowerCase();
                const roleInfo = ROLE_DETAILS[entry.role as UserRole] || ROLE_DETAILS.admin;
                return (
                  <button
                    key={entry.email}
                    type="button"
                    onClick={() => handleSelectQuickAccount(entry.email)}
                    disabled={isLoading}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-50 border-amber-400 shadow-xs ring-1 ring-amber-300' 
                        : 'bg-[#fcfaf7] hover:bg-gray-50 border-[#ebdccd]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-[#855300] shrink-0">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-gray-900 truncate">
                            {entry.name}
                          </span>
                          {entry.isMaster && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              Master
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate font-medium">
                          {entry.burmeseName || entry.email}
                        </div>
                      </div>
                    </div>
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: roleInfo.bg, color: roleInfo.color }}
                    >
                      {roleInfo.my}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              သို့မဟုတ် အီးမေးလ်ဖြင့် ဝင်မည်
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
            {/* Email / Username Field */}
            <div>
              <label className="text-xs font-bold text-[#534434] uppercase tracking-wider block mb-1.5">
                အီးမေးလ် သို့မဟုတ် အသုံးပြုသူအမည် (Email / Username) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="user@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#534434] uppercase tracking-wider">
                  လျှို့ဝှက်နံပါတ် (Password)
                </label>
                <span className="text-[10px] text-gray-400">
                  {settings.supabaseUrl ? 'Supabase Auth' : 'Company Auth'}
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
                  <span>စနစ်တွင်းသို့ ဝင်မည် (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center text-[11px] text-gray-500 font-medium">
          Sand Logistics & Supply Co., Ltd • Enterprise Fleet Security
        </div>
      </div>
    </div>
  );
};
