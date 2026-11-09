import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppScreen, Card, DemoNotice, Field, PageHeading, PrimaryButton } from '../../src/components/UI';
import { colors, radius } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

export default function ProfileScreen() {
  const {
    authUser,
    notificationError,
    notificationPermission,
    notificationSchedule,
    profile,
    refreshReminderSchedule,
    requestReminderPermission,
    signOut,
    updateProfile,
  } = useApp();
  const [name, setName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone);
  const [smsConsent, setSmsConsent] = useState(profile.smsConsent);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device local time';

  const save = async () => {
    if (name.trim().length < 2) {
      setFormError('Enter a name with at least 2 characters.');
      setMessage('');
      return;
    }
    setBusy(true);
    setFormError('');
    setMessage('');
    try {
      await updateProfile({ ...profile, displayName: name.trim(), phone: phone.trim(), smsConsent });
      setMessage('Name saved to Firebase. Phone and SMS preference are kept only for this app session.');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const leaveAccount = async () => {
    setBusy(true);
    setFormError('');
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen>
      <PageHeading eyebrow="Your account" title="Profile & settings" subtitle="Manage your Firebase account details." />
      <Card style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name.trim().slice(0, 1) || 'A').toUpperCase()}</Text>
        </View>
        <View style={styles.profileIntro}>
          <Text style={styles.profileName}>{name || 'Patient profile'}</Text>
          <Text style={styles.profileEmail}>{authUser?.email ?? profile.email ?? 'No email saved'}</Text>
        </View>
      </Card>
      <Card>
        <Field label="Name" onChangeText={setName} placeholder="Your name" value={name} />
        <Field label="Mobile number" keyboardType="phone-pad" onChangeText={setPhone} placeholder="+91 98765 43210" value={phone} />
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>SMS reminder consent</Text>
            <Text style={styles.settingCaption}>You can withdraw consent at any time.</Text>
          </View>
          <Switch
            accessibilityLabel="SMS reminder consent"
            onValueChange={setSmsConsent}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.line, true: colors.teal }}
            value={smsConsent}
          />
        </View>
      </Card>
      <DemoNotice>
        Firebase Authentication stores your name and email. Your phone number and SMS preference are not uploaded or saved between sessions yet. No SMS is sent.
      </DemoNotice>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <PrimaryButton disabled={busy} label={busy ? 'Saving…' : 'Save profile'} onPress={save} />
      <Card style={styles.statusCard}>
        <Text style={styles.sectionTitle}>Device settings</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoDot} />
          <View style={styles.infoText}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingCaption}>
              {notificationPermission === 'granted'
                ? `${notificationSchedule.scheduled} local reminders scheduled for the next 7 days.`
                : notificationPermission === 'unavailable'
                  ? 'Local reminders are available in the Android or iOS app, not the web preview.'
                  : notificationPermission === 'denied'
                    ? 'Permission is off. Enable notifications in your device settings.'
                    : 'Local medicine reminders are off.'}
            </Text>
          </View>
        </View>
        {notificationSchedule.notScheduled > 0 ? (
          <Text style={styles.settingCaption}>
            {notificationSchedule.notScheduled} reminders could not be scheduled because the device limit was reached.
          </Text>
        ) : null}
        {notificationError ? <Text style={styles.error}>{notificationError}</Text> : null}
        {notificationPermission !== 'unavailable' ? (
          <PrimaryButton
            disabled={busy}
            label={notificationPermission === 'granted' ? 'Refresh reminder schedule' : 'Enable local reminders'}
            onPress={notificationPermission === 'granted' ? refreshReminderSchedule : requestReminderPermission}
            variant="outline"
          />
        ) : null}
        <View style={styles.infoRow}>
          <View style={[styles.infoDot, styles.tealDot]} />
          <View style={styles.infoText}>
            <Text style={styles.settingTitle}>Time zone</Text>
            <Text style={styles.settingCaption}>{timeZone}</Text>
          </View>
        </View>
      </Card>
      <Card style={styles.accountCard}>
        <Text style={styles.sectionTitle}>Account & privacy</Text>
        <Text style={styles.settingCaption}>
          Your email/password account is managed by Firebase Authentication. Medicine schedules are saved in your account. Account deletion and persistent dose history are not implemented yet.
        </Text>
        <PrimaryButton disabled={busy} label={busy ? 'Please wait…' : 'Sign out'} onPress={leaveAccount} variant="outline" />
      </Card>
      <Text style={styles.version}>MediTrack · Local reminders milestone</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 58, height: 58, borderRadius: radius.pill, backgroundColor: colors.softTeal, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.teal, fontSize: 23, fontWeight: '800' },
  profileIntro: { flex: 1, gap: 4 },
  profileName: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  profileEmail: { color: colors.muted, fontSize: 13 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 1 },
  settingText: { flex: 1, paddingRight: 12, gap: 4 },
  settingTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  settingCaption: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  statusCard: { gap: 14 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.orange },
  tealDot: { backgroundColor: colors.teal },
  infoText: { flex: 1, gap: 2 },
  accountCard: { gap: 12 },
  version: { color: colors.muted, textAlign: 'center', fontSize: 11 },
  error: { color: colors.red, fontSize: 12, lineHeight: 18 },
  success: { color: colors.green, fontSize: 12, lineHeight: 18 },
});
