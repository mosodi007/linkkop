import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { User, getMessengerIconUrl } from '@/app/data/mockUsers';
import { fetchDiscoverProfileById, fetchDiscoverPostsByAuthorId } from '@/app/lib/discover';
import type { Post } from '@/app/data/mockPosts';
import { Button } from '@/app/components/ui/button';
import { PostCard } from '@/app/components/PostCard';
import { Linkedin, Twitter, Instagram, Facebook, Phone } from 'lucide-react';
import { toast } from 'sonner';

const SOCIAL_ICONS: Record<string, { Icon: typeof Linkedin; label: string }> = {
  linkedin: { Icon: Linkedin, label: 'LinkedIn' },
  twitter: { Icon: Twitter, label: 'X (Twitter)' },
  instagram: { Icon: Instagram, label: 'Instagram' },
  facebook: { Icon: Facebook, label: 'Facebook' },
};

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setPostsLoading(false);
      return;
    }
    let cancelled = false;
    fetchDiscoverProfileById(id).then((u) => {
      if (!cancelled) {
        setUser(u ?? null);
        setLoading(false);
        if (u) {
          setPostsLoading(true);
          fetchDiscoverPostsByAuthorId(u.id, u).then((p) => {
            if (!cancelled) {
              setPosts(p);
              setPostsLoading(false);
            }
          });
        } else {
          setPostsLoading(false);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRequestContact = () => {
    if (user) {
      toast.success('Connection request sent', {
        description: `You requested to connect with ${user.name}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6">
        <p className="text-neutral-600 mb-4">Profile not found.</p>
        <Link to="/discover">
          <Button variant="outline" className="rounded-xl">
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 px-4 pt-4 pb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>

        {/* Profile header – Facebook-style: cover + avatar + name + CTA */}
        <header className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="relative h-40 sm:h-52">
            <img
              src={user.photo}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-4">
              <div className="relative -mb-8 sm:-mb-10">
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white object-cover shadow-lg"
                />
              </div>
              <div className="flex-1 min-w-0 pb-1 pl-0 sm:pl-2">
                <h1 className="text-white font-semibold text-xl sm:text-2xl drop-shadow-md">
                  {user.name}, {user.age}
                </h1>
                <p className="text-white/90 text-sm mt-0.5">
                  {user.occupation} · {user.city}
                </p>
              </div>
              <Button
                onClick={handleRequestContact}
                className="shrink-0 h-10 px-5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-sm font-medium"
              >
                Request Contact
              </Button>
            </div>
          </div>
        </header>

        {/* Posts – main content, prioritized */}
        <section className="px-4 py-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Posts
          </h2>
          {postsLoading ? (
            <p className="text-neutral-500 text-sm py-8">Loading posts…</p>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
              <p className="text-neutral-500 text-sm">
                No posts yet.
              </p>
            </div>
          )}
        </section>

        {/* About – collapsible so posts stay primary */}
        <section className="px-4 pb-8">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-neutral-200 text-left hover:bg-neutral-50 transition-colors"
          >
            <span className="font-semibold text-neutral-900">About</span>
            {aboutOpen ? (
              <ChevronUp className="w-5 h-5 text-neutral-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-500" />
            )}
          </button>
          {aboutOpen && (
            <div className="mt-2 p-4 bg-white rounded-xl border border-neutral-200 space-y-4">
              {user.bio && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    Bio
                  </h3>
                  <p className="text-neutral-700 leading-relaxed text-sm">
                    {user.bio}
                  </p>
                </div>
              )}
              {user.interests.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
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
              <div>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Social
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(user.socialNetworks) as [string, string | undefined][]).map(
                    ([key, value]) => {
                      const social = SOCIAL_ICONS[key];
                      if (!value || !social) return null;
                      const Icon = social.Icon;
                      return (
                        <a
                          key={key}
                          href={
                            value.startsWith('http')
                              ? value
                              : `https://${key}.com/${value.replace('@', '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                          aria-label={social.label}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                    }
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Contact
                </h3>
                <p className="text-neutral-700 font-mono text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-neutral-500 shrink-0" />
                  {user.phone}
                </p>
              </div>
              {user.messenger && user.messenger.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.messenger.map((m) => {
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
        </section>
      </div>
    </div>
  );
}
