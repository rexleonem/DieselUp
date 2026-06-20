import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from './ui/Screen';
import { Brand } from './ui/Brand';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { configurationErrors } from '@/lib/env';
import { colors, spacing } from '@/theme/tokens';

export function ConfigurationRequired() {
  return <Screen contentStyle={styles.content}><Brand /><Card style={styles.card}><Ionicons name="construct-outline" size={38} color={colors.primary} /><Text variant="h2">Connect your production services</Text><Text color="#64748B">DieselUp will not fabricate operational data. Copy .env.example to .env and provide the Firebase, Google Maps, and Paystack public configuration to start the app.</Text><View style={styles.list}>{configurationErrors.map((item) => <Text key={item} variant="caption" color={colors.danger}>• {item}</Text>)}</View></Card></Screen>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.xl }, card: { width: '100%', maxWidth: 560, gap: spacing.md }, list: { gap: spacing.xs } });
