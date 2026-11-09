export function getFirebaseErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !('code' in error)) {
    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'permission-denied':
      return 'Firebase denied access. Make sure Firestore is enabled and the security rules in README.md are published.';
    case 'unavailable':
    case 'network-request-failed':
      return 'Could not reach Firebase. Check your internet connection and try again.';
    case 'not-found':
      return 'This medicine no longer exists. Refresh the list and try again.';
    default:
      return error.message || 'Could not save your medicine. Please try again.';
  }
}
