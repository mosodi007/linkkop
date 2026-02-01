import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../lib/ThemeContext';
import { useDiscoverProfiles, type DiscoverUser } from '../../lib/discover';
import { maskPhoneNumber } from '../../lib/utils';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

const MESSENGER_ICONS: Record<string, number> = {
  whatsapp: require('../../public/WhatsApp.png'),
  signal: require('../../public/Signal.png'),
  telegram: require('../../public/Telegram.png'),
  viber: require('../../public/Viber.png'),
  wechat: require('../../public/WeChat.png'),
  line: require('../../public/LINE.png'),
  imo: require('../../public/IMO.png'),
};

function getMessengerIcon(messenger: string): number | undefined {
  return MESSENGER_ICONS[messenger.toLowerCase()];
}

const SOCIAL_KEYS_ORDER = ['instagram', 'facebook', 'twitter', 'linkedin'] as const;
const SOCIAL_ICON_NAMES: Record<string, 'logo-instagram' | 'logo-facebook' | 'logo-twitter' | 'logo-linkedin'> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  twitter: 'logo-twitter',
  linkedin: 'logo-linkedin',
};

type CategoryKey = 'all' | 'nearby' | 'interest' | 'profession' | 'new';

const CATEGORIES: { key: CategoryKey; label: string; description: string }[] = [
  { key: 'all', label: 'Everyone', description: 'All people nearby' },
  { key: 'nearby', label: 'Less than 10 km', description: 'People close to you' },
  { key: 'interest', label: 'By interest', description: 'Shared interests' },
  { key: 'profession', label: 'By profession', description: 'Similar work fields' },
  { key: 'new', label: 'Recently joined', description: 'New to the network' },
];

const YOUR_INTERESTS = ['Tech', 'Networking', 'Business'];

function getUsersByCategory(users: DiscoverUser[], category: CategoryKey): DiscoverUser[] {
  switch (category) {
    case 'nearby':
      return users.filter((u) => u.distance < 10).sort((a, b) => a.distance - b.distance);
    case 'interest':
      return users.filter((u) =>
        u.interests.some((i) => YOUR_INTERESTS.some((y) => y.toLowerCase() === i.toLowerCase()))
      );
    case 'profession':
      return [...users].sort((a, b) => (a.occupation || '').localeCompare(b.occupation || ''));
    case 'new':
      return [...users].slice().reverse();
    default:
      return users;
  }
}

function DiscoverUserCard({
  user,
  onConnect,
  onViewProfile,
}: {
  user: DiscoverUser;
  onConnect: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}) {
  const photo = user.photo || PLACEHOLDER_AVATAR;
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardImageContainer}
        onPress={() => onViewProfile(user.id)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: photo }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardOverlay}>
          <View style={styles.cardOverlayText}>
            <Text style={styles.cardName} numberOfLines={1}>
              {user.name}, {user.age}
            </Text>
            <Text style={styles.cardOccupation} numberOfLines={1}>
              {user.occupation || 'Member'}
            </Text>
            <Text style={styles.cardLocation} numberOfLines={1}>
              {user.distance} km away · {user.city || 'Lagos'}
            </Text>
          </View>
          {user.socialNetworks && Object.keys(user.socialNetworks).length > 0 ? (
            <View style={styles.cardOverlayIcons}>
              {SOCIAL_KEYS_ORDER.filter((key) => user.socialNetworks[key]?.trim()).map((key) => {
                const iconName = SOCIAL_ICON_NAMES[key];
                if (!iconName) return null;
                return (
                  <View key={key} style={styles.cardPhotoSocialIconWrap}>
                    <Ionicons name={iconName} size={18} color="#fff" />
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => onViewProfile(user.id)}
        activeOpacity={1}
      >
        {user.bio ? (
          <>
            <Text style={styles.cardBio} numberOfLines={3}>
              {user.bio}
            </Text>
          </>
        ) : null}
        
        {(user.phone || (user.messenger && user.messenger.length > 0)) ? (
          <View style={styles.cardContactRow}>
            <Text style={styles.cardSectionLabel}>Contact Number</Text>
            <View style={styles.cardPhoneRow}>
              {user.messenger && user.messenger.length > 0 ? (
                <View style={styles.cardMessengerIcons}>
                  {user.messenger.map((m) => {
                    const iconSrc = getMessengerIcon(m);
                    if (!iconSrc) return null;
                    return (
                      <Image key={m} source={iconSrc} style={styles.messengerIcon} />
                    );
                  })}
                </View>
              ) : null}
              {user.phone ? (
                <Text style={styles.cardPhone}>{maskPhoneNumber(user.phone)}</Text>
              ) : null}
            </View>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={() => onConnect(user.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color={themeColors.text.inverse} />
          <Text style={styles.connectBtnText}>Request Contact</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { users, loading, refresh } = useDiscoverProfiles();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const byCategory = useMemo(
    () => getUsersByCategory(users, activeCategory),
    [users, activeCategory]
  );
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return byCategory;
    const q = searchQuery.toLowerCase();
    return byCategory.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        (user.occupation || '').toLowerCase().includes(q) ||
        user.interests.some((i) => i.toLowerCase().includes(q))
    );
  }, [byCategory, searchQuery]);

  const handleConnect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    Alert.alert(
      'Connection request sent',
      `You requested to connect with ${user?.name ?? 'this person'}.`
    );
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const categoryDesc = CATEGORIES.find((c) => c.key === activeCategory)?.description ?? '';

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={20} color={themeColors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, job, or interest..."
          placeholderTextColor={themeColors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
        style={styles.categoriesWrap}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat.key && styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.categoryDesc}>{categoryDesc}</Text>
      <Text style={styles.resultCount}>
        {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Find people to connect with</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiscoverUserCard
              user={item}
              onConnect={handleConnect}
              onViewProfile={handleViewProfile}
            />
          )}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={themeColors.border.default} />
              <Text style={styles.emptyTitle}>No one matches right now</Text>
              <Text style={styles.emptySubtitle}>Try another category or search.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.screen,
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
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
    marginTop: 16,
    backgroundColor: themeColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: themeColors.text.primary,
  },
  categoriesWrap: {
    marginTop: 16,
    height: 84,
  },
  categoriesScroll: {
    paddingHorizontal: 0,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: themeColors.background.card,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    marginRight: 10,
    justifyContent: 'center',
    minHeight: 36,
  },
  categoryChipActive: {
    backgroundColor: themeColors.secondary,
    borderColor: themeColors.secondary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text.secondary,
  },
  categoryChipTextActive: {
    color: themeColors.text.inverse,
  },
  categoryDesc: {
    fontSize: 12,
    color: themeColors.text.muted,
    marginHorizontal: 0,
    marginTop: 4,
  },
  resultCount: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 4,
  },
  listHeader: {
    paddingBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: themeColors.background.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: themeColors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: themeColors.background.muted,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardOverlayText: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  cardOverlayIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardPhotoMessengerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cardPhotoSocialIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  cardOccupation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  cardBody: {
    padding: 16,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: themeColors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  cardBio: {
    fontSize: 14,
    lineHeight: 21,
    color: themeColors.text.primary,
    marginBottom: 12,
  },
  cardInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: themeColors.background.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    color: themeColors.text.secondary,
  },
  cardContactRow: {
    marginBottom: 12,
  },
  cardPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardPhone: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: themeColors.text.primary,
  },
  cardMessengerRow: {
    marginBottom: 14,
  },
  cardMessengerIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    marginRight: 4,
  },
  messengerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  connectBtnText: {
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
