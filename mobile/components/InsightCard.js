// An explanation with a speaker button that reads it aloud.
// The title and the button share the top row; the text uses the full width below.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import Card from './ui/Card';
import SpeakerButton from './ui/SpeakerButton';
import { colors, sizes, spacing } from '../theme';

export default function InsightCard({ text }) {
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={24} color={colors.info} />
        <AppText variant="h2" style={styles.title}>{t('common.explanation')}</AppText>
        <SpeakerButton text={text} />
      </View>
      <AppText variant="body" color={colors.textBody}>{text}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: sizes.touch },
  title: { flex: 1 },
});
