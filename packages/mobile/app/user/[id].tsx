import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../lib/ThemeContext';
import { getCountryName } from '../../lib/countries';
import { fetchUserProfile, type UserProfileDisplay } from '../../lib/userProfile';
import { maskPhoneNumber } from '../../lib/utils';
import { fetchPostsByAuthorId, type Post } from '../../lib/feed';

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

export default function UserProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfileDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setPostsLoading(false);
      return;
    }
    let cancelled = false;
    fetchUserProfile(id).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
        if (p) {
          setPostsLoading(true);
          fetchPostsByAuthorId(p.id, {
            id: p.id,
            full_name: p.fullName,
            avatar_url: p.avatarUrl,
            city: p.city,
          }).then((list) => {
            if (!cancelled) {
              setPosts(list);
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

  const showAvatar = profile?.avatarUrl && !avatarError;
  const hasSocialHandles =
    profile?.socialNetworks &&
    Object.values(profile.socialNetworks).some((v) => typeof v === 'string' && v.trim().length > 0);

  const handleRequestContact = () => {
    Alert.alert(
      'Connection request sent',
      `You requested to connect with ${profile?.fullName ?? 'this person'}.`
    );
  };

  if (loading) {
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
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
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color={themeColors.text.muted} />
          <Text style={styles.emptyTitle}>Profile not found</Text>
          <Text style={styles.emptySubtitle}>This user may have been removed or the link is invalid.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile.fullName || 'Profile'}
        </Text>
        <View style={styles.backBtn} />
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
                source={{ uri: profile.avatarUrl! }}
                style={[
                  styles.avatar,
                  {
                    width: width * 0.36,
                    height: width * 0.36,
                    borderRadius: (width * 0.36) / 2,
                  },
                ]}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <DefaultAvatar size={Math.min(120, width * 0.36)} />
            )}
          </View>
          <Text style={styles.fullName} numberOfLines={2}>
            {profile.fullName || 'No name'}
          </Text>
          {(profile.city || profile.country) ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={themeColors.text.secondary} />
              <Text style={styles.locationText}>
                {[profile.city, getCountryName(profile.country)].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}
        </View>
         {/* Request Contact */}
         <TouchableOpacity
          style={styles.requestContactBtn}
          onPress={handleRequestContact}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={20} color={themeColors.text.inverse} />
          <Text style={styles.requestContactBtnText}>Request Contact</Text>
        </TouchableOpacity>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Interests */}
        {profile.interests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.chipsRow}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.chip}>
                  <Text style={styles.chipText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Contact */}
        {(profile.phone || profile.messenger.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.card}>
              {profile.phone ? (
                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={20} color={themeColors.text.secondary} />
                  <Text style={styles.contactValue}>{maskPhoneNumber(profile.phone)}</Text>
                </View>
              ) : null}
              {profile.messenger.length > 0 ? (
                <View style={styles.messengersRow}>
                  <Ionicons name="chatbubbles-outline" size={20} color={themeColors.text.secondary} />
                  <Text style={styles.messengersLabel}>
                    {profile.messenger.map((m) => MESSENGER_LABELS[m] ?? m).join(', ')}
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
              {Object.entries(profile.socialNetworks)
                .filter(([, v]) => v?.trim())
                .map(([key, value], index, arr) => (
                  <View
                    key={key}
                    style={[styles.socialRow, index === arr.length - 1 && styles.socialRowLast]}
                  >
                    <Text style={styles.socialLabel}>{SOCIAL_LABELS[key] ?? key}</Text>
                    <Text style={styles.socialValue} numberOfLines={1}>
                      {value!.trim()}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        ) : null}

        {/* Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
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
                  <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.card}>
              <Text style={styles.postsEmpty}>No posts yet.</Text>
            </View>
          )}
        </View>

       

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  loadingText: {
    fontSize: 15,
    color: themeColors.text.secondary,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
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
  backBtn: { padding: 4, minWidth: 32 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: { marginBottom: 16 },
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
  section: { marginBottom: 24 },
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
  socialRowLast: { borderBottomWidth: 0 },
  requestContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 24,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: themeColors.primary,
  },
  requestContactBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.inverse,
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
