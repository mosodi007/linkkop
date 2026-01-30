import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
    location?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <View className="bg-white mb-2 pb-4 border-b border-gray-100">
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <Image
          source={{ uri: post.author.avatar_url || 'https://via.placeholder.com/40' }}
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900">{post.author.full_name}</Text>
          <Text className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            {post.location && ` • ${post.location}`}
          </Text>
        </View>
        <TouchableOpacity>
          <MoreVertical size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <Text className="px-4 pb-3 text-gray-800 leading-5">{post.content}</Text>

      {post.image_url && (
        <Image
          source={{ uri: post.image_url }}
          className="w-full h-80"
          resizeMode="cover"
        />
      )}

      <View className="flex-row items-center px-4 pt-3 gap-6">
        <TouchableOpacity className="flex-row items-center gap-1">
          <Heart size={20} color="#6b7280" />
          <Text className="text-sm text-gray-600">{post.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-1">
          <MessageCircle size={20} color="#6b7280" />
          <Text className="text-sm text-gray-600">{post.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-1">
          <Share2 size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
