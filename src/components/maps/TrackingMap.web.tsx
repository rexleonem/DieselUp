import { StyleSheet, View } from 'react-native'; import type { GeoPointValue } from '@/types/domain';

export function TrackingMap({ customer, driver }: { customer: GeoPointValue; driver?: GeoPointValue; trail: GeoPointValue[] }) {
  const center = driver ?? customer;
  const d = 0.01;
  const bbox = `${center.longitude - d},${center.latitude - d},${center.longitude + d},${center.latitude + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.latitude},${center.longitude}`;
  
  return (
    <View style={styles.wrap}>
      <iframe title="Live delivery map" src={src} style={{ width: '100%', height: '100%', border: 0 }} loading="lazy" />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: '100%', height: 300 } });
