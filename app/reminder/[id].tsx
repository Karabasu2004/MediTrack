import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen, Card, DemoNotice, PageHeading, PrimaryButton, StatusPill } from '../../src/components/UI';
import { colors, radius } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import type { DoseStatus } from '../../src/types';
import { formatShortDate, formatTime } from '../../src/utils/dates';

export default function ReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { doses, updateDose } = useApp();
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pastDueDoseId, setPastDueDoseId] = useState<string | null>(null);
  const dose = doses.find((item) => item.id === id);

  useEffect(() => {
    if (!dose) return undefined;
    const doseId = dose.id;
    const scheduledDate = dose.scheduledDate;
    const scheduledTime = dose.scheduledTime;
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).getTime();
    let timer: ReturnType<typeof setTimeout>;
    const checkDueTime = () => {
      const remaining = scheduledAt - Date.now();
      if (remaining <= 0) {
        setPastDueDoseId(doseId);
        return;
      }
      timer = setTimeout(checkDueTime, Math.min(remaining, 60_000));
    };
    timer = setTimeout(checkDueTime, Math.min(Math.max(0, scheduledAt - Date.now()), 60_000));
    return () => clearTimeout(timer);
  }, [dose]);

  if (!dose) {
    return (
      <AppScreen>
        <PageHeading title="Reminder preview" subtitle="This dose may no longer be in your upcoming schedule." />
        <DemoNotice>Saved dose records are kept in your account. Local reminders are managed in Profile & settings.</DemoNotice>
        <PrimaryButton label="Back to home" onPress={() => router.replace('/(tabs)')} />
      </AppScreen>
    );
  }

  const recordAction = async (status: DoseStatus) => {
    setSaving(true);
    setActionError('');
    try {
      await updateDose(dose.id, status);
      router.back();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not save this dose record.');
    } finally {
      setSaving(false);
    }
  };
  const isPastDue = pastDueDoseId === dose.id;
  const statusTone = dose.status === 'taken' ? 'green' : dose.status === 'skipped' ? 'orange' : dose.status === 'missed' ? 'red' : 'blue';

  return (
    <AppScreen>
      <PageHeading eyebrow="Local reminder" title="Medicine reminder" subtitle={formatShortDate(dose.scheduledDate)} />
      <View style={styles.clockFace}>
        <View style={styles.clockCircle}>
          <Text style={styles.clockGlyph}>◷</Text>
        </View>
        <Text style={styles.time}>{formatTime(dose.scheduledTime)}</Text>
        <Text style={styles.date}>{formatShortDate(dose.scheduledDate)}</Text>
      </View>
      <Card style={styles.medicineCard}>
        <View style={styles.medicineIcon}>
          <Text style={styles.medicineEmoji}>💊</Text>
        </View>
        <Text style={styles.medicineName}>{dose.medicineName}</Text>
        <Text style={styles.doseDescription}>{dose.doseDescription}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusCaption}>Dose status</Text>
          <StatusPill label={dose.status} tone={statusTone} />
        </View>
      </Card>
      <DemoNotice>
        No SMS is sent. Local reminders can be enabled in Profile & settings. Dose actions are saved to your account.
      </DemoNotice>
      {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
      {dose.status === 'pending' ? (
        <View style={styles.actions}>
          <PrimaryButton disabled={saving} label="✓  Mark as taken" onPress={() => void recordAction('taken')} />
          <PrimaryButton disabled={saving} label="Skip this dose" onPress={() => void recordAction('skipped')} variant="outline" />
          {isPastDue ? (
            <PrimaryButton disabled={saving} label="Mark as missed" onPress={() => void recordAction('missed')} variant="outline" />
          ) : null}
          <Text style={styles.actionHint}>Choose an action to save this dose record to your account.</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Text style={styles.recordedTitle}>This dose is marked as {dose.status}.</Text>
          <PrimaryButton label="Back to schedule" onPress={() => router.back()} />
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  clockFace: { alignItems: 'center', paddingVertical: 8, gap: 4 },
  clockCircle: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  clockGlyph: { color: colors.primary, fontSize: 58, fontWeight: '300' },
  time: { color: colors.ink, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  date: { color: colors.muted, fontSize: 14 },
  medicineCard: { alignItems: 'center', paddingVertical: 22 },
  medicineIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.softTeal, alignItems: 'center', justifyContent: 'center' },
  medicineEmoji: { fontSize: 28 },
  medicineName: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 2 },
  doseDescription: { color: colors.muted, fontSize: 14 },
  statusRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 13, marginTop: 3 },
  statusCaption: { color: colors.muted, fontSize: 13 },
  actions: { gap: 10 },
  actionHint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  actionError: { color: colors.red, fontSize: 13, textAlign: 'center' },
  recordedTitle: { color: colors.ink, fontSize: 14, textAlign: 'center', fontWeight: '700' },
});
