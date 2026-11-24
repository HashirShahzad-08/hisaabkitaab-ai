// One place that answers "is the layout right-to-left?". It follows the language (Urdu = RTL).
// Rows, margins and text alignment flip by themselves (native RTL). Only things that are DRAWN as
// arrows or chevrons need this, because an icon glyph does not flip on its own.
import { useTranslation } from 'react-i18next';

export function useIsRTL() {
  const { i18n } = useTranslation();
  return i18n.language === 'ur';
}

// "back" and "forward" arrows/chevrons that point the right way in either direction
export const backIcon = (rtl, kind = 'arrow') => (rtl ? `${kind}-forward` : `${kind}-back`);
export const forwardIcon = (rtl, kind = 'arrow') => (rtl ? `${kind}-back` : `${kind}-forward`);
