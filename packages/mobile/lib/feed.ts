import { supabase } from './supabase';
import type { PostRow, ProfileRow, PostLikerDto, PostCommentDto } from '@repo/shared';

export interface PostAuthor {
  id: string;
  name: string;
  photo: string;
  occupation: string;
  city: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: PostAuthor;
  content: string;
  image?: string;
  location: string;
  city: string;
  createdAt: string;
  likes: number;
  comments: number;
  /** True if the current user has liked this post (set when feed is fetched with current user). */
  likedByMe?: boolean;
}

type PostWithAuthor = PostRow & {
  profiles: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url' | 'city'> | null;
};

function mapRowToPost(
  row: PostRow,
  author: { id: string; full_name: string; avatar_url: string | null; city: string | null },
  likedByMe?: boolean
): Post {
  const post: Post = {
    id: row.id,
    authorId: row.author_id,
    author: {
      id: author.id,
      name: author.full_name,
      photo: author.avatar_url ?? '',
      occupation: 'Member',
      city: author.city ?? '',
    },
    content: row.content,
    image: row.image_url ?? undefined,
    location: row.location ?? '',
    city: row.city ?? '',
    createdAt: row.created_at,
    likes: row.likes_count,
    comments: row.comments_count,
  };
  if (likedByMe !== undefined) post.likedByMe = likedByMe;
  return post;
}

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: '1',
    author: {
      id: '1',
      name: 'Amina Okonkwo',
      photo: 'https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=400&h=400&fit=crop',
      occupation: 'Marketing Manager',
      city: 'Lagos',
    },
    content:
      "Just wrapped an amazing networking event in Victoria Island. So many great connections made. If you're in Lagos and into tech & business, let's connect!",
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=500&fit=crop',
    location: 'Victoria Island, Lagos',
    city: 'Lagos',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 24,
    comments: 5,
  },
  {
    id: 'p2',
    authorId: '2',
    author: {
      id: '2',
      name: 'Chukwudi Eze',
      photo: 'https://images.unsplash.com/photo-1619452220963-4da4e145aba9?w=400&h=400&fit=crop',
      occupation: 'Software Engineer',
      city: 'Lagos',
    },
    content:
      'Coffee and code at a new spot in Lekki. The vibe here is perfect for getting work done. Who else works remotely from Lagos?',
    location: 'Lekki Phase 1, Lagos',
    city: 'Lagos',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likes: 18,
    comments: 3,
  },
  {
    id: 'p3',
    authorId: '3',
    author: {
      id: '3',
      name: 'Funmi Adeyemi',
      photo: 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?w=400&h=400&fit=crop',
      occupation: 'Fashion Designer',
      city: 'Lagos',
    },
    content:
      'New collection drop happening this weekend at the pop-up in Ikeja. Would love to see some familiar faces!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    location: 'Ikeja, Lagos',
    city: 'Lagos',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 42,
    comments: 12,
  },
];

const FEED_SELECT = `
  id,
  author_id,
  content,
  image_url,
  location,
  city,
  likes_count,
  comments_count,
  created_at,
  profiles (
    id,
    full_name,
    avatar_url,
    city
  )
`;

/** Fetch set of post_ids the current user has liked (for initial liked state). */
async function fetchLikedPostIds(currentUserId: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', currentUserId);
  return new Set((data ?? []).map((r: { post_id: string }) => r.post_id));
}

