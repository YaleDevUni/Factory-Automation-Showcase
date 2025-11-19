import { create } from "zustand";

interface AnalyticsState {
  overviewData: any | null;
  machineSummaryData: any | null;
  allPropertyHistoryData: { [propertyName: string]: any[] }; // New state for all property histories
  overviewLoading: boolean; // Renamed from loading
  chartsLoading: boolean; // New loading state for charts
  error: string | null;
  selectedPeriod: string;
  selectedMachineId: string | null;
  machines: any[]; // Added missing machines state
  properties: string[]; // Added missing properties state

  setOverviewLoading: (loading: boolean) => void; // Renamed from setLoading
  setChartsLoading: (loading: boolean) => void; // New action for charts loading
  setError: (error: string | null) => void;
  setSelectedPeriod: (period: string) => void;
  setSelectedMachineId: (machineId: string | null) => void;
  setOverviewData: (data: any) => void;
  setMachineSummaryData: (data: any) => void;
  setAllPropertyHistoryData: (data: { [propertyName: string]: any[] }) => void; // New action
  setMachines: (machines: any[]) => void;
  setProperties: (properties: string[]) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  overviewData: null,
  machineSummaryData: null,
  allPropertyHistoryData: {}, // Initial state for all property histories
  overviewLoading: false, // Initial state for overview loading
  chartsLoading: false, // Initial state for charts loading
  error: null,
  selectedPeriod: "3m",
  selectedMachineId: null,
  machines: [],
  properties: [],

  setOverviewLoading: (loading) => set({ overviewLoading: loading }), // Updated action
  setChartsLoading: (loading) => set({ chartsLoading: loading }), // New action
  setError: (error) => set({ error }),
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setSelectedMachineId: (machineId) => set({ selectedMachineId: machineId }),
  setOverviewData: (data) => set({ overviewData: data }),
  setMachineSummaryData: (data) => set({ machineSummaryData: data }),
  setAllPropertyHistoryData: (data) => set({ allPropertyHistoryData: data }), // New action
  setMachines: (machines) => set({ machines }),
  setProperties: (properties) => set({ properties }),
}));
