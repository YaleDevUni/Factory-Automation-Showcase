import { create } from 'zustand';

interface AnalyticsState {
  overviewData: any | null;
  machineSummaryData: any | null;
  propertyHistoryData: any | null;
  loading: boolean;
  error: string | null;
  selectedPeriod: string;
  selectedMachineId: string | null;
  selectedPropertyName: string | null;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedPeriod: (period: string) => void;
  setSelectedMachineId: (machineId: string | null) => void;
  setSelectedPropertyName: (propertyName: string | null) => void;
  setOverviewData: (data: any) => void;
  setMachineSummaryData: (data: any) => void;
  setPropertyHistoryData: (data: any) => void;
  setMachines: (machines: any[]) => void;
  setProperties: (properties: string[]) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overviewData: null,
  machineSummaryData: null,
  propertyHistoryData: null,
  loading: false,
  error: null,
  selectedPeriod: '24h',
  selectedMachineId: null,
  selectedPropertyName: null,
  machines: [],
  properties: [],

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setSelectedMachineId: (machineId) => set({ selectedMachineId: machineId }),
  setSelectedPropertyName: (propertyName) => set({ selectedPropertyName: propertyName }),
  setOverviewData: (data) => set({ overviewData: data }),
  setMachineSummaryData: (data) => set({ machineSummaryData: data }),
  setPropertyHistoryData: (data) => set({ propertyHistoryData: data }),
  setMachines: (machines) => set({ machines }),
  setProperties: (properties) => set({ properties }),
}));
