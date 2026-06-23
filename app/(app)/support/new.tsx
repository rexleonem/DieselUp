import { useState } from 'react';
import { StyleSheet, View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/hooks/useTheme';
import { colors, radii, spacing } from '@/theme/tokens';

export default function NewTicketScreen() {
  const { profile } = useAuth();
  const theme = useTheme();
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please provide both a subject and a description.');
      return;
    }

    if (!profile?.id) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        customerId: profile.id,
        subject: subject.trim(),
        description: description.trim(),
        status: 'open',
        priority: 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Screen header={<AppHeader title="New Ticket" showBack />} edges={['top', 'bottom']}>
      <Card style={styles.formCard}>
        <Text variant="h3" style={{ marginBottom: spacing.md }}>How can we help?</Text>
        
        <View style={styles.field}>
          <Text variant="label" color={theme.colors.muted}>Subject</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholderTextColor={theme.colors.muted}
            placeholder="E.g. Delivery delayed"
            value={subject}
            onChangeText={setSubject}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text variant="label" color={theme.colors.muted}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholderTextColor={theme.colors.muted}
            placeholder="Please describe your issue in detail..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
        </View>

        <Button 
          title="Submit Ticket" 
          onPress={handleSubmit} 
          disabled={loading || !subject || !description}
          style={{ marginTop: spacing.md }}
        />
        {loading && <ActivityIndicator style={styles.loader} color={colors.primary} />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: { padding: spacing.xl },
  field: { marginBottom: spacing.lg, gap: spacing.sm },
  input: { height: 48, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md, fontSize: 16 },
  textArea: { height: 120, paddingTop: spacing.md },
  loader: { position: 'absolute', right: spacing.xl, bottom: spacing.xl + 12 }
});
