// Shared "is the Add sheet open?" state, used by the + button and the sheet.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AddSheetContext = createContext({ open: false, toggle: () => {}, close: () => {} });

export function AddSheetProvider({ children }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);
  return <AddSheetContext.Provider value={value}>{children}</AddSheetContext.Provider>;
}

export const useAddSheet = () => useContext(AddSheetContext);
