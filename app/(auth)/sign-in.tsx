import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { doc, getDoc } from 'firebase/firestore';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FirebaseError } from 'firebase/app';
import { Screen } from '@/components/ui/Screen';
import { Brand } from '@/components/ui/Brand';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { signInWithGoogleIdToken, useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { env } from '@/lib/env';
import { upsertAccountProfile } from '@/services/functions';
import { colors, spacing } from '@/theme/tokens';

const schema = z.object({ email: z.email('Enter a valid email'), password: z.string().min(8, 'Password must be at least 8 characters') });
type Values = z.infer<typeof schema>;
WebBrowser.maybeCompleteAuthSession();

const missingNativeGoogleMessage = () => {
  if (Platform.OS === 'android' && !env.googleAndroidClientId) {
    return 'Google sign-in is not configured for Android yet. Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to .env/EAS after creating an Android OAuth client for com.dieselup.app.';
  }
  if (Platform.OS === 'ios' && !env.googleIosClientId) {
    return 'Google sign-in is not configured for iOS yet. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to .env/EAS after creating an iOS OAuth client.';
  }
  return '';
};

export default function SignInScreen() {
  const { signInEmail, signInGoogle } = useAuth();
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleConfigIssue = useMemo(() => missingNativeGoogleMessage(), []);
  const fallbackClientId = env.googleAndroidClientId ?? env.googleIosClientId ?? env.googleWebClientId ?? 'google-client-id-not-configured';
  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    webClientId: env.googleWebClientId ?? fallbackClientId,
    androidClientId: env.googleAndroidClientId ?? fallbackClientId,
    iosClientId: env.googleIosClientId ?? fallbackClientId,
    clientId: fallbackClientId
  });

  useEffect(() => {
    if (Platform.OS === 'web' || googleResponse?.type !== 'success') return;
    const paramsToken = (googleResponse as { params?: { id_token?: string } }).params?.id_token;
    const idToken = googleResponse.authentication?.idToken ?? paramsToken;
    if (!idToken) {
      setError('Google did not return an ID token. Check the native OAuth client configuration.');
      return;
    }
    (async () => {
      try {
        setGoogleLoading(true);
        const user = await signInWithGoogleIdToken(idToken);
        if (!(await getDoc(doc(db, 'users', user.uid))).exists()) {
          await upsertAccountProfile({ displayName: user.displayName ?? user.email?.split('@')[0] ?? 'DieselUp User', role: 'customer' });
        }
        await user.getIdToken(true);
        router.replace('/');
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Google sign-in failed.');
      } finally {
        setGoogleLoading(false);
      }
    })();
  }, [googleResponse]);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const submit = handleSubmit(async (values) => {
    try {
      setError('');
      await signInEmail(values.email, values.password);
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof FirebaseError ? 'Email or password is incorrect.' : reason instanceof Error ? reason.message : 'Unable to sign in.');
    }
  });

  const google = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      if (Platform.OS === 'web') {
        await signInGoogle();
        return;
      }
      if (googleConfigIssue) {
        setError(googleConfigIssue);
        return;
      }
      if (!googleRequest) {
        setError('Google sign-in is still initializing. Please try again.');
        return;
      }
      await promptGoogle();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google sign-in failed.');
    } finally {
      if (Platform.OS === 'web' || googleConfigIssue || !googleRequest) setGoogleLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <Brand />
        <Pressable onPress={() => router.back()}><Text color={colors.primary}>Back</Text></Pressable>
      </View>
      <Card style={styles.card}>
        <View style={styles.title}>
          <Text variant="h1">Welcome back</Text>
          <Text color="#64748B">Sign in to manage your DieselUp account.</Text>
        </View>
        {error ? <Text color={colors.danger} style={styles.error}>{error}</Text> : null}
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input label="Email address" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.email?.message} />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input label="Password" icon="lock-closed-outline" secureTextEntry autoComplete="current-password" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={errors.password?.message} />
          )}
        />
        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text variant="label" color={colors.primary} style={styles.right}>Forgot password?</Text>
        </Pressable>
        <Button title="Sign in" loading={isSubmitting} onPress={submit} />
        <View style={styles.divider}><View style={styles.line} /><Text variant="caption" color="#94A3B8">OR</Text><View style={styles.line} /></View>
        <Button title="Continue with Google" variant="outline" icon="logo-google" loading={googleLoading} disabled={Platform.OS !== 'web' && !googleRequest} onPress={google} />
        <Button title="Continue with phone" variant="ghost" icon="call-outline" onPress={() => router.push('/(auth)/phone')} />
        <View style={styles.signup}>
          <Text color="#64748B">New to DieselUp?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')}><Text variant="label" color={colors.primary}>Create an account</Text></Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.xl },
  top: { width: '100%', maxWidth: 520, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.lg, padding: spacing.xl },
  title: { gap: spacing.sm },
  error: { backgroundColor: '#FEF2F2', padding: spacing.md, borderRadius: 10 },
  right: { textAlign: 'right' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { height: 1, flex: 1, backgroundColor: '#E2E8F0' },
  signup: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' }
});
