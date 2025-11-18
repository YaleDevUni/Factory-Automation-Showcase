import React, { useEffect } from 'react';
import { useAnalyticsStore } from '../store';
import {
  fetchOverviewAnalytics,
  fetchMachineSummary,
  fetchPropertyHistory,
} from '../../shared/api/analyticsApi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard: React.FC = () => {
  const {
    overviewData,
    machineSummaryData,
    propertyHistoryData,
    loading,
    error,
    selectedPeriod,
    selectedMachineId,
    selectedPropertyName,
    machines,
    properties,
    setOverviewData,
    setMachineSummaryData,
    setPropertyHistoryData,
    setLoading,
    setError,
    setSelectedPeriod,
    setSelectedMachineId,
    setSelectedPropertyName,
    setMachines,
    setProperties,
  } = useAnalyticsStore();

  // Fetch overview data on component mount and when selectedPeriod changes
  useEffect(() => {
    const getOverviewData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOverviewAnalytics(selectedPeriod);
        setOverviewData(data);
        setMachines(data.machines);
        setProperties(data.uniquePropertyNames);
        // Automatically select the first machine if available
        if (data.machines.length > 0 && !selectedMachineId) {
          setSelectedMachineId(data.machines[0].machineId);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getOverviewData();
  }, [selectedPeriod]);

  // Fetch machine summary when selectedMachineId or selectedPeriod changes
  useEffect(() => {
    if (selectedMachineId) {
      const getMachineSummary = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchMachineSummary(selectedMachineId, selectedPeriod);
          setMachineSummaryData(data);
          // Automatically select the first property if available
          if (data.propertySummaries && Object.keys(data.propertySummaries).length > 0 && !selectedPropertyName) {
            setSelectedPropertyName(Object.keys(data.propertySummaries)[0]);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      getMachineSummary();
    } else {
      setMachineSummaryData(null);
    }
  }, [selectedMachineId, selectedPeriod]);

  // Fetch property history when selectedMachineId, selectedPropertyName, or selectedPeriod changes
  useEffect(() => {
    if (selectedMachineId && selectedPropertyName) {
      const getPropertyHistory = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchPropertyHistory(selectedPropertyName, selectedMachineId, null, selectedPeriod);
          setPropertyHistoryData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      getPropertyHistory();
    } else {
      setPropertyHistoryData(null);
    }
  }, [selectedMachineId, selectedPropertyName, selectedPeriod]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value);
  };

  const handleMachineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMachineId(event.target.value);
    setSelectedPropertyName(null); // Reset property selection when machine changes
  };

  const handlePropertyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPropertyName(event.target.value);
  };

  if (loading) return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MES/ERP Dashboard</h1>

      <div className="mb-4 flex space-x-4">
        <div>
          <label htmlFor="period-select" className="mr-2">Select Period:</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="border rounded p-1"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <div>
          <label htmlFor="machine-select" className="mr-2">Select Machine:</label>
          <select
            id="machine-select"
            value={selectedMachineId || ''}
            onChange={handleMachineChange}
            className="border rounded p-1"
            disabled={machines.length === 0}
          >
            <option value="">-- Select a Machine --</option>
            {machines.map((machine) => (
              <option key={machine.machineId} value={machine.machineId}>
                {machine.machineName || machine.machineId}
              </option>
            ))}
          </select>
        </div>

        {selectedMachineId && properties.length > 0 && (
          <div>
            <label htmlFor="property-select" className="mr-2">Select Property:</label>
            <select
              id="property-select"
              value={selectedPropertyName || ''}
              onChange={handlePropertyChange}
              className="border rounded p-1"
            >
              <option value="">-- Select a Property --</option>
              {properties.map((propName) => (
                <option key={propName} value={propName}>
                  {propName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Total Records</h2>
            <p className="text-3xl">{overviewData.totalRecords}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Total Machines</h2>
            <p className="text-3xl">{overviewData.machines.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Total Lines</h2>
            <p className="text-3xl">{overviewData.lines.length}</p>
          </div>
        </div>
      )}

      {machineSummaryData && selectedMachineId && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Machine Summary: {machineSummaryData.machineName || selectedMachineId}</h2>
          {machineSummaryData.message ? (
            <p>{machineSummaryData.message}</p>
          ) : (
            <div>
              <p><strong>Line ID:</strong> {machineSummaryData.lineId}</p>
              <p><strong>Alarms:</strong> {machineSummaryData.alarmCount}</p>
              <h3 className="text-md font-semibold mt-4">Property Summaries:</h3>
              {Object.keys(machineSummaryData.propertySummaries).length > 0 ? (
                <ul className="list-disc list-inside">
                  {Object.entries(machineSummaryData.propertySummaries).map(([propName, summary]: [string, any]) => (
                    <li key={propName}>
                      <strong>{propName}:</strong> Avg: {summary.avg?.toFixed(2)}, Min: {summary.min?.toFixed(2)}, Max: {summary.max?.toFixed(2)}, Latest: {summary.latest?.toFixed(2)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No property summaries available for this period.</p>
              )}
            </div>
          )}
        </div>
      )}

      {propertyHistoryData && selectedPropertyName && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">Property History: {selectedPropertyName} for {selectedMachineId}</h2>
          {propertyHistoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={propertyHistoryData.map(d => ({ ...d, timestamp: new Date(d.timestamp).toLocaleTimeString() }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No historical data available for this property in the selected period.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
