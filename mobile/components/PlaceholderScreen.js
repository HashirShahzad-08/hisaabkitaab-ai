// Simple placeholder used by every tab until the real screen is built.
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, screenPadding } from '../theme';

export default function PlaceholderScreen({ titleKey }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppText variant="h1">{t(titleKey)}</AppText>
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
