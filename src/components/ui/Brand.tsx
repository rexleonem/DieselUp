import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { colors, radii, spacing } from '@/theme/tokens';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={styles.row}><LinearGradient colors={['#FF9F1C', '#F97316']} style={[styles.mark, compact && styles.compact]}><Ionicons name="water" size={compact ? 18 : 24} color="white" /></LinearGradient><Text variant={compact ? 'h3' : 'h2'}>Diesel<Text variant={compact ? 'h3' : 'h2'} color={colors.primary}>Up</Text></Text></View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, mark: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' }, compact: { width: 34, height: 34, borderRadius: 10 } });
