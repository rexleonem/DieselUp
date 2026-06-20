import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import nativeAuth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { signInWithCustomToken } from 'firebase/auth';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { auth } from '@/lib/firebase';
import { env } from '@/lib/env';
import { upsertAccountProfile } from '@/services/functions';
import { colors, spacing } from '@/theme/tokens';

export function PhoneAuthScreen() {
  const [phone, setPhone] = useState('+234'); const [code, setCode] = useState(''); const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const send = async () => { try { setLoading(true); setError(''); setConfirmation(await nativeAuth().signInWithPhoneNumber(phone.replace(/\s/g, ''))); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send code.'); } finally { setLoading(false); } };
  const verify = async () => { if (!confirmation) return; try { setLoading(true); setError(''); const credential = await confirmation.confirm(code); if (!credential) throw new Error('Verification failed.'); const idToken = await credential.user.getIdToken(true); const endpoint = `https://us-central1-${env.projectId}.cloudfunctions.net/exchangeNativeFirebaseToken`; const exchange = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }); const payload = await exchange.json() as { customToken?: string; error?: string }; if (!exchange.ok || !payload.customToken) throw new Error(payload.error ?? 'Unable to establish DieselUp session.'); const result = await signInWithCustomToken(auth, payload.customToken); await upsertAccountProfile({ displayName: result.user.displayName ?? result.user.phoneNumber ?? 'DieselUp Customer', phoneNumber: result.user.phoneNumber ?? undefined, role: 'customer' }); await result.user.getIdToken(true); router.replace('/'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'The verification code is invalid or expired.'); } finally { setLoading(false); } };
  return <Screen contentStyle={styles.content}><Card style={styles.card}><Text variant="h1">Phone sign-in</Text><Text color="#64748B">Firebase will verify this device and send a one-time SMS code.</Text>{error ? <Text color={colors.danger}>{error}</Text> : null}{!confirmation ? <><Input label="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} /><Button title="Send verification code" loading={loading} onPress={send} /></> : <><Input label="6-digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} /><Button title="Verify and continue" loading={loading} disabled={code.length !== 6} onPress={verify} /></>}<Button title="Back" variant="ghost" onPress={() => router.back()} /></Card></Screen>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'center' }, card: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.lg } });
