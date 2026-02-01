import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { PhotoViewer } from '@/app/components/PhotoViewer';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useAuth } from '@/app/lib/auth';
import {
  updatePost,
  hidePostByAuthor,
  deletePost,
  togglePostLike,
  getPostLikers,
  getPostComments,
  addPostComment,
} from '@/app/lib/feed';
import type { PostLikerDto, PostCommentDto } from '@repo/shared';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
  onPostUpdated?: (post: Post) => void;
  onPostHidden?: (postId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostLiked?: (postId: string, likesCount: number) => void;
  onCommentAdded?: (postId: string, commentsCount: number) => void;
}

/** Parses comment content: if it starts with > "quoted"\n\n, returns { quoted, reply }; else { quoted: null, reply: content }. */
function parseQuotedComment(content: string): { quoted: string | null; reply: string } {
  const match = content.match(/^> "((?:[^"\\]|\\.)*)"\n\n/);
  if (!match) return { quoted: null, reply: content };
  const quoted = match[1].replace(/\\(.)/g, (_, c) => c);
  return { quoted, reply: content.slice(match[0].length).trim() };
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

export function PostCard({
  post,
  onPostUpdated,
  onPostHidden,
  onPostDeleted,
  onPostLiked,
  onCommentAdded,
}: PostCardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isOwnPost = profile?.id === post.author.id;
  const [editOpen, setEditOpen] = useState(false);
  const [editCaption, setEditCaption] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState<number | null>(null);
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [likersOpen, setLikersOpen] = useState(false);
  const [likers, setLikers] = useState<PostLikerDto[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState<number | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<PostCommentDto | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  const likesCount = localLikesCount ?? post.likes;
  const liked = localLiked ?? post.likedByMe ?? false;
  const commentsCount = localCommentsCount ?? post.comments;

  function openEdit() {
    setEditCaption(post.content);
    setEditOpen(true);
  }
  async function handleSaveEdit() {
    const trimmed = editCaption.trim();
    if (!trimmed) return;
    setEditSaving(true);
    const updated = await updatePost(post.id, trimmed);
    setEditSaving(false);
    if (updated) {
      onPostUpdated?.(updated);
      setEditOpen(false);
      toast.success('Post updated');
    } else {
      toast.error('Failed to update post');
    }
  }
  async function handleHide() {
    const ok = await hidePostByAuthor(post.id);
    if (ok) {
      toast.success('Post hidden');
      onPostHidden?.(post.id);
    } else {
      toast.error('Failed to hide post');
    }
  }
  function handlePrivacySettings() {
    navigate('/settings/privacy');
  }
  async function handleDelete() {
    const ok = await deletePost(post.id);
    if (ok) {
      toast.success('Post deleted');
      onPostDeleted?.(post.id);
    } else {
      toast.error('Failed to delete post');
    }
  }
  function handleReportPost() {
    toast.info('Report submitted. We’ll review this post.');
  }
  function handleBlockUser() {
    toast.info(`${post.author.name} has been blocked`);
  }

  async function handleLikeToggle() {
    if (!profile) return;
    const result = await togglePostLike(post.id, profile.id);
    if (result) {
      setLocalLikesCount(result.likesCount);
      setLocalLiked(result.liked);
      onPostLiked?.(post.id, result.likesCount);
    } else {
      toast.error('Failed to update like');
    }
  }

  async function openLikers() {
    if (!isOwnPost) return;
    setLikersOpen(true);
    setLikersLoading(true);
    const list = await getPostLikers(post.id);
    setLikers(list);
    setLikersLoading(false);
  }

  async function openComments() {
    setCommentsOpen(true);
    setNewComment('');
    setReplyingToComment(null);
    setCommentsLoading(true);
    const list = await getPostComments(post.id);
    setComments(list);
    setCommentsLoading(false);
  }

  async function handleAddComment() {
    if (!profile || !newComment.trim()) return;
    setCommentSubmitting(true);
    const body =
      replyingToComment != null
        ? `> "${replyingToComment.content.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"\n\n${newComment.trim()}`
        : newComment.trim();
    const result = await addPostComment(
      post.id,
      profile.id,
      body,
      replyingToComment?.id
    );
    setCommentSubmitting(false);
    if (!result) {
      toast.error('Failed to add comment');
      return;
    }
    if ('error' in result) {
      toast.error(result.error || 'Failed to add comment');
      return;
    }
    setComments((prev) => [...prev, result.comment]);
    setNewComment('');
    setReplyingToComment(null);
    setLocalCommentsCount(result.commentsCount);
    onCommentAdded?.(post.id, result.commentsCount);
  }

  const profileLink = isOwnPost ? '/profile' : `/user/${post.author.id}`;
  const profileAriaLabel = isOwnPost ? 'View your profile' : `View ${post.author.name}'s profile`;

  return (
    <article className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3 p-4">
        <Link
          to={profileLink}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          aria-label={profileAriaLabel}
        >
          <img
            src={post.author.photo}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={profileLink}
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
                <DropdownMenuItem onSelect={openEdit}>
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
        <>
          <button
            type="button"
            className="w-full aspect-[16/10] bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#41C28A] focus:ring-inset"
            onClick={() => setPhotoViewerOpen(true)}
            aria-label="View full size photo"
          >
            <img
              src={post.image}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
            />
          </button>
          <PhotoViewer
            src={post.image}
            open={photoViewerOpen}
            onOpenChange={setPhotoViewerOpen}
          />
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-neutral-100">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${liked ? 'text-[#41C28A] hover:text-[#36a876]' : 'text-neutral-600 hover:text-neutral-900'}`}
            onClick={handleLikeToggle}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likesCount}
          </Button>
          {isOwnPost && likesCount > 0 && (
            <button
              type="button"
              className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline"
              onClick={openLikers}
            >
              See who liked
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-600 hover:text-neutral-900 gap-1.5"
          onClick={openComments}
          aria-label={isOwnPost ? 'View comments' : 'Add a comment'}
        >
          <MessageCircle className="w-4 h-4" />
          {commentsCount}
        </Button>
      </div>

      {/* Edit caption dialog (own post only) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit caption</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="edit-caption">Caption</Label>
            <Textarea
              id="edit-caption"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[120px] resize-y"
              disabled={editSaving}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editCaption.trim() || editSaving}>
              {editSaving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Likers dialog (poster only) */}
      <Dialog open={likersOpen} onOpenChange={setLikersOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Who liked this post</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {likersLoading ? (
              <p className="text-sm text-neutral-500 py-4">Loading…</p>
            ) : likers.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4">No likes yet.</p>
            ) : (
              <ul className="space-y-2">
                {likers.map((l) => (
                  <li key={l.user_id} className="flex items-center gap-3">
                    <img
                      src={l.avatar_url ?? ''}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover bg-neutral-200"
                    />
                    <span className="font-medium text-neutral-900">{l.full_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments dialog: list (all on own post, only your comments on others'), add-comment for all */}
      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isOwnPost ? 'Comments' : 'Your comments'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[40vh] overflow-y-auto space-y-3">
            {commentsLoading ? (
              <p className="text-sm text-neutral-500 py-4">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4">
                {isOwnPost ? 'No comments yet.' : 'No comments yet. Add one below.'}
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <img
                    src={c.avatar_url ?? ''}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover bg-neutral-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{c.full_name}</p>
                    {(() => {
                      const { quoted, reply } = parseQuotedComment(c.content);
                      return quoted != null ? (
                        <>
                          <blockquote className="text-sm text-neutral-600 border-l-2 border-neutral-300 pl-3 my-1 italic">
                            {quoted}
                          </blockquote>
                          {reply ? <p className="text-sm text-neutral-700">{reply}</p> : null}
                        </>
                      ) : (
                        <p className="text-sm text-neutral-700">{reply}</p>
                      );
                    })()}
                    <p className="text-xs text-neutral-400 mt-0.5">{formatTimeAgo(c.created_at)}</p>
                    {c.author_id !== profile?.id && (
                      <button
                        type="button"
                        className="text-xs text-neutral-500 hover:text-neutral-700 hover:underline mt-1"
                        onClick={() => setReplyingToComment(c)}
                      >
                        Reply to {c.full_name}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="grid gap-2 pt-2 border-t border-neutral-100">
            {replyingToComment && (
              <p className="text-xs text-neutral-500 flex items-center gap-2">
                Replying to {replyingToComment.full_name}
                <button
                  type="button"
                  className="text-neutral-400 hover:text-neutral-600 underline"
                  onClick={() => setReplyingToComment(null)}
                >
                  Cancel
                </button>
              </p>
            )}
            <Label htmlFor="new-comment">Add a comment</Label>
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment…"
                  className="min-h-[80px] resize-y flex-1"
                  maxLength={120}
                  disabled={commentSubmitting}
                />
                <p className="text-xs text-neutral-400">{newComment.length}/120</p>
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || commentSubmitting}
                className="self-end"
              >
                {commentSubmitting ? 'Sending…' : 'Post'}
              </Button>
            </div>
            {!isOwnPost && (
              <p className="text-xs text-neutral-500 mt-2">
                Only you and {post.author.name} can see your comments on this post.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
