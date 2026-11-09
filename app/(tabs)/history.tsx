import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen, Card, PageHeading, StatusPill, uiStyles } from '../../src/components/UI';
import { colors, radius } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import type { DoseStatus } from '../../src/types';
import { formatShortDate, formatTime, localDateString } from '../../src/utils/dates';

type DateFilter = 'all' | 'today';
type StatusFilter = 'all' | DoseStatus;

const statusTones: Record<DoseStatus, 'green' | 'orange' | 'red' | 'blue'> = {
  pending: 'blue',
  taken: 'green',
  skipped: 'orange',
  missed: 'red',
};

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selectedChip]}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { doseHistoryError, doseHistoryLoading, doses, medicines } = useApp();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [medicineFilter, setMedicineFilter] = useState('all');
  const filteredDoses = useMemo(
    () =>
      doses
        .filter((dose) => statusFilter === 'all' || dose.status === statusFilter)
        .filter((dose) => dateFilter === 'all' || dose.scheduledDate === localDateString())
        .filter((dose) => medicineFilter === 'all' || dose.medicineId === medicineFilter)
        .sort((first, second) =>
          `${second.scheduledDate} ${second.scheduledTime}`.localeCompare(`${first.scheduledDate} ${first.scheduledTime}`),
        ),
    [doses, dateFilter, medicineFilter, statusFilter],
  );

  return (
    <AppScreen>
      <PageHeading eyebrow="Your records" title="Dose history" subtitle="Review upcoming doses and saved actions from past doses." />
      {doseHistoryLoading ? <Text style={styles.footer}>Loading saved dose records…</Text> : null}
      {doseHistoryError ? <Text style={styles.error}>{doseHistoryError}</Text> : null}
      <Card style={styles.filtersCard}>
        <Text style={uiStyles.cardTitle}>Date</Text>
        <View style={styles.chipRow}>
          <FilterChip label="All dates" onPress={() => setDateFilter('all')} selected={dateFilter === 'all'} />
          <FilterChip label="Today" onPress={() => setDateFilter('today')} selected={dateFilter === 'today'} />
        </View>
        <Text style={uiStyles.cardTitle}>Medicine</Text>
        <View style={styles.chipRow}>
          <FilterChip label="All" onPress={() => setMedicineFilter('all')} selected={medicineFilter === 'all'} />
          {medicines.map((medicine) => (
            <FilterChip
              key={medicine.id}
              label={medicine.name}
              onPress={() => setMedicineFilter(medicine.id)}
              selected={medicineFilter === medicine.id}
            />
          ))}
        </View>
        <Text style={uiStyles.cardTitle}>Dose status</Text>
        <View style={styles.chipRow}>
          {(['all', 'taken', 'pending', 'skipped', 'missed'] as const).map((status) => (
            <FilterChip
              key={status}
              label={status === 'all' ? 'All' : status}
              onPress={() => setStatusFilter(status)}
              selected={statusFilter === status}
            />
          ))}
        </View>
      </Card>
      <View style={styles.resultsHeading}>
        <Text style={uiStyles.sectionTitle}>Dose records</Text>
        <Text style={styles.resultCount}>{filteredDoses.length} records</Text>
      </View>
      {filteredDoses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={uiStyles.cardTitle}>No matching doses</Text>
          <Text style={uiStyles.muted}>Try changing one of the filters above.</Text>
        </Card>
      ) : (
        <View style={styles.doseList}>
          {filteredDoses.map((dose) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={dose.id}
              onPress={() => router.push({ pathname: '/reminder/[id]', params: { id: dose.id } })}
              style={styles.record}
            >
              <View style={[styles.recordIcon, dose.status === 'taken' && styles.recordIconTaken]}>
                <Text style={styles.recordEmoji}>{dose.status === 'taken' ? '✓' : '•'}</Text>
              </View>
              <View style={styles.recordBody}>
                <View style={styles.recordTitleRow}>
                  <Text numberOfLines={1} style={styles.recordName}>{dose.medicineName}</Text>
                  <StatusPill label={dose.status} tone={statusTones[dose.status]} />
                </View>
                <Text style={styles.recordDetails}>{dose.doseDescription} · {formatTime(dose.scheduledTime)}</Text>
                <Text style={styles.recordDate}>{formatShortDate(dose.scheduledDate)}</Text>
                <Text style={styles.deliveryStatus}>{dose.status === 'pending' ? 'Not recorded yet' : 'Saved to your account'}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.footer}>Taken, skipped, and missed actions are saved to your account. Pending doses are not marked automatically.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filtersCard: { gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 11 },
  selectedChip: { backgroundColor: colors.softBlue, borderColor: colors.primary },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  selectedChipText: { color: colors.primary },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { color: colors.muted, fontSize: 12 },
  doseList: { gap: 9 },
  record: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, padding: 13 },
  recordIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softOrange },
  recordIconTaken: { backgroundColor: colors.softGreen },
  recordEmoji: { color: colors.green, fontSize: 18, fontWeight: '800' },
  recordBody: { flex: 1, gap: 3 },
  recordTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  recordName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
  recordDetails: { color: colors.muted, fontSize: 12 },
  recordDate: { color: colors.muted, fontSize: 11 },
  deliveryStatus: { color: colors.orange, fontSize: 11, fontWeight: '600', marginTop: 2 },
  error: { color: colors.red, fontSize: 12, textAlign: 'center' },
  chevron: { color: colors.muted, fontSize: 22 },
  emptyCard: { alignItems: 'center', paddingVertical: 25 },
  emptyIcon: { fontSize: 29 },
  footer: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
