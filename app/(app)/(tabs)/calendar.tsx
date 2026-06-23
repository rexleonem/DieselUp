import { useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { useOrders } from '@/hooks/useOrders';
import { formatLitres, formatNaira } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Order } from '@/types/domain';

export default function CalendarScreen() {
  const { profile } = useAuth();
  const theme = useTheme();
  const { data: allOrders, loading } = useOrders(50);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter out only scheduled orders
  const scheduledOrders = useMemo(() => {
    return allOrders.filter(o => o.scheduledFor != null);
  }, [allOrders]);

  const markedDates = useMemo(() => {
    const dates: Record<string, any> = {};
    scheduledOrders.forEach(order => {
      if (order.scheduledFor) {
        const dateString = order.scheduledFor.toDate().toISOString().split('T')[0];
        dates[dateString] = { marked: true, dotColor: colors.primary };
      }
    });
    
    // Select the current date
    dates[selectedDate] = { ...dates[selectedDate], selected: true, selectedColor: colors.primary };
    
    return dates;
  }, [scheduledOrders, selectedDate]);

  const ordersOnSelectedDate = useMemo(() => {
    return scheduledOrders.filter(order => {
      if (!order.scheduledFor) return false;
      const dateString = order.scheduledFor.toDate().toISOString().split('T')[0];
      return dateString === selectedDate;
    });
  }, [scheduledOrders, selectedDate]);

  return (
    <Screen header={<AppHeader title="Deliveries" />}>
      <View style={styles.container}>
        <Calendar
          onDayPress={(day: any) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: theme.colors.background,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.muted,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.border,
            dotColor: colors.primary,
            selectedDotColor: '#ffffff',
            arrowColor: colors.primary,
            monthTextColor: theme.colors.text,
            textMonthFontWeight: 'bold',
          }}
          style={styles.calendar}
        />
        
        <View style={styles.eventsContainer}>
          <Text variant="h2" style={styles.eventsTitle}>
            Scheduled on {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
          
          {loading ? (
            <Text color={theme.colors.muted}>Loading...</Text>
          ) : ordersOnSelectedDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.border} />
              <Text variant="label" color={theme.colors.muted} style={{ marginTop: 10 }}>No deliveries scheduled</Text>
            </View>
          ) : (
            ordersOnSelectedDate.map(order => <OrderRow key={order.id} order={order} />)
          )}
        </View>
      </View>
    </Screen>
  );
}

function OrderRow({ order }: { order: Order }) {
  const theme = useTheme();
  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderIcon}>
        <Ionicons name="time" color={colors.primary} size={20} />
      </View>
      <View style={styles.orderCopy}>
        <Text variant="label">{order.scheduledFor?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text variant="caption" color={theme.colors.muted}>{formatLitres(order.quantityLitres)} • {order.deliveryAddress.label}</Text>
      </View>
      <View style={styles.orderRight}>
        <Text variant="label">{formatNaira(order.money.total)}</Text>
        <Text variant="caption" color={colors.accent}>{order.status.replace('_', ' ')}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: { borderRadius: radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  eventsContainer: { marginTop: spacing.xl, paddingHorizontal: spacing.md },
  eventsTitle: { marginBottom: spacing.md },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  orderCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  orderIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' },
  orderCopy: { flex: 1, gap: 3 },
  orderRight: { alignItems: 'flex-end', gap: 3 }
});
