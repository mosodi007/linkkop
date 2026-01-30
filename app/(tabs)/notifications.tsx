import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../src/app/lib/supabase.native';
import { useAuth } from '../../src/app/lib/auth.native';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  async function fetchNotifications() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchNotifications();
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <Text className="text-2xl font-bold text-gray-900">
          {t('nav.notifications', 'Notifications')}
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`border-b border-gray-100 px-4 py-4 ${
              !item.read_at ? 'bg-blue-50' : 'bg-white'
            }`}
            onPress={() => !item.read_at && markAsRead(item.id)}
          >
            <View className="flex-row items-start">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{item.title}</Text>
                <Text className="text-gray-700 mt-1">{item.body}</Text>
                <Text className="text-xs text-gray-500 mt-2">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </Text>
              </View>
              {!item.read_at && (
                <View className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              )}
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                {t('notifications.no_notifications', 'No notifications yet')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
