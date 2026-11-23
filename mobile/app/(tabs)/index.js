import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AppText from '../../components/AppText';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../services/authService';
import { colors, radius, screenPadding, sizes } from '../../theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppText variant="h1">{t('home.title')}</AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          {t('home.signedInAs', { name: user?.displayName || user?.email })}
        </AppText>
        {/* Temporary: remove when Settings has a Log out button */}
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
  body: { flex: 1, padding: screenPadding, justifyContent: 'center' },
  sub: { marginTop: 8 },
  logout: { marginTop: 24, borderRadius: radius.button, borderColor: colors.danger },
});
