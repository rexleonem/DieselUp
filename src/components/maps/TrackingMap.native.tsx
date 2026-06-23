import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import type { GeoPointValue } from '@/types/domain';

export function TrackingMap({ customer, driver, trail }: { customer: GeoPointValue; driver?: GeoPointValue; trail: GeoPointValue[] }) {
  return (
    <MapView 
      style={styles.map} 
      initialRegion={{ ...(driver ?? customer), latitudeDelta: .06, longitudeDelta: .06 }}
    >
      <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
      <Marker coordinate={customer} title="Delivery location" pinColor="#FF8A00" />
      {driver && <Marker coordinate={driver} title="Driver" pinColor="#3B82F6" />}
      {trail.length > 1 && <Polyline coordinates={trail} strokeColor="#3B82F6" strokeWidth={4} />}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { width: '100%', height: 300 } });
