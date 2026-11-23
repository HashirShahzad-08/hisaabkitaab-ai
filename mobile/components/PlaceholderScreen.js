// Simple placeholder used until the real screen is built.
// withBack = true adds a back button (for screens opened from the Add sheet).
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import ScreenHeader from './ScreenHeader';
import { colors, screenPadding } from '../theme';

export default function PlaceholderScreen({ titleKey, withBack = false }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {withBack ? <ScreenHeader title={t(titleKey)} /> : null}
      <View style={styles.body}>
        {withBack ? null : <AppText variant="h1">{t(titleKey)}</AppText>}
        <AppText variant="body" color={colors.textSecondary} style={styles.sub}>
          {t('common.comingSoon')}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: screenPadding, justifyContent: 'center' },
  sub: { marginTop: 8 },
});
