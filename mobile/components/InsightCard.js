// AI insight card (rule-based for now) with a speaker button that reads the tip aloud.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

import AppText from './AppText';
import { useSettings } from '../context/SettingsContext';
import { colors, radius, sizes } from '../theme';

function SoundBars() {
  return (
    <View style={styles.bars}>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          from={{ height: 6 }}
          animate={{ height: 18 }}
          transition={{ type: 'timing', duration: 350, delay: i * 120, loop: true, repeatReverse: true }}
          style={styles.bar}
        />
      ))}
    </View>
  );
}

export default function InsightCard({ text }) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const { readAloud } = useSettings();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => Speech.stop(), []);
  useEffect(() => { if (!readAloud) setSpeaking(false); }, [readAloud]);

  function toggle() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: isUrdu ? 'ur-PK' : 'en-US',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  return (
    <View style={styles.card}>
      <Ionicons name="bulb-outline" size={24} color={colors.info} />
      <AppText variant="body" style={styles.text}>{text}</AppText>
      {readAloud ? (
        <Pressable onPress={toggle} style={styles.speaker} accessibilityRole="button" accessibilityLabel={t('home.listen')}>
          {speaking ? <SoundBars /> : <Ionicons name="volume-high-outline" size={22} color={colors.info} />}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
  },
  text: { flex: 1 },
  speaker: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 20 },
  bar: { width: 4, borderRadius: 2, backgroundColor: colors.info },
});
