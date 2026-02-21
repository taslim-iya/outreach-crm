import { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'fundraising' | 'deal-sourcing';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  modeLabel: string;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: 'fundraising',
  setMode: () => {},
  modeLabel: 'Fundraising',
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(() => {
    return (localStorage.getItem('app-mode') as AppMode) || 'fundraising';
  });

  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem('app-mode', newMode);
  };

  const modeLabel = mode === 'fundraising' ? 'Fundraising' : 'Deal Sourcing';

  return (
    <AppModeContext.Provider value={{ mode, setMode: handleSetMode, modeLabel }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
