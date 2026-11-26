// Keeps inputs and the bottom button above the keyboard, on Android as well as iOS.
// Put it around the scroll area AND the footer of a form screen.
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

export default function KeyboardAvoider({ children, style }) {
  return (
    <KeyboardAvoidingView style={[styles.flex, style]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
