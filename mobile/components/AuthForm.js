// One form used for both Login and Sign up (DESIGN.md section 8.2).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import FadeInCard from './FadeInCard';
import FormInput from './ui/FormInput';
import PrimaryButton from './ui/PrimaryButton';
import { login, mapAuthError, signUp } from '../services/authService';
import { colors, fonts, screenPadding, spacing } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForm({ mode }) {
  const isSignUp = mode === 'signup';
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const clear = (field) => setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));

  function validate() {
    const e = {};
    if (isSignUp && !name.trim()) e.name = 'auth.errors.nameRequired';
    if (!email.trim()) e.email = 'auth.errors.emailRequired';
    else if (!EMAIL_PATTERN.test(email.trim())) e.email = 'auth.errors.invalidEmail';
    if (!password) e.password = 'auth.errors.passwordRequired';
    else if (isSignUp && password.length < 6) e.password = 'auth.errors.weakPassword';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (busy || !validate()) return;
    setBusy(true);
    try {
      if (isSignUp) {
        await signUp({ name, email, password, language: i18n.language });
      } else {
        await login(email, password);
      }
      // Nothing else to do: the app notices the new user and shows the tabs.
    } catch (err) {
      const { field, key } = mapAuthError(err);
      setErrors({ [field]: key });
    } finally {
      setBusy(false);
    }
  }

  const inputProps = { font: fonts.en.regular, disabled: busy };

  const fieldError = (field) =>
    errors[field] ? (
      <AppText variant="caption" color={colors.danger} style={styles.error}>
        {t(errors[field])}
      </AppText>
    ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FadeInCard index={0}>
            <View style={styles.header}>
              <AppText variant="display" style={styles.center}>
                {t('app.name')}
              </AppText>
              <AppText variant="body" color={colors.textSecondary} style={styles.center}>
                {t('app.tagline')}
              </AppText>
            </View>
          </FadeInCard>

          <FadeInCard index={1}>
            <AppText variant="h2" style={styles.title}>
              {isSignUp ? t('auth.createAccount') : t('auth.login')}
            </AppText>

            {isSignUp && (
              <View style={styles.field}>
                <FormInput
                  {...inputProps}
                  label={t('auth.name')}
                  value={name}
                  onChangeText={(v) => { setName(v); clear('name'); }}
                  autoCapitalize="words"
                  error={!!errors.name}
                />
                {fieldError('name')}
              </View>
            )}

            <View style={styles.field}>
              <FormInput
                {...inputProps}
                label={t('auth.email')}
                value={email}
                onChangeText={(v) => { setEmail(v); clear('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.email}
              />
              {fieldError('email')}
            </View>

            <View style={styles.field}>
              <FormInput
                {...inputProps}
                label={t('auth.password')}
                value={password}
                onChangeText={(v) => { setPassword(v); clear('password'); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={!!errors.password}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword((s) => !s)}
                    accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  />
                }
              />
              {fieldError('password')}
            </View>

            {errors.form ? (
              <AppText variant="body" color={colors.danger} style={styles.formError}>
                {t(errors.form)}
              </AppText>
            ) : null}

            <PrimaryButton
              label={isSignUp ? t('auth.createAccount') : t('auth.login')}
              onPress={submit}
              loading={busy}
              style={styles.button}
            />

            <PrimaryButton
              label={isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
              variant="text"
              onPress={() => router.replace(isSignUp ? '/login' : '/signup')}
              style={styles.switch}
            />
          </FadeInCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: screenPadding, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxl, gap: spacing.sm },
  center: { textAlign: 'center' },
  title: { marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  error: { marginTop: spacing.xs, marginHorizontal: spacing.xs },
  formError: { marginBottom: spacing.md },
  button: { marginTop: spacing.sm },
  switch: { marginTop: spacing.md },
});
