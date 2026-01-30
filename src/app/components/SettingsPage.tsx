import { Link, useNavigate } from 'react-router-dom';
import { User, Bell, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/app/lib/auth';
import { supabase } from '@/app/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { ONBOARDING_COMPLETE_KEY } from '@/app/types/onboarding';

const settingsGroups = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Profile', description: 'Name, photo, bio' },
      { icon: Bell, label: 'Notifications', description: 'Push and email' },
    ],
  },
  {
    title: 'Privacy & safety',
    items: [
      { icon: Shield, label: 'Privacy', description: 'Who can see your posts' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: HelpCircle, label: 'Help & feedback', description: 'FAQ and contact' },
    ],
  },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isLocalOnboarded =
    typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  const showLogout = user || (!supabase && isLocalOnboarded);

  function handleLogout() {
    if (supabase && user) {
      signOut();
      navigate('/', { replace: true });
    } else if (isLocalOnboarded) {
      localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
      localStorage.removeItem('onboarding_data');
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Settings</h1>
        <p className="text-sm text-neutral-500 mb-6">Manage your account and preferences</p>

        <div className="space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 px-1">
                {group.title}
              </h2>
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isPrivacy = item.label === 'Privacy';
                  const content = (
                    <>
                      <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900">{item.label}</p>
                        <p className="text-sm text-neutral-500">{item.description}</p>
                      </div>
                    </>
                  );
                  return isPrivacy ? (
                    <Link
                      key={item.label}
                      to="/settings/privacy"
                      className="flex items-center gap-4 w-full p-4 hover:bg-neutral-50 transition-colors text-left"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      className="flex items-center gap-4 w-full p-4 hover:bg-neutral-50 transition-colors text-left"
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {showLogout && (
          <div className="mt-8 pt-6 border-t border-neutral-200">
            {user?.email && (
              <p className="text-sm text-neutral-500 mb-2">{user.email}</p>
            )}
            <Button
              variant="outline"
              className="w-full border-neutral-300 text-neutral-700"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
