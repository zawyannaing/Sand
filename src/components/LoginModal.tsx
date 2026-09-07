import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Truck, 
  User, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Sparkles,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  AlertCircle,
  Check
} from 'lucide-react';
import { AuthUser, UserRole, AppSettings } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { 
  ROLE_DETAILS, 
  loginWithEmail, 
  registerWithEmail, 
  switchDemoRole, 
  loginWithGoogleGmail,
  isGmailAddress 
} from '../services/authService';

// Official Google Multi-Color SVG Icon
export const GoogleGIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  currentUser: AuthUser | null;
  settings: AppSettings;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'quick' | 'email' | 'register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('dispatcher');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time Gmail domain validation check
  const isInputGmail = email.trim().length > 0 && isGmailAddress(email);
  const isInputInvalidDomain = email.includes('@') && !isGmailAddress(email);

  const handleAppendGmailDomain = () => {
    const raw = email.trim();
    if (!raw) {
      setEmail('zawyannaing.yanrx4@gmail.com');
      return;
    }
    const cleanPrefix = raw.includes('@') ? raw.split('@')[0] : raw;
    setEmail(`${cleanPrefix}@gmail.com`);
    setErrorMessage(null);
  };

  // Google 1-Click Login Handler
  const handleGoogleSignIn = async (gmailAddr: string = 'zawyannaing.yanrx4@gmail.com', name?: string, role?: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await loginWithGoogleGmail(gmailAddr, name, role);
      if (res.success && res.user) {
        setSuccessMessage(`Google Authentication Success! ${res.user.email} (${res.user.roleLabel.my}) အဖြစ် ဝင်ရောက်ပြီးပါပြီ`);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(res.user!);
          onClose();
        }, 500);
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || 'Google Login verification failed');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Google Login failed');
    }
  };

  // Quick Demo Role Switch
  const handleQuickLogin = (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = switchDemoRole(role);
      setSuccessMessage(`Gmail Verified: ${user.email} (${user.roleLabel.my}) ဖြင့် ဝင်ရောက်ပြီးပါပြီ!`);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user);
        onClose();
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Login failed');
    }
  };

  // Form Submit for Email Login or Registration
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('ကျေးဇူးပြု၍ Gmail လိပ်စာ ထည့်သွင်းပေးပါ');
      return;
    }

    if (!isGmailAddress(email)) {
      setErrorMessage('ခွင့်ပြုချက်မရှိပါ: Gmail အကောင့် (@gmail.com) ဖြင့်သာ ဝင်ရောက်ခွင့် ပြုထားပါသည် (Only @gmail.com accounts are permitted access).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (activeTab === 'email') {
        const res = await loginWithEmail(email, password, selectedRole, settings);
        if (res.success && res.user) {
          setSuccessMessage('Gmail အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်!');
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(res.user!);
            onClose();
          }, 500);
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'အီးမေးလ် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်');
        }
      } else {
        // Registration
        const res = await registerWithEmail(email, password, fullName, selectedRole, settings);
        if (res.success && res.user) {
          setSuccessMessage(res.message || 'Gmail အကောင့်ဖွင့်လှစ်ခြင်း အောင်မြင်ပါသည်!');
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(res.user!);
            onClose();
          }, 600);
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'အကောင့်ဖွင့်လှစ်ခြင်း မအောင်မြင်ပါ');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'စနစ်တွင် ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#d8c3ad]/60 overflow-hidden my-auto animate-scale-in">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#151c27] via-[#242e42] to-[#151c27] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-xs shadow-inner flex items-center justify-center">
              <GoogleGIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Gmail Only Access Permission
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                Google / Gmail Login System
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                စနစ်အတွင်းသို့ <strong className="text-amber-300">Gmail (@gmail.com)</strong> အကောင့်ဖြင့်သာ ဝင်ရောက်ခွင့်ပြုထားပါသည်
              </p>
            </div>
          </div>

          {/* Current Active Account Pill */}
          {currentUser && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-gray-300 flex items-center gap-1.5">
                <GoogleGIcon className="w-3.5 h-3.5" /> ဝင်ထားသော Gmail:
              </span>
              <span className="font-bold bg-white/15 px-2.5 py-1 rounded-lg truncate max-w-[240px] text-amber-200 border border-white/10 font-mono text-[11px]">
                {currentUser.email}
              </span>
            </div>
          )}
        </div>

        {/* Security Requirement Banner */}
        <div className="bg-amber-50/90 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-2 text-[11px] text-amber-900 font-semibold">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">
              သတ်မှတ်ချက်: <strong>@gmail.com</strong> အကောင့်များသာ စနစ်အား သုံးစွဲခွင့်ရှိပါသည်
            </span>
          </div>
          <span className="px-2 py-0.5 bg-amber-200/80 rounded-md font-bold text-[10px] text-amber-800 shrink-0 uppercase">
            Strict Policy
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#d8c3ad]/50 bg-[#f9f9ff] p-1.5 gap-1 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => { setActiveTab('google'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'google'
                ? 'bg-white text-[#151c27] shadow-xs border border-[#d8c3ad]/70 font-black'
                : 'text-[#534434] hover:text-[#151c27]'
            }`}
          >
            <GoogleGIcon className="w-4 h-4" />
            <span>Google / Gmail ဝင်မည်</span>
          </button>

          <button
            onClick={() => { setActiveTab('quick'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'quick'
                ? 'bg-white text-[#855300] shadow-xs border border-[#d8c3ad]/70 font-black'
                : 'text-[#534434] hover:text-[#151c27]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Roles Demo</span>
          </button>

          <button
            onClick={() => { setActiveTab('email'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'email'
                ? 'bg-white text-[#855300] shadow-xs border border-[#d8c3ad]/70 font-black'
                : 'text-[#534434] hover:text-[#151c27]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Gmail Sign In</span>
          </button>

          <button
            onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-white text-[#855300] shadow-xs border border-[#d8c3ad]/70 font-black'
                : 'text-[#534434] hover:text-[#151c27]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl font-semibold flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: Prominent Google / Gmail Sign In Flow */}
        {activeTab === 'google' && (
          <div className="p-6 flex flex-col gap-4">
            {/* Primary Google Login Button */}
            <button
              onClick={() => handleGoogleSignIn('zawyannaing.yanrx4@gmail.com', 'Zaw Yan Naing', 'admin')}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-gray-400 rounded-2xl font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.99] disabled:opacity-50"
            >
              <GoogleGIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Continue with Google (zawyannaing.yanrx4@gmail.com)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                သို့မဟုတ် ခွင့်ပြုထားသော Gmail များ
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* List of Verified Authorized Gmail Accounts */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#534434]">
                အကောင့် ရွေးချယ်၍ ၁ ချက်နှိပ် ဝင်ရောက်ရန် (Choose Authorized Gmail):
              </span>

              {DEMO_USERS.map((user) => {
                const details = ROLE_DETAILS[user.role];
                const isCurrent = currentUser?.email.toLowerCase() === user.email.toLowerCase();

                return (
                  <button
                    key={user.id}
                    onClick={() => handleGoogleSignIn(user.email, user.name, user.role)}
                    disabled={isLoading}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-[#fdfbf9] border-gray-200 hover:bg-white hover:border-[#855300] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
                          <GoogleGIcon className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#151c27] truncate">
                            {user.name}
                          </span>
                          <span 
                            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ backgroundColor: details.bg, color: details.color }}
                          >
                            {details.my}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono truncate font-medium">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCurrent ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#855300] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>Sign In</span> <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Quick Demo Roles (All verified @gmail.com) */}
        {activeTab === 'quick' && (
          <div className="p-6 flex flex-col gap-3.5">
            <p className="text-xs text-[#534434] font-medium leading-relaxed">
              စနစ်၏ အခန်းကဏ္ဍ (Roles) အလိုက် သီးသန့် Dashboard & Live Data များကို စမ်းသပ်ရန် အောက်ပါ <strong>Gmail Verified</strong> အကောင့်များမှ ရွေးချယ်ဝင်ရောက်ပါ:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_USERS.map((user) => {
                const details = ROLE_DETAILS[user.role];
                const isCurrent = currentUser?.role === user.role;

                return (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user.role)}
                    disabled={isLoading}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-[#fdfbf9] border-[#d8c3ad]/60 hover:bg-white hover:border-[#855300] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-11 h-11 rounded-full object-cover border border-[#d8c3ad]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs border border-gray-200">
                          <GoogleGIcon className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#151c27] truncate">
                            {user.name}
                          </span>
                          <span 
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: details.bg, color: details.color }}
                          >
                            {details.my}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#534434] truncate mt-0.5 font-medium">
                          {user.role === 'driver' && `🚗 ယာဉ်နံပါတ်: ${user.licensePlate}`}
                          {user.role === 'site_manager' && `🏗️ ဆိုဒ်: ${user.siteName}`}
                          {user.role === 'admin' && '👑 Company Revenue, Fleet Debt & All Drivers'}
                          {user.role === 'dispatcher' && '⚡ Trip Dispatches & Fast Vouchers'}
                          {user.role === 'viewer' && '👁️ Financial Audit & Real-time Records'}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-1 mt-0.5">
                          <span className="text-emerald-600 font-bold">✓ Gmail Authorized:</span> {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCurrent ? (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-1 rounded-lg">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#855300] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>ဝင်မည်</span> <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3 & 4: Email / Gmail Form Input */}
        {(activeTab === 'email' || activeTab === 'register') && (
          <form onSubmit={handleEmailSubmit} className="p-6 flex flex-col gap-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider mb-1.5">
                  နာမည်အပြည့်အစုံ (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ဥပမာ - ကိုကျော်လင်း"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider">
                  Gmail လိပ်စာ (Gmail Address) *
                </label>
                <button
                  type="button"
                  onClick={handleAppendGmailDomain}
                  className="text-[10px] text-[#855300] hover:text-[#653e00] font-extrabold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                >
                  + @gmail.com အလိုအလျောက်ထည့်မည်
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
                  placeholder="username@gmail.com"
                  className={`w-full pl-10 pr-24 py-2.5 rounded-xl border text-sm focus:outline-none bg-white font-medium ${
                    isInputGmail
                      ? 'border-emerald-500 ring-2 ring-emerald-100'
                      : isInputInvalidDomain
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-[#d8c3ad] focus:ring-2 focus:ring-[#855300]'
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isInputGmail ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Gmail OK
                    </span>
                  ) : isInputInvalidDomain ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                      @gmail.com သာ
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono font-semibold">
                      @gmail.com
                    </span>
                  )}
                </div>
              </div>

              {isInputInvalidDomain && (
                <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Gmail လိပ်စာ (@gmail.com) ဖြင့်သာ စနစ်အတွင်း ဝင်ရောက်ခွင့်ရပါမည်
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider mb-1.5">
                လျှို့ဝှက်နံပါတ် (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium"
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

            <div>
              <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider mb-1.5">
                အခန်းကဏ္ဍ ရွေးချယ်ရန် (Role / Permission) *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-semibold text-[#151c27]"
              >
                <option value="admin">👑 Fleet Director / Admin (အထွေထွေ မန်နေဂျာ)</option>
                <option value="dispatcher">⚡ Logistics Dispatcher (ကားဂိတ်မှူး / စာရင်းကိုင်)</option>
                <option value="driver">🚗 Fleet Driver (ယာဉ်မောင်း)</option>
                <option value="site_manager">🏗️ Construction Site Manager (ဆောက်လုပ်ရေး ဆိုက်တာဝန်ခံ)</option>
                <option value="viewer">👁️ Auditor / Viewer (ကြည့်ရှုစစ်ဆေးသူ)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#855300] hover:bg-[#653e00] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Gmail ခွင့်ပြုချက် စစ်ဆေးနေပါသည်...</span>
                  </>
                ) : activeTab === 'email' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Gmail ဖြင့် ဝင်ရောက်မည် (Sign In)</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Gmail အကောင့် ဖွင့်မည် (Register)</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-1">
              <p className="text-xs text-gray-500">
                {activeTab === 'email' ? (
                  <>
                    အကောင့်မရှိသေးပါက{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-[#855300] font-bold hover:underline cursor-pointer"
                    >
                      ဒီနေရာတွင် Gmail ဖြင့် အကောင့်ဖွင့်ပါ
                    </button>
                  </>
                ) : (
                  <>
                    အကောင့်ရှိပြီးဖြစ်ပါက{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('email')}
                      className="text-[#855300] font-bold hover:underline cursor-pointer"
                    >
                      Gmail Sign In ပြန်ဝင်ရန်
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="bg-[#f0f3ff]/60 px-6 py-3.5 border-t border-[#d8c3ad]/40 flex items-center justify-between text-xs text-[#534434]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gmail Authentication & Permissions Active</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            ပိတ်မည် (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
