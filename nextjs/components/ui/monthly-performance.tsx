import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, CheckCircle2, AlertCircle, Award, BarChart3 } from 'lucide-react';

interface MonthlyPerformance {
  month: string;
  year: number;
  sales: number;
  commission: number;
  target: number;
  growth: number;
  bestEmployee: {
    name: string;
    sales: number;
    commission: number;
  };
  achievements: string[];
}

interface MonthlyPerformanceTrackerProps {
  branchId: string;
  branchName: string;
  data: MonthlyPerformance[];
  className?: string;
}

export function MonthlyPerformanceTracker({ branchId, branchName, data, className = '' }: MonthlyPerformanceTrackerProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  // Filter data by year
  const filteredData = useMemo(() => {
    if (yearFilter === 'all') return data;
    return data.filter(item => item.year === yearFilter);
  }, [data, yearFilter]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = [...new Set(data.map(item => item.year))].sort((a, b) => b - a);
    return years;
  }, [data]);

  // Calculate yearly performance
  const yearlyPerformance = useMemo(() => {
    if (filteredData.length === 0) return null;

    const yearlyData = filteredData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = {
          year: item.year,
          sales: 0,
          commission: 0,
          target: 0,
          months: []
        };
      }

      acc[item.year].sales += item.sales;
      acc[item.year].commission += item.commission;
      acc[item.year].target += item.target;
      acc[item.year].months.push(item);

      return acc;
    }, {} as Record<number, { year: number; sales: number; commission: number; target: number; months: MonthlyPerformance[] }>);

    return yearlyData;
  }, [filteredData]);

  // Get performance status
  const getPerformanceStatus = (achievementRate: number) => {
    if (achievementRate >= 100) return { status: 'excellent', color: 'text-emerald-600', icon: <CheckCircle2 className="text-emerald-500" /> };
    if (achievementRate >= 80) return { status: 'good', color: 'text-blue-600', icon: <Target className="text-blue-500" /> };
    if (achievementRate >= 60) return { status: 'average', color: 'text-amber-600', icon: <AlertCircle className="text-amber-500" /> };
    return { status: 'poor', color: 'text-rose-600', icon: <AlertCircle className="text-rose-500" /> };
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format month name
  const formatMonth = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleDateString('ar-SA', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={18} />
          أداء شهري - {branchName}
        </h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">السنة:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="all">الكل</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Yearly Overview */}
      {yearlyPerformance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.values(yearlyPerformance).map(yearData => {
            const achievementRate = (yearData.sales / yearData.target) * 100;
            const performanceStatus = getPerformanceStatus(achievementRate);

            return (
              <div key={yearData.year} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-slate-800 dark:text-slate-200">
                    {yearData.year}
                  </h4>
                  <div className={`text-xs font-medium flex items-center gap-1 ${performanceStatus.color}`}>
                    {performanceStatus.icon}
                    {performanceStatus.status === 'excellent' && 'ممتاز'}
                    {performanceStatus.status === 'good' && 'جيد'}
                    {performanceStatus.status === 'average' && 'متوسط'}
                    {performanceStatus.status === 'poor' && 'ضعيف'}
                  </div>
                </div>

                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {formatCurrency(yearData.sales)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {achievementRate.toFixed(1)}% من الهدف
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {yearData.months.length} شهر
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Performance List */}
      <div>
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
          الأداء حسب الشهر
        </h4>

        <div className="space-y-3">
          {filteredData.map((month) => {
            const performanceStatus = getPerformanceStatus((month.sales / month.target) * 100);
            const isSelected = selectedMonth === month.month;

            return (
              <div 
                key={`${month.year}-${month.month}`} 
                className={`p-4 rounded-md border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedMonth(isSelected ? null : `${month.year}-${month.month}`)}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h5 className="font-medium text-slate-800 dark:text-slate-200">
                      {formatMonth(month.month, month.year)}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium flex items-center gap-1 ${performanceStatus.color}`}>
                        {performanceStatus.icon}
                        {performanceStatus.status === 'excellent' && 'ممتاز'}
                        {performanceStatus.status === 'good' && 'جيد'}
                        {performanceStatus.status === 'average' && 'متوسط'}
                        {performanceStatus.status === 'poor' && 'ضعيف'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {((month.sales / month.target) * 100).toFixed(1)}% من الهدف
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(month.sales)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(month.commission)} عمولات
                    </p>
                    <p className={`text-sm flex items-center justify-end gap-1 ${
                      month.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {month.growth >= 0 ? <TrendingUp className="text-emerald-500" size={14} /> : <TrendingDown className="text-rose-500" size={14} />}
                      {Math.abs(month.growth).toFixed(1)}% نمو
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    {/* Best Employee */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-1">
                        <Award className="text-amber-500" size={14} />
                        أفضل موظف في الشهر
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-md">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {month.bestEmployee.name}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {formatCurrency(month.bestEmployee.sales)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatCurrency(month.bestEmployee.commission)} عمولات
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Achievements */}
                    {month.achievements.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-1">
                          <CheckCircle2 className="text-emerald-500" size={14} />
                          الإنجازات
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {month.achievements.map((achievement, index) => (
                            <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              {achievement}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
