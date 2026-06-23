import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, radii, spacing } from '@/theme/tokens';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={styles.row}><LinearGradient colors={['#FF9F1C', '#F97316']} style={[styles.mark, compact && styles.compact]}><Ionicons name="water" size={compact ? 16 : 24} color="white" /></LinearGradient><Text variant={compact ? 'h3' : 'h2'} style={styles.brandText}>Diesel<Text variant={compact ? 'h3' : 'h2'} color={colors.primary} style={styles.brandText}>Up</Text></Text></View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, mark: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }, compact: { width: 30, height: 30, borderRadius: 8 }, brandText: { fontWeight: '900', letterSpacing: -1 } });
