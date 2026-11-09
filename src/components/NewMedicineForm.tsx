import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { AppScreen, Card, DemoNotice, Field, PageHeading, PrimaryButton, uiStyles } from './UI';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { Medicine, MedicineInput } from '../types';
import { localDateString } from '../utils/dates';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export default function MedicineForm({ medicineId }: { medicineId?: string }) {
  const { medicineLoading, medicines } = useApp();
  const medicine = medicineId ? medicines.find((item) => item.id === medicineId) : undefined;
  if (medicineLoading) {
    return (
      <AppScreen>
        <PageHeading title="Loading medicines" subtitle="Getting your saved schedule from Firebase." />
      </AppScreen>
    );
  }

  if (medicineId && !medicine) {
    return (
      <AppScreen>
        <PageHeading title="Medicine not found" subtitle="This medicine may have been removed from your account." />
        <PrimaryButton label="Back to home" onPress={() => router.replace('/(tabs)')} />
      </AppScreen>
    );
  }

  return <MedicineEditor key={medicine?.id ?? 'new'} medicine={medicine} medicineId={medicineId} />;
}

function MedicineEditor({ medicine, medicineId }: { medicine?: Medicine; medicineId?: string }) {
  const { deleteMedicine, saveMedicine } = useApp();
  const [name, setName] = useState(medicine?.name ?? '');
  const [doseDescription, setDoseDescription] = useState(medicine?.doseDescription ?? '');
  const [notes, setNotes] = useState(medicine?.notes ?? '');
  const [startDate, setStartDate] = useState(medicine?.startDate ?? localDateString());
  const [endDate, setEndDate] = useState(medicine?.endDate ?? '2099-12-31');
  const [timesInput, setTimesInput] = useState(medicine?.reminderTimes.join(', ') ?? '08:00');
  const [active, setActive] = useState(medicine?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const times = timesInput.split(',').map((time) => time.trim()).filter(Boolean);
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Enter a medicine name.';
    else if (name.trim().length > 120) nextErrors.name = 'Use 120 characters or fewer.';
    if (doseDescription.trim().length > 200) nextErrors.doseDescription = 'Use 200 characters or fewer.';
    if (notes.trim().length > 2000) nextErrors.notes = 'Use 2,000 characters or fewer.';
    if (!isDate(startDate)) nextErrors.startDate = 'Use a valid date in YYYY-MM-DD format.';
    if (!isDate(endDate)) nextErrors.endDate = 'Use a valid date in YYYY-MM-DD format.';
    else if (isDate(startDate) && endDate < startDate) nextErrors.endDate = 'End date cannot be before start date.';
    if (times.length === 0 || times.length > 24) nextErrors.times = 'Add between 1 and 24 reminder times.';
    else if (times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
      nextErrors.times = 'Use 24-hour HH:MM times, separated by commas.';
    } else if (new Set(times).size !== times.length) {
      nextErrors.times = 'Remove duplicate reminder times.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: MedicineInput = {
      name: name.trim(),
      doseDescription: doseDescription.trim(),
      notes: notes.trim(),
      startDate,
      endDate,
      reminderTimes: times,
      active,
    };
    setBusy(true);
    setFormError('');
    try {
      await saveMedicine(input, medicineId);
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getFirebaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!medicineId) return;
    Alert.alert('Delete medicine?', 'This will permanently remove this medicine schedule.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setFormError('');
          try {
            await deleteMedicine(medicineId);
            router.replace('/(tabs)');
          } catch (error) {
            setFormError(getFirebaseErrorMessage(error));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <PageHeading
        eyebrow={medicine ? 'Edit your schedule' : 'Personal schedule'}
        title={medicine ? 'Edit medicine' : 'Add medicine'}
        subtitle="Enter your schedule exactly as instructed by your healthcare professional."
      />
      <DemoNotice>Your schedule is saved to Firebase. Enable local reminders in Profile & settings; dose actions are saved to your account.</DemoNotice>
      <Card>
        <Field error={errors.name} label="Medicine name *" onChangeText={setName} placeholder="e.g. Paracetamol" value={name} />
        <Field
          error={errors.doseDescription}
          label="Dose description"
          onChangeText={setDoseDescription}
          placeholder="e.g. 1 tablet"
          value={doseDescription}
        />
        <Field error={errors.notes} label="Notes (optional)" multiline onChangeText={setNotes} placeholder="Any notes you want to keep" value={notes} />
        <Field
          hint="Use your local calendar date."
          error={errors.startDate}
          label="Start date *"
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          value={startDate}
        />
        <Field
          error={errors.endDate}
          label="End date *"
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          value={endDate}
        />
        <Field
          hint="Enter one or more 24-hour times, separated by commas."
          error={errors.times}
          label="Reminder times *"
          onChangeText={setTimesInput}
          placeholder="08:00, 20:00"
          value={timesInput}
        />
      </Card>
      <Card>
        <View style={uiStyles.between}>
          <View style={{ flex: 1, paddingRight: 12, gap: 3 }}>
            <Text style={uiStyles.cardTitle}>Daily schedule</Text>
            <Text style={uiStyles.cardSubTitle}>Repeat every day during these dates.</Text>
          </View>
          <Text style={styles.dailyLabel}>Daily</Text>
        </View>
        <View style={uiStyles.between}>
          <View style={{ flex: 1, paddingRight: 12, gap: 3 }}>
            <Text style={uiStyles.cardTitle}>Medicine is active</Text>
            <Text style={uiStyles.cardSubTitle}>Paused schedules are hidden from today&apos;s plan.</Text>
          </View>
          <Switch
            accessibilityLabel="Medicine is active"
            onValueChange={setActive}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.line, true: colors.teal }}
            value={active}
          />
        </View>
      </Card>
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton disabled={busy} label={busy ? 'Saving…' : medicine ? 'Save changes' : 'Save medicine'} onPress={submit} />
      {medicine ? (
        <PrimaryButton disabled={busy} label="Delete medicine" onPress={confirmDelete} variant="outline" />
      ) : null}
    </AppScreen>
  );
}

const styles = {
  dailyLabel: { color: colors.teal, fontSize: 13, fontWeight: '700' as const },
  error: { color: colors.red, fontSize: 12, lineHeight: 18 },
};
