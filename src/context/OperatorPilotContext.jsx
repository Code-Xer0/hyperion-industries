import { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'hyperion.operatorPilot.enabled.v1';
const PILOT_AVAILABLE = import.meta.env.VITE_OPERATOR_PILOT_AVAILABLE !== 'false';
const PILOT_DEFAULT = import.meta.env.VITE_OPERATOR_PILOT_DEFAULT === 'true';

const OperatorPilotContext = createContext(null);

function readInitialState() {
  if (!PILOT_AVAILABLE) return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // Storage can be unavailable in hardened or private browsing contexts.
  }
  return PILOT_DEFAULT;
}

export function OperatorPilotProvider({ children }) {
  const [enabled, setEnabledState] = useState(readInitialState);

  const setEnabled = (next) => {
    const value = PILOT_AVAILABLE && Boolean(next);
    setEnabledState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Consent still applies for this session when persistence is unavailable.
    }
  };

  const value = useMemo(() => ({
    available: PILOT_AVAILABLE,
    enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled),
  }), [enabled]);

  return <OperatorPilotContext.Provider value={value}>{children}</OperatorPilotContext.Provider>;
}

export function useOperatorPilot() {
  const value = useContext(OperatorPilotContext);
  if (!value) throw new Error('useOperatorPilot must be used inside OperatorPilotProvider.');
  return value;
}
