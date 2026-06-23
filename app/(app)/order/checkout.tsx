import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { doc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ErrorState, LoadingState } from '@/components/ui/StateView';
import { OrderHeader } from '@/features/order/OrderHeader';
import { useAppStore } from '@/store/app';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { db, storage } from '@/lib/firebase';
import { createOrder, getOrderQuote, type QuoteResponse } from '@/services/functions';
import { formatNaira } from '@/lib/format';
import { colors, radii, spacing } from '@/theme/tokens';
import type { BankAccount, DeliveryMode, PaymentMethod, Wallet } from '@/types/domain';

const modeLabels: Record<DeliveryMode, string> = {
  quick: 'Quick delivery',
  emergency: 'Emergency delivery',
  scheduled: 'Scheduled delivery'
};

export default function CheckoutStep() {
  const draft = useAppStore((state) => state.orderDraft);
  const clear = useAppStore((state) => state.clearOrderDraft);
  const { firebaseUser } = useAuth();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');
  const [verificationMethod, setVerificationMethod] = useState<'otp' | 'qr'>('otp');
  const [transferReference, setTransferReference] = useState('');
  const [proof, setProof] = useState<{ url: string; path: string; name: string } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const walletRef = useMemo(() => firebaseUser ? doc(db, 'wallets', firebaseUser.uid) : null, [firebaseUser]);
  const bankRef = useMemo(() => doc(db, 'settings', 'payment'), []);
  const wallet = useRealtimeDocument<Wallet>(walletRef);
  const bankAccount = useRealtimeDocument<BankAccount>(bankRef);
  const bank = bankAccount.data;

  useEffect(() => {
    if (!draft.address || !draft.quantityLitres || !draft.supplierId) {
      router.replace('/order/location');
      return;
    }
    setQuote(null);
    setQuoteError('');
    getOrderQuote({
      supplierId: draft.supplierId,
      quantityLitres: draft.quantityLitres,
      deliveryAddress: draft.address,
      isEmergency: draft.isEmergency,
      deliveryMode: draft.deliveryMode,
      scheduledFor: draft.scheduledFor
    }).then(setQuote).catch((reason) => setQuoteError(reason instanceof Error ? reason.message : 'Unable to calculate quote.'));
  }, [draft]);

  const uploadProof = async () => {
    if (!firebaseUser) return;
    try {
      setUploadingProof(true);
      setQuoteError('');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission is required to upload payment proof.');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const fileName = `${Date.now()}-${(asset.fileName ?? 'transfer-proof.jpg').replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const fileRef = storageRef(storage, `manual-funding-proofs/${firebaseUser.uid}/${fileName}`);
      const blob = await (await fetch(asset.uri)).blob();
      await uploadBytes(fileRef, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
      const url = await getDownloadURL(fileRef);
      setProof({ url, path: fileRef.fullPath, name: fileName });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (reason) {
      setQuoteError(reason instanceof Error ? reason.message : 'Unable to upload proof.');
    } finally {
      setUploadingProof(false);
    }
  };

  const submit = async () => {
    if (!quote || !draft.address || !draft.quantityLitres || !draft.supplierId) return;
    if (paymentMethod === 'bank_transfer' && !proof) {
      setQuoteError('Upload bank transfer proof before submitting this order.');
      return;
    }
    if (paymentMethod === 'bank_transfer' && !bank) {
      setQuoteError('Bank transfer is not available until an admin configures a receiving account.');
      return;
    }
    try {
      setSubmitting(true);
      setQuoteError('');
      const result = await createOrder({
        quoteId: quote.quoteId,
        supplierId: draft.supplierId,
        quantityLitres: draft.quantityLitres,
        deliveryAddress: draft.address,
        isEmergency: draft.isEmergency,
        deliveryMode: draft.deliveryMode,
        scheduledFor: draft.scheduledFor,
        paymentMethod,
        verificationMethod,
        manualFundingProofUrl: proof?.url,
        manualFundingProofPath: proof?.path,
        manualFundingTransferReference: transferReference,
        bankAccount: bank ?? null
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clear();
      if (result.paymentUrl) await WebBrowser.openBrowserAsync(result.paymentUrl);
      router.replace({ pathname: '/order/acknowledgement' as never, params: { orderId: result.orderId } });
    } catch (reason) {
      setQuoteError(reason instanceof Error ? reason.message : 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (quoteError && !quote) return <Screen header={<OrderHeader step={4} title="Checkout" />}><ErrorState message={quoteError} onRetry={() => router.back()} /></Screen>;
  if (!quote) return <Screen header={<OrderHeader step={4} title="Checkout" />}><LoadingState label="Securing live quote…" /></Screen>;

  const walletBalance = wallet.data?.availableBalance ?? 0;
  const walletInsufficient = paymentMethod === 'wallet' && walletBalance < quote.money.total;
  const bankBlocked = paymentMethod === 'bank_transfer' && (!bank || !proof);
  const submitTitle = paymentMethod === 'wallet'
    ? `Pay ${formatNaira(quote.money.total)} from wallet`
    : paymentMethod === 'bank_transfer'
      ? 'Submit bank transfer proof'
      : 'Continue to Paystack';

  return (
    <Screen header={<OrderHeader step={4} title="Checkout" />} contentStyle={styles.content}>
      <View>
        <Text variant="h1">Review and pay</Text>
        <Text color="#64748B">
          {modeLabels[draft.deliveryMode] ?? 'Quick delivery'}{draft.scheduledFor ? ` • ${new Date(draft.scheduledFor).toLocaleString()}` : ''}
        </Text>
      </View>

      <Card style={styles.summary}>
        <Row label={`${draft.quantityLitres?.toLocaleString()} L fuel`} value={formatNaira(quote.money.fuelCost)} />
        <Row label={draft.isEmergency ? 'Priority delivery' : 'Delivery'} value={formatNaira(quote.money.deliveryFee)} />
        <Row label="Tax" value={formatNaira(quote.money.tax)} />
        <View style={styles.divider} />
        <Row label="Total" value={formatNaira(quote.money.total)} strong />
      </Card>

      <Text variant="h3">Payment method</Text>
      <PaymentOption selected={paymentMethod === 'paystack'} icon="card-outline" title="Paystack" detail="Card, bank transfer, USSD or mobile money" onPress={() => setPaymentMethod('paystack')} />
      <PaymentOption selected={paymentMethod === 'wallet'} icon="wallet-outline" title="DieselUp wallet" detail={wallet.data ? `${formatNaira(walletBalance)} available` : 'Wallet has not been funded'} onPress={() => setPaymentMethod('wallet')} />
      <PaymentOption selected={paymentMethod === 'bank_transfer'} icon="business-outline" title="Manual bank transfer" detail="Transfer to DieselUp account, upload proof, and wait for admin approval" onPress={() => setPaymentMethod('bank_transfer')} />

      {paymentMethod === 'bank_transfer' ? (
        <Card style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <View>
              <Text variant="h3">Bank account</Text>
              <Text variant="caption" color="#64748B">Use this account for direct order payment. Delivery starts after admin approval.</Text>
            </View>
            <View style={styles.pendingPill}><Text variant="caption" color={colors.warning}>Manual review</Text></View>
          </View>
          {bank ? (
            <>
              <BankRow label="Bank" value={bank.bankName} />
              <BankRow label="Account name" value={bank.accountName} />
              <BankRow label="Account number" value={bank.accountNumber} />
              {bank.instructions ? <Text variant="caption" color="#64748B">{bank.instructions}</Text> : null}
              <Input label="Transfer reference / narration" value={transferReference} onChangeText={setTransferReference} placeholder={bank.referencePrefix ? `${bank.referencePrefix}-...` : 'Your bank transaction reference'} />
              <Button title={proof ? `Proof uploaded: ${proof.name}` : 'Upload transfer proof'} variant={proof ? 'outline' : 'secondary'} icon={proof ? 'checkmark-circle-outline' : 'cloud-upload-outline'} loading={uploadingProof} onPress={uploadProof} />
            </>
          ) : (
            <Text color={colors.danger}>Bank transfer is unavailable because no receiving bank account has been configured by an admin.</Text>
          )}
        </Card>
      ) : null}

      <Text variant="h3">Delivery verification</Text>
      <View style={styles.methods}>
        <Pressable onPress={() => setVerificationMethod('otp')} style={[styles.method, verificationMethod === 'otp' && styles.selected]}>
          <Ionicons name="keypad-outline" size={22} color={colors.primary} />
          <Text variant="label">OTP code</Text>
        </Pressable>
        <Pressable onPress={() => setVerificationMethod('qr')} style={[styles.method, verificationMethod === 'qr' && styles.selected]}>
          <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
          <Text variant="label">QR code</Text>
        </Pressable>
      </View>
      <Text variant="caption" color="#64748B">The server revalidates price, inventory, wallet balance, identity, payment proof, and supplier availability before creating this order.</Text>
      {quoteError ? <Text color={colors.danger}>{quoteError}</Text> : null}
      <Button title={submitTitle} loading={submitting} disabled={walletInsufficient || bankBlocked} onPress={submit} />
      {walletInsufficient ? <Text color={colors.danger}>Your wallet balance is lower than this order total.</Text> : null}
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.row}><Text variant={strong ? 'h3' : 'body'}>{label}</Text><Text variant={strong ? 'h2' : 'label'}>{value}</Text></View>;
}

function BankRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text color="#64748B">{label}</Text><Text variant="label">{value}</Text></View>;
}

function PaymentOption({ selected, icon, title, detail, onPress }: { selected: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.payment, selected && styles.selected]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <View style={styles.flex}>
          <Text variant="label">{title}</Text>
          <Text variant="caption" color="#64748B">{detail}</Text>
        </View>
        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : '#94A3B8'} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 780, gap: spacing.lg },
  summary: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  divider: { height: 1, backgroundColor: '#E2E8F0' },
  payment: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selected: { borderColor: colors.primary, backgroundColor: '#FFF9F2' },
  flex: { flex: 1 },
  bankCard: { gap: spacing.md, borderColor: '#FED7AA', backgroundColor: '#FFF9F2' },
  bankHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  pendingPill: { borderRadius: radii.full, backgroundColor: '#FFFBEB', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  methods: { flexDirection: 'row', gap: spacing.md },
  method: { flex: 1, minHeight: 90, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }
});
