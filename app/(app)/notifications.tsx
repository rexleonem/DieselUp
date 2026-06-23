import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { collection, doc, limit, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/ui/StateView';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { db } from '@/lib/firebase';
import { colors, spacing } from '@/theme/tokens';
import type { Notification } from '@/types/domain';

export default function NotificationsScreen() {
  const { firebaseUser } = useAuth();
  const notificationsQuery = useMemo(() => firebaseUser ? query(collection(db, 'notifications'), where('userId', '==', firebaseUser.uid), orderBy('createdAt', 'desc'), limit(100)) : null, [firebaseUser]);
  const items = useRealtimeQuery<Notification>(notificationsQuery);
  const read = (id: string) => updateDoc(doc(db, 'notifications', id), { readAt: serverTimestamp() });
  const open = async (item: Notification) => {
    await read(item.id);
    if (item.data?.orderId) router.push(`/(app)/orders/${item.data.orderId}` as never);
    else if (item.data?.conversationId) router.push(`/(app)/messages/${item.data.conversationId}` as never);
    else if (item.data?.supportTicketId) router.push(`/(app)/support/${item.data.supportTicketId}` as never);
  };

  return (
    <Screen header={<AppHeader title="Notifications" showBack backHref="/(app)/(tabs)/more" showNotificationsAction={false} />}>
      {items.loading ? <LoadingState /> : items.data.length === 0 ? (
        <EmptyState icon="notifications-outline" title="You’re all caught up" message="Order, payment, delivery, refund, and support notifications will appear here." />
      ) : (
        <View style={styles.list}>
          {items.data.map((item) => (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item)}>
              <Card style={[styles.row, !item.readAt && styles.unread]}>
                <View style={styles.icon}><Ionicons name="notifications" size={19} color={colors.primary} /></View>
                <View style={styles.flex}>
                  <Text variant="label">{item.title}</Text>
                  <Text color="#64748B">{item.body}</Text>
                </View>
                {item.data?.orderId || item.data?.conversationId || item.data?.supportTicketId ? <Ionicons name="chevron-forward" size={18} color="#94A3B8" /> : null}
                {!item.readAt && <View style={styles.dot} />}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unread: { borderColor: '#FDBA74' },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }
});
