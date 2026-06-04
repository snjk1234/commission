import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'currency';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  format = 'number',
  className = '' 
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `ر.س ${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getChangeIcon = () => {
    if (change === 0) return <Minus className="h-4 w-4 text-gray-500" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getChangeColor = () => {
    if (change === 0) return 'text-gray-500';
    if (change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatValue(value)}
          </p>
        </div>
        {icon && (
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center mt-3">
          {getChangeIcon()}
          <span className={`text-sm font-medium ml-1 ${getChangeColor()}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">عن العام الماضي</span>
        </div>
      )}
    </div>
  );
}
