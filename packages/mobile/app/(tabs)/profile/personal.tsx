import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../../lib/ThemeContext';
import { useAuth } from '../../../lib/auth';
import { fetchMyPosts, type Post } from '../../../lib/feed';
import { PhotoViewer } from '../../../components/PhotoViewer';

const MESSENGER_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  signal: 'Signal',
  telegram: 'Telegram',
  viber: 'Viber',
  wechat: 'WeChat',
  line: 'LINE',
  imo: 'IMO',
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
};

function DefaultAvatar({ size = 96 }: { size?: number }) {
  return (
    <View style={[styles.defaultAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name="person-outline" size={size * 0.5} color={themeColors.text.muted} />
    </View>
  );
}

export default function PersonalProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile } = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [photoViewerUri, setPhotoViewerUri] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setPosts([]);
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

  const avatarUrl = profile?.avatar_url?.trim() || null;
  const showAvatar = avatarUrl && !avatarError;

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No profile</Text>
          <Text style={styles.emptySubtitle}>Sign in to see your profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const messengers = Array.isArray(profile.messenger) ? profile.messenger : [];
  const socialNetworks = profile.social_networks && typeof profile.social_networks === 'object'
    ? profile.social_networks
    : {};
  const hasSocialHandles = Object.values(socialNetworks).some(
    (v) => typeof v === 'string' && v.trim().length > 0
  );
  const interests = Array.isArray(profile.interests) ? profile.interests : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/(tabs)/profile')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="settings-outline" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar and name */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {showAvatar ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.avatar, { width: width * 0.36, height: width * 0.36, borderRadius: (width * 0.36) / 2 }]}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <DefaultAvatar size={Math.min(120, width * 0.36)} />
            )}
          </View>
          <Text style={styles.fullName} numberOfLines={2}>
            {profile.full_name || 'No name'}
          </Text>
          {profile.city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={themeColors.text.secondary} />
              <Text style={styles.locationText}>{profile.city}, Nigeria</Text>
            </View>
          ) : null}
        </View>

        {/* Bio */}
        {profile.bio?.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio.trim()}</Text>
          </View>
        ) : null}

        {/* Interests */}
        {interests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.chipsRow}>
              {interests.map((interest) => (
                <View key={interest} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Contact */}
        {(profile.phone?.trim() || messengers.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.card}>
              {profile.phone?.trim() ? (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={20} color={themeColors.text.secondary} />
                  <Text style={styles.contactValue}>{profile.phone.trim()}</Text>
                </View>
              ) : null}
              {messengers.length > 0 ? (
                <View style={styles.messengersRow}>
                  <Ionicons name="chatbubbles-outline" size={20} color={themeColors.text.secondary} />
                  <Text style={styles.messengersLabel}>
                    {messengers.map((m) => MESSENGER_LABELS[m] ?? m).join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Social handles */}
        {hasSocialHandles ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social</Text>
            <View style={styles.card}>
              {(Object.entries(socialNetworks) as [string, string][]).filter(([, v]) => v?.trim()).map(([key, value], index, arr) => (
                <View
                  key={key}
                  style={[styles.socialRow, index === arr.length - 1 && styles.socialRowLast]}
                >
                  <Text style={styles.socialLabel}>{SOCIAL_LABELS[key] ?? key}</Text>
                  <Text style={styles.socialValue} numberOfLines={1}>{value!.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Your posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your posts</Text>
          {postsLoading ? (
            <Text style={styles.postsLoading}>Loading posts…</Text>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Image
                    source={{ uri: post.author.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                    style={styles.postAvatar}
                  />
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor} numberOfLines={1}>{post.author.name}</Text>
                    <Text style={styles.postSubtext} numberOfLines={1}>{post.author.city}</Text>
                  </View>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                {post.image ? (
                  <TouchableOpacity
                    onPress={() => setPhotoViewerUri(post.image!)}
                    activeOpacity={1}
                    accessibilityLabel="View full size photo"
                    accessibilityRole="imagebutton"
                  >
                    <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.postsEmpty}>You haven&apos;t posted yet.</Text>
            </View>
          )}
        </View>

        {/* Edit in Settings */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color={themeColors.primary} />
          <Text style={styles.editBtnText}>Edit in Settings</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      {photoViewerUri ? (
        <PhotoViewer
          uri={photoViewerUri}
          visible={!!photoViewerUri}
          onClose={() => setPhotoViewerUri(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.screen,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: themeColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.default,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
  },
  settingsBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: themeColors.background.muted,
  },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.muted,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.text.primary,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  bio: {
    fontSize: 15,
    color: themeColors.text.primary,
    lineHeight: 22,
    backgroundColor: themeColors.background.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: themeColors.background.card,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  chipText: {
    fontSize: 14,
    color: themeColors.text.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: themeColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    padding: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contactValue: {
    fontSize: 15,
    color: themeColors.text.primary,
    flex: 1,
  },
  messengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messengersLabel: {
    fontSize: 15,
    color: themeColors.text.primary,
    flex: 1,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border.light,
  },
  socialLabel: {
    fontSize: 14,
    color: themeColors.text.muted,
    marginRight: 12,
  },
  socialValue: {
    fontSize: 14,
    color: themeColors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  socialRowLast: {
    borderBottomWidth: 0,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.primary,
    backgroundColor: 'transparent',
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.primary,
  },
  bottomSpacer: { height: 24 },
  postsLoading: {
    fontSize: 14,
    color: themeColors.text.secondary,
    paddingVertical: 12,
    marginLeft: 4,
  },
  postCard: {
    backgroundColor: themeColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.background.muted,
  },
  postMeta: { flex: 1, marginLeft: 12, minWidth: 0 },
  postAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  postSubtext: {
    fontSize: 13,
    color: themeColors.text.secondary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: themeColors.text.primary,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 12,
    backgroundColor: themeColors.background.muted,
  },
  postsEmpty: {
    fontSize: 14,
    color: themeColors.text.secondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
