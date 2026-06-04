import React, { useState, useMemo } from 'react';
import { Trophy, Star, Users, Target, TrendingUp, TrendingDown, Award, Crown } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  sales2024: number;
  sales2025: number;
  growth: number;
  commission2024: number;
  commission2025: number;
  employees: number;
  supervisor: string;
  achievements: string[];
}

interface CompetitionTrackerProps {
  branches: Branch[];
  className?: string;
}

export function CompetitionTracker({ branches, className = '' }: CompetitionTrackerProps) {
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'growth' | 'commission'>('sales');
  const [timeFrame, setTimeFrame] = useState<'current' | 'previous'>('current');

  // Calculate rankings
  const rankings = useMemo(() => {
    const metric = timeFrame === 'current' 
      ? (selectedMetric === 'sales' ? 'sales2025' : 
         selectedMetric === 'growth' ? 'growth' : 'commission2025')
      : (selectedMetric === 'sales' ? 'sales2024' : 
         selectedMetric === 'growth' ? 0 : 'commission2024');

    return [...branches].sort((a, b) => {
      if (selectedMetric === 'growth') {
        return b[metric] - a[metric];
      }
      return b[metric] - a[metric];
    });
  }, [branches, selectedMetric, timeFrame]);

  // Get top performers
  const topPerformers = useMemo(() => {
    return rankings.slice(0, 3);
  }, [rankings]);

  // Calculate performance metrics
  const getPerformanceLevel = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;

    if (percentage >= 90) return { level: 'excellent', color: 'text-emerald-600', icon: <Crown className="text-emerald-500" /> };
    if (percentage >= 75) return { level: 'very-good', color: 'text-blue-600', icon: <Star className="text-blue-500" /> };
    if (percentage >= 50) return { level: 'good', color: 'text-amber-600', icon: <Award className="text-amber-500" /> };
    return { level: 'needs-improvement', color: 'text-rose-600', icon: <TrendingDown className="text-rose-500" /> };
  };

  // Get trend icon
  const getTrendIcon = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;

    if (change > 0) return <TrendingUp className="text-emerald-500" size={16} />;
    if (change < 0) return <TrendingDown className="text-rose-500" size={16} />;
    return null;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get position icon
  const getPositionIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="text-yellow-500" size={20} />;
      case 1:
        return <Star className="text-gray-400" size={18} />;
      case 2:
        return <Award className="text-amber-600" size={18} />;
      default:
        return <span className="text-lg font-bold text-slate-500 dark:text-slate-400">#{index + 1}</span>;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Trophy className="text-blue-500" size={18} />
          متابعة المنافسة
        </h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">مقاييس:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="sales">المبيعات</option>
              <option value="growth">النمو</option>
              <option value="commission">العمولات</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">الفترة:</label>
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as typeof timeFrame)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="current">الحالية</option>
              <option value="previous">السابقة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="mb-6">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">المراكز الثلاثة الأولى</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map((branch, index) => {
            const value = timeFrame === 'current' 
              ? (selectedMetric === 'sales' ? branch.sales2025 : 
                 selectedMetric === 'growth' ? branch.growth : branch.commission2025)
              : (selectedMetric === 'sales' ? branch.sales2024 : 
                 selectedMetric === 'growth' ? 0 : branch.commission2024);

            const maxValue = rankings[0][selectedMetric === 'growth' ? 'growth' : 
              (timeFrame === 'current' ? 
                (selectedMetric === 'sales' ? 'sales2025' : 'commission2025') : 
                (selectedMetric === 'sales' ? 'sales2024' : 'commission2024'))];

            const performance = getPerformanceLevel(value, maxValue);

            return (
              <div key={branch.id} className="p-4 rounded-md border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  {getPositionIcon(index)}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}`} />
                  <h5 className="font-medium text-slate-800 dark:text-slate-200">{branch.name}</h5>
                </div>

                <div className={`text-sm font-medium ${performance.color} flex items-center gap-1 mb-2`}>
                  {performance.icon}
                  {performance.level === 'excellent' && 'ممتاز'}
                  {performance.level === 'very-good' && 'ممتاز جدًا'}
                  {performance.level === 'good' && 'جيد'}
                  {performance.level === 'needs-improvement' && 'يحتاج تحسين'}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {selectedMetric === 'sales' && 'المبيعات'}
                  {selectedMetric === 'growth' && 'معدل النمو'}
                  {selectedMetric === 'commission' && 'العمولات'}
                </div>

                <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {selectedMetric === 'growth' ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : 
                   selectedMetric === 'sales' ? formatCurrency(value) : formatCurrency(value)}
                </div>

                {selectedMetric !== 'growth' && timeFrame === 'current' && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {getTrendIcon(
                      selectedMetric === 'sales' ? branch.sales2025 : branch.commission2025,
                      selectedMetric === 'sales' ? branch.sales2024 : branch.commission2024
                    )}
                    {selectedMetric === 'sales' ? branch.sales2024 : branch.commission2024}
                  </div>
                )}

                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  المشرف: {branch.supervisor}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Branches Ranking */}
      <div>
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">ترتيب جميع الفروع</h4>
        <div className="space-y-3">
          {rankings.map((branch, index) => {
            const value = timeFrame === 'current' 
              ? (selectedMetric === 'sales' ? branch.sales2025 : 
                 selectedMetric === 'growth' ? branch.growth : branch.commission2025)
              : (selectedMetric === 'sales' ? branch.sales2024 : 
                 selectedMetric === 'growth' ? 0 : branch.commission2024);

            const maxValue = rankings[0][selectedMetric === 'growth' ? 'growth' : 
              (timeFrame === 'current' ? 
                (selectedMetric === 'sales' ? 'sales2025' : 'commission2025') : 
                (selectedMetric === 'sales' ? 'sales2024' : 'commission2024'))];

            const performance = getPerformanceLevel(value, maxValue);

            return (
              <div key={branch.id} className="p-3 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {getPositionIcon(index)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium text-slate-800 dark:text-slate-200 truncate">{branch.name}</h5>
                    <div className={`text-xs font-medium ${performance.color} flex items-center gap-1`}>
                      {performance.icon}
                      {performance.level === 'excellent' && 'ممتاز'}
                      {performance.level === 'very-good' && 'ممتاز جدًا'}
                      {performance.level === 'good' && 'جيد'}
                      {performance.level === 'needs-improvement' && 'يحتاج تحسين'}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {selectedMetric === 'growth' ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%` : 
                       selectedMetric === 'sales' ? formatCurrency(value) : formatCurrency(value)}
                    </div>

                    {selectedMetric !== 'growth' && timeFrame === 'current' && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {getTrendIcon(
                          selectedMetric === 'sales' ? branch.sales2025 : branch.commission2025,
                          selectedMetric === 'sales' ? branch.sales2024 : branch.commission2024
                        )}
                        {selectedMetric === 'sales' ? branch.sales2024 : branch.commission2024}
                      </div>
                    )}

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {branch.employees} موظف
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
