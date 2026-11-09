import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen, BrandMark, Card, DemoNotice, Field, PrimaryButton } from '../../src/components/UI';
import { colors, radius } from '../../src/constants/theme';
import { useApp } from '../../src/context/AppContext';
import { getAuthErrorMessage } from '../../src/utils/authErrors';

export default function WelcomeScreen() {
  const { authError, isFirebaseConfigured, signIn } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim();
    const nextEmailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ? ''
      : 'Enter a valid email address.';
    const nextPasswordError = password.length >= 6 ? '' : 'Password must be at least 6 characters.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError('');
    if (nextEmailError || nextPasswordError || !isFirebaseConfigured) return;

    setBusy(true);
    try {
      await signIn(normalizedEmail, password);
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.brandWrap}>
        <BrandMark />
      </View>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>💊</Text>
          <Text style={styles.clock}>◷</Text>
        </View>
        <Text style={styles.heroTitle}>Your health,{'\n'}your priority</Text>
        <Text style={styles.heroText}>A little reminder can make a big difference.</Text>
      </View>
      {!isFirebaseConfigured && (
        <DemoNotice>
          Firebase needs setup before you can sign in. Add the values from your Firebase web app to the project&apos;s .env file, then restart Expo. See README.md for steps.
        </DemoNotice>
      )}
      <Card>
        <Text style={styles.cardHeading}>Welcome back</Text>
        <Text style={styles.cardSubheading}>Sign in to see your medicine schedule.</Text>
        <Field
          autoCapitalize="none"
          error={emailError}
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => {
            setEmail(value);
            setEmailError('');
            setFormError('');
          }}
          placeholder="you@example.com"
          value={email}
        />
        <Field
          autoCapitalize="none"
          error={passwordError}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            setPasswordError('');
            setFormError('');
          }}
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
        />
        {formError || authError ? <Text style={styles.formError}>{formError || authError}</Text> : null}
        <PrimaryButton
          disabled={busy || !isFirebaseConfigured}
          label={busy ? 'Signing in…' : 'Login'}
          onPress={submit}
        />
        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>
        <View style={styles.registerLine}>
          <Text style={styles.mutedText}>New to MediTrack? </Text>
          <Link href="/(auth)/register" style={styles.linkText}>
            Create an account
          </Link>
        </View>
      </Card>
      <Text style={styles.footer}>Stay healthy • Stay happy 💙</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  brandWrap: { marginTop: 6 },
  hero: { alignItems: 'center', paddingVertical: 6, gap: 7 },
  heroIcon: {
    width: 92,
    height: 92,
    backgroundColor: colors.softBlue,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 43 },
  clock: { color: colors.teal, fontSize: 26, fontWeight: '700', position: 'absolute', right: 12, bottom: 8 },
  heroTitle: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', textAlign: 'center' },
  heroText: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  cardHeading: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  cardSubheading: { color: colors.muted, fontSize: 13, marginTop: -7, marginBottom: 2 },
  registerLine: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  mutedText: { color: colors.muted, fontSize: 13 },
  linkText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  forgotLink: { color: colors.primary, fontSize: 13, fontWeight: '700', alignSelf: 'flex-end' },
  formError: { color: colors.red, fontSize: 12, lineHeight: 18 },
  footer: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 'auto', paddingTop: 2 },
});
