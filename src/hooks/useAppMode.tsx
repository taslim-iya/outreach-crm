import { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'campaigns' | 'sequences';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  modeLabel: string;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: 'campaigns',
  setMode: () => {},
  modeLabel: 'Campaigns',
});

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>(() => {
    return (localStorage.getItem('app-mode') as AppMode) || 'campaigns';
  });

  const handleSetMode = (newMode: AppMode) => {
    setMode(newMode);
    localStorage.setItem('app-mode', newMode);
  };

  const modeLabel = mode === 'campaigns' ? 'Campaigns' : 'Sequences';

  return (
    <AppModeContext.Provider value={{ mode, setMode: handleSetMode, modeLabel }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
