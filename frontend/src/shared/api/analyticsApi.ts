const API_BASE_URL = 'http://localhost:8000/api/analytics';


export const fetchOverviewAnalytics = async (period: string = "24h") => {
  const response = await fetch(`${API_BASE_URL}/overview?period=${period}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchMachineSummary = async (
  machineId: string,
  period: string = "24h"
) => {
  const response = await fetch(
    `${API_BASE_URL}/machine/${machineId}/summary?period=${period}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};



export const fetchRealtimePropertyHistory = async (
  propertyName: string,
  machineId: string | null = null,
  lineId: string | null = null,
  lastTimestamp: string | null = null
) => {
  let url = `${API_BASE_URL}/realtime/${propertyName}/history`;
  const params = new URLSearchParams();
  if (machineId) {
    params.append("machineId", machineId);
  }
  if (lineId) {
    params.append("lineId", lineId);
  }
  if (lastTimestamp) {
    params.append("lastTimestamp", lastTimestamp);
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchRealtimeOverview = async (
  machineId: string,
  lineId: string | null = null
) => {
  let url = `${API_BASE_URL}/realtime/overview/${machineId}`;
  const params = new URLSearchParams();
  if (lineId) {
    params.append("lineId", lineId);
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchRealtimeAlarmDetails = async (
  machineId: string,
  lineId: string | null = null
) => {
  let url = `${API_BASE_URL}/realtime/alarms/${machineId}`;
  const params = new URLSearchParams();
  if (lineId) {
    params.append("lineId", lineId);
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
