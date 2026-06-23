import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { db } from '@/lib/firebase';
import { colors, spacing } from '@/theme/tokens';
import type { BankAccount } from '@/types/domain';

type Market = { currentPricePerLitre: number; previousPricePerLitre: number; taxRate: number; emergencySurchargeRate: number };

export default function AdminSettingsScreen() {
  const marketRef = useMemo(() => doc(db, 'settings', 'market'), []);
  const paymentRef = useMemo(() => doc(db, 'settings', 'payment'), []);
  const { data: market } = useRealtimeDocument<Market>(marketRef);
  const { data: payment } = useRealtimeDocument<BankAccount>(paymentRef);
  const [price, setPrice] = useState('');
  const [tax, setTax] = useState('');
  const [emergencyRate, setEmergencyRate] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [referencePrefix, setReferencePrefix] = useState('');
  const [instructions, setInstructions] = useState('');
  const [marketSaved, setMarketSaved] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

  const saveMarket = async () => {
    const nextPrice = Number(price || market?.currentPricePerLitre);
    await setDoc(marketRef, {
      previousPricePerLitre: market?.currentPricePerLitre ?? nextPrice,
      currentPricePerLitre: nextPrice,
      taxRate: Number(tax || market?.taxRate || 0),
      emergencySurchargeRate: Number(emergencyRate || market?.emergencySurchargeRate || 0),
      updatedAt: serverTimestamp()
    }, { merge: true });
    setPrice('');
    setTax('');
    setEmergencyRate('');
    setMarketSaved(true);
  };

  const savePayment = async () => {
    const next = {
      bankName: (bankName || payment?.bankName || '').trim(),
      accountName: (accountName || payment?.accountName || '').trim(),
      accountNumber: (accountNumber || payment?.accountNumber || '').trim(),
      referencePrefix: (referencePrefix || payment?.referencePrefix || 'DU').trim(),
      instructions: (instructions || payment?.instructions || 'Use your DieselUp order number or wallet funding reference as the transfer narration.').trim(),
      updatedAt: serverTimestamp()
    };
    if (!next.bankName || !next.accountName || !next.accountNumber) return;
    await setDoc(paymentRef, next, { merge: true });
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setReferencePrefix('');
    setInstructions('');
    setPaymentSaved(true);
  };

  return (
    <Screen header={<AppHeader title="System settings" showBack backHref="/(app)/(tabs)/more" />} contentStyle={styles.content}>
      <Card style={styles.card}>
        <Text variant="h2">Market pricing</Text>
        <Text color="#64748B">Published reference prices are informational. Supplier quotes remain inventory-specific and server-calculated.</Text>
        <Input label={`Current reference price (${market?.currentPricePerLitre ?? 'not set'})`} keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
        <Input label={`Tax rate decimal (${market?.taxRate ?? 0})`} keyboardType="decimal-pad" value={tax} onChangeText={setTax} />
        <Input label={`Emergency surcharge decimal (${market?.emergencySurchargeRate ?? 0})`} keyboardType="decimal-pad" value={emergencyRate} onChangeText={setEmergencyRate} />
        <Button title="Publish market settings" onPress={saveMarket} />
        {marketSaved ? <Text color={colors.success}>Market settings saved.</Text> : null}
      </Card>

      <Card style={styles.card}>
        <Text variant="h2">Payment receiving account</Text>
        <Text color="#64748B">This account appears in manual bank-transfer checkout and wallet funding. Customers must upload proof for admin approval.</Text>
        <Input label={`Bank name (${payment?.bankName ?? 'not set'})`} value={bankName} onChangeText={setBankName} />
        <Input label={`Account name (${payment?.accountName ?? 'not set'})`} value={accountName} onChangeText={setAccountName} />
        <Input label={`Account number (${payment?.accountNumber ?? 'not set'})`} keyboardType="number-pad" value={accountNumber} onChangeText={(value) => setAccountNumber(value.replace(/\D/g, ''))} />
        <Input label={`Reference prefix (${payment?.referencePrefix ?? 'DU'})`} value={referencePrefix} onChangeText={setReferencePrefix} />
        <Input label="Customer instructions" value={instructions} onChangeText={setInstructions} placeholder={payment?.instructions ?? 'Use your order number or wallet reference as narration.'} />
        <Button title="Save payment account" onPress={savePayment} disabled={!(bankName || payment?.bankName) || !(accountName || payment?.accountName) || !(accountNumber || payment?.accountNumber)} />
        {paymentSaved ? <Text color={colors.success}>Payment receiving account saved.</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 760, gap: spacing.lg },
  card: { gap: spacing.lg }
});
