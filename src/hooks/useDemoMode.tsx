import { createContext, useContext, useState, ReactNode } from 'react';

interface DemoModeContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType>({
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        enterDemoMode: () => setIsDemoMode(true),
        exitDemoMode: () => setIsDemoMode(false),
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

// Demo data for guest users
export const DEMO_DATA = {
  metrics: {
    totalInvestors: 47,
    totalCommitted: 2850000,
    fundraisingGoal: 5000000,
    activePipeline: 23,
    meetingsThisWeek: 4,
    emailsSent: 156,
    openRate: 68,
    responseRate: 34,
  },
  investors: [
    { id: '1', name: 'Sarah Chen', organization: 'Westfield Capital', stage: 'committed', commitment_amount: 500000 },
    { id: '2', name: 'Michael Torres', organization: 'Blue Ridge Partners', stage: 'interested', commitment_amount: null },
    { id: '3', name: 'David Park', organization: 'Summit Equity Group', stage: 'meeting_scheduled', commitment_amount: null },
    { id: '4', name: 'Lisa Wong', organization: 'Pacific Ventures', stage: 'committed', commitment_amount: 750000 },
    { id: '5', name: 'James Richardson', organization: 'Heritage Capital', stage: 'follow_up', commitment_amount: null },
    { id: '6', name: 'Emily Foster', organization: 'Redwood Partners', stage: 'outreach_sent', commitment_amount: null },
  ],
  companies: [
    { id: '1', name: 'TechFlow Solutions', industry: 'SaaS', geography: 'Austin, TX', stage: 'in_discussion', revenue: 3200000, ebitda: 640000 },
    { id: '2', name: 'Meridian Services', industry: 'Business Services', geography: 'Chicago, IL', stage: 'nda_signed', revenue: 5800000, ebitda: 1160000 },
    { id: '3', name: 'GreenLeaf HVAC', industry: 'Home Services', geography: 'Denver, CO', stage: 'researching', revenue: 2100000, ebitda: 420000 },
  ],
  tasks: [
    { id: '1', title: 'Follow up with Sarah Chen on term sheet', priority: 'high', due_date: '2026-02-27', completed: false },
    { id: '2', title: 'Send LOI to TechFlow Solutions', priority: 'high', due_date: '2026-02-28', completed: false },
    { id: '3', title: 'Prepare Q1 investor update', priority: 'medium', due_date: '2026-03-01', completed: false },
    { id: '4', title: 'Schedule call with David Park', priority: 'medium', due_date: '2026-02-26', completed: false },
  ],
};
