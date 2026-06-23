import React, { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Brand } from '@/components/ui/Brand';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, radii, spacing } from '@/theme/tokens';

const slides = [
  { id: '1', title: 'Verified supply network', desc: 'Order from vetted suppliers guaranteeing quality and exact quantity on every single drop.', icon: 'shield-checkmark' },
  { id: '2', title: 'Live delivery tracking', desc: 'Follow every litre from depot to destination with real-time GPS tracking and alerts.', icon: 'navigate' },
  { id: '3', title: 'Secure payments', desc: 'Enterprise-grade secure payments, wallet top-ups, and instant automated invoicing.', icon: 'card' }
] as const;

export default function WelcomeScreen() {
  const { width } = useWindowDimensions(); 
  const wide = width >= 900;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index);
  }).current;

  // The width of each slide
  const slideWidth = wide ? Math.min(width * 0.4, 580) : width - spacing.xl * 2;

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <View style={[styles.slide, { width: slideWidth }]}>
      <View style={styles.slideIconContainer}>
        <Ionicons name={item.icon as any} size={32} color={colors.primary} />
      </View>
      <Text variant="h1" style={styles.slideTitle}>{item.title}</Text>
      <Text color="#64748B" style={styles.slideDesc}>{item.desc}</Text>
    </View>
  );

  return (
    <Screen contentStyle={[styles.content, wide && styles.wide]}>
      <View style={[styles.copy, wide && styles.copyWide]}>
        <View style={styles.header}>
          <Brand />
        </View>
        
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            bounces={false}
            keyExtractor={(item) => item.id}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfig}
          />
          <View style={styles.pagination}>
            {slides.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * slideWidth, i * slideWidth, (i + 1) * slideWidth],
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * slideWidth, i * slideWidth, (i + 1) * slideWidth],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return <Animated.View key={i.toString()} style={[styles.dot, { width: dotWidth, opacity }]} />;
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Create account" icon="arrow-forward" onPress={() => router.push('/(auth)/register')} />
          <Button title="Sign in" variant="outline" onPress={() => router.push('/(auth)/sign-in')} />
          <Text variant="caption" color="#64748B" style={styles.disclaimer}>
            By continuing, you agree to DieselUp’s Terms and Privacy Policy.
          </Text>
        </View>
      </View>

      {wide && (
        <LinearGradient colors={['#111827', '#0F172A', '#1E293B']} style={styles.visual}>
          <View style={styles.glow} />
          <View style={styles.glowSecondary} />
          <Text color="#FDBA74" variant="label">LIVE OPERATIONS</Text>
          <Text color="white" style={styles.visualNumber}>
            {activeIndex === 0 ? 'Verified.\nQuality assured.' : activeIndex === 1 ? 'One order.\nEvery moving part.' : 'Secure.\nFast checkout.'}
          </Text>
          
          <Card style={styles.routeCard}>
            <View style={styles.routeTop}>
              <View>
                <Text variant="caption" color="#64748B">ACTIVE DELIVERY</Text>
                <Text variant="h3">En route</Text>
              </View>
              <View style={styles.pill}>
                <View style={styles.liveDot} />
                <Text variant="caption" color={colors.success}>Live</Text>
              </View>
            </View>
            <View style={styles.route}>
              <View style={styles.pin}><Ionicons name="business" color="white" size={15} /></View>
              <View style={styles.line} />
              <View style={[styles.pin, { backgroundColor: colors.primary }]}><Ionicons name="location" color="white" size={15} /></View>
            </View>
            <Text variant="caption" color="#64748B">The live map activates when a real driver is assigned.</Text>
          </Card>
        </LinearGradient>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 0 },
  wide: { flexDirection: 'row', maxWidth: 1440, alignSelf: 'center', width: '100%' },
  copy: { flex: 1, justifyContent: 'space-between', padding: spacing.xl, paddingVertical: spacing['3xl'] },
  copyWide: { padding: 72, maxWidth: 640 },
  header: { marginBottom: spacing['2xl'] },
  carouselContainer: { flex: 1, justifyContent: 'center', minHeight: 280, maxHeight: 400 },
  slide: { justifyContent: 'center', gap: spacing.lg, paddingRight: spacing.xl },
  slideIconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF3E5', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  slideTitle: { fontSize: 32, lineHeight: 38 },
  slideDesc: { fontSize: 17, lineHeight: 26 },
  pagination: { flexDirection: 'row', gap: 6, marginTop: spacing.xl },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  actions: { gap: spacing.md, marginTop: spacing.xl },
  disclaimer: { textAlign: 'center', marginTop: 8 },
  visual: { flex: 1, margin: spacing.lg, borderRadius: 28, padding: 64, justifyContent: 'center', overflow: 'hidden', gap: spacing.lg },
  glow: { position: 'absolute', top: -100, right: -80, width: 340, height: 340, borderRadius: 170, backgroundColor: '#FF8A0033' },
  glowSecondary: { position: 'absolute', bottom: -50, left: -50, width: 240, height: 240, borderRadius: 120, backgroundColor: '#3B82F622' },
  visualNumber: { fontSize: 42, lineHeight: 49, fontWeight: '800' },
  routeCard: { marginTop: spacing.xl, maxWidth: 440, gap: spacing.xl },
  routeTop: { flexDirection: 'row', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  route: { flexDirection: 'row', alignItems: 'center' },
  pin: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  line: { height: 3, flex: 1, backgroundColor: '#FED7AA' }
});
