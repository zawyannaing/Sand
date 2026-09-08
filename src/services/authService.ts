import { AuthUser, UserRole } from '../types';
import { DEMO_USERS, DEFAULT_AVATAR } from '../data/mockData';
import { signInWithSupabase, signUpWithSupabase, signOutFromSupabase, SupabaseConfig } from './supabaseClient';

const AUTH_USER_KEY = 'sand_logistics_auth_user';
const ALLOWED_EMAILS_KEY = 'sand_logistics_allowed_emails';

export const ROLE_DETAILS: Record<UserRole, { en: string; my: string; color: string; bg: string; description: string }> = {
  admin: {
    en: 'Fleet Director / Admin',
    my: 'အထွေထွေ မန်နေဂျာ',
    color: '#855300',
    bg: '#ffddb8',
    description: 'Full oversight: view all company gross revenue, total debt collections, all active trucks & drivers, export data, and system settings.',
  },
  dispatcher: {
    en: 'Logistics Dispatcher',
    my: 'ကားဂိတ်မှူး / စာရင်းကိုင်',
    color: '#005ac2',
    bg: '#dae2fd',
    description: 'Quick dispatch portal: log sand/stone deliveries, issue printable vouchers, assign drivers, and manage live transit queues.',
  },
  driver: {
    en: 'Fleet Driver',
    my: 'ယာဉ်မောင်း',
    color: '#006d3a',
    bg: '#c7f8cb',
    description: 'Personal driver hub: track assigned truck deliveries, daily volume in Kyin, earned driver fees (ယာဉ်မောင်းခ), and fuel records.',
  },
  site_manager: {
    en: 'Site Engineer / Customer',
    my: 'ဆောက်လုပ်ရေး ဆိုက်တာဝန်ခံ',
    color: '#653e00',
    bg: '#fdf2e9',
    description: 'Project site portal: inspect material deliveries received at your construction site, review volume counts, and manage invoice payments.',
  },
  viewer: {
    en: 'Auditor / Viewer',
    my: 'ကြည့်ရှုစစ်ဆေးသူ',
    color: '#475569',
    bg: '#f1f5f9',
    description: 'Read-only access: view live metrics, daily totals, and logs without editing rights.',
  },
};

export interface WhitelistEntry {
  email: string;
  name: string;
  burmeseName?: string;
  role: UserRole;
  isMaster?: boolean;
}

// Special Authorized Emails Whitelist
export const DEFAULT_SPECIAL_EMAILS: WhitelistEntry[] = [
  {
    email: 'zawyannaing.yanrx4@gmail.com',
    name: 'Zaw Yan Naing',
    burmeseName: 'ဇော်ရန်နိုင် (Master Admin)',
    role: 'admin',
    isMaster: true,
  },
  {
    email: 'tintlwin.dispatcher@gmail.com',
    name: 'U Tint Lwin',
    burmeseName: 'ဦးတင့်လွင် (ဂိတ်မှူး)',
    role: 'dispatcher',
  },
  {
    email: 'bamaung.driver912345@gmail.com',
    name: 'U Ba Maung',
    burmeseName: 'ဦးဘမောင် (ယာဉ်မောင်း - 9ယ/12345)',
    role: 'driver',
  },
  {
    email: 'winhtein.shwenagar@gmail.com',
    name: 'U Win Htein',
    burmeseName: 'ဦးဝင်းထိန် (ရွှေနဂါး ဆောက်လုပ်ရေး)',
    role: 'site_manager',
  },
  {
    email: 'auditor.sandlogistics@gmail.com',
    name: 'Daw Khin Aye',
    burmeseName: 'ဒေါ်ခင်အေး (စာရင်းစစ်)',
    role: 'viewer',
  }
];

/**
 * Get the current list of authorized special emails
 */
export function getAllowedSpecialEmails(): WhitelistEntry[] {
  try {
    const saved = localStorage.getItem(ALLOWED_EMAILS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading whitelist:', e);
  }
  return DEFAULT_SPECIAL_EMAILS;
}

/**
 * Add or update an allowed special email
 */
export function saveAllowedSpecialEmail(entry: WhitelistEntry) {
  const current = getAllowedSpecialEmails();
  const existingIdx = current.findIndex(e => e.email.toLowerCase() === entry.email.toLowerCase());
  let updated: WhitelistEntry[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = entry;
  } else {
    updated = [...current, entry];
  }
  localStorage.setItem(ALLOWED_EMAILS_KEY, JSON.stringify(updated));
}

/**
 * Remove an allowed special email (except master)
 */
export function removeAllowedSpecialEmail(email: string) {
  const current = getAllowedSpecialEmails();
  const filtered = current.filter(e => e.email.toLowerCase() !== email.toLowerCase() || e.isMaster);
  localStorage.setItem(ALLOWED_EMAILS_KEY, JSON.stringify(filtered));
}

/**
 * General verification: Check if string is a valid email format
 */
export function isGmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.includes('@') && email.includes('.');
}

/**
 * Verification: Check if email is authorized
 */
export function isEmailWhitelisted(email: string): boolean {
  if (!email) return false;
  const allowed = getAllowedSpecialEmails();
  const clean = email.trim().toLowerCase();
  return allowed.some(a => a.email.toLowerCase() === clean) || DEMO_USERS.some(u => u.email.toLowerCase() === clean);
}

/**
 * Get current stored auth user from session. Returns null if not logged in.
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      const parsed: AuthUser = JSON.parse(saved);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading auth user:', err);
  }
  return null;
}

/**
 * Save user to local session
 */
export function setCurrentUser(user: AuthUser | null) {
  if (user && user.id) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
  // Trigger custom storage event for instant UI reaction
  window.dispatchEvent(new Event('auth_user_change'));
}

