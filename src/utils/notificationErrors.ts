export function getNotificationErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !('code' in error)) {
    return error instanceof Error ? error.message : 'Could not update reminders. Please try again.';
  }

  switch (error.code) {
    case 'ERR_NOTIFICATIONS_UNAVAILABLE':
      return 'Local reminders are unavailable in this app environment. Try an Android or iOS build.';
    case 'ERR_NOTIFICATIONS_PERMISSION_DENIED':
      return 'Notifications are disabled. Allow them for MediTrack in your device settings.';
    default:
      return error.message || 'Could not update reminders. Please try again.';
  }
}
