import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../../lib/ThemeContext';
import { useAuth } from '../../../lib/auth';

const SETTINGS_GROUPS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline' as const, label: 'Profile', description: 'Name, photo, bio', route: 'personal' },
      { icon: 'notifications-outline' as const, label: 'Notifications', description: 'Push and email' },
    ],
  },
  {
    title: 'Privacy & safety',
    items: [
      { icon: 'shield-outline' as const, label: 'Privacy', description: 'Who can see your posts', route: 'privacy' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline' as const, label: 'Help & feedback', description: 'FAQ and contact' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleLogout() {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  }

  function handleItemPress(item: (typeof SETTINGS_GROUPS)[0]['items'][0]) {
    if ('route' in item) {
      if (item.route === 'privacy') router.push('/(tabs)/profile/privacy');
      else if (item.route === 'personal') router.push('/(tabs)/profile/personal');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.row,
                    index === group.items.length - 1 && styles.rowLast,
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={20} color={themeColors.text.secondary} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowDescription}>{item.description}</Text>
                  </View>
                  {'route' in item && (
                    <Ionicons name="chevron-forward" size={20} color={themeColors.text.muted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {user && (
          <View style={styles.logoutSection}>
            {user.email ? (
              <Text style={styles.email}>{user.email}</Text>
            ) : null}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={themeColors.primary} />
              <Text style={styles.logoutBtnText}>Log out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: themeColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border.light,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  rowDescription: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 2,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  logoutSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: themeColors.border.default,
  },
  email: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.card,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.primary,
  },
});
