import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { themeColors } from '../../lib/ThemeContext';

const TAB_ITEM_RADIUS = 12;

const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: themeColors.primary,
  tabBarInactiveTintColor: themeColors.tabBar.inactive,
  tabBarButton: (props: Record<string, unknown> & { children: React.ReactNode; style?: unknown; accessibilityState?: { selected?: boolean } }) => (
    <Pressable
      {...props}
      style={[
        props.style as object,
        styles.tabButton,
        props.accessibilityState?.selected && styles.tabButtonActive,
      ]}
    />
  ),
  tabBarStyle: {
    borderTopWidth: 1,
    borderTopColor: themeColors.tabBar.border,
    height: Platform.OS === 'ios' ? 98 : 72,
    borderRadius: 10,
    overflow: 'hidden' as const,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: themeColors.tabBar.background,
  },
  tabBarItemStyle: {
    borderColor: themeColors.border.default,
    borderRadius: TAB_ITEM_RADIUS,
    marginHorizontal: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  tabBarShowLabel: true,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '500' as const },
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    borderRadius: TAB_ITEM_RADIUS,
    overflow: 'hidden',
  },
  tabButtonActive: {
    backgroundColor: themeColors.secondary,
  },
});
