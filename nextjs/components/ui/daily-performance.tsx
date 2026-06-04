import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Target, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';

interface DailyPerformance {
  date: string;
  sales: number;
  commission: number;
  target: number;
  employees: {
    name: string;
    sales: number;
    commission: number;
  }[];
}

interface DailyPerformanceTrackerProps {
  branchId: string;
  branchName: string;
  data: DailyPerformance[];
  className?: string;
}

export function DailyPerformanceTracker({ branchId, branchName, data, className = '' }: DailyPerformanceTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Process data based on view mode
  const processedData = useMemo(() => {
    if (viewMode === 'daily') return data;

    // Group by week or month
    const groupedData = data.reduce((acc, item) => {
      const date = new Date(item.date);
      let key;

      if (viewMode === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      if (!acc[key]) {
        acc[key] = {
          date: key,
          sales: 0,
          commission: 0,
          target: 0,
          employees: []
        };
      }

      acc[key].sales += item.sales;
      acc[key].commission += item.commission;
      acc[key].target += item.target;

      // Combine employee data (in a real app, you might want to handle this differently)
      if (acc[key].employees.length === 0) {
        acc[key].employees = [...item.employees];
      } else {
        acc[key].employees = acc[key].employees.map(emp => {
          const existing = item.employees.find(e => e.name === emp.name);
          return existing ? { ...emp, sales: emp.sales + existing.sales, commission: emp.commission + existing.commission } : emp;
        });
      }

      return acc;
    }, {} as Record<string, DailyPerformance>);

    return Object.values(groupedData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, viewMode]);

  // Calculate performance metrics
  const metrics = useMemo(() => {
    if (processedData.length === 0) return null;

    const totalSales = processedData.reduce((sum, day) => sum + day.sales, 0);
    const totalCommission = processedData.reduce((sum, day) => sum + day.commission, 0);
    const totalTarget = processedData.reduce((sum, day) => sum + day.target, 0);
    const achievementRate = totalTarget > 0 ? (totalSales / totalTarget) * 100 : 0;

    const avgDailySales = totalSales / processedData.length;
    const lastWeekData = processedData.slice(-7);
    const prevWeekData = processedData.slice(-14, -7);

    const lastWeekSales = lastWeekData.reduce((sum, day) => sum + day.sales, 0);
    const prevWeekSales = prevWeekData.length > 0 ? prevWeekData.reduce((sum, day) => sum + day.sales, 0) : lastWeekSales;

    const weekGrowth = prevWeekSales > 0 ? ((lastWeekSales - prevWeekSales) / prevWeekSales) * 100 : 0;

    return {
      totalSales,
      totalCommission,
      achievementRate,
      avgDailySales,
      weekGrowth
    };
  }, [processedData]);

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

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (viewMode === 'weekly') {
      const weekEnd = new Date(date);
      weekEnd.setDate(date.getDate() + 6);
      return `من ${date.toLocaleDateString('ar-SA')} إلى ${weekEnd.toLocaleDateString('ar-SA')}`;
    } else if (viewMode === 'monthly') {
      return `${date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={18} />
          أداء يومي - {branchName}
        </h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">العرض:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المبيعات</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(metrics.totalSales)}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي العمولات</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(metrics.totalCommission)}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
            <p className="text-xs text-slate-500 dark:text-slate-400">معدل الإنجاز</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {metrics.achievementRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
            <p className="text-xs text-slate-500 dark:text-slate-400">نمو الأسبوع</p>
            <p className={`text-lg font-bold flex items-center gap-1 ${
              metrics.weekGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {metrics.weekGrowth >= 0 ? <TrendingUp className="text-emerald-500" size={16} /> : <TrendingDown className="text-rose-500" size={16} />}
              {Math.abs(metrics.weekGrowth).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="mb-6">
        <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-md">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <BarChart3 size={32} className="mx-auto mb-2" />
            <p>مخطط الأداء سيتم إضافته قريبًا</p>
          </div>
        </div>
      </div>

      {/* Daily Performance List */}
      <div>
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
          الأداء حسب {viewMode === 'daily' ? 'اليوم' : viewMode === 'weekly' ? 'الأسبوع' : 'الشهر'}
        </h4>

        <div className="space-y-3">
          {processedData.map((day) => {
            const performanceStatus = getPerformanceStatus((day.sales / day.target) * 100);
            const isSelected = selectedDate === day.date;

            return (
              <div 
                key={day.date} 
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedDate(isSelected ? null : day.date)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDate(day.date)}
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
                        {((day.sales / day.target) * 100).toFixed(1)}% من الهدف
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(day.sales)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(day.commission)} عمولات
                    </p>
                  </div>
                </div>

                {/* Employee Performance (only for daily view or when expanded) */}
                {(viewMode === 'daily' || isSelected) && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">أداء الموظفين:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {day.employees.map((emp, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-md">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{emp.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {formatCurrency(emp.sales)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {formatCurrency(emp.commission)} عمولات
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
