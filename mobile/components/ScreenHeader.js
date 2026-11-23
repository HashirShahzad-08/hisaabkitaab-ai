// Title bar with a back button, for screens that sit on top of the tabs.
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { colors, screenPadding, sizes } from '../theme';

export default function ScreenHeader({ title }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  return (
    <View style={[styles.row, isUrdu && styles.rowUrdu]}>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
      >
        <Ionicons name={isUrdu ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
      </Pressable>
      <AppText variant="h1" style={styles.title}>{title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: screenPadding - 8, paddingVertical: 8 },
  rowUrdu: { flexDirection: 'row-reverse' },
  back: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, marginHorizontal: 4 },
});
