// Icon, (optional) title, one line of text and (optionally) a button, for empty lists and load errors.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '../AppText';
import Card from './Card';
import PrimaryButton from './PrimaryButton';
import { colors, spacing } from '../../theme';

export default function EmptyState({
  icon, iconColor = colors.accentLight, title, text, buttonLabel, buttonIcon, buttonVariant, onPress,
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.circle}>
        <Ionicons name={icon} size={40} color={iconColor} />
      </View>
      {title ? <AppText variant="h2" style={styles.center}>{title}</AppText> : null}
      <AppText variant="body" color={colors.textSecondary} style={styles.center}>{text}</AppText>
      {buttonLabel ? (
        <PrimaryButton label={buttonLabel} icon={buttonIcon} variant={buttonVariant} onPress={onPress} style={styles.button} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  circle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: spacing.md },
});
