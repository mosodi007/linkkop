import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { UserCard } from '../../components/UserCard';
import { supabase } from '../../src/app/lib/supabase.native';
import { useTranslation } from 'react-i18next';

export default function DiscoverScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles_discover')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchUsers();
  }

  async function handleConnect(userId: string) {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .insert({
          from_user_id: supabase.auth.getUser().then(u => u.data.user?.id),
          to_user_id: userId,
          status: 'pending'
        });

      if (error) throw error;
      Alert.alert('Success', 'Connection request sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send connection request');
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.occupation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 px-4 pt-3 pb-2">
          {t('nav.discover', 'Discover')}
        </Text>
        <View className="px-4 pb-3">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder={t('discover.search', 'Search by name, job, or interests...')}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserCard user={item} onConnect={() => handleConnect(item.id)} />
        )}
        contentContainerStyle={{ paddingVertical: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                {t('discover.no_users', 'No users found')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
