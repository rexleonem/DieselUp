import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc } from 'firebase/firestore';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/StateView';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { db } from '@/lib/firebase';
import { formatLitres, formatNaira } from '@/lib/format';
import { buildReceiptHtml, receiptRows } from '@/lib/receipt';
import { colors, radii, spacing } from '@/theme/tokens';
import type { DeliveryMode, Order, PaymentMethod } from '@/types/domain';

const deliveryLabels: Record<DeliveryMode, string> = {
  quick: 'Quick delivery',
  emergency: 'Emergency delivery',
  scheduled: 'Scheduled delivery'
};

const paymentLabels: Record<PaymentMethod, string> = {
  paystack: 'Paystack',
  wallet: 'DieselUp wallet',
  bank_transfer: 'Manual bank transfer'
};

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ref = useMemo(() => id ? doc(db, 'orders', id) : null, [id]);
  const { data: order } = useRealtimeDocument<Order>(ref);
  const [busy, setBusy] = useState(false);

  if (!order) {
    return <Screen header={<AppHeader title="Receipt" showBack backHref="/(app)/(tabs)/orders" />}><LoadingState /></Screen>;
  }

  const deliveryMode = order.deliveryMode ?? (order.isEmergency ? 'emergency' : order.scheduledFor ? 'scheduled' : 'quick');
  const print = async () => {
    try {
      setBusy(true);
      const file = await Print.printToFileAsync({ html: buildReceiptHtml(order), base64: false });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { dialogTitle: `DieselUp receipt ${order.orderNumber}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={<AppHeader title="Receipt" showBack backHref="/(app)/(tabs)/orders" />} contentStyle={styles.content}>
      <Card style={styles.receipt}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text color="white" style={styles.brandLetter}>D</Text></View>
          <View style={styles.flex}>
            <Text variant="h1">DieselUp</Text>
            <Text color="#64748B">Diesel order receipt</Text>
          </View>
          <View style={styles.statusPill}><Text variant="caption" color={colors.primary}>{order.status.replaceAll('_', ' ').toUpperCase()}</Text></View>
        </View>

        <Card style={styles.darkPanel}>
          <Text variant="caption" color="#CBD5E1">RECEIPT NUMBER</Text>
          <Text color="white" style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={styles.metricGrid}>
            <Metric label="Delivery" value={deliveryLabels[deliveryMode]} />
            <Metric label="Quantity" value={formatLitres(order.quantityLitres)} />
            <Metric label="Total" value={formatNaira(order.money.total)} />
          </View>
        </Card>

        <View style={styles.twoCol}>
          <Card style={styles.innerCard}>
            <Text variant="h3">Payment</Text>
            <ReceiptInfo label="Method" value={paymentLabels[order.paymentMethod]} />
            <ReceiptInfo label="Status" value={order.status.replaceAll('_', ' ')} />
            {order.manualFundingRequestId ? <ReceiptInfo label="Manual review ID" value={order.manualFundingRequestId} /> : null}
          </Card>
          <Card style={styles.innerCard}>
            <Text variant="h3">Delivery address</Text>
            <Text variant="label">{order.deliveryAddress.label}</Text>
            <Text color="#64748B">{order.deliveryAddress.formattedAddress}</Text>
          </Card>
        </View>

        <Card style={styles.innerCard}>
          <Text variant="h3">Charges</Text>
          {receiptRows(order).map((row) => <Row key={row.label} label={row.label} value={row.value} />)}
          <View style={styles.divider} />
          <Row label="Total" value={formatNaira(order.money.total)} strong />
        </Card>
      </Card>

      <Button title="Export PDF" icon="download-outline" loading={busy} onPress={print} />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text variant="caption" color="#CBD5E1">{label.toUpperCase()}</Text><Text variant="h3" color="white">{value}</Text></View>;
}

function ReceiptInfo({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text color="#64748B">{label}</Text><Text variant="label">{value}</Text></View>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.row}><Text>{label}</Text><Text variant={strong ? 'h2' : 'h3'} color={strong ? colors.primary : undefined}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  content: { maxWidth: 760, gap: spacing.lg },
  flex: { flex: 1 },
  receipt: { gap: spacing.lg, padding: spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandLetter: { fontSize: 28, fontWeight: '900' },
  statusPill: { borderRadius: radii.full, backgroundColor: '#FFF3E5', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  darkPanel: { backgroundColor: colors.secondary, borderColor: colors.secondary, gap: spacing.md },
  orderNumber: { fontSize: 30, fontWeight: '900' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { flex: 1, minWidth: 140, gap: 4 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  innerCard: { flex: 1, minWidth: 250, gap: spacing.md },
  infoRow: { gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  divider: { height: 1, backgroundColor: '#E2E8F0' }
});
