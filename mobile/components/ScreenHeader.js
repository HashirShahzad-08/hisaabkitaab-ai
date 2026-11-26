// Title bar with a back button, for screens that sit on top of the tabs.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import PressableScale from './PressableScale';
import { colors, radius, screenPadding, sizes, spacing } from '../theme';
import { backIcon, useIsRTL } from '../utils/rtl';

export default function ScreenHeader({ title }) {
  const router = useRouter();
  const { t } = useTranslation();
  const rtl = useIsRTL();
  return (
    <View style={styles.row}>
      <PressableScale onPress={() => router.back()} accessibilityLabel={t('common.back')} hitSlop={8}>
        <View style={styles.back}>
          <Ionicons name={backIcon(rtl)} size={22} color={colors.text} />
        </View>
      </PressableScale>
      <AppText variant="h1" style={styles.title}>{title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: screenPadding, paddingVertical: spacing.sm },
  back: {
    width: sizes.touch,
    height: sizes.touch,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
});
