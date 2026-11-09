import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppScreen, BrandMark, Card, DemoNotice, Field, PageHeading, PrimaryButton } from '../../src/components/UI';
import { colors } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

export default function RegisterScreen() {
  const { isFirebaseConfigured, register } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Enter a valid phone number.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0 || !isFirebaseConfigured) return;

    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim(), smsConsent);
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen>
      <BrandMark compact />
      <PageHeading eyebrow="Get started" title="Create your account" subtitle="Register with Firebase Authentication." />
      {!isFirebaseConfigured && (
        <DemoNotice>
          Firebase needs setup before account registration. Add the values from your Firebase web app to .env and restart Expo. See README.md for steps.
        </DemoNotice>
      )}
      <Card>
        <Field
          error={errors.name}
          label="Full name"
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: '' }));
            setFormError('');
          }}
          placeholder="Your name"
          value={name}
        />
        <Field
          autoCapitalize="none"
          error={errors.email}
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: '' }));
            setFormError('');
          }}
          placeholder="you@example.com"
          value={email}
        />
        <Field
          autoCapitalize="none"
          error={errors.password}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: '' }));
            setFormError('');
          }}
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
        />
        <Field
          error={errors.phone}
          keyboardType="phone-pad"
          label="Mobile number"
          onChangeText={(value) => {
            setPhone(value);
            setErrors((current) => ({ ...current, phone: '' }));
            setFormError('');
          }}
          placeholder="+91 98765 43210"
          value={phone}
        />
      </Card>
      <Card style={styles.consentCard}>
        <View style={styles.consentText}>
          <Text style={styles.consentTitle}>SMS reminder consent</Text>
          <Text style={styles.consentDescription}>
            No SMS is sent in this milestone. Your phone number and consent are not uploaded or persisted until a later profile-storage milestone.
          </Text>
        </View>
        <Switch
          accessibilityLabel="SMS reminder consent"
          onValueChange={setSmsConsent}
          thumbColor="#FFFFFF"
          trackColor={{ false: colors.line, true: colors.teal }}
          value={smsConsent}
        />
      </Card>
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <PrimaryButton
        disabled={busy || !isFirebaseConfigured}
        label={busy ? 'Creating account…' : 'Create account'}
        onPress={submit}
      />
      <View style={styles.loginLine}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <Link href="/(auth)" style={styles.linkText}>
          Login
        </Link>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  consentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  consentText: { flex: 1, paddingRight: 12, gap: 4 },
  consentTitle: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  consentDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  loginLine: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: colors.muted, fontSize: 13 },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  formError: { color: colors.red, fontSize: 12, lineHeight: 18 },
});
