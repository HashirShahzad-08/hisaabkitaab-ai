// A tip or explanation with a speaker button that reads it aloud.
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from './AppText';
import Card from './ui/Card';
import SpeakerButton from './ui/SpeakerButton';
import { colors, spacing } from '../theme';

export default function InsightCard({ text }) {
  return (
    <Card style={styles.card}>
      <Ionicons name="bulb-outline" size={24} color={colors.info} />
      <AppText variant="body" color={colors.textBody} style={styles.text}>{text}</AppText>
      <SpeakerButton text={text} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1 },
});
