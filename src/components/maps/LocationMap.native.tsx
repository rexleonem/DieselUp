import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import type { GeoPointValue } from '@/types/domain';
export function LocationMap({ location, onChange, interactive = true }: { location: GeoPointValue; onChange?: (value: GeoPointValue) => void; interactive?: boolean }) { return <MapView provider={PROVIDER_GOOGLE} style={styles.map} initialRegion={{ ...location, latitudeDelta: 0.035, longitudeDelta: 0.035 }} region={{ ...location, latitudeDelta: 0.035, longitudeDelta: 0.035 }} onPress={interactive ? (event) => onChange?.(event.nativeEvent.coordinate) : undefined}><Marker coordinate={location} /></MapView>; }
const styles = StyleSheet.create({ map: { width: '100%', height: 260 } });
