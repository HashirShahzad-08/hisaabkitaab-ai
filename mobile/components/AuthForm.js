// One form used for both Login and Sign up (DESIGN.md section 8.2).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { login, mapAuthError, signUp } from '../services/authService';
import { colors, fonts, radius, screenPadding, sizes } from '../theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForm({ mode }) {
  const isSignUp = mode === 'signup';
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isUrdu = i18n.language === 'ur';

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

  const inputProps = {
    mode: 'outlined',
    outlineColor: colors.border,
    activeOutlineColor: colors.primary,
    style: styles.input,
    outlineStyle: { borderRadius: radius.input },
    contentStyle: { fontFamily: fonts.en.regular },
    disabled: busy,
  };

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
          <View style={styles.header}>
            <AppText variant="h1" color={colors.primary} style={styles.center}>
              {t('app.name')}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.center}>
              {t('app.tagline')}
            </AppText>
          </View>

          <AppText variant="h2" style={styles.title}>
            {isSignUp ? t('auth.createAccount') : t('auth.login')}
          </AppText>

          {isSignUp && (
            <View style={styles.field}>
              <TextInput
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
            <TextInput
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
            <TextInput
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

          <Button
            mode="contained"
            onPress={submit}
            loading={busy}
            disabled={busy}
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={{ fontFamily: isUrdu ? fonts.ur.semibold : fonts.en.semibold, fontSize: 16 }}
          >
            {isSignUp ? t('auth.createAccount') : t('auth.login')}
          </Button>

          <Pressable
            onPress={() => router.replace(isSignUp ? '/login' : '/signup')}
            style={styles.switch}
            hitSlop={8}
          >
            <AppText variant="body" color={colors.primary} style={styles.center}>
              {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
            </AppText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: screenPadding, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  center: { textAlign: 'center' },
  title: { marginBottom: 16 },
  field: { marginBottom: 12 },
  input: { backgroundColor: colors.surface },
  error: { marginTop: 4, marginHorizontal: 4 },
  formError: { marginBottom: 12 },
  button: { borderRadius: radius.button, marginTop: 12 },
  buttonContent: { height: sizes.button },
  switch: { marginTop: 24, minHeight: sizes.touch, justifyContent: 'center' },
});
