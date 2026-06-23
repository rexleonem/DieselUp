import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/StateView';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { db } from '@/lib/firebase';
import { formatLitres, formatNaira } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';
import type { DeliveryMode, Order, PaymentMethod } from '@/types/domain';

const modeLabels: Record<DeliveryMode, string> = {
  quick: 'Quick delivery',
  emergency: 'Emergency delivery',
  scheduled: 'Scheduled delivery'
};

const paymentLabels: Record<PaymentMethod, string> = {
  paystack: 'Paystack',
  wallet: 'Wallet',
  bank_transfer: 'Manual bank transfer'
};

export default function OrderAcknowledgementScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const ref = useMemo(() => orderId ? doc(db, 'orders', orderId) : null, [orderId]);
  const { data: order, loading } = useRealtimeDocument<Order>(ref);

  if (loading || !order) {
    return <Screen header={<AppHeader title="Order acknowledgement" showBack backHref="/(app)/(tabs)" />}><LoadingState label="Preparing acknowledgement…" /></Screen>;
  }

  const awaitingManualApproval = order.paymentMethod === 'bank_transfer' && order.status === 'payment_pending';
  const paid = !['pending', 'payment_pending', 'cancelled', 'refunded'].includes(order.status);
  const statusColor = awaitingManualApproval ? colors.warning : paid ? colors.success : colors.accent;

  return (
    <Screen header={<AppHeader title="Order acknowledgement" showBack backHref="/(app)/(tabs)" />} contentStyle={styles.content}>
      <Card style={styles.hero}>
        <View style={[styles.successIcon, { backgroundColor: statusColor }]}>
          <Ionicons name={awaitingManualApproval ? 'time-outline' : 'checkmark'} size={42} color="white" />
        </View>
        <Text variant="h1">{awaitingManualApproval ? 'Transfer proof submitted' : 'Order received'}</Text>
        <Text color="#64748B" style={styles.center}>
          {awaitingManualApproval
            ? 'Your order is safely recorded. DieselUp admin must verify the bank transfer before supplier dispatch starts.'
            : order.paymentMethod === 'paystack' && order.status === 'payment_pending'
              ? 'Your order is recorded. Paystack will send a signed server confirmation before the order moves to paid.'
              : 'Your order is recorded and ready for the next operational step.'}
        </Text>
        <View style={styles.orderBadge}><Text variant="label" color={colors.primary}>{order.orderNumber}</Text></View>
      </Card>

      <Card style={styles.card}>
        <Text variant="h3">Order summary</Text>
        <SummaryRow label="Delivery type" value={modeLabels[order.deliveryMode ?? (order.isEmergency ? 'emergency' : order.scheduledFor ? 'scheduled' : 'quick')]} />
        <SummaryRow label="Quantity" value={formatLitres(order.quantityLitres)} />
        <SummaryRow label="Payment" value={paymentLabels[order.paymentMethod]} />
        <SummaryRow label="Status" value={order.status.replaceAll('_', ' ')} valueColor={statusColor} />
        {order.scheduledFor ? <SummaryRow label="Scheduled for" value={order.scheduledFor.toDate().toLocaleString()} /> : null}
        {order.estimatedArrival ? <SummaryRow label="Estimated arrival" value={order.estimatedArrival.toDate().toLocaleString()} /> : null}
        <View style={styles.divider} />
        <SummaryRow label="Total" value={formatNaira(order.money.total)} strong />
      </Card>

      <Card style={styles.deliveryCard}>
        <View style={styles.deliveryIcon}><Ionicons name="location-outline" size={22} color={colors.primary} /></View>
        <View style={styles.flex}>
          <Text variant="label">{order.deliveryAddress.label}</Text>
          <Text color="#64748B">{order.deliveryAddress.formattedAddress}</Text>
        </View>
      </Card>

      {awaitingManualApproval ? (
        <Card style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.warning} />
          <Text style={styles.flex} color="#92400E">Manual transfer reviews are handled by admins. You’ll receive an in-app notification once approved or rejected.</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button title="View receipt" icon="document-text-outline" variant="outline" onPress={() => router.push(`/orders/${order.id}/receipt` as never)} />
        <Button title="Track order" icon="navigate-outline" onPress={() => router.replace(`/orders/${order.id}` as never)} />
      </View>
      <Button title="Back to home" variant="ghost" onPress={() => router.replace('/(app)/(tabs)')} />
    </Screen>
  );
}

function SummaryRow({ label, value, strong, valueColor }: { label: string; value: string; strong?: boolean; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text color="#64748B">{label}</Text>
      <Text variant={strong ? 'h2' : 'label'} color={valueColor}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 720, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing['2xl'] },
  successIcon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center', maxWidth: 540 },
  orderBadge: { borderRadius: radii.full, backgroundColor: '#FFF3E5', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  card: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  deliveryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  deliveryIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF3E5' },
  notice: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  flex: { flex: 1 }
});
