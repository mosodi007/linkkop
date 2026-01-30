import { useState, useEffect, useRef } from 'react';
import type { Post } from '@/app/data/mockPosts';
import { fetchFeedPosts, createFeedPost } from '@/app/lib/feed';
import { PostCard } from '@/app/components/PostCard';
import { useAuth } from '@/app/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { ImagePlus, X } from 'lucide-react';

const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

export function FeedPage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeText, setComposeText] = useState('');
  const [composeImage, setComposeImage] = useState<File | null>(null);
  const [composeImagePreview, setComposeImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeedPosts().then((list) => {
      if (!cancelled) {
        setPosts(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentAuthor = profile
    ? {
        id: profile.id,
        name: profile.full_name,
        photo: profile.avatar_url || PLACEHOLDER_AVATAR,
        occupation: 'Member',
        city: profile.city || 'Lagos',
      }
    : {
        id: 'current',
        name: 'You',
        photo: PLACEHOLDER_AVATAR,
        occupation: 'Member',
        city: 'Lagos',
      };

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setComposeImage(file);
    const url = URL.createObjectURL(file);
    setComposeImagePreview(url);
    e.target.value = '';
  }

  function clearComposeImage(revoke = true) {
    if (revoke && composeImagePreview) URL.revokeObjectURL(composeImagePreview);
    setComposeImage(null);
    setComposeImagePreview(null);
  }

  async function handlePost() {
    const text = composeText.trim();
    const hasContent = text || composeImage;
    if (!hasContent || posting) return;
    setPosting(true);
    if (profile) {
      const created = await createFeedPost(text || ' ', profile, composeImage);
      if (created) {
        setPosts((prev) => [created, ...prev]);
        setComposeText('');
        clearComposeImage();
      }
    } else {
      const newPost: Post = {
        id: `new-${Date.now()}`,
        authorId: currentAuthor.id,
        author: currentAuthor,
        content: text || ' ',
        image: composeImagePreview ?? undefined,
        location: '',
        city: currentAuthor.city,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
      };
      setPosts((prev) => [newPost, ...prev]);
      setComposeText('');
      clearComposeImage(false);
    }
    setPosting(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Feed</h1>
        <p className="text-sm text-neutral-500 mb-4">Public posts from people near you in Lagos</p>

        {/* Compose box */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
          <div className="p-4 flex gap-3">
            <Avatar className="h-10 w-10 shrink-0 rounded-full border border-neutral-200">
              <AvatarImage src={currentAuthor.photo} alt={currentAuthor.name} />
              <AvatarFallback className="bg-neutral-200 text-neutral-600 text-sm">
                {currentAuthor.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="What's on your mind?"
                rows={2}
                className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-transparent"
              />
              {composeImagePreview && (
                <div className="relative mt-3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                  <img
                    src={composeImagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearComposeImage}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  onChange={handleImagePick}
                  className="hidden"
                  aria-hidden
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4" />
                  Photo
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={(!composeText.trim() && !composeImage) || posting}
                  className="rounded-xl bg-neutral-900 hover:bg-neutral-800 text-sm px-4"
                >
                  {posting ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-500 text-sm py-8">Loading feed…</p>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
            <p className="text-neutral-500 text-sm">No posts yet. Be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
