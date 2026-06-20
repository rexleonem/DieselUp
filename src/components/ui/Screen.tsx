import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';

export function Screen({ children, scroll = true, contentStyle, refreshControl, header }: PropsWithChildren<{ scroll?: boolean; contentStyle?: StyleProp<ViewStyle>; refreshControl?: ScrollViewProps['refreshControl']; header?: ReactNode }>) {
  const theme = useTheme();
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{children}</ScrollView>
  ) : <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>;
  return <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.colors.background }]}>{header}{body}</SafeAreaView>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { width: '100%', maxWidth: 1240, alignSelf: 'center', padding: spacing.lg, paddingBottom: 96 } });
