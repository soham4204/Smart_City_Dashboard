'use client';

import { DashboardData, useWebsocket } from '@/hooks/useWebsocket';
import { createContext, ReactNode, useContext } from 'react';

interface DashboardContextType {
  data: DashboardData;
  isConnected: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data, isConnected, error } = useWebsocket();

  return (
    <DashboardContext.Provider value={{ data, isConnected, error }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}