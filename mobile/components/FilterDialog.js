// A simple pick-one list shown in a dialog (used by the History filter chips).
import { ScrollView } from 'react-native';
import { Dialog, Portal, RadioButton } from 'react-native-paper';

import AppText from './AppText';
import { colors, radius } from '../theme';

// options: [{ value, label }]
export default function FilterDialog({ visible, title, options, value, onSelect, onDismiss }) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: colors.surfaceRaised, borderRadius: radius.card }}>
        <Dialog.Title>
          <AppText variant="h2">{title}</AppText>
        </Dialog.Title>
        <Dialog.ScrollArea style={{ maxHeight: 360, paddingHorizontal: 0 }}>
          <ScrollView>
            <RadioButton.Group onValueChange={onSelect} value={value}>
              {options.map((o) => (
                <RadioButton.Item
                  key={o.value}
                  value={o.value}
                  label={o.label}
                  color={colors.primary}
                  labelVariant="bodyLarge"
                  labelStyle={{ color: colors.text }}
                />
              ))}
            </RadioButton.Group>
          </ScrollView>
        </Dialog.ScrollArea>
      </Dialog>
    </Portal>
  );
}
