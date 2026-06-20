import { Platform } from 'react-native';

export const colors = {
  primary: '#FF8A00', primaryDark: '#E66F00', secondary: '#0F172A', accent: '#3B82F6',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444', white: '#FFFFFF', black: '#020617',
  light: { background: '#F7F8FA', surface: '#FFFFFF', surfaceAlt: '#F1F5F9', text: '#0F172A', muted: '#64748B', border: '#E2E8F0' },
  dark: { background: '#070B14', surface: '#111827', surfaceAlt: '#1E293B', text: '#F8FAFC', muted: '#94A3B8', border: '#263244' }
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 } as const;
export const radii = { sm: 8, md: 12, lg: 18, xl: 24, full: 999 } as const;
export const typography = {
  hero: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const }
} as const;
export const shadows = {
  card: Platform.select({ web: { boxShadow: '0 12px 36px rgba(15,23,42,.08)' }, default: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3 } })
};