export async function fetchFeedPosts(currentUserId?: string | null): Promise<Post[]> {
  if (!supabase) {
    return [...MOCK_POSTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  const likedPostIds =
    currentUserId ? await fetchLikedPostIds(currentUserId) : new Set<string>();

  const { data, error } = await supabase
    .from('posts')
    .select(FEED_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback: fetch posts without join, then fetch profiles for authors
    const fallback = await supabase
      .from('posts')
      .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
      .order('created_at', { ascending: false });
    if (fallback.error) return [];
    const rows = (fallback.data ?? []) as PostRow[];
    const authorIds = [...new Set(rows.map((r) => r.author_id))];
    const profileMap = new Map<string, { id: string; full_name: string; avatar_url: string | null; city: string | null }>();
    if (authorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city')
        .in('id', authorIds);
      (profilesData ?? []).forEach((p) => {
        const row = p as { id: string; full_name: string; avatar_url: string | null; city: string | null };
        profileMap.set(row.id, row);
      });
    }
    const placeholder = { id: '', full_name: 'Unknown', avatar_url: null as string | null, city: null as string | null };
    return rows.map((row) => {
      const author = profileMap.get(row.author_id) ?? { ...placeholder, id: row.author_id };
      return mapRowToPost(row, author, likedPostIds.has(row.id));
    });
  }

  const rows = (data ?? []) as PostWithAuthor[];
  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const profileMap = new Map<string, { id: string; full_name: string; avatar_url: string | null; city: string | null }>();
  rows.forEach((row) => {
    if (row.profiles) {
      const p = row.profiles;
      profileMap.set(row.author_id, {
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        city: p.city,
      });
    }
  });
  // If any author missing from join, fetch those profiles
  const missingIds = authorIds.filter((id) => !profileMap.has(id));
  if (missingIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city')
      .in('id', missingIds);
    (profilesData ?? []).forEach((p) => {
      const row = p as { id: string; full_name: string; avatar_url: string | null; city: string | null };
      profileMap.set(row.id, row);
    });
  }
  const placeholder = { id: '', full_name: 'Unknown', avatar_url: null as string | null, city: null as string | null };
  return rows.map((row) => {
    const author = profileMap.get(row.author_id) ?? { ...placeholder, id: row.author_id };
    return mapRowToPost(row, author, likedPostIds.has(row.id));
  });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = typeof atob !== 'undefined' ? atob(base64) : (() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let binary = '';
    base64 = base64.replace(/=+$/, '');
    for (let i = 0; i < base64.length; i += 4) {
      const a = chars.indexOf(base64[i]);
      const b = chars.indexOf(base64[i + 1]);
      const c = chars.indexOf(base64[i + 2]);
      const d = chars.indexOf(base64[i + 3]);
      binary += String.fromCharCode((a << 2) | (b >> 4));
      if (c !== -1) binary += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d !== -1) binary += String.fromCharCode(((c & 3) << 6) | d);
    }
    return binary;
  })();
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function createFeedPost(
  content: string,
  profile: ProfileRow,
  imageUri?: string | null,
  imageBase64?: string | null
): Promise<Post | null> {
  if (!supabase) return null;

  let imageUrl: string | null = null;
  const path = `${profile.id}/${Date.now()}.jpg`;
  const contentType = 'image/jpeg';

  if (imageBase64) {
    try {
      const bytes = base64ToUint8Array(imageBase64);
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, bytes, { upsert: false, contentType });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
        imageUrl = urlData?.publicUrl ?? null;
      }
    } catch (_) {
      // fallback to URI if base64 fails
    }
  }

  if (!imageUrl && imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, blob, { upsert: false, contentType: blob.type || contentType });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
        imageUrl = urlData?.publicUrl ?? null;
      }
    } catch (_) {
      // upload failed (e.g. file:// on Android)
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: profile.id,
      content: content.trim(),
      image_url: imageUrl,
      city: profile.city ?? null,
    })
    .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
    .single();

  if (error || !data) return null;
  return mapRowToPost(data as PostRow, {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    city: profile.city,
  });
}

export async function fetchMyPosts(profile: ProfileRow): Promise<Post[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  const author = {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    city: profile.city,
  };
  return (data as PostRow[]).map((row) => mapRowToPost(row, author));
}

/** Fetches posts by a given author (for user profile pages). */
export async function fetchPostsByAuthorId(
  authorId: string,
  author: { id: string; full_name: string; avatar_url: string | null; city: string | null }
): Promise<Post[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as PostRow[]).map((row) => mapRowToPost(row, author));
}

/** Updates post caption (content). Caller must be the author (RLS). */
export async function updatePost(postId: string, content: string): Promise<Post | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('posts')
    .update({ content: content.trim() })
    .eq('id', postId)
    .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
    .single();
  if (error || !data) return null;
  const row = data as PostRow;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, city')
    .eq('id', row.author_id)
    .single();
  const p = profile as Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url' | 'city'> | null;
  const author = p
    ? { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, city: p.city }
    : { id: row.author_id, full_name: 'Unknown', avatar_url: null, city: null };
  return mapRowToPost(row, author);
}

