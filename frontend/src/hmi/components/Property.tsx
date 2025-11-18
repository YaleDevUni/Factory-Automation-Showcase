import React from "react";

interface PropertyProps {
  property: {
    property_name: string;
    unit: string | null;
    value: number | null;
    alarm: boolean;
  };
}

const Property: React.FC<PropertyProps> = ({ property }) => {
  const alarmClass = property.alarm ? 'bg-red-500 text-white' : 'bg-gray-700 text-blue-300';

  return (
    <div className={`rounded-lg p-3 border border-gray-600 flex justify-between items-center ${alarmClass}`}>
      <p className="text-md font-semibold text-gray-300">{property.property_name}</p>
      <p className="text-xl font-bold">
        {property.value !== null ? property.value.toFixed(2) : 'N/A'} <span className="text-sm text-gray-400">{property.unit}</span>
      </p>
    </div>
  );
};

export default Property;
