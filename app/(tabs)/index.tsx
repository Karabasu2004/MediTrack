import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen, BrandMark, Card, PageHeading, PrimaryButton, StatusPill, uiStyles } from '../../src/components/UI';
import { colors, radius } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import type { Dose } from '../../src/types';
import { formatDate, formatTime, localDateString } from '../../src/utils/dates';

function DoseCard({ dose }: { dose: Dose }) {
  return (
    <View style={styles.doseCard}>
      <TouchableOpacity
        accessibilityLabel={`Open ${dose.medicineName} reminder preview`}
        accessibilityRole="button"
        activeOpacity={0.82}
        onPress={() => router.push({ pathname: '/reminder/[id]', params: { id: dose.id } })}
        style={styles.doseMain}
      >
        <View style={styles.doseIcon}>
          <Text style={styles.doseEmoji}>💊</Text>
        </View>
        <View style={styles.doseDetails}>
          <View style={styles.doseTitleLine}>
            <Text numberOfLines={1} style={styles.doseName}>{dose.medicineName}</Text>
            <StatusPill label={dose.status} tone={dose.status === 'taken' ? 'green' : 'blue'} />
          </View>
          <Text style={styles.doseDescription}>{dose.doseDescription}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.clockIcon}>◷</Text>
            <Text style={styles.doseTime}>{formatTime(dose.scheduledTime)}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={`Edit ${dose.medicineName} schedule`}
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/medicine/[id]', params: { id: dose.medicineId } })}
        style={styles.editButton}
      >
        <Text style={styles.editIcon}>✎</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const { doses, medicineError, medicineLoading, medicines, profile } = useApp();
  const todayDoses = useMemo(
    () =>
      doses
        .filter((dose) => dose.scheduledDate === localDateString())
        .sort((first, second) => first.scheduledTime.localeCompare(second.scheduledTime)),
    [doses],
  );
  const takenCount = todayDoses.filter((dose) => dose.status === 'taken').length;
  const pendingCount = todayDoses.filter((dose) => dose.status === 'pending').length;
  const hasMedicines = medicines.some((medicine) => medicine.active);
  const firstName = profile.displayName.split(' ')[0] || 'there';

  return (
    <AppScreen>
      <View style={styles.topBar}>
        <BrandMark compact />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>
        </View>
      </View>
      <PageHeading
        eyebrow={formatDate(new Date())}
        title={`Hello, ${firstName} 👋`}
        subtitle="Here is your medicine plan for today."
      />
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Today&apos;s overview</Text>
            <Text style={styles.summarySubtitle}>{todayDoses.length} scheduled doses</Text>
          </View>
          <View style={styles.summarySymbol}>
            <Text style={styles.summarySymbolText}>✓</Text>
          </View>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.stat, styles.statBlue]}>
            <Text style={styles.statValue}>{todayDoses.length}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={[styles.stat, styles.statGreen]}>
            <Text style={styles.statValue}>{takenCount}</Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
          <View style={[styles.stat, styles.statOrange]}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </Card>
      {medicineLoading ? (
        <Text style={styles.dataMessage}>Loading your saved medicine schedule…</Text>
      ) : null}
      {medicineError ? <Text style={styles.dataError}>{medicineError}</Text> : null}
      <View style={styles.sectionHeading}>
        <Text style={uiStyles.sectionTitle}>Today&apos;s medicines</Text>
        <Text style={styles.sectionCount}>{todayDoses.length} doses</Text>
      </View>
      {medicineLoading || medicineError ? null : !hasMedicines || todayDoses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🗓️</Text>
          <Text style={styles.emptyTitle}>Your schedule is clear</Text>
          <Text style={styles.emptyText}>Add a medicine and the times you were instructed to take it.</Text>
        </Card>
      ) : (
        <View style={styles.doseList}>
          {todayDoses.map((dose) => <DoseCard dose={dose} key={dose.id} />)}
        </View>
      )}
      <PrimaryButton label="＋  Add medicine" onPress={() => router.push('/medicine/new')} />
      <View style={styles.notice}>
        <Text style={styles.noticeIcon}>ℹ</Text>
        <Text style={styles.noticeText}>Enter your schedule exactly as instructed by your healthcare professional.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softTeal,
  },
  avatarText: { color: colors.teal, fontSize: 16, fontWeight: '800' },
  summaryCard: { backgroundColor: colors.surface, padding: 17 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  summarySubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  summarySymbol: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: colors.softTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySymbolText: { color: colors.teal, fontSize: 20, fontWeight: '800' },
  statRow: { flexDirection: 'row', gap: 9, marginTop: 2 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 11, alignItems: 'center', gap: 3 },
  statBlue: { backgroundColor: colors.softBlue },
  statGreen: { backgroundColor: colors.softGreen },
  statOrange: { backgroundColor: colors.softOrange },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionCount: { color: colors.muted, fontSize: 12 },
  doseList: { gap: 10 },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
  },
  doseMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  doseIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: colors.softBlue, alignItems: 'center', justifyContent: 'center' },
  doseEmoji: { fontSize: 22 },
  doseDetails: { flex: 1, gap: 3 },
  doseTitleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  doseName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
  doseDescription: { color: colors.muted, fontSize: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  clockIcon: { color: colors.primary, fontSize: 16 },
  doseTime: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  chevron: { color: colors.muted, fontSize: 24 },
  editButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.softBlue, alignItems: 'center', justifyContent: 'center' },
  editIcon: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 25 },
  emptyIcon: { fontSize: 31 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  emptyText: { color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, maxWidth: 260 },
  dataMessage: { color: colors.muted, fontSize: 13 },
  dataError: { color: colors.red, fontSize: 13, lineHeight: 19 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 2 },
  noticeIcon: { color: colors.teal, fontSize: 15, fontWeight: '800' },
  noticeText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
});
