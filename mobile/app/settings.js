// Settings (placeholder). The temporary Log out button now lives here.
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AppText from '../components/AppText';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { colors, radius, screenPadding, sizes } from '../theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader title={t('settings.title')} />
      <View style={styles.body}>
        <AppText variant="body" color={colors.textSecondary}>{t('common.comingSoon')}</AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.email}>
          {t('home.signedInAs', { name: user?.displayName || user?.email })}
        </AppText>
        <Button
          mode="outlined"
          onPress={logout}
          textColor={colors.danger}
          style={styles.logout}
          contentStyle={{ height: sizes.button }}
        >
          {t('auth.logout')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: screenPadding },
  email: { marginTop: 8 },
  logout: { marginTop: 24, borderRadius: radius.button, borderColor: colors.danger },
});
