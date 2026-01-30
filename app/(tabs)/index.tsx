import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { useAuth } from '../../src/app/lib/auth.native';
import { PostCard } from '../../components/PostCard';
import { supabase } from '../../src/app/lib/supabase.native';
import { useTranslation } from 'react-i18next';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchPosts();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          {t('nav.feed', 'Feed')}
        </Text>
        <TouchableOpacity className="bg-blue-500 rounded-full p-2">
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                {t('feed.no_posts', 'No posts yet. Be the first to share!')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
