import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/StateView';
import { OrderHeader } from '@/features/order/OrderHeader';
import { LocationMap } from '@/components/maps/LocationMap';
import { useAppStore } from '@/store/app';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery';
import { db } from '@/lib/firebase';
import { getAddressDetails, searchAddresses } from '@/services/functions';
import { colors, radii, spacing } from '@/theme/tokens';
import type { Address, DeliveryMode } from '@/types/domain';

const deliveryModes: {
  mode: DeliveryMode;
  title: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: 'quick', title: 'Quick delivery', detail: 'Best supplier match for today’s normal delivery window.', icon: 'flash-outline' },
  { mode: 'emergency', title: 'Emergency delivery', detail: 'Priority dispatch for generators, hospitals, events, and critical sites.', icon: 'alert-circle-outline' },
  { mode: 'scheduled', title: 'Scheduled delivery', detail: 'Book a future date and time for planned replenishment.', icon: 'calendar-outline' }
];

const readParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
const toTimeInput = (date: Date) => date.toTimeString().slice(0, 5);
const initialSchedule = () => {
  const date = new Date(Date.now() + 2 * 60 * 60_000);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  return { date: toDateInput(date), time: toTimeInput(date) };
};

export default function LocationStep() {
  const params = useLocalSearchParams<{ mode?: string; emergency?: string; scheduled?: string }>();
  const { firebaseUser } = useAuth();
  const patch = useAppStore((state) => state.patchOrderDraft);
  const draft = useAppStore((state) => state.orderDraft);
  const requestedMode = readParam(params.mode);
  const initialMode: DeliveryMode = requestedMode === 'emergency' || readParam(params.emergency) === 'true'
    ? 'emergency'
    : requestedMode === 'scheduled' || readParam(params.scheduled) === 'true'
      ? 'scheduled'
      : draft.deliveryMode ?? 'quick';
  const schedule = draft.scheduledFor ? new Date(draft.scheduledFor) : null;
  const fallbackSchedule = initialSchedule();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(initialMode);
  const [scheduleDate, setScheduleDate] = useState(schedule && !Number.isNaN(schedule.getTime()) ? toDateInput(schedule) : fallbackSchedule.date);
  const [scheduleTime, setScheduleTime] = useState(schedule && !Number.isNaN(schedule.getTime()) ? toTimeInput(schedule) : fallbackSchedule.time);
  const [selected, setSelected] = useState<Address | undefined>(draft.address);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const savedQuery = useMemo(() => firebaseUser ? query(collection(db, 'customers', firebaseUser.uid, 'addresses'), orderBy('updatedAt', 'desc'), limit(10)) : null, [firebaseUser]);
  const saved = useRealtimeQuery<Address>(savedQuery);
  const scheduledFor = deliveryMode === 'scheduled' ? new Date(`${scheduleDate}T${scheduleTime}:00`) : null;
  const scheduleError = deliveryMode === 'scheduled' && (!scheduleDate || !scheduleTime || !scheduledFor || Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now() + 30 * 60_000)
    ? 'Choose a future delivery slot at least 30 minutes from now.'
    : '';
  const activeMode = deliveryModes.find((item) => item.mode === deliveryMode) ?? deliveryModes[0];

  const useCurrentLocation = async () => {
    try {
      setBusy(true);
      setError('');
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Location permission is required to use your current location.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      let formattedAddress = `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;
      try {
        const geocoded = await Location.reverseGeocodeAsync(point);
        const item = geocoded[0];
        if (item) formattedAddress = [item.name, item.street, item.city, item.region].filter(Boolean).join(', ') || formattedAddress;
      } catch {
        // A coordinate is still a valid delivery point; reverse geocoding is only a convenience label.
      }
      setSelected({ label: 'Current location', formattedAddress, location: point });
      await Haptics.selectionAsync();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to get current location.');
    } finally {
      setBusy(false);
    }
  };

  const find = async (value: string) => {
    setSearch(value);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      setSuggestions(await searchAddresses(value.trim()));
      setError('');
    } catch {
      setError('Address search is temporarily unavailable.');
    }
  };

  const chooseSuggestion = async (item: { placeId: string; description: string }) => {
    try {
      setBusy(true);
      setError('');
      const details = await getAddressDetails(item.placeId);
      setSelected({ label: 'Delivery location', formattedAddress: details.formattedAddress, location: details.location, placeId: item.placeId });
      setSuggestions([]);
      setSearch('');
    } catch {
      setError('Unable to validate that address.');
    } finally {
      setBusy(false);
    }
  };

  const chooseMode = async (mode: DeliveryMode) => {
    setDeliveryMode(mode);
    await Haptics.selectionAsync();
  };

  const next = () => {
    if (!selected || scheduleError) return;
    patch({
      address: selected,
      deliveryMode,
      isEmergency: deliveryMode === 'emergency',
      scheduledFor: deliveryMode === 'scheduled' && scheduledFor ? scheduledFor.toISOString() : undefined
    });
    router.push('/order/quantity');
  };

  return (
    <Screen header={<OrderHeader step={1} title={activeMode.title} />} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name={activeMode.icon} size={26} color={colors.primary} /></View>
        <View style={styles.flex}>
          <Text variant="h1">Set up your {activeMode.title.toLowerCase()}</Text>
          <Text color="#64748B">{activeMode.detail}</Text>
        </View>
      </View>

      <View style={styles.modeGrid}>
        {deliveryModes.map((item) => (
          <Pressable key={item.mode} onPress={() => chooseMode(item.mode)} style={[styles.mode, deliveryMode === item.mode && styles.modeSelected]}>
            <Ionicons name={item.icon} size={22} color={deliveryMode === item.mode ? colors.primary : '#64748B'} />
            <Text variant="label" color={deliveryMode === item.mode ? colors.primary : undefined}>{item.title}</Text>
            <Text variant="caption" color="#64748B">{item.detail}</Text>
          </Pressable>
        ))}
      </View>

      {deliveryMode === 'scheduled' ? (
        <Card style={styles.schedule}>
          <View>
            <Text variant="h3">Delivery slot</Text>
            <Text variant="caption" color="#64748B">Suppliers will only be compared for this planned delivery window.</Text>
          </View>
          <View style={styles.scheduleInputs}>
            <Input label="Date" value={scheduleDate} onChangeText={setScheduleDate} placeholder="YYYY-MM-DD" />
            <Input label="Time" value={scheduleTime} onChangeText={setScheduleTime} placeholder="HH:mm" />
          </View>
          {scheduleError ? <Text color={colors.danger}>{scheduleError}</Text> : <Text color={colors.success}>Scheduled for {scheduledFor?.toLocaleString()}</Text>}
        </Card>
      ) : null}

      <Input icon="search-outline" placeholder="Search address" value={search} onChangeText={find} />
      {suggestions.length > 0 ? (
        <Card style={styles.suggestions}>
          {suggestions.map((item) => (
            <Pressable key={item.placeId} onPress={() => chooseSuggestion(item)} style={styles.suggestion}>
              <Ionicons name="location-outline" size={19} color={colors.primary} />
              <Text style={styles.flex}>{item.description}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
      <Button title="Use my current location" variant="outline" icon="locate-outline" loading={busy} onPress={useCurrentLocation} />
      {error ? <Text color={colors.danger}>{error}</Text> : null}

      {saved.loading ? <LoadingState label="Loading saved locations…" /> : saved.data.length > 0 ? (
        <>
          <Text variant="h3">Saved locations</Text>
          <View style={styles.saved}>
            {saved.data.map((address) => (
              <Pressable key={address.id} onPress={() => setSelected(address)}>
                <Card style={[styles.address, selected?.id === address.id && styles.selected]}>
                  <Ionicons name={address.label.toLowerCase().includes('home') ? 'home-outline' : 'business-outline'} size={21} color={colors.primary} />
                  <View style={styles.flex}>
                    <Text variant="label">{address.label}</Text>
                    <Text variant="caption" color="#64748B">{address.formattedAddress}</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {selected ? (
        <Card style={styles.mapCard}>
          <LocationMap location={selected.location} onChange={(location) => setSelected({ ...selected, location })} />
          <View style={styles.mapCopy}>
            <Text variant="label">{selected.label}</Text>
            <Text variant="caption" color="#64748B">{selected.formattedAddress}</Text>
          </View>
        </Card>
      ) : null}

      <Button title="Continue to quantity" disabled={!selected || !!scheduleError} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: 940, gap: spacing.lg },
  flex: { flex: 1 },
  hero: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  heroIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  mode: { flex: 1, minWidth: 210, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm, backgroundColor: '#FFFFFF' },
  modeSelected: { borderColor: colors.primary, backgroundColor: '#FFF9F2' },
  schedule: { gap: spacing.md },
  scheduleInputs: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  suggestions: { gap: 0, paddingVertical: 4 },
  suggestion: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  saved: { gap: spacing.sm },
  address: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  selected: { borderColor: colors.primary, backgroundColor: '#FFF9F2' },
  mapCard: { padding: 0, overflow: 'hidden' },
  mapCopy: { padding: spacing.lg, gap: 4 }
});
