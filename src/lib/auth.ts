import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email?: string;
  fullName?: string;
  role: 'admin' | 'booking_manager' | 'viewer';
}

export function watchAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  const ref = doc(db, 'users', uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    callback({
      uid,
      email: data.email,
      fullName: data.fullName,
      role: data.role === 'admin' ? 'admin' : data.role === 'booking_manager' ? 'booking_manager' : 'viewer',
    });
  });
}

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function isAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'admin';
}
