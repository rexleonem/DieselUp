import { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/lib/firebase';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';
import { colors, radii, spacing } from '@/theme/tokens';
import type { SupportTicket } from '@/types/domain';

export default function SupportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTicket() {
      if (!id) return;
      try {
        const snapshot = await getDoc(doc(db, 'support_tickets', id));
        if (snapshot.exists()) {
          setTicket({ id: snapshot.id, ...snapshot.data() } as SupportTicket);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [id]);

  if (loading) {
    return <Screen header={<AppHeader title="Ticket Details" showBack backHref="/(app)/support" />}><ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} /></Screen>;
  }

  if (!ticket) {
    return (
      <Screen header={<AppHeader title="Ticket Not Found" showBack backHref="/(app)/support" />}>
        <Text color={theme.colors.muted} style={{ textAlign: 'center', marginTop: 40 }}>We could not find this support ticket.</Text>
      </Screen>
    );
  }

  const statusColors = {
    open: colors.primary,
    in_progress: colors.accent,
    resolved: colors.success
  };

  return (
    <Screen header={<AppHeader title="Ticket Details" showBack backHref="/(app)/support" />} edges={['top', 'bottom']}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: statusColors[ticket.status] + '20' }]}>
            <Text variant="caption" color={statusColors[ticket.status]}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text variant="caption" color={theme.colors.muted}>
            Created on {ticket.createdAt?.toDate().toLocaleDateString()}
          </Text>
        </View>
        
        <Text variant="h2" style={styles.subject}>{ticket.subject}</Text>
        
        <View style={styles.divider} />
        
        <Text color={theme.colors.text} style={styles.description}>
          {ticket.description}
        </Text>
      </Card>
      
      <View style={styles.supportNote}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.muted} />
        <Text variant="caption" color={theme.colors.muted} style={{ flex: 1 }}>
          Our support team has received your ticket and will contact you via your registered email or phone number shortly.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  subject: { marginBottom: spacing.lg },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: spacing.md },
  description: { lineHeight: 24 },
  supportNote: { flexDirection: 'row', gap: spacing.md, padding: spacing.xl, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: radii.lg }
});
