import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Linkedin, Twitter, Instagram, Facebook, Phone } from 'lucide-react';
import { useAuth } from '@/app/lib/auth';
import { fetchMyPosts } from '@/app/lib/feed';
import type { Post } from '@/app/data/mockPosts';
import { PostCard } from '@/app/components/PostCard';
import { Button } from '@/app/components/ui/button';
import { getMessengerIconUrl } from '@/app/data/mockUsers';

const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

const SOCIAL_ICONS: Record<string, { Icon: typeof Linkedin; label: string }> = {
  linkedin: { Icon: Linkedin, label: 'LinkedIn' },
  twitter: { Icon: Twitter, label: 'X (Twitter)' },
  instagram: { Icon: Instagram, label: 'Instagram' },
  facebook: { Icon: Facebook, label: 'Facebook' },
};

export function PersonalProfilePage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setPostsLoading(false);
      return;
    }
    let cancelled = false;
    fetchMyPosts(profile).then((list) => {
      if (!cancelled) {
        setPosts(list);
        setPostsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading profile…</p>
      </div>
    );
  }

  const avatarUrl = profile.avatar_url || PLACEHOLDER_AVATAR;
  const social = (profile.social_networks ?? {}) as Record<string, string>;
  const messengers = Array.isArray(profile.messenger) ? profile.messenger : [];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Profile header – cover + avatar + name + Edit */}
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="relative h-40 sm:h-52">
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4 min-w-0">
                <div className="relative -mb-8 sm:-mb-10 shrink-0">
                  <img
                    src={avatarUrl}
                    alt={profile.full_name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                </div>
                <div className="min-w-0 pb-1">
                  <h1 className="text-white font-semibold text-xl sm:text-2xl drop-shadow-md truncate">
                    {profile.full_name}
                  </h1>
                  {profile.city && (
                    <p className="text-white/90 text-sm mt-0.5 truncate">{profile.city}</p>
                  )}
                </div>
              </div>
              <Link to="/settings" className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 rounded-xl border-white/80 bg-white/20 text-white hover:bg-white/30 hover:text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* About */}
        <section className="px-4 py-6 space-y-6">
          {profile.bio && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Bio
              </h2>
              <p className="text-neutral-700 leading-relaxed text-sm">{profile.bio}</p>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(Object.keys(social).length > 0 || profile.phone || messengers.length > 0) && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Contact
              </h2>
              {profile.phone && (
                <p className="text-neutral-700 font-mono text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                  {profile.phone}
                </p>
              )}
              {Object.entries(social).map(([key, value]) => {
                const item = SOCIAL_ICONS[key];
                if (!value || !item) return null;
                const Icon = item.Icon;
                return (
                  <a
                    key={key}
                    href={
                      String(value).startsWith('http')
                        ? String(value)
                        : `https://${key}.com/${String(value).replace('@', '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </a>
                );
              })}
              {messengers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {messengers.map((m) => {
                    const iconUrl = getMessengerIconUrl(m);
                    if (!iconUrl) return null;
                    return (
                      <img
                        key={m}
                        src={iconUrl}
                        alt={m}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                        title={m.charAt(0).toUpperCase() + m.slice(1)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Your posts */}
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Your posts</h2>
            {postsLoading ? (
              <p className="text-neutral-500 text-sm py-6">Loading posts…</p>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500 text-sm">You haven’t posted yet.</p>
                <Link to="/feed" className="inline-block mt-3">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Go to Feed
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
