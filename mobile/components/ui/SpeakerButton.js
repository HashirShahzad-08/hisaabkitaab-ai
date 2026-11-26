// Reads a text aloud. Tap again to stop. Hidden when "Read aloud" is off in Settings.
// Speech stops when you leave the screen. In Urdu, a message appears if the phone has no Urdu voice.
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppText from '../AppText';
import PressableScale from '../PressableScale';
import { useSettings } from '../../context/SettingsContext';
import { colors, sizes } from '../../theme';

// True only when the phone lists its voices and none of them is Urdu.
// An empty list means "cannot tell" (some phones answer late), so we try to speak.
async function urduVoiceMissing() {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0 && !voices.some((v) => /^ur/i.test(v.language || ''));
  } catch (e) {
    return false;
  }
}

export default function SpeakerButton({ text, color = colors.accentLight }) {
  const { t, i18n } = useTranslation();
  const { readAloud } = useSettings();
  const [speaking, setSpeaking] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const focused = useRef(true);

  useEffect(() => () => { focused.current = false; Speech.stop(); }, []);
  useEffect(() => { if (!readAloud) setSpeaking(false); }, [readAloud]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
        Speech.stop();
        setSpeaking(false);
        setNoVoice(false);
      };
    }, [])
  );

  if (!readAloud) return null;

  async function toggle() {
    const wasSpeaking = speaking;
    await Speech.stop(); // also stops another speaker on the same screen
    if (wasSpeaking) {
      setSpeaking(false);
      return;
    }
    const urdu = i18n.language === 'ur';
    if (urdu && (await urduVoiceMissing())) {
      setNoVoice(true);
      return;
    }
    if (!focused.current) return; // the screen was left while we were checking
    setSpeaking(true);
    Speech.speak(text, {
      language: urdu ? 'ur-PK' : 'en-US',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  return (
    <>
      <PressableScale onPress={toggle} accessibilityLabel={t('home.listen')} pressableStyle={styles.button}>
        <Ionicons name={speaking ? 'stop-circle-outline' : 'volume-high-outline'} size={22} color={color} />
      </PressableScale>
      {noVoice ? (
        <Portal>
          <Snackbar visible onDismiss={() => setNoVoice(false)} duration={3000}>
            <AppText variant="body">{t('common.noUrduVoice')}</AppText>
          </Snackbar>
        </Portal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
});
