import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, Bell, Lock, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/app/lib/auth.native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          }
        }
      ]
    );
  }

  const menuItems = [
    {
      icon: User,
      label: t('settings.profile', 'Edit Profile'),
      onPress: () => Alert.alert('Coming soon', 'Profile editing will be available soon'),
    },
    {
      icon: Bell,
      label: t('settings.notifications', 'Notifications'),
      onPress: () => Alert.alert('Coming soon', 'Notification settings will be available soon'),
    },
    {
      icon: Lock,
      label: t('settings.privacy', 'Privacy'),
      onPress: () => Alert.alert('Coming soon', 'Privacy settings will be available soon'),
    },
    {
      icon: HelpCircle,
      label: t('settings.help', 'Help & Feedback'),
      onPress: () => Alert.alert('Coming soon', 'Help & feedback will be available soon'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <Text className="text-2xl font-bold text-gray-900">
          {t('nav.profile', 'Profile')}
        </Text>
      </View>

      <ScrollView>
        <View className="bg-white px-4 py-6 mb-2">
          <View className="items-center">
            <Image
              source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/100' }}
              className="w-24 h-24 rounded-full"
            />
            <Text className="text-xl font-bold text-gray-900 mt-4">
              {profile?.full_name || 'User'}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">{user?.email}</Text>
            {profile?.city && (
              <Text className="text-sm text-gray-500 mt-1">{profile.city}</Text>
            )}
          </View>
        </View>

        <View className="bg-white mt-2">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center px-4 py-4 border-b border-gray-100"
              onPress={item.onPress}
            >
              <item.icon size={20} color="#6b7280" />
              <Text className="flex-1 ml-3 text-gray-900">{item.label}</Text>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="bg-white mt-2 flex-row items-center px-4 py-4"
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="ml-3 text-red-500 font-semibold">
            {t('settings.sign_out', 'Sign Out')}
          </Text>
        </TouchableOpacity>

        <View className="px-4 py-6">
          <Text className="text-center text-xs text-gray-400">
            Linkkop v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
