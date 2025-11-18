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

export const fetchPropertyHistory = async (
  propertyName: string,
  machineId: string | null = null,
  lineId: string | null = null,
  period: string = "24h"
) => {
  let url = `${API_BASE_URL}/property/${propertyName}/history?period=${period}`;
  if (machineId) {
    url += `&machineId=${machineId}`;
  }
  if (lineId) {
    url += `&lineId=${lineId}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
