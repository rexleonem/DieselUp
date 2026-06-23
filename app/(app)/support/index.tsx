import { StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { EmptyState, LoadingState } from '@/components/ui/StateView';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useTheme } from '@/hooks/useTheme';
import { colors, radii, spacing } from '@/theme/tokens';
import type { SupportTicket } from '@/types/domain';

export default function SupportIndexScreen() {
  const { data: tickets, loading } = useSupportTickets();

  return (
    <Screen header={<AppHeader title="Support Tickets" showBack backHref="/(app)/(tabs)/more" />}>
      <View style={styles.headerRow}>
        <Text variant="h2">Your Tickets</Text>
        <Pressable onPress={() => router.push('/(app)/support/new' as never)} style={styles.newButton}>
          <Ionicons name="add" size={20} color="white" />
          <Text variant="label" color="white">New Ticket</Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingState label="Loading tickets..." />
      ) : tickets.length === 0 ? (
        <EmptyState 
          icon="help-buoy-outline" 
          title="No support tickets" 
          message="If you have an issue, feel free to open a ticket." 
          actionTitle="Create Ticket" 
          onAction={() => router.push('/(app)/support/new' as never)} 
        />
      ) : (
        <View style={styles.list}>
          {tickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}
        </View>
      )}
    </Screen>
  );
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  const theme = useTheme();
  const statusColors = {
    open: colors.primary,
    in_progress: colors.accent,
    resolved: colors.success
  };

  return (
    <Pressable onPress={() => router.push(`/(app)/support/${ticket.id}` as never)}>
      <Card style={styles.ticketCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="ticket-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text variant="label">{ticket.subject}</Text>
          <Text variant="caption" color={theme.colors.muted} numberOfLines={1}>
            {ticket.description}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.badge, { backgroundColor: statusColors[ticket.status] + '20' }]}>
            <Text variant="caption" color={statusColors[ticket.status]}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text variant="caption" color={theme.colors.muted}>
            {ticket.createdAt?.toDate().toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full, gap: spacing.sm },
  list: { gap: spacing.sm },
  ticketCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconContainer: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  statusContainer: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.full }
});
