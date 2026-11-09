import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase is not configured. Follow the setup steps in README.md.');
  }
  return auth;
}

export async function registerWithEmail(
  displayName: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(requireAuth());
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(requireAuth(), email);
}
