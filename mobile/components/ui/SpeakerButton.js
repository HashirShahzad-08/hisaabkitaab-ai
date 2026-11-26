// Reads a text aloud. Tap again to stop. Hidden when "Read aloud" is off in Settings.
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

import PressableScale from '../PressableScale';
import { useSettings } from '../../context/SettingsContext';
import { colors, sizes } from '../../theme';

export default function SpeakerButton({ text, color = colors.accentLight }) {
  const { t, i18n } = useTranslation();
  const { readAloud } = useSettings();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => { Speech.stop(); }, []);
  useEffect(() => { if (!readAloud) setSpeaking(false); }, [readAloud]);

  if (!readAloud) return null;

  async function toggle() {
    const wasSpeaking = speaking;
    await Speech.stop(); // also stops another speaker on the same screen
    if (wasSpeaking) {
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: i18n.language === 'ur' ? 'ur-PK' : 'en-US',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  return (
    <PressableScale onPress={toggle} accessibilityLabel={t('home.listen')} pressableStyle={styles.button}>
      <Ionicons name={speaking ? 'stop-circle-outline' : 'volume-high-outline'} size={22} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
});
