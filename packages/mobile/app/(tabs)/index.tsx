import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../lib/auth';
import { themeColors } from '../../lib/ThemeContext';
import { getCountryName } from '../../lib/countries';
import { PhotoViewer } from '../../components/PhotoViewer';
import {
  fetchFeedPosts,
  createFeedPost,
  updatePost,
  hidePostByAuthor,
  deletePost,
  togglePostLike,
  getPostLikers,
  getPostComments,
  addPostComment,
  type Post,
} from '../../lib/feed';
import type { PostLikerDto, PostCommentDto } from '@repo/shared';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

function DefaultAvatar({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.defaultAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="person-outline" size={size * 0.5} color={themeColors.text.muted} />
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Parses comment content: if it starts with > "quoted"\n\n, returns { quoted, reply }; else { quoted: null, reply: content }. */
function parseQuotedComment(content: string): { quoted: string | null; reply: string } {
  const match = content.match(/^> "((?:[^"\\]|\\.)*)"\n\n/);
  if (!match) return { quoted: null, reply: content };
  const quoted = match[1].replace(/\\(.)/g, (_, c: string) => c);
  return { quoted, reply: content.slice(match[0].length).trim() };
}

function FeedPostCard({
  post,
  onPostUpdated,
  onPostHidden,
  onDeletePost,
  onPostLiked,
  onCommentAdded,
}: {
  post: Post;
  onPostUpdated?: (post: Post) => void;
  onPostHidden?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onPostLiked?: (postId: string, likesCount: number) => void;
  onCommentAdded?: (postId: string, commentsCount: number) => void;
}) {
  const { profile } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editCaption, setEditCaption] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState<number | null>(null);
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [likersVisible, setLikersVisible] = useState(false);
  const [likers, setLikers] = useState<PostLikerDto[]>([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState<number | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<PostCommentDto | null>(null);
  const authorPhoto = post.author.photo || PLACEHOLDER_AVATAR;
  const isOwnPost = profile?.id === post.author.id;
  const insets = useSafeAreaInsets();
  const likesCount = localLikesCount ?? post.likes;
  const liked = localLiked ?? post.likedByMe ?? false;
  const commentsCount = localCommentsCount ?? post.comments;

  const closeMenu = () => setMenuVisible(false);

  const handleEdit = () => {
    closeMenu();
    setEditCaption(post.content);
    setEditVisible(true);
  };
  const handleSaveEdit = async () => {
    const trimmed = editCaption.trim();
    if (!trimmed) return;
    setEditSaving(true);
    const updated = await updatePost(post.id, trimmed);
    setEditSaving(false);
    if (updated) {
      onPostUpdated?.(updated);
      setEditVisible(false);
      Alert.alert('Updated', 'Post updated');
    } else {
      Alert.alert('Error', 'Failed to update post');
    }
  };
  const handleHide = async () => {
    closeMenu();
    const ok = await hidePostByAuthor(post.id);
    if (ok) {
      onPostHidden?.(post.id);
      Alert.alert('Hidden', 'Post hidden');
    } else {
      Alert.alert('Error', 'Failed to hide post');
    }
  };
  const handlePrivacySettings = () => {
    closeMenu();
    router.push('/(tabs)/profile');
  };
  const handleDelete = async () => {
    closeMenu();
    const ok = await deletePost(post.id);
    if (ok) {
      onDeletePost?.(post.id);
      Alert.alert('Deleted', 'Post deleted');
    } else {
      Alert.alert('Error', 'Failed to delete post');
    }
  };
  const handleReportPost = () => {
    closeMenu();
    Alert.alert('Report submitted', "We'll review this post.");
  };
  const handleBlockUser = () => {
    closeMenu();
    Alert.alert('Blocked', `${post.author.name} has been blocked`);
  };

  const handleLikeToggle = async () => {
    if (!profile) return;
    const result = await togglePostLike(post.id, profile.id);
    if (result) {
      setLocalLikesCount(result.likesCount);
      setLocalLiked(result.liked);
      onPostLiked?.(post.id, result.likesCount);
    } else {
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const openLikers = async () => {
    if (!isOwnPost) return;
    setLikersVisible(true);
    setLikersLoading(true);
    const list = await getPostLikers(post.id);
    setLikers(list);
    setLikersLoading(false);
  };

  const openComments = async () => {
    setCommentsVisible(true);
    setNewComment('');
    setReplyingToComment(null);
    setCommentsLoading(true);
    const list = await getPostComments(post.id);
    setComments(list);
    setCommentsLoading(false);
  };

  const handleAddComment = async () => {
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
      Alert.alert('Error', 'Failed to add comment');
      return;
    }
    if ('error' in result) {
      Alert.alert('Error', result.error || 'Failed to add comment');
      return;
    }
    setComments((prev) => [...prev, result.comment]);
    setNewComment('');
    setReplyingToComment(null);
    setLocalCommentsCount(result.commentsCount);
    onCommentAdded?.(post.id, result.commentsCount);
  };

  const menuOptions = isOwnPost
    ? [
        { key: 'edit', label: 'Edit', icon: 'create-outline' as const, onPress: handleEdit },
        { key: 'hide', label: 'Hide', icon: 'eye-off-outline' as const, onPress: handleHide },
        { key: 'privacy', label: 'Privacy Settings', icon: 'shield-outline' as const, onPress: handlePrivacySettings },
        { key: 'delete', label: 'Delete', icon: 'trash-outline' as const, onPress: handleDelete, destructive: true },
      ]
    : [
        { key: 'report', label: 'Report post', icon: 'flag-outline' as const, onPress: handleReportPost },
        { key: 'block', label: 'Block user', icon: 'person-remove-outline' as const, onPress: handleBlockUser },
      ];

  const goToAuthorProfile = () => {
    if (isOwnPost) {
      router.push('/(tabs)/profile/personal');
    } else {
      router.push(`/user/${post.author.id}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          style={styles.cardAuthorTouch}
          onPress={goToAuthorProfile}
          activeOpacity={0.7}
        >
          <Image source={{ uri: authorPhoto }} style={styles.cardAvatar} />
          <View style={styles.cardMeta}>
            <Text style={styles.cardAuthor} numberOfLines={1}>
              {post.author.name}
            </Text>
            <Text style={styles.cardSubtext} numberOfLines={1}>
              {post.author.occupation} · {post.author.city}
            </Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.cardTime}>{formatTimeAgo(post.createdAt)}</Text>
        <TouchableOpacity
          style={styles.cardMoreBtn}
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="More options"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={themeColors.text.secondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardContent}>{post.content}</Text>
      {post.image ? (
        <>
          <TouchableOpacity
            style={styles.cardImageWrap}
            onPress={() => setPhotoViewerVisible(true)}
            activeOpacity={1}
            accessibilityLabel="View full size photo"
            accessibilityRole="imagebutton"
          >
            <Image source={{ uri: post.image }} style={styles.cardImage} resizeMode="cover" />
          </TouchableOpacity>
          <PhotoViewer
            uri={post.image}
            visible={photoViewerVisible}
            onClose={() => setPhotoViewerVisible(false)}
          />
        </>
      ) : null}
      <View style={styles.cardActions}>
        <View style={styles.cardActionRow}>
          <TouchableOpacity style={styles.cardAction} onPress={handleLikeToggle} activeOpacity={0.7}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#41C28A' : themeColors.text.secondary}
            />
            <Text style={[styles.cardActionText, liked && { color: '#41C28A' }]}>{likesCount}</Text>
          </TouchableOpacity>
          {isOwnPost && likesCount > 0 && (
            <TouchableOpacity onPress={openLikers} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.seeWhoLikedText}>See who liked</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.cardAction} onPress={openComments} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={themeColors.text.secondary} />
          <Text style={styles.cardActionText}>{commentsCount}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
                {menuOptions.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={({ pressed }) => [
                      styles.modalOption,
                      pressed && styles.modalOptionPressed,
                      opt.destructive && styles.modalOptionDestructive,
                    ]}
                    onPress={opt.onPress}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={opt.destructive ? '#dc2626' : themeColors.text.primary}
                    />
                    <Text
                      style={[
                        styles.modalOptionText,
                        opt.destructive && styles.modalOptionTextDestructive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={({ pressed }) => [styles.modalCancel, pressed && styles.modalOptionPressed]}
                  onPress={closeMenu}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit caption modal (own post only) */}
      <Modal visible={editVisible} transparent animationType="fade">
        <Pressable style={styles.editModalOverlay} onPress={() => !editSaving && setEditVisible(false)}>
          <View style={styles.editModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.editModalTitle}>Edit caption</Text>
            <TextInput
              style={styles.editModalInput}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="What's on your mind?"
              placeholderTextColor={themeColors.text.muted}
              multiline
              numberOfLines={4}
              editable={!editSaving}
            />
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editModalBtn, styles.editModalCancelBtn]}
                onPress={() => setEditVisible(false)}
                disabled={editSaving}
              >
                <Text style={styles.editModalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalBtn, styles.editModalSaveBtn]}
                onPress={handleSaveEdit}
                disabled={!editCaption.trim() || editSaving}
              >
                <Text style={styles.editModalSaveBtnText}>{editSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Likers modal (poster only) */}
      <Modal visible={likersVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setLikersVisible(false)}>
          <View style={styles.likersSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.likersSheetTitle}>Who liked this post</Text>
            {likersLoading ? (
              <ActivityIndicator size="small" color={themeColors.text.muted} style={{ marginVertical: 16 }} />
            ) : likers.length === 0 ? (
              <Text style={styles.likersEmpty}>No likes yet.</Text>
            ) : (
              <FlatList
                data={likers}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => (
                  <View style={styles.likerRow}>
                    <Image
                      source={{ uri: item.avatar_url || PLACEHOLDER_AVATAR }}
                      style={styles.likerAvatar}
                    />
                    <Text style={styles.likerName}>{item.full_name}</Text>
                  </View>
                )}
                style={styles.likersList}
              />
            )}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setLikersVisible(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Comments modal: list (all on own post, only your comments on others'), add-comment for all */}
      <Modal visible={commentsVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoid}
          keyboardVerticalOffset={0}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCommentsVisible(false)}>
            <View
              style={[
                styles.commentsSheet,
                { paddingBottom: Math.max(16, insets.bottom) + 8, maxHeight: '85%' },
              ]}
              onStartShouldSetResponder={() => true}
            >
            <View style={styles.modalHandle} />
            <View style={styles.commentsSheetHeader}>
              <Text style={styles.commentsSheetTitle}>{isOwnPost ? 'Comments' : 'Your comments'}</Text>
              <TouchableOpacity
                onPress={() => setCommentsVisible(false)}
                hitSlop={12}
                style={styles.commentsSheetCloseBtn}
              >
                <Ionicons name="close" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>
            {commentsLoading ? (
              <View style={styles.commentsEmptyState}>
                <ActivityIndicator size="small" color={themeColors.text.muted} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.commentsEmptyState}>
                <Text style={styles.likersEmpty}>
                  {isOwnPost ? 'No comments yet.' : 'No comments yet. Add one below.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Image
                      source={{ uri: item.avatar_url || PLACEHOLDER_AVATAR }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentBody}>
                      <Text style={styles.commentNameTime} numberOfLines={1}>
                        {item.full_name} · {formatTimeAgo(item.created_at)}
                      </Text>
                      {(() => {
                        const { quoted, reply } = parseQuotedComment(item.content);
                        return quoted != null ? (
                          <>
                            <View style={styles.commentBlockquote}>
                              <Text style={styles.commentBlockquoteText}>{quoted}</Text>
                            </View>
                            {reply ? <Text style={styles.commentContent}>{reply}</Text> : null}
                          </>
                        ) : (
                          <Text style={styles.commentContent}>{reply}</Text>
                        );
                      })()}
                      {item.author_id !== profile?.id && (
                        <TouchableOpacity
                          onPress={() => setReplyingToComment(item)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginTop: 4 }}
                        >
                          <Text style={styles.replyToText}>Reply to {item.full_name}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                style={styles.commentsList}
              />
            )}
            {replyingToComment && (
              <View style={styles.replyingToRow}>
                <Text style={styles.replyingToText}>Replying to {replyingToComment.full_name}</Text>
                <TouchableOpacity onPress={() => setReplyingToComment(null)} hitSlop={8}>
                  <Text style={styles.replyCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.commentInputRow}>
              <View style={styles.commentInputWrap}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Write a comment…"
                  placeholderTextColor={themeColors.text.muted}
                  multiline
                  maxLength={120}
                  editable={!commentSubmitting}
                />
                <Text style={styles.commentCharCount}>{newComment.length}/120</Text>
              </View>
              <TouchableOpacity
                style={[styles.commentPostBtn, (!newComment.trim() || commentSubmitting) && styles.commentPostBtnDisabled]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || commentSubmitting}
              >
                <Text style={styles.commentPostBtnText}>{commentSubmitting ? 'Sending…' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
            {!isOwnPost && (
              <Text style={styles.commentVisibilityNote}>
                Only you and {post.author.name} can see your comments on this post.
              </Text>
            )}
          </View>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [composeImageUri, setComposeImageUri] = useState<string | null>(null);
  const [composeImageBase64, setComposeImageBase64] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const loadFeed = useCallback(async () => {
    const list = await fetchFeedPosts(profile?.id ?? null);
    setPosts(list);
  }, [profile?.id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFeedPosts(profile?.id ?? null).then((list) => {
      if (!cancelled) {
        setPosts(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const profileAvatarUrl = (profile?.avatar_url?.trim()) || null;
  const currentPhoto = profileAvatarUrl || PLACEHOLDER_AVATAR;
  const currentName = profile?.full_name ?? 'You';
  const [avatarError, setAvatarError] = useState(false);
  useEffect(() => {
    setAvatarError(false);
  }, [profileAvatarUrl]);

  const pickComposeImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to attach an image to your post.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3] as [number, number],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setComposeImageUri(asset.uri);
        setComposeImageBase64(asset.base64 ?? null);
      }
    } catch (err) {
      console.warn('Feed image picker error', err);
      Alert.alert('Error', 'Could not open the photo library. Please try again.');
    }
  };

  const clearComposeImage = () => {
    setComposeImageUri(null);
    setComposeImageBase64(null);
  };

  const handlePost = async () => {
    const text = composeText.trim();
    if (!text || posting) return;
    setPosting(true);
    const imageUriToSend = composeImageUri;
    const imageBase64ToSend = composeImageBase64;
    setComposeText('');
    clearComposeImage();

    if (profile) {
      const created = await createFeedPost(text, profile, imageUriToSend, imageBase64ToSend);
      if (created) {
        setPosts((prev) => [created, ...prev]);
      } else {
        // Supabase not configured or error: add optimistic local post
        const fallbackPost: Post = {
          id: `local-${Date.now()}`,
          authorId: profile.id,
          author: {
            id: profile.id,
            name: currentName,
            photo: currentPhoto,
            occupation: 'Member',
            city: profile.city ?? 'Lagos',
          },
          content: text,
          location: '',
          city: profile.city ?? 'Lagos',
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: 0,
        };
        setPosts((prev) => [fallbackPost, ...prev]);
      }
    } else {
      const newPost: Post = {
        id: `local-${Date.now()}`,
        authorId: 'me',
        author: {
          id: 'me',
          name: currentName,
          photo: currentPhoto,
          occupation: 'Member',
          city: 'Lagos',
        },
        content: text,
        location: '',
        city: 'Lagos',
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
      };
      setPosts((prev) => [newPost, ...prev]);
    }

    setPosting(false);
  };

  const canPost = (composeText.trim().length > 0 || composeImageUri != null) && !posting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../../public/Linkkop.png')} style={styles.headerLogo} resizeMode="contain" />
            <View style={styles.headerLocation}>
              <Ionicons name="location-outline" size={18} color={themeColors.text.secondary} />
              <Text style={styles.headerSubtitle}>{[profile?.city, getCountryName(profile?.country)].filter(Boolean).join(', ')}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile/personal')}
            activeOpacity={0.8}
            style={styles.headerAvatarTouch}
          >
            {profileAvatarUrl && !avatarError ? (
              <Image
                source={{ uri: currentPhoto }}
                style={styles.headerAvatar}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <DefaultAvatar size={40} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={styles.loadingText}>Loading feed…</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FeedPostCard
                post={item}
                onPostUpdated={(updated) =>
                  setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
                onPostHidden={(postId) =>
                  setPosts((prev) => prev.filter((p) => p.id !== postId))
                }
                onDeletePost={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                onPostLiked={(postId, likesCount) =>
                  setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: likesCount } : p)))
                }
                onCommentAdded={(postId, commentsCount) =>
                  setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: commentsCount } : p)))
                }
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={themeColors.primary}
              />
            }
            ListHeaderComponent={
              <View style={styles.compose}>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile/personal')}
                  activeOpacity={0.8}
                  style={styles.composeAvatarTouch}
                >
                  {profileAvatarUrl && !avatarError ? (
                    <Image
                      source={{ uri: currentPhoto }}
                      style={styles.composeAvatar}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <DefaultAvatar size={44} />
                  )}
                </TouchableOpacity>
                <View style={styles.composeRight}>
                  <TextInput
                    style={styles.composeInput}
                    placeholder="What's on your mind?"
                    placeholderTextColor={themeColors.text.muted}
                    value={composeText}
                    onChangeText={setComposeText}
                    multiline
                    maxLength={500}
                    editable={!posting}
                  />
                  {composeImageUri ? (
                    <View style={styles.composeImageWrap}>
                      <Image source={{ uri: composeImageUri }} style={styles.composeImagePreview} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.composeImageRemove}
                        onPress={clearComposeImage}
                        hitSlop={8}
                        accessibilityLabel="Remove photo"
                      >
                        <Ionicons name="close-circle" size={24} color={themeColors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <View style={styles.composeRow}>
                    <TouchableOpacity
                      style={styles.composePhotoBtn}
                      onPress={pickComposeImage}
                      activeOpacity={0.7}
                      disabled={posting}
                    >
                      <Ionicons name="image-outline" size={22} color={themeColors.text.secondary} />
                      <Text style={styles.composePhotoLabel}>Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.composePostBtn, !canPost && styles.composePostBtnDisabled]}
                      onPress={handlePost}
                      disabled={!canPost}
                      activeOpacity={0.8}
                    >
                      {posting ? (
                        <ActivityIndicator size="small" color={themeColors.text.inverse} />
                      ) : (
                        <Text style={styles.composePostLabel}>Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="newspaper-outline" size={48} color={themeColors.border.default} />
                <Text style={styles.emptyTitle}>No posts yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to share something.</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.screen,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: themeColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.default,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerLogo: {
    height: 28,
    width: 90,
  },
  headerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: themeColors.text.secondary,
  },
  headerAvatarTouch: { marginLeft: 12 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: { marginLeft: 12 },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.muted,
  },
  compose: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: themeColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.default,
    borderRadius: 16,
    gap: 12,
  },
  composeAvatarTouch: {},
  composeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  composeRight: {
    flex: 1,
    minWidth: 0,
  },
  composeInput: {
    backgroundColor: themeColors.background.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: themeColors.text.primary,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  composeImageWrap: {
    marginTop: 10,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  composeImagePreview: {
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: themeColors.background.muted,
  },
  composeImageRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: themeColors.background.card,
    borderRadius: 12,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  composePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  composePhotoLabel: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  composePostBtn: {
    backgroundColor: themeColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  composePostBtnDisabled: {
    backgroundColor: themeColors.text.muted,
    opacity: 0.8,
  },
  composePostLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.inverse,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: themeColors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: themeColors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  cardAuthorTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.background.muted,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  cardSubtext: {
    fontSize: 12,
    color: themeColors.text.secondary,
    marginTop: 1,
  },
  cardTime: {
    fontSize: 12,
    color: themeColors.text.muted,
  },
  cardMoreBtn: {
    padding: 8,
    margin: -8,
  },
  cardContent: {
    fontSize: 15,
    lineHeight: 22,
    color: themeColors.text.secondary,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: themeColors.background.screen,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: themeColors.border.light,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionText: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  seeWhoLikedText: {
    fontSize: 12,
    color: themeColors.text.muted,
  },
  modalKeyboardAvoid: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: themeColors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.border.default,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.light,
  },
  modalOptionPressed: {
    opacity: 0.7,
  },
  modalOptionDestructive: {},
  modalOptionText: {
    fontSize: 17,
    color: themeColors.text.primary,
  },
  modalOptionTextDestructive: {
    color: '#dc2626',
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: themeColors.background.muted,
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  likersSheet: {
    backgroundColor: themeColors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 16,
    maxHeight: '70%',
  },
  likersSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 12,
  },
  likersEmpty: {
    fontSize: 14,
    color: themeColors.text.muted,
    marginVertical: 16,
  },
  likersList: {
    maxHeight: 280,
    marginBottom: 8,
  },
  likerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.light,
  },
  likerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.background.muted,
  },
  likerName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  commentsSheet: {
    backgroundColor: themeColors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  commentsSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentsSheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
  },
  commentsSheetCloseBtn: {
    padding: 4,
  },
  commentsEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  commentsList: {
    maxHeight: 280,
    marginBottom: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border.light,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: themeColors.background.muted,
    overflow: 'hidden',
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
  },
  commentNameTime: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 21,
    color: themeColors.text.primary,
  },
  commentBlockquote: {
    borderLeftWidth: 2,
    borderLeftColor: themeColors.border.default ?? '#d4d4d4',
    paddingLeft: 12,
    marginVertical: 4,
  },
  commentBlockquoteText: {
    fontSize: 14,
    lineHeight: 21,
    color: themeColors.text.muted,
    fontStyle: 'italic',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  commentInputWrap: {
    flex: 1,
  },
  commentInput: {
    width: '100%',
    backgroundColor: themeColors.background.input,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: themeColors.text.primary,
    minHeight: 72,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    textAlignVertical: 'top',
  },
  commentCharCount: {
    fontSize: 11,
    color: themeColors.text.muted,
    marginTop: 4,
  },
  commentPostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: themeColors.primary,
  },
  commentPostBtnDisabled: {
    opacity: 0.5,
  },
  commentPostBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.inverse ?? '#fff',
  },
  commentVisibilityNote: {
    fontSize: 12,
    color: themeColors.text.muted,
    marginTop: 8,
    marginBottom: 4,
  },
  replyToText: {
    fontSize: 12,
    color: themeColors.text.muted,
  },
  replyingToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  replyingToText: {
    fontSize: 12,
    color: themeColors.text.muted,
  },
  replyCancelText: {
    fontSize: 12,
    color: themeColors.text.secondary,
    textDecorationLine: 'underline',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  editModalContent: {
    backgroundColor: themeColors.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 12,
  },
  editModalInput: {
    backgroundColor: themeColors.background.input,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: themeColors.text.primary,
    minHeight: 100,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    textAlignVertical: 'top',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  editModalCancelBtn: {
    backgroundColor: themeColors.background.muted,
  },
  editModalCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  editModalSaveBtn: {
    backgroundColor: themeColors.primary,
  },
  editModalSaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.inverse,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: themeColors.text.secondary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: themeColors.text.muted,
    marginTop: 4,
  },
});