/** Hides the post from feed (local only). Column hidden_by_author was rolled back; this no-op keeps UI from breaking. */
export async function hidePostByAuthor(postId: string): Promise<boolean> {
  void postId;
  return true;
}

/** Deletes a post from the database. Caller must be the author (RLS). */
export async function deletePost(postId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  return !error;
}

/** Toggle like on a post. Returns new likes_count and whether the user now liked. */
export async function togglePostLike(
  postId: string,
  currentUserId: string
): Promise<{ likesCount: number; liked: boolean } | null> {
  if (!supabase) return null;
  // RLS: "Users can read own like rows" lets us see our row; then delete or insert.
  const { data: existing } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', currentUserId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    if (error) return null;
    const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
    return { likesCount: Math.max(0, post?.likes_count ?? 0), liked: false };
  }
  const { error: insertErr } = await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId });
  if (insertErr) return null;
  const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
  return { likesCount: post?.likes_count ?? 0, liked: true };
}

/** Get list of users who liked a post. RLS: only post author can read. */
export async function getPostLikers(postId: string): Promise<PostLikerDto[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('post_likes')
    .select('user_id, created_at, profiles(full_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []).map((row: { user_id: string; created_at: string; profiles: { full_name: string; avatar_url: string | null } | null }) => ({
    user_id: row.user_id,
    full_name: row.profiles?.full_name ?? 'Unknown',
    avatar_url: row.profiles?.avatar_url ?? null,
    created_at: row.created_at,
  }));
}

/** Add a comment (or reply when parentId is set). Returns new comment and count, or { error } if insert failed. */
export async function addPostComment(
  postId: string,
  currentUserId: string,
  content: string,
  parentId?: string
): Promise<{ comment: PostCommentDto; commentsCount: number } | { error: string } | null> {
  if (!supabase) return null;
  const trimmed = content.trim();
  const payload: { post_id: string; author_id: string; content: string; parent_id?: string } = {
    post_id: postId,
    author_id: currentUserId,
    content: trimmed,
  };
  if (parentId) payload.parent_id = parentId;
  const { error: insertErr } = await supabase.from('post_comments').insert(payload);

  if (insertErr) return { error: insertErr.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', currentUserId)
    .single();
  const { data: post } = await supabase.from('posts').select('comments_count').eq('id', postId).single();
  const commentsCount = post?.comments_count ?? 0;
  const p = profile as { full_name: string; avatar_url: string | null } | null;
  const comment: PostCommentDto = {
    id: `temp-${Date.now()}`,
    author_id: currentUserId,
    full_name: p?.full_name ?? 'Unknown',
    avatar_url: p?.avatar_url ?? null,
    content: trimmed,
    created_at: new Date().toISOString(),
  };
  return { comment, commentsCount };
}

/** Get comments visible to the current user for a post (post author: all; others: own comments + replies to them). Uses RPC so your comments on others' posts persist after refresh. */
export async function getPostComments(postId: string): Promise<PostCommentDto[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_personal_comments_for_post', {
    p_post_id: postId,
  });
  if (!error && Array.isArray(data)) {
    return data.map(
      (row: { id: string; author_id: string; content: string; created_at: string; full_name: string; avatar_url: string | null }) => ({
        id: row.id,
        author_id: row.author_id,
        full_name: row.full_name ?? 'Unknown',
        avatar_url: row.avatar_url ?? null,
        content: row.content,
        created_at: row.created_at,
      })
    );
  }
  // Fallback if RPC not available (migration not run)
  const { data: tableData, error: tableError } = await supabase
    .from('post_comments')
    .select('id, author_id, content, created_at, profiles(full_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (tableError) return [];
  return (tableData ?? []).map(
    (row: {
      id: string;
      author_id: string;
      content: string;
      created_at: string;
      profiles: { full_name: string; avatar_url: string | null } | null;
    }) => ({
      id: row.id,
      author_id: row.author_id,
      full_name: row.profiles?.full_name ?? 'Unknown',
      avatar_url: row.profiles?.avatar_url ?? null,
      content: row.content,
      created_at: row.created_at,
    })
  );
}
