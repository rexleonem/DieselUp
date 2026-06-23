import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OrderHeader } from '@/features/order/OrderHeader';
import { useAppStore } from '@/store/app';
import { colors, radii, spacing } from '@/theme/tokens';
import type { DeliveryMode } from '@/types/domain';

const options = [50, 100, 200, 500, 1000];
const modeCopy: Record<DeliveryMode, { title: string; detail: string; icon: keyof typeof Ionicons.glyphMap }> = {
  quick: { title: 'Quick delivery', detail: 'Today’s live supplier marketplace will be used.', icon: 'flash-outline' },
  emergency: { title: 'Emergency delivery', detail: 'Priority suppliers and any configured emergency surcharge apply.', icon: 'alert-circle-outline' },
  scheduled: { title: 'Scheduled delivery', detail: 'Supplier comparison will use your selected future delivery slot.', icon: 'calendar-outline' }
};

export default function QuantityStep() {
  const draft = useAppStore((state) => state.orderDraft);
  const patch = useAppStore((state) => state.patchOrderDraft);
  const [quantity, setQuantity] = useState<number | undefined>(draft.quantityLitres);
  const [custom, setCustom] = useState(quantity && !options.includes(quantity) ? String(quantity) : '');
  const mode = modeCopy[draft.deliveryMode] ?? modeCopy.quick;
  const choose = async (value: number) => {
    setQuantity(value);
    setCustom('');
    await Haptics.selectionAsync();
  };
  const customChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setCustom(cleaned);
    setQuantity(cleaned ? Number(cleaned) : undefined);
  };
  const valid = !!quantity && quantity >= 50 && quantity <= 50_000;
  const next = () => {
    if (!quantity) return;
    patch({ quantityLitres: quantity });
    router.push('/order/suppliers');
  };

  return (
    <Screen header={<OrderHeader step={2} title="Diesel quantity" />} contentStyle={styles.content}>
      <Card style={styles.modeBanner}>
        <View style={styles.modeIcon}><Ionicons name={mode.icon} size={21} color={colors.primary} /></View>
        <View style={styles.flex}>
          <Text variant="label">{mode.title}</Text>
          <Text variant="caption" color="#64748B">
            {draft.deliveryMode === 'scheduled' && draft.scheduledFor ? `Scheduled for ${new Date(draft.scheduledFor).toLocaleString()}` : mode.detail}
          </Text>
        </View>
      </Card>

      <Text variant="h1">How much diesel?</Text>
      <Text color="#64748B">Minimum order is 50 litres. Large orders are checked against live supplier inventory.</Text>
      <View style={styles.grid}>
        {options.map((value) => (
          <Pressable key={value} onPress={() => choose(value)} style={[styles.option, { borderColor: quantity === value ? colors.primary : '#E2E8F0', backgroundColor: quantity === value ? '#FFF7ED' : '#FFFFFF' }]}>
            <Text variant="h2" color={quantity === value ? colors.primary : undefined}>{value.toLocaleString()}</Text>
            <Text variant="caption" color="#64748B">LITRES</Text>
          </Pressable>
        ))}
      </View>
      <Card style={styles.custom}>
        <Text variant="h3">Custom quantity</Text>
        <Input keyboardType="number-pad" placeholder="Enter litres" value={custom} onChangeText={customChange} />
        <Text variant="caption" color={valid ? colors.success : '#64748B'}>{valid ? `${quantity?.toLocaleString()} litres selected` : 'Enter 50–50,000 litres'}</Text>
      </Card>
      <Button title="Compare suppliers" disabled={!valid} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 900, gap: spacing.lg },
  flex: { flex: 1 },
  modeBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#FFF9F2', borderColor: '#FED7AA' },
  modeIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  option: { minWidth: 130, flexGrow: 1, minHeight: 100, borderWidth: 1, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', gap: 3 },
  custom: { gap: spacing.md }
});
