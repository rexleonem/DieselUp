import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { collection, doc, limit, orderBy, query, where } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/StateView';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { db, storage } from '@/lib/firebase';
import { initializeWalletFunding, submitManualFundingRequest } from '@/services/functions';
import { formatNaira } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';
import type { BankAccount, ManualFundingRequest, Wallet, WalletTransaction } from '@/types/domain';

type FundingMethod = 'paystack' | 'bank_transfer';

export default function WalletScreen() {
  const { firebaseUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<FundingMethod>('paystack');
  const [transferReference, setTransferReference] = useState('');
  const [proof, setProof] = useState<{ url: string; path: string; name: string } | null>(null);
  const [funding, setFunding] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const walletRef = useMemo(() => firebaseUser ? doc(db, 'wallets', firebaseUser.uid) : null, [firebaseUser]);
  const bankRef = useMemo(() => doc(db, 'settings', 'payment'), []);
  const txQuery = useMemo(() => firebaseUser ? query(collection(db, 'wallets', firebaseUser.uid, 'transactions'), orderBy('createdAt', 'desc'), limit(100)) : null, [firebaseUser]);
  const manualQuery = useMemo(() => firebaseUser ? query(collection(db, 'manual_funding_requests'), where('userId', '==', firebaseUser.uid), where('purpose', '==', 'wallet'), orderBy('createdAt', 'desc'), limit(10)) : null, [firebaseUser]);
  const wallet = useRealtimeDocument<Wallet>(walletRef);
  const bankAccount = useRealtimeDocument<BankAccount>(bankRef);
  const tx = useRealtimeQuery<WalletTransaction>(txQuery);
  const manualRequests = useRealtimeQuery<ManualFundingRequest>(manualQuery);
  const numericAmount = Number(amount);
  const bank = bankAccount.data;

  const uploadProof = async () => {
    if (!firebaseUser) return;
    try {
      setUploadingProof(true);
      setError('');
      setSuccess('');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission is required to upload transfer proof.');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const fileName = `${Date.now()}-${(asset.fileName ?? 'wallet-proof.jpg').replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const fileRef = storageRef(storage, `manual-funding-proofs/${firebaseUser.uid}/${fileName}`);
      const blob = await (await fetch(asset.uri)).blob();
      await uploadBytes(fileRef, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
      const url = await getDownloadURL(fileRef);
      setProof({ url, path: fileRef.fullPath, name: fileName });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to upload proof.');
    } finally {
      setUploadingProof(false);
    }
  };

  const fundWithPaystack = async () => {
    try {
      setFunding(true);
      setError('');
      setSuccess('');
      const result = await initializeWalletFunding(numericAmount);
      await WebBrowser.openBrowserAsync(result.authorizationUrl);
      setSuccess('Paystack checkout opened. Your wallet updates after signed payment confirmation.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to fund wallet.');
    } finally {
      setFunding(false);
    }
  };

  const submitManual = async () => {
    if (!proof || !bank) return;
    try {
      setFunding(true);
      setError('');
      setSuccess('');
      const result = await submitManualFundingRequest({
        amount: numericAmount,
        purpose: 'wallet',
        proofUrl: proof.url,
        proofStoragePath: proof.path,
        transferReference,
        bankAccount: bank
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(`Manual wallet funding request submitted (${result.requestId}). Admin approval is required before your wallet is credited.`);
      setAmount('');
      setTransferReference('');
      setProof(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit manual funding request.');
    } finally {
      setFunding(false);
    }
  };

  const submit = method === 'paystack' ? fundWithPaystack : submitManual;
  const disabled = numericAmount < 100 || funding || (method === 'bank_transfer' && (!bank || !proof));

  return (
    <Screen header={<AppHeader title="Wallet" showBack backHref="/(app)/(tabs)/more" />} contentStyle={styles.content}>
      {wallet.loading ? <LoadingState /> : (
        <Card style={styles.balance}>
          <View>
            <Text variant="caption" color="#CBD5E1">AVAILABLE BALANCE</Text>
            <Text color="white" style={styles.amount}>{formatNaira(wallet.data?.availableBalance ?? 0)}</Text>
            <Text variant="caption" color="#94A3B8">Pending: {formatNaira(wallet.data?.pendingBalance ?? 0)}</Text>
          </View>
          <Ionicons name="wallet" size={74} color="#FFFFFF16" />
        </Card>
      )}

      <Card style={styles.fund}>
        <View>
          <Text variant="h3">Fund wallet</Text>
          <Text color="#64748B">Use Paystack for instant card/bank checkout, or transfer to the DieselUp bank account and upload proof for approval.</Text>
        </View>
        <View style={styles.methodGrid}>
          <FundingOption selected={method === 'paystack'} icon="card-outline" title="Paystack" onPress={() => setMethod('paystack')} />
          <FundingOption selected={method === 'bank_transfer'} icon="business-outline" title="Bank transfer" onPress={() => setMethod('bank_transfer')} />
        </View>
        <Input label="Amount" keyboardType="number-pad" value={amount} onChangeText={(value) => setAmount(value.replace(/\D/g, ''))} />

        {method === 'bank_transfer' ? (
          <Card style={styles.bankCard}>
            {bank ? (
              <>
                <BankRow label="Bank" value={bank.bankName} />
                <BankRow label="Account name" value={bank.accountName} />
                <BankRow label="Account number" value={bank.accountNumber} />
                {bank.instructions ? <Text variant="caption" color="#64748B">{bank.instructions}</Text> : null}
                <Input label="Transfer reference / narration" value={transferReference} onChangeText={setTransferReference} placeholder={bank.referencePrefix ? `${bank.referencePrefix}-...` : 'Bank transaction reference'} />
                <Button title={proof ? `Proof uploaded: ${proof.name}` : 'Upload transfer proof'} variant={proof ? 'outline' : 'secondary'} icon={proof ? 'checkmark-circle-outline' : 'cloud-upload-outline'} loading={uploadingProof} onPress={uploadProof} />
              </>
            ) : (
              <Text color={colors.danger}>Manual funding is unavailable because no receiving bank account has been configured by an admin.</Text>
            )}
          </Card>
        ) : null}

        <Button title={method === 'paystack' ? 'Continue with Paystack' : 'Submit for manual approval'} loading={funding} disabled={disabled} onPress={submit} />
        {error ? <Text color={colors.danger}>{error}</Text> : null}
        {success ? <Text color={colors.success}>{success}</Text> : null}
      </Card>

      {manualRequests.data.length > 0 ? (
        <>
          <Text variant="h2">Manual funding requests</Text>
          <View style={styles.list}>
            {manualRequests.data.map((item) => <ManualRequestRow key={item.id} item={item} />)}
          </View>
        </>
      ) : null}

      <Text variant="h2">Transactions</Text>
      {tx.loading ? <LoadingState /> : tx.data.length === 0 ? (
        <EmptyState icon="swap-vertical-outline" title="No transactions" message="Verified wallet credits, debits, refunds, bonuses, and withdrawals will appear here." />
      ) : (
        <View style={styles.list}>{tx.data.map((item) => <TransactionRow key={item.id} item={item} />)}</View>
      )}
    </Screen>
  );
}

function FundingOption({ selected, icon, title, onPress }: { selected: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.method, selected && styles.methodSelected]}>
      <Ionicons name={icon} size={20} color={selected ? colors.primary : '#64748B'} />
      <Text variant="label" color={selected ? colors.primary : undefined}>{title}</Text>
    </Pressable>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.bankRow}><Text color="#64748B">{label}</Text><Text variant="label">{value}</Text></View>;
}

function ManualRequestRow({ item }: { item: ManualFundingRequest }) {
  const color = item.status === 'approved' ? colors.success : item.status === 'rejected' ? colors.danger : colors.warning;
  return (
    <Card style={styles.requestRow}>
      <View style={styles.flex}>
        <Text variant="label">{formatNaira(item.amount)}</Text>
        <Text variant="caption" color="#64748B">{item.transferReference || 'No reference supplied'}</Text>
      </View>
      <Text variant="label" color={color}>{item.status}</Text>
    </Card>
  );
}

function TransactionRow({ item }: { item: WalletTransaction }) {
  const outgoing = item.type === 'debit' || item.type === 'withdrawal';
  return (
    <Card style={styles.transaction}>
      <View style={[styles.txIcon, { backgroundColor: outgoing ? '#FEF2F2' : '#ECFDF5' }]}>
        <Ionicons name={outgoing ? 'arrow-up' : 'arrow-down'} size={18} color={outgoing ? colors.danger : colors.success} />
      </View>
      <View style={styles.flex}>
        <Text variant="label">{item.description}</Text>
        <Text variant="caption" color="#64748B">{item.type} • {item.status}</Text>
      </View>
      <Text variant="h3" color={outgoing ? colors.danger : colors.success}>{outgoing ? '-' : '+'}{formatNaira(item.amount)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 840, gap: spacing.lg },
  balance: { backgroundColor: colors.secondary, borderColor: colors.secondary, minHeight: 170, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  amount: { fontSize: 38, fontWeight: '800' },
  fund: { gap: spacing.md },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  method: { flex: 1, minWidth: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 48, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radii.md },
  methodSelected: { borderColor: colors.primary, backgroundColor: '#FFF9F2' },
  bankCard: { gap: spacing.md, borderColor: '#FED7AA', backgroundColor: '#FFF9F2' },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  list: { gap: spacing.sm },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  transaction: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 }
});
