import { create } from "zustand";

export interface SensorData {
  machine_id: number;
  machine_name: string;
  line_id: number;
  properties: {
    property_name: string;
    unit: string | null;
    value: number | null;
    alarm: boolean;
  }[];
}

interface HmiState {
  machines: SensorData[];
  updateMachine: (data: SensorData) => void;
}

const arePropertiesEqual = (props1: any[], props2: any[]): boolean => {
  if (props1.length !== props2.length) {
    return false;
  }
  for (let i = 0; i < props1.length; i++) {
    const p1 = props1[i];
    const p2 = props2[i];
    if (
      p1.property_name !== p2.property_name ||
      p1.value !== p2.value ||
      p1.alarm !== p2.alarm
    ) {
      return false;
    }
  }
  return true;
};

export const useHmiStore = create<HmiState>((set) => ({
  machines: [],
  updateMachine: (data) =>
    set((state) => {
      const existingMachineIndex = state.machines.findIndex(
        (machine) => machine.machine_id === data.machine_id
      );

      if (existingMachineIndex !== -1) {
        const existingMachine = state.machines[existingMachineIndex];
        if (arePropertiesEqual(existingMachine.properties, data.properties)) {
          return state;
        }

        const newMachines = state.machines.map((machine, index) =>
          index === existingMachineIndex ? data : machine
        );
        newMachines.sort((a, b) => a.machine_id - b.machine_id);
        return { machines: newMachines };
      } else {
        const newMachines = [...state.machines, data];
        newMachines.sort((a, b) => a.machine_id - b.machine_id);
        return { machines: newMachines };
      }
    }),
}));
