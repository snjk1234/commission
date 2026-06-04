import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface QuarterlyData {
  quarter: string;
  year: number;
  sales: number;
  commission: number;
  growth?: number;
}

interface BranchQuarterlyData {
  branchName: string;
  quarters: QuarterlyData[];
}

interface QuarterlyComparisonProps {
  data: BranchQuarterlyData[];
  className?: string;
}

export function QuarterlyComparison({ data, className = '' }: QuarterlyComparisonProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedMetric, 'sales' | 'commission' | 'growth'] = useState<'sales' | 'commission' | 'growth'>('sales');

  // Calculate overall quarterly statistics
  const quarterlyStats = useMemo(() => {
    const quarters: Record<string, { sales: number; commission: number; count: number }> = {};

    data.forEach(branch => {
      branch.quarters.forEach(quarter => {
        const key = `${quarter.year}-${Math.floor((quarter.quarter - 1) / 3) + 1}`;
        if (!quarters[key]) {
          quarters[key] = { sales: 0, commission: 0, count: 0 };
        }
        quarters[key].sales += quarter.sales;
        quarters[key].commission += quarter.commission;
        quarters[key].count++;
      });
    });

    return Object.entries(quarters).map(([key, stats]) => {
      const [year, quarter] = key.split('-');
      return {
        quarter: `الربع ${quarter}`,
        year: parseInt(year),
        sales: stats.sales,
        commission: stats.commission,
        avgSales: stats.sales / stats.count,
        avgCommission: stats.commission / stats.count
      };
    }).sort((a, b) => a.year - b.year || a.quarter.localeCompare(b.quarter));
  }, [data]);

  // Calculate growth rates
  const quarterlyGrowth = useMemo(() => {
    const growthRates = quarterlyStats.map((stat, index) => {
      if (index === 0) return { ...stat, growth: 0 };

      const prev = quarterlyStats[index - 1];
      const growth = ((stat.sales - prev.sales) / prev.sales) * 100;

      return { ...stat, growth };
    });

    return growthRates;
  }, [quarterlyStats]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (selectedBranch) {
      const branchData = data.find(b => b.branchName === selectedBranch);
      if (!branchData) return [];

      return branchData.quarters.map(q => ({
        label: `ربع ${Math.floor((q.quarter - 1) / 3) + 1}`,
        value: q[selectedMetric],
        growth: q.growth,
        year: q.year
      }));
    }

    return quarterlyStats.map(q => ({
      label: q.quarter,
      value: q[selectedMetric],
      growth: quarterlyGrowth.find(g => g.quarter === q.quarter)?.growth || 0,
      year: q.year
    }));
  }, [data, selectedBranch, selectedMetric, quarterlyStats, quarterlyGrowth]);

  const formatValue = (value: number, metric: typeof selectedMetric) => {
    switch (metric) {
      case 'sales':
        return `ر.س ${value.toLocaleString()}`;
      case 'commission':
        return `ر.س ${value.toFixed(2)}`;
      case 'growth':
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={18} />
          المقارنة الفصلية
        </h3>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1 text-sm"
          >
            <option value="">جميع الفروع</option>
            {data.map(branch => (
              <option key={branch.branchName} value={branch.branchName}>{branch.branchName}</option>
            ))}
          </select>

          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            {(['sales', 'commission', 'growth'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => selectedMetric = metric}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${
                  selectedMetric === metric 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {metric === 'sales' && 'المبيعات'}
                {metric === 'commission' && 'العمولات'}
                {metric === 'growth' && 'النمو'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Chart */}
        <div className="h-64 flex items-center justify-center">
          <div className="w-full h-full flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {formatValue(item.value, selectedMetric)}
                  </div>
                  {selectedMetric === 'growth' && item.growth !== undefined && (
                    <div className={`text-xs font-bold flex items-center gap-1 mt-1 ${
                      item.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(item.growth).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branch Selector */}
        {data.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اختر فرع للمقارنة</h4>
            <div className="flex flex-wrap gap-2">
              {data.map(branch => (
                <button
                  key={branch.branchName}
                  onClick={() => setSelectedBranch(branch.branchName)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedBranch === branch.branchName 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {branch.branchName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
