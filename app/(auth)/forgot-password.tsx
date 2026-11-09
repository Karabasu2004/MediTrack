import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppScreen, BrandMark, Card, DemoNotice, Field, PageHeading, PrimaryButton } from '../../src/components/UI';
import { colors } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import { requestPasswordReset } from '../../src/services/auth';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

export default function ForgotPasswordScreen() {
  const { isFirebaseConfigured } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setError('');
    setMessage('');
    setBusy(true);
    try {
      await requestPasswordReset(normalizedEmail);
      setMessage('If an account exists for this email, Firebase will send a password reset link.');
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen>
      <BrandMark compact />
      <PageHeading
        eyebrow="Account recovery"
        title="Reset password"
        subtitle="Request a password reset email from Firebase."
      />
      {!isFirebaseConfigured && (
        <DemoNotice>Set up Firebase using the instructions in README.md before requesting a reset email.</DemoNotice>
      )}
      <Card>
        <Field
          autoCapitalize="none"
          error={error && !error.includes('Firebase') ? error : undefined}
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => {
            setEmail(value);
            setError('');
            setMessage('');
          }}
          placeholder="you@example.com"
          value={email}
        />
        {error && error.includes('Firebase') ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
        <PrimaryButton
          disabled={busy || !isFirebaseConfigured}
          label={busy ? 'Sending request…' : 'Send reset link'}
          onPress={submit}
        />
        <Link href="/(auth)" style={styles.backLink}>
          Back to login
        </Link>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.red, fontSize: 12, lineHeight: 18 },
  success: { color: colors.green, fontSize: 13, lineHeight: 19 },
  backLink: { color: colors.primary, fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
