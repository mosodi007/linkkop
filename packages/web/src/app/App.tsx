import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { FeedPage } from '@/app/components/FeedPage';
import { DiscoverPage } from '@/app/components/DiscoverPage';
import { ContactsPage } from '@/app/components/ContactsPage';
import { NotificationsPage } from '@/app/components/NotificationsPage';
import { SettingsPage } from '@/app/components/SettingsPage';
import { PrivacyPage } from '@/app/components/PrivacyPage';
import { UserProfilePage } from '@/app/components/UserProfilePage';
import { PersonalProfilePage } from '@/app/components/PersonalProfilePage';
import { LandingPage } from '@/app/components/LandingPage';
import { SignUpFlow } from '@/app/components/SignUpFlow';
import { SignInPage } from '@/app/components/SignInPage';
import { LayoutDashboard, Compass, Users, Bell, Settings, MapPin } from 'lucide-react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/app/lib/auth';
import { supabase } from '@/app/lib/supabase';
import { ONBOARDING_COMPLETE_KEY } from '@/app/types/onboarding';

const navItems = [
  { path: '/feed', label: 'Feed', icon: LayoutDashboard },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const MAIN_APP_PATHS = ['/feed', '/discover', '/contacts', '/notifications', '/settings'];

function useCanAccessApp() {
  const { session, profile, loading } = useAuth();
  const localOnboarded =
    typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';

  if (supabase) {
    if (loading) return { allowed: false, loading: true };
    if (session && !profile) return { allowed: false, loading: true };
    return { allowed: !!(session && profile), loading: false };
  }
  return { allowed: localOnboarded, loading: false };
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { allowed, loading } = useCanAccessApp();
  if (loading)
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading…</p>
      </div>
    );
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function FloatingNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl px-2 py-2 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] py-2 px-3 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#000000] text-[#41C28A]'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

function Header() {
  const { profile } = useAuth();
  const avatarUrl = (profile?.avatar_url?.trim()) || PLACEHOLDER_AVATAR;
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [avatarUrl]);
  const src = imgError ? PLACEHOLDER_AVATAR : avatarUrl;

  return (
    <header className="sticky top-0 z-40 bg-neutral-50/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/feed" className="shrink-0">
            <img
              src="/Linkkop.png"
              alt="Linkkop"
              className="h-6 w-auto object-contain"
            />
          </Link>
          <span className="h-4 w-px bg-neutral-300" aria-hidden />
          <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <MapPin className="size-3.5 shrink-0 text-neutral-400" />
            {profile?.city ?? 'Lagos'}, Nigeria
          </span>
        </div>
        <Link
          to="/profile"
          className="shrink-0 w-9 h-9 rounded-full overflow-hidden border-2 border-neutral-200 hover:border-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
          aria-label="Your profile"
        >
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </Link>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const { allowed } = useCanAccessApp();
  const showAppShell =
    MAIN_APP_PATHS.includes(location.pathname) ||
    location.pathname === '/profile' ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/user/');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {showAppShell && <Header />}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              allowed ? <Navigate to="/feed" replace /> : <LandingPage />
            }
          />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpFlow />} />
          <Route
            path="/feed"
            element={
              <RequireAuth>
                <FeedPage />
              </RequireAuth>
            }
          />
          <Route
            path="/discover"
            element={
              <RequireAuth>
                <DiscoverPage />
              </RequireAuth>
            }
          />
          <Route
            path="/contacts"
            element={
              <RequireAuth>
                <ContactsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings/privacy"
            element={
              <RequireAuth>
                <PrivacyPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <PersonalProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/user/:id"
            element={
              <RequireAuth>
                <UserProfilePage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      {showAppShell && <FloatingNav />}
      <Toaster theme="light" position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
