export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !('code' in error)) {
    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 8 characters.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a little while and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Enable it in Firebase Console under Authentication → Sign-in method.';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not configured for this project. Check your Firebase Console settings.';
    case 'auth/already-initialized':
      return 'Firebase Authentication could not be initialized. Restart the Expo development server.';
    default:
      return error.message || 'Firebase Authentication failed. Please try again.';
  }
}
