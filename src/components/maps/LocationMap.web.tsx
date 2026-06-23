import { StyleSheet, View } from 'react-native'; import type { GeoPointValue } from '@/types/domain';

export function LocationMap({ location }: { location: GeoPointValue; onChange?: (value: GeoPointValue) => void; interactive?: boolean }) {
  const d = 0.005;
  const bbox = `${location.longitude - d},${location.latitude - d},${location.longitude + d},${location.latitude + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude},${location.longitude}`;
  
  return (
    <View style={styles.wrap}>
      <iframe title="Delivery location map" src={src} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen loading="lazy" />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: '100%', height: 260, overflow: 'hidden' } });
