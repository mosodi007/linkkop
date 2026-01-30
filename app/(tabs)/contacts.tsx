import { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, X } from 'lucide-react-native';
import { supabase } from '../../src/app/lib/supabase.native';
import { useAuth } from '../../src/app/lib/auth.native';
import { useTranslation } from 'react-i18next';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  async function fetchContacts() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          contact:profiles!contacts_contact_id_fkey(
            id,
            full_name,
            avatar_url,
            bio,
            city
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setContacts(data?.map(c => ({ ...c.contact, contactId: c.id })) || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchContacts();
  }

  async function handleRemoveContact(contactId: string) {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contactId);

              if (error) throw error;
              await fetchContacts();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove contact');
            }
          }
        }
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <Text className="text-2xl font-bold text-gray-900">
          {t('nav.contacts', 'Contacts')}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
        </Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white border-b border-gray-100 px-4 py-4 flex-row items-center">
            <Image
              source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900">{item.full_name}</Text>
              {item.city && (
                <Text className="text-sm text-gray-500 mt-1">{item.city}</Text>
              )}
            </View>
            <TouchableOpacity className="p-2 mr-2">
              <MessageCircle size={20} color="#0ea5e9" />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-2"
              onPress={() => handleRemoveContact(item.contactId)}
            >
              <X size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                {t('contacts.no_contacts', 'No contacts yet')}
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {t('contacts.discover_hint', 'Discover people and send connection requests!')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
