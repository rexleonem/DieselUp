import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { auth } from '@/lib/firebase';
import { upsertAccountProfile } from '@/services/functions';
import { colors, spacing } from '@/theme/tokens';

export function PhoneAuthScreen() {
  const [phone, setPhone] = useState('+234'); const [code, setCode] = useState(''); const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const verifier = useRef<RecaptchaVerifier | null>(null);
  useEffect(() => { verifier.current = new RecaptchaVerifier(auth, 'dieselup-recaptcha', { size: 'invisible' }); return () => { verifier.current?.clear(); verifier.current = null; }; }, []);
  const send = async () => { if (!verifier.current) return; try { setLoading(true); setError(''); setConfirmation(await signInWithPhoneNumber(auth, phone.replace(/\s/g, ''), verifier.current)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to send code.'); } finally { setLoading(false); } };
  const verify = async () => { if (!confirmation) return; try { setLoading(true); const result = await confirmation.confirm(code); await upsertAccountProfile({ displayName: result.user.displayName ?? result.user.phoneNumber ?? 'DieselUp Customer', phoneNumber: result.user.phoneNumber ?? undefined, role: 'customer' }); await result.user.getIdToken(true); router.replace('/'); } catch { setError('The verification code is invalid or expired.'); } finally { setLoading(false); } };
  return <Screen contentStyle={styles.content}><Card style={styles.card}><Text variant="h1">Phone sign-in</Text><Text color="#64748B">We’ll send a Firebase verification code to your mobile number.</Text>{error ? <Text color={colors.danger}>{error}</Text> : null}{!confirmation ? <><Input label="Phone number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} /><View nativeID="dieselup-recaptcha" /><Button title="Send verification code" loading={loading} onPress={send} /></> : <><Input label="6-digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} /><Button title="Verify and continue" loading={loading} disabled={code.length !== 6} onPress={verify} /></>}<Button title="Back" variant="ghost" onPress={() => router.back()} /></Card></Screen>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'center' }, card: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.lg } });
