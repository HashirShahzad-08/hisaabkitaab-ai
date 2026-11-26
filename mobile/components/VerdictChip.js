// Small colored pill: blue (looks ok), amber (check), red (likely overbilled).
import { useTranslation } from 'react-i18next';

import Chip from './ui/Chip';
import { verdictMeta } from '../utils/billUi';

export default function VerdictChip({ verdict }) {
  const { t } = useTranslation();
  const meta = verdictMeta(verdict);
  return <Chip label={t(`bills.chip.${verdict}`)} color={meta.color} background={meta.bg} borderColor={meta.color} />;
}
