import MapView, { Marker, UrlTile } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import type { GeoPointValue } from '@/types/domain';

export function LocationMap({ location, onChange, interactive = true }: { location: GeoPointValue; onChange?: (value: GeoPointValue) => void; interactive?: boolean }) {
  return (
    <MapView 
      style={styles.map} 
      initialRegion={{ ...location, latitudeDelta: 0.035, longitudeDelta: 0.035 }} 
      region={{ ...location, latitudeDelta: 0.035, longitudeDelta: 0.035 }} 
      onPress={interactive ? (event) => onChange?.(event.nativeEvent.coordinate) : undefined}
    >
      <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
      <Marker coordinate={location} />
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { width: '100%', height: 260 } });
