// Shown for a moment after login while we decide between the welcome flow and Home.
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme';

export default function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={colors.accentLight} accessibilityLabel={t('common.loading')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
