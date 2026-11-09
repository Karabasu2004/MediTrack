import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../constants/theme';

export function AppScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandRow, compact && styles.brandCompact]}>
      <View style={styles.brandIcon}>
        <Text style={styles.brandGlyph}>💊</Text>
      </View>
      <View>
        <Text style={styles.brandName}>
          Medi<Text style={styles.brandAccent}>Track</Text>
        </Text>
        {!compact && <Text style={styles.brandTagline}>Never miss your medicine again</Text>}
      </View>
    </View>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.pageHeading}>
      <View style={styles.headingText}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
      </View>
      {trailing}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'soft';
}) {
  const buttonStyle =
    variant === 'outline' ? styles.outlineButton : variant === 'soft' ? styles.softButton : styles.primaryButton;
  const textStyle = variant === 'outline' ? styles.outlineButtonText : styles.primaryButtonText;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, buttonStyle, disabled && styles.disabledButton]}
    >
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multiline, error && styles.inputError]}
        value={value}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function DemoNotice({ children }: PropsWithChildren) {
  return (
    <View style={styles.demoNotice}>
      <Text style={styles.demoIcon}>ⓘ</Text>
      <Text style={styles.demoText}>{children}</Text>
    </View>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'green' | 'orange' | 'red' | 'blue' }) {
  const toneStyle = {
    green: styles.greenPill,
    orange: styles.orangePill,
    red: styles.redPill,
    blue: styles.bluePill,
  }[tone];
  return (
    <View style={[styles.statusPill, toneStyle]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

export const uiStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  cardSubTitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screenContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30, gap: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandCompact: { gap: 8 },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlyph: { fontSize: 25 },
  brandName: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  brandAccent: { color: colors.teal },
  brandTagline: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headingText: { flex: 1, gap: 3 },
  eyebrow: { color: colors.teal, fontWeight: '700', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  pageTitle: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#1C3C72',
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: { minHeight: 50, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButton: { backgroundColor: colors.primary },
  outlineButton: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1.3 },
  softButton: { backgroundColor: colors.softBlue },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  outlineButtonText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 50,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  inputError: { borderColor: colors.red },
  errorText: { color: colors.red, fontSize: 12, lineHeight: 17 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: radius.control,
    backgroundColor: colors.softOrange,
    padding: 13,
  },
  demoIcon: { color: colors.orange, fontSize: 16, fontWeight: '800' },
  demoText: { flex: 1, color: '#755222', fontSize: 12, lineHeight: 18 },
  statusPill: { borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 10 },
  greenPill: { backgroundColor: colors.softGreen },
  orangePill: { backgroundColor: colors.softOrange },
  redPill: { backgroundColor: colors.softRed },
  bluePill: { backgroundColor: colors.softBlue },
  statusText: { color: colors.ink, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
