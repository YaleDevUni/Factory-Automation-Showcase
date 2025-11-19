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
  realtimeOverviewData: any | null; // New state for real-time overview
  realtimeOverviewLoading: boolean; // New state for real-time overview loading
  isAutoFetchingEnabled: boolean; // New state for auto-fetching toggle
  realtimeAlarmDetails: any[]; // New state for real-time alarm details
  realtimeAlarmDetailsLoading: boolean; // New state for real-time alarm details loading

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
  setRealtimeOverviewData: (data: any) => void; // New action
  setRealtimeOverviewLoading: (loading: boolean) => void; // New action
  setIsAutoFetchingEnabled: (enabled: boolean) => void; // New action
  setRealtimeAlarmDetails: (details: any[]) => void; // New action
  setRealtimeAlarmDetailsLoading: (loading: boolean) => void; // New action
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
  realtimeOverviewData: null, // Initial state for real-time overview
  realtimeOverviewLoading: false, // Initial state for real-time overview loading
  isAutoFetchingEnabled: true, // Initial state for auto-fetching toggle
  realtimeAlarmDetails: [], // Initial state for real-time alarm details
  realtimeAlarmDetailsLoading: false, // Initial state for real-time alarm details loading

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
  setRealtimeOverviewData: (data) => set({ realtimeOverviewData: data }), // New action
  setRealtimeOverviewLoading: (loading) =>
    set({ realtimeOverviewLoading: loading }), // New action
  setIsAutoFetchingEnabled: (enabled) =>
    set({ isAutoFetchingEnabled: enabled }), // New action
  setRealtimeAlarmDetails: (details) => set({ realtimeAlarmDetails: details }), // New action
  setRealtimeAlarmDetailsLoading: (loading) => set({ realtimeAlarmDetailsLoading: loading }), // New action
}));
