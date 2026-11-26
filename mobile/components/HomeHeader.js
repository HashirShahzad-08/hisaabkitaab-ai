// Home header: greeting by time of day with the name, notifications, and an avatar that opens Settings.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import PressableScale from './PressableScale';
import { colors, fonts, sizes, spacing } from '../theme';

function greetingKey(hour) {
  if (hour >= 5 && hour < 12) return 'home.goodMorning';
  if (hour >= 12 && hour < 17) return 'home.goodAfternoon';
  return 'home.goodEvening';
}

export default function HomeHeader({ name, onBell, onSettings }) {
  const { t } = useTranslation();
  const initial = name.trim().charAt(0).toUpperCase();
  // An Urdu-script initial needs the Urdu font
  const initialFont = /[؀-ۿ]/.test(initial) ? fonts.ur.semibold : fonts.en.semibold;

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <AppText variant="caption" color={colors.textSecondary}>{t(greetingKey(new Date().getHours()))}</AppText>
        <AppText variant="h1" numberOfLines={1}>{name || t('home.greetingNoName')}</AppText>
      </View>
      <PressableScale onPress={onBell} accessibilityLabel={t('home.notifications')} pressableStyle={styles.bell}>
        <Ionicons name="notifications-outline" size={22} color={colors.textBody} />
      </PressableScale>
      <PressableScale onPress={onSettings} accessibilityLabel={t('settings.title')}>
        <View style={styles.avatar}>
          {initial ? (
            <AppText variant="h2" color={colors.textBody} style={{ fontFamily: initialFont }}>{initial}</AppText>
          ) : (
            <Ionicons name="person-outline" size={22} color={colors.textBody} />
          )}
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  texts: { flex: 1 },
  bell: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
