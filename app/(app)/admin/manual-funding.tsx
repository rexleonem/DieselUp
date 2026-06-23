import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/StateView';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { db } from '@/lib/firebase';
import { reviewManualFundingRequest } from '@/services/functions';
import { formatNaira } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';
import type { ManualFundingRequest } from '@/types/domain';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

export default function ManualFundingApprovalsScreen() {
  const [filter, setFilter] = useState<ReviewStatus>('pending');
  const [busy, setBusy] = useState('');
  const requestsQuery = useMemo(() => query(collection(db, 'manual_funding_requests'), where('status', '==', filter), orderBy('createdAt', filter === 'pending' ? 'asc' : 'desc'), limit(100)), [filter]);
  const requests = useRealtimeQuery<ManualFundingRequest>(requestsQuery);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    setBusy(`${id}:${status}`);
    try {
      await reviewManualFundingRequest(id, status, status === 'approved' ? 'Approved by admin' : 'Rejected by admin');
    } finally {
      setBusy('');
    }
  };

  return (
    <Screen header={<AppHeader title="Manual funding approvals" showBack backHref="/(app)/(tabs)/more" />} contentStyle={styles.content}>
      <Text color="#64748B">Review wallet funding and direct order-payment transfers submitted with customer proof. Approval runs the money/order update through Cloud Functions when available.</Text>
      <View style={styles.filters}>
        {(['pending', 'approved', 'rejected'] as const).map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, item === filter && styles.activeFilter]}>
            <Text variant="label" color={item === filter ? colors.primary : '#64748B'}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {requests.loading ? <LoadingState /> : requests.data.length === 0 ? (
        <EmptyState icon="cash-outline" title="No requests here" message="Manual funding submissions will appear in this queue after customers upload proof." />
      ) : (
        <View style={styles.list}>
          {requests.data.map((item) => (
            <Card key={item.id} style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.icon}><Ionicons name={item.purpose === 'wallet' ? 'wallet-outline' : 'receipt-outline'} size={22} color={colors.primary} /></View>
                <View style={styles.flex}>
                  <Text variant="h3">{formatNaira(item.amount)}</Text>
                  <Text color="#64748B">{item.purpose === 'wallet' ? 'Wallet funding' : `Order payment ${item.orderNumber ?? ''}`}</Text>
                </View>
                <StatusPill status={item.status} />
              </View>
              <View style={styles.details}>
                <Detail label="Customer" value={item.userName ?? item.userId} />
                <Detail label="Reference" value={item.transferReference || 'Not supplied'} />
                <Detail label="Bank" value={[item.bankName, item.accountNumber].filter(Boolean).join(' • ') || 'Not captured'} />
                <Detail label="Request ID" value={item.id} />
              </View>
              <View style={styles.actions}>
                <Button title="View proof" variant="outline" icon="image-outline" onPress={() => Linking.openURL(item.proofUrl)} />
                {item.status === 'pending' ? (
                  <>
                    <Button title="Reject" variant="danger" loading={busy === `${item.id}:rejected`} onPress={() => review(item.id, 'rejected')} />
                    <Button title="Approve" loading={busy === `${item.id}:approved`} onPress={() => review(item.id, 'approved')} />
                  </>
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text variant="caption" color="#64748B">{label}</Text><Text variant="label">{value}</Text></View>;
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const color = status === 'approved' ? colors.success : status === 'rejected' ? colors.danger : colors.warning;
  return <View style={[styles.statusPill, { backgroundColor: `${color}18` }]}><Text variant="caption" color={color}>{status.toUpperCase()}</Text></View>;
}

const styles = StyleSheet.create({
  content: { maxWidth: 980, gap: spacing.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radii.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  activeFilter: { borderColor: colors.primary, backgroundColor: '#FFF3E5' },
  list: { gap: spacing.md },
  card: { gap: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  statusPill: { borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  detail: { flex: 1, minWidth: 190, gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.sm }
});
