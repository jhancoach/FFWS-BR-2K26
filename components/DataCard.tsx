import React from 'react';

interface DataCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const DataCard: React.FC<DataCardProps> = ({ title, value, subValue, icon, color = "bg-[#2D2D2D]" }) => {
  return (
    <div className={`${color} rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:border-purple-500/30 transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
        </div>
        {icon && (
          <div className="p-3 bg-white/5 rounded-lg text-purple-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCard;