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
  Eye, 
  EyeOff, 
  AlertCircle,
  Users
} from 'lucide-react';
import { AuthUser, UserRole, AppSettings } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { 
  ROLE_DETAILS, 
  loginWithEmail, 
  registerWithEmail, 
  switchDemoRole 
} from '../services/authService';

// Compatibility export
export const GoogleGIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <ShieldCheck className={className} />
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
  const [activeTab, setActiveTab] = useState<'quick' | 'email' | 'register'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('dispatcher');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Quick Demo Role Switch
  const handleQuickLogin = (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = switchDemoRole(role);
      setSuccessMessage(`အောင်မြင်ပါသည်: ${user.name} (${user.roleLabel.my}) ဖြင့် ဝင်ရောက်ပြီးပါပြီ!`);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(user);
        onClose();
      }, 350);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Login failed');
    }
  };

  // Form Submit for Email Login or Registration
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('ကျေးဇူးပြု၍ အီးမေးလ် သို့မဟုတ် အသုံးပြုသူအမည် ထည့်သွင်းပေးပါ');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (activeTab === 'email') {
        const res = await loginWithEmail(email, password, selectedRole, settings);
        if (res.success && res.user) {
          setSuccessMessage('အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်!');
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(res.user!);
            onClose();
          }, 350);
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'အီးမေးလ် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်');
        }
      } else {
        // Registration
        const res = await registerWithEmail(email, password, fullName, selectedRole, settings);
        if (res.success && res.user) {
          setSuccessMessage('အကောင့်အသစ် ဖွင့်လှစ်ပြီး ဝင်ရောက်ပြီးပါပြီ!');
          setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess(res.user!);
            onClose();
          }, 350);
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'အကောင့်ဖွင့်လှစ်ခြင်း မအောင်မြင်ပါ');
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Error occurred');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
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
              <Truck className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Account Authentication
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                စနစ်တွင်းသို့ ဝင်ရောက်ရန်
              </h2>
              <p className="text-xs text-gray-300 mt-0.5">
                သဲ/ကျောက် သယ်ယူပို့ဆောင်ရေး လုပ်ငန်းသုံး စီမံခန့်ခွဲမှုစနစ်
              </p>
            </div>
          </div>

          {/* Current Active Account Pill */}
          {currentUser && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-gray-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-300" /> လက်ရှိအသုံးပြုသူ:
              </span>
              <span className="font-bold bg-white/15 px-2.5 py-1 rounded-lg truncate max-w-[240px] text-amber-200 border border-white/10 font-mono text-[11px]">
                {currentUser.name} ({currentUser.email})
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#d8c3ad]/50 bg-[#f9f9ff] p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('quick'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'quick'
                ? 'bg-white text-[#855300] shadow-xs border border-[#d8c3ad]/70 font-black'
                : 'text-[#534434] hover:text-[#151c27]'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>အမြန်ဝင်ရောက်ရန် (Roles)</span>
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
            <span>အီးမေးလ်ဖြင့် ဝင်မည်</span>
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
            <span>အကောင့်သစ်</span>
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

        {/* TAB 1: Quick Role Switcher */}
        {activeTab === 'quick' && (
          <div className="p-6 flex flex-col gap-3">
            <div className="text-xs text-gray-500 font-medium mb-1">
              အောက်ပါ အကောင့်များထဲမှ မိမိ အသုံးပြုလိုသော အခန်းကဏ္ဍကို ၁ ချက်နှိပ်၍ အလွယ်တကူ ဝင်ရောက်နိုင်ပါသည်:
            </div>

            {DEMO_USERS.map((user) => {
              const details = ROLE_DETAILS[user.role];
              const isCurrent = currentUser?.email.toLowerCase() === user.email.toLowerCase();

              return (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user.role)}
                  disabled={isLoading}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-[#fdfbf9] border-gray-200 hover:bg-white hover:border-[#855300] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-gray-900 truncate group-hover:text-[#855300]">
                          {user.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded">
                            လက်ရှိ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {user.email}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {details.description}
                      </div>
                    </div>
                  </div>

                  <span 
                    className="text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: details.bg, color: details.color }}
                  >
                    {details.my}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 2 & 3: Email Login / Registration */}
        {(activeTab === 'email' || activeTab === 'register') && (
          <form onSubmit={handleEmailSubmit} className="p-6 flex flex-col gap-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider mb-1.5">
                  အမည်အပြည့်အစုံ (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ဥပမာ - ကိုအောင်ကျော်"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider mb-1.5">
                အီးမေးလ် သို့မဟုတ် အသုံးပြုသူအမည် (Email / Username) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium"
                />
              </div>
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

            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#534434] uppercase tracking-wider mb-1.5">
                  တာဝန် / အခန်းကဏ္ဍ (Role) *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#d8c3ad] text-sm focus:outline-none focus:ring-2 focus:ring-[#855300] bg-white font-medium"
                >
                  <option value="dispatcher">ကားဂိတ်မှူး / စာရင်းကိုင် (Dispatcher)</option>
                  <option value="driver">ယာဉ်မောင်း (Fleet Driver)</option>
                  <option value="site_manager">ဆိုက်တာဝန်ခံ (Site Engineer)</option>
                  <option value="viewer">စာရင်းစစ် (Auditor)</option>
                  <option value="admin">မန်နေဂျာ (Admin)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-[#855300] hover:bg-[#653e00] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>ဆောင်ရွက်နေပါသည်...</span>
                </>
              ) : (
                <>
                  <span>{activeTab === 'email' ? 'စနစ်တွင်းသို့ ဝင်မည်' : 'အကောင့်ဖွင့်မည်'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center text-[11px] text-gray-500 font-medium">
          Sand Logistics & Supply Co., Ltd • Enterprise Security
        </div>
      </div>
    </div>
  );
};
