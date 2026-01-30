import { Link, useNavigate } from 'react-router-dom';
import { Post } from '@/app/data/mockPosts';
import { Heart, MessageCircle, MapPin, MoreVertical, Pencil, EyeOff, Shield, Trash2, Flag, UserX } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useAuth } from '@/app/lib/auth';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PostCard({ post }: PostCardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwnPost = profile?.id === post.author.id;

  function handleEdit() {
    toast.info('Edit post — coming soon');
  }
  function handleHide() {
    toast.info('Post hidden from your feed');
  }
  function handlePrivacySettings() {
    navigate('/settings/privacy');
  }
  function handleDelete() {
    toast.success('Post deleted');
  }
  function handleReportPost() {
    toast.info('Report submitted. We’ll review this post.');
  }
  function handleBlockUser() {
    toast.info(`${post.author.name} has been blocked`);
  }

  return (
    <article className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3 p-4">
        <Link
          to={`/user/${post.author.id}`}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          aria-label={`View ${post.author.name}'s profile`}
        >
          <img
            src={post.author.photo}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/user/${post.author.id}`}
            className="font-semibold text-neutral-900 truncate block hover:underline focus:outline-none focus-visible:underline"
          >
            {post.author.name}
          </Link>
          <p className="text-xs text-neutral-500 truncate">
            {post.author.occupation} · {post.author.city}
          </p>
        </div>
        <span className="text-xs text-neutral-400 shrink-0">{formatTimeAgo(post.createdAt)}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
              aria-label="More options"
            >
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            {isOwnPost ? (
              <>
                <DropdownMenuItem onSelect={handleEdit}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleHide}>
                  <EyeOff className="size-4" />
                  Hide
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handlePrivacySettings}>
                  <Shield className="size-4" />
                  Privacy Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onSelect={handleHide}>
                  <EyeOff className="size-4" />
                  Hide
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleReportPost}>
                  <Flag className="size-4" />
                  Report post
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleBlockUser}>
                  <UserX className="size-4" />
                  Block user
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-neutral-700 text-[15px] leading-relaxed">{post.content}</p>
        {post.location && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
            <MapPin className="w-3.5 h-3.5" />
            {post.location}
          </p>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="w-full aspect-[16/10] bg-neutral-100">
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-neutral-100">
        <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900 gap-1.5">
          <Heart className="w-4 h-4" />
          {post.likes}
        </Button>
        <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-900 gap-1.5">
          <MessageCircle className="w-4 h-4" />
          {post.comments}
        </Button>
      </div>
    </article>
  );
}