/**
 * Sign In with email / username credentials
 */
export async function loginWithSpecialGmail(
  email: string,
  password?: string,
  config?: SupabaseConfig
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Format check
  if (!cleanEmail) {
    return { success: false, error: 'ကျေးဇူးပြု၍ အီးမေးလ် သို့မဟုတ် အသုံးပြုသူအမည် ထည့်သွင်းပါ (Please enter your email or username).' };
  }

  // 2. Lookup in special email list or demo users
  const allowedList = getAllowedSpecialEmails();
  let matchedEntry = allowedList.find(a => a.email.toLowerCase() === cleanEmail);
  const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanEmail);

  if (!matchedEntry && demoMatch) {
    matchedEntry = {
      email: demoMatch.email,
      name: demoMatch.name,
      burmeseName: demoMatch.name,
      role: demoMatch.role,
    };
  }

  // If new email, create entry so user can log in
  if (!matchedEntry) {
    matchedEntry = {
      email: cleanEmail,
      name: cleanEmail.split('@')[0] || 'User',
      burmeseName: cleanEmail.split('@')[0] || 'အသုံးပြုသူ',
      role: 'dispatcher',
    };
    saveAllowedSpecialEmail(matchedEntry);
  }

  // 3. Supabase Auth Integration (if configured and password provided)
  if (config?.supabaseUrl && config?.supabaseAnonKey && password) {
    try {
      const res = await signInWithSupabase(cleanEmail, password, config);
      if (res.success && res.user) {
        const meta = res.user.user_metadata || {};
        const userRole = (meta.role as UserRole) || matchedEntry.role;
        const authUser: AuthUser = {
          id: res.user.id,
          email: cleanEmail,
          name: matchedEntry.name || meta.full_name || cleanEmail.split('@')[0],
          burmeseName: matchedEntry.burmeseName || meta.burmese_name || '',
          role: userRole,
          roleLabel: ROLE_DETAILS[userRole] || ROLE_DETAILS.admin,
          phone: meta.phone || '09-790123456',
          avatarUrl: meta.avatar_url || DEFAULT_AVATAR,
          lastLoginAt: new Date().toISOString(),
        };
        setCurrentUser(authUser);
        return { success: true, user: authUser };
      }
    } catch (err: any) {
      console.warn('Supabase sign-in fallback to local authorized session:', err);
    }
  }

  // 4. Authorized session login
  const authUser: AuthUser = {
    id: demoMatch?.id || `usr-special-${Date.now()}`,
    email: cleanEmail,
    name: matchedEntry.name,
    burmeseName: matchedEntry.burmeseName || '',
    role: matchedEntry.role,
    roleLabel: ROLE_DETAILS[matchedEntry.role] || ROLE_DETAILS.admin,
    phone: demoMatch?.phone || '09-790123456',
    licensePlate: demoMatch?.licensePlate,
    siteName: demoMatch?.siteName,
    avatarUrl: demoMatch?.avatarUrl || DEFAULT_AVATAR,
    lastLoginAt: new Date().toISOString(),
  };

  setCurrentUser(authUser);
  return { success: true, user: authUser };
}

/**
 * Logout session
 */
export function logoutUser(config?: SupabaseConfig) {
  if (config?.supabaseUrl && config?.supabaseAnonKey) {
    signOutFromSupabase(config).catch(err => console.warn('Supabase signout:', err));
  }
  setCurrentUser(null);
}

/**
 * Compatible helper for login with Google / Gmail
 */
export async function loginWithGoogleGmail(
  gmailAddress: string = 'zawyannaing.yanrx4@gmail.com',
  _name?: string,
  _role?: UserRole
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  return loginWithSpecialGmail(gmailAddress);
}

/**
 * Compatible helper for login with email
 */
export async function loginWithEmail(
  email: string,
  password?: string,
  _role: UserRole = 'dispatcher',
  config?: SupabaseConfig
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  return loginWithSpecialGmail(email, password, config);
}

/**
 * Compatible helper for register
 */
export async function registerWithEmail(
  email: string,
  password?: string,
  fullName?: string,
  role: UserRole = 'dispatcher',
  config?: SupabaseConfig
): Promise<{ success: boolean; user?: AuthUser; message?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      error: 'ကျေးဇူးပြု၍ မှန်ကန်သော အီးမေးလ်လိပ်စာ ထည့်သွင်းပါ (Please enter a valid email address).'
    };
  }
  saveAllowedSpecialEmail({
    email: cleanEmail,
    name: fullName || cleanEmail.split('@')[0],
    role,
  });
  const res = await loginWithSpecialGmail(cleanEmail, password, config);
  return {
    success: res.success,
    user: res.user,
    error: res.error,
    message: res.success ? 'အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်' : undefined,
  };
}

/**
 * Compatible helper for demo role switch
 */
export function switchDemoRole(role: UserRole): AuthUser {
  const allowed = getAllowedSpecialEmails();
  const match = allowed.find(a => a.role === role) || allowed[0] || DEFAULT_SPECIAL_EMAILS[0];
  const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === match.email.toLowerCase());
  const user: AuthUser = {
    id: demoMatch?.id || `usr-${role}-${Date.now()}`,
    email: match.email,
    name: match.name,
    burmeseName: match.burmeseName || '',
    role: match.role,
    roleLabel: ROLE_DETAILS[match.role],
    phone: demoMatch?.phone || '09-790123456',
    licensePlate: demoMatch?.licensePlate,
    siteName: demoMatch?.siteName,
    avatarUrl: demoMatch?.avatarUrl || DEFAULT_AVATAR,
    lastLoginAt: new Date().toISOString(),
  };
  setCurrentUser(user);
  return user;
}
