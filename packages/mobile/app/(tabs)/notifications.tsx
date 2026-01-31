import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../lib/ThemeContext';
import { useNotifications, type NotificationItem } from '../../lib/notifications';

const ICON_BY_TYPE: Record<string, keyof typeof Ionicons.glyphMap> = {
  connection: 'person-add-outline',
  comment: 'chatbubble-outline',
  like: 'heart-outline',
};

function getIconForType(type: string): keyof typeof Ionicons.glyphMap {
  return ICON_BY_TYPE[type] ?? 'notifications-outline';
}

function NotificationCard({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) {
  const icon = getIconForType(item.type);
  const displayText = item.body ?? item.title ?? item.type;
  const isRead = !!item.readAt;

  return (
    <TouchableOpacity
      style={[styles.card, isRead && styles.cardRead]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, isRead && styles.iconWrapRead]}>
        <Ionicons
          name={icon}
          size={22}
          color={isRead ? themeColors.text.muted : themeColors.primary}
        />
      </View>
      <View style={styles.cardBody}>
        <Text
          style={[styles.cardText, isRead && styles.cardTextRead]}
          numberOfLines={3}
        >
          {displayText}
        </Text>
        <Text style={styles.cardTime}>{item.timeAgo}</Text>
      </View>
      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { notifications, loading, refresh, markRead } = useNotifications();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handlePress = async (item: NotificationItem) => {
    if (!item.readAt) {
      await markRead(item.id);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>Activity and connection updates</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard item={item} onPress={handlePress} />
          )}
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
                name="notifications-outline"
                size={48}
                color={themeColors.border.default}
              />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Connection requests, likes, and comments will show up here.
              </Text>
            </View>
          }
        />
      )}
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
  cardRead: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapRead: {
    backgroundColor: themeColors.background.input,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardText: {
    fontSize: 15,
    color: themeColors.text.primary,
    lineHeight: 21,
  },
  cardTextRead: {
    color: themeColors.text.secondary,
  },
  cardTime: {
    fontSize: 13,
    color: themeColors.text.muted,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
    marginLeft: 10,
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
});
