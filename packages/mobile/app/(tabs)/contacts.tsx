import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../lib/ThemeContext';
import { useContacts, type ContactProfile } from '../../lib/contacts';

const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

function ContactCard({
  contact,
  onMore,
  onViewProfile,
}: {
  contact: ContactProfile;
  onMore: (contact: ContactProfile) => void;
  onViewProfile: (contactId: string) => void;
}) {
  const photo = contact.photo || PLACEHOLDER_AVATAR;
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardMain}
        onPress={() => onViewProfile(contact.id)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: photo }} style={styles.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {contact.name}
          </Text>
          <Text style={styles.cardCity} numberOfLines={1}>
            {contact.city || '—'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.moreBtn}
        onPress={() => onMore(contact)}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={themeColors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [moreContact, setMoreContact] = useState<ContactProfile | null>(null);
  const { contacts, loading, refresh, removeContactById } = useContacts();

  const handleViewProfile = (contactId: string) => {
    router.push(`/user/${contactId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const handleRemoveContact = (contact: ContactProfile) => {
    setMoreContact(null);
    Alert.alert(
      'Remove contact',
      `Remove ${contact.name} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeContactById(contact.id),
        },
      ]
    );
  };

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search-outline"
          size={20}
          color={themeColors.text.muted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or city..."
          placeholderTextColor={themeColors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <Text style={styles.resultCount}>
        {filteredContacts.length}{' '}
        {filteredContacts.length === 1 ? 'contact' : 'contacts'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <Text style={styles.headerSubtitle}>People you've connected with</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading contacts…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onMore={setMoreContact}
              onViewProfile={handleViewProfile}
            />
          )}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="people-outline"
                size={48}
                color={themeColors.border.default}
              />
              <Text style={styles.emptyTitle}>
                {searchQuery.trim()
                  ? 'No contacts match your search'
                  : 'No contacts yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim()
                  ? 'Try a different name or city.'
                  : "Discover people and accept connection requests to add contacts."}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!moreContact}
        transparent
        animationType="slide"
        onRequestClose={() => setMoreContact(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMoreContact(null)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            {moreContact ? (
              <>
                <Text style={styles.modalTitle}>{moreContact.name}</Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleRemoveContact(moreContact)}
                >
                  <Ionicons name="person-remove-outline" size={22} color="#dc2626" />
                  <Text style={styles.modalOptionTextDanger}>Remove from contacts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => setMoreContact(null)}
                >
                  <Text style={styles.modalOptionText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
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
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
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
  resultCount: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 10,
    marginBottom: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: themeColors.background.muted,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  cardCity: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
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
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: themeColors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.border.default,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: themeColors.text.secondary,
  },
  modalOptionTextDanger: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
});
