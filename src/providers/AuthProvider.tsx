import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, onIdTokenChanged, sendPasswordResetEmail,
  signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut as firebaseSignOut,
  updateProfile, type User
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { AppUser, UserRole } from '@/types/domain';
import { upsertAccountProfile } from '@/services/functions';

interface Registration { name: string; email: string; password: string; phoneNumber?: string; role: Extract<UserRole, 'customer' | 'supplier' | 'driver'> }
interface AuthContextValue {
  firebaseUser: User | null; profile: AppUser | null; loading: boolean; profileMissing: boolean;
  signInEmail: (email: string, password: string) => Promise<void>; register: (value: Registration) => Promise<void>;
  signInGoogle: () => Promise<void>; signOut: () => Promise<void>; resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, (user) => { setFirebaseUser(user); setAuthLoading(false); });
    const timer = setTimeout(() => setAuthLoading(false), 8000);
    return () => { unsub(); clearTimeout(timer); };
  }, []);
  useEffect(() => {
    if (!firebaseUser) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    const timer = setTimeout(() => setProfileLoading(false), 8000);
    const unsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
      clearTimeout(timer);
      setProfile(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as AppUser) : null);
      setProfileLoading(false);
    }, (err) => {
      clearTimeout(timer);
      console.error('Profile fetch error:', err);
      setProfileLoading(false);
    });
    return () => { unsub(); clearTimeout(timer); };
  }, [firebaseUser]);

  const refreshProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setProfile(null); return null; }
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    const next = snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as AppUser) : null;
    setProfile(next); setProfileLoading(false); return next;
  }, []);

  const ensureProfile = useCallback(async (user: User, role: Registration['role'] = 'customer', name?: string, phoneNumber?: string) => {
    if ((await getDoc(doc(db, 'users', user.uid))).exists()) return;
    await upsertAccountProfile({ displayName: name ?? user.displayName ?? user.email?.split('@')[0] ?? 'DieselUp User', role, phoneNumber: user.phoneNumber ?? phoneNumber });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    firebaseUser, profile, loading: authLoading || profileLoading, profileMissing: !!firebaseUser && !profile && !profileLoading,
    signInEmail: async (email, password) => { await signInWithEmailAndPassword(auth, email.trim(), password); },
    register: async ({ name, email, password, phoneNumber, role }) => {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: name.trim() });
      await ensureProfile(result.user, role, name.trim(), phoneNumber);
      await result.user.getIdToken(true);
      await refreshProfile();
    },
    signInGoogle: async () => {
      if (Platform.OS === 'web') {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await ensureProfile(result.user);
        await result.user.getIdToken(true);
        return;
      }
      throw new Error('Google native sign-in requires the platform OAuth client IDs in the release build. Use email sign-in until those credentials are configured.');
    },
    signOut: () => firebaseSignOut(auth), resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()), refreshProfile
  }), [authLoading, ensureProfile, firebaseUser, profile, profileLoading, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export async function signInWithGoogleIdToken(idToken: string) {
  const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  return result.user;
}
