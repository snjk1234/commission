import React from 'react';

interface SimpleChartProps {
  data: { label: string; value: number; color?: string }[];
  type?: 'bar' | 'pie';
  className?: string;
  showLabels?: boolean;
  maxValue?: number;
}

export function SimpleChart({ 
  data, 
  type = 'bar', 
  className = '',
  showLabels = true,
  maxValue 
}: SimpleChartProps) {
  const maxVal = maxValue || Math.max(...data.map(item => item.value));

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 
      'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];

    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative w-40 h-40 rounded-full overflow-hidden">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const cumulativePercentage = data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 100, 0);
            const color = colors[index % colors.length];

            return (
              <div
                key={index}
                className={`absolute top-0 left-0 h-full ${color}`}
                style={{
                  clipPath: `conic-gradient(${cumulativePercentage}deg ${cumulativePercentage + percentage}deg)`
                }}
              />
            );
          })}
        </div>

        {showLabels && (
          <div className="ml-4 space-y-1">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1);
              const color = colors[index % colors.length];

              return (
                <div key={index} className="flex items-center text-sm">
                  <div className={`w-3 h-3 ${color} rounded-full mr-2`} />
                  <span className="text-slate-600 dark:text-slate-300">{item.label}: {percentage}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {data.map((item, index) => {
        const percentage = (item.value / maxVal) * 100;
        const color = item.color || [
          'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 
          'bg-rose-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
        ][index % 8];

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">{item.value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div 
                className={`${color} h-2 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
