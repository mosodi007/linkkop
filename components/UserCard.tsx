import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin, Briefcase } from 'lucide-react-native';

interface UserCardProps {
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    city?: string;
    occupation?: string;
    interests?: string[];
    distance_km?: number;
  };
  onConnect?: () => void;
}

export function UserCard({ user, onConnect }: UserCardProps) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 mx-4 shadow-sm">
      <View className="flex-row items-start">
        <Image
          source={{ uri: user.avatar_url || 'https://via.placeholder.com/60' }}
          className="w-16 h-16 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="text-lg font-semibold text-gray-900">{user.full_name}</Text>
          {user.occupation && (
            <View className="flex-row items-center mt-1">
              <Briefcase size={14} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">{user.occupation}</Text>
            </View>
          )}
          {user.city && (
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {user.city}
                {user.distance_km && ` • ${user.distance_km.toFixed(1)} km away`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {user.bio && (
        <Text className="text-gray-700 mt-3 leading-5" numberOfLines={2}>
          {user.bio}
        </Text>
      )}

      {user.interests && user.interests.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {user.interests.slice(0, 3).map((interest, idx) => (
            <View key={idx} className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-xs text-blue-600">{interest}</Text>
            </View>
          ))}
          {user.interests.length > 3 && (
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-xs text-gray-600">+{user.interests.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        className="bg-blue-500 rounded-lg py-3 mt-4"
        onPress={onConnect}
      >
        <Text className="text-white text-center font-semibold">Connect</Text>
      </TouchableOpacity>
    </View>
  );
}
