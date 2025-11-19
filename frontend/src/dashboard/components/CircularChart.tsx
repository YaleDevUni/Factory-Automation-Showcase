// frontend/src/dashboard/components/CircularChart.tsx
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ChartData {
  name: string;
  value: number;
}

interface CircularChartProps {
  data: ChartData[];
  title: string;
}

const COLORS = ["#00C49F", "#FF8042"]; // Green for Normal, Orange for Alarm

const CircularChart: React.FC<CircularChartProps> = ({ data, title }) => {
  // Filter out data points with value 0 to avoid rendering empty slices
  const filteredData = data.filter((entry) => entry.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow text-center text-gray-500">
        <h3 className="text-md font-semibold mb-2">{title}</h3>
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-md font-semibold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            fill="#8884d8"
            paddingAngle={5}
            isAnimationActive={false}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {filteredData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-1"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></span>
            <span>
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CircularChart;
