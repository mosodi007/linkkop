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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { themeColors } from '../../lib/ThemeContext';
import { fetchFeedPosts, createFeedPost, type Post } from '../../lib/feed';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

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

function FeedPostCard({ post }: { post: Post }) {
  const authorPhoto = post.author.photo || PLACEHOLDER_AVATAR;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: authorPhoto }} style={styles.cardAvatar} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor} numberOfLines={1}>
            {post.author.name}
          </Text>
          <Text style={styles.cardSubtext} numberOfLines={1}>
            {post.author.occupation} · {post.author.city}
          </Text>
        </View>
        <Text style={styles.cardTime}>{formatTimeAgo(post.createdAt)}</Text>
      </View>
      <Text style={styles.cardContent}>{post.content}</Text>
      {post.image ? (
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: post.image }} style={styles.cardImage} resizeMode="cover" />
        </View>
      ) : null}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardAction} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={20} color={themeColors.text.secondary} />
          <Text style={styles.cardActionText}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cardAction} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={themeColors.text.secondary} />
          <Text style={styles.cardActionText}>{post.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [posting, setPosting] = useState(false);

  const loadFeed = useCallback(async () => {
    const list = await fetchFeedPosts();
    setPosts(list);
  }, []);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const currentPhoto = profile?.avatar_url || PLACEHOLDER_AVATAR;
  const currentName = profile?.full_name ?? 'You';

  const handlePost = async () => {
    const text = composeText.trim();
    if (!text || posting) return;
    setPosting(true);
    setComposeText('');

    if (profile) {
      const created = await createFeedPost(text, profile);
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

  const canPost = composeText.trim().length > 0 && !posting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Linkkop</Text>
          <Text style={styles.headerSubtitle}>Feed</Text>
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
            renderItem={({ item }) => <FeedPostCard post={item} />}
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
                <Image source={{ uri: currentPhoto }} style={styles.composeAvatar} />
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
                  <View style={styles.composeRow}>
                    <TouchableOpacity style={styles.composePhotoBtn} activeOpacity={0.7}>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: themeColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.default,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.text.primary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: themeColors.text.secondary,
    marginTop: 2,
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
  composeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.background.muted,
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
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionText: {
    fontSize: 14,
    color: themeColors.text.secondary,
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
