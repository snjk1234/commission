import React, { useState, useMemo } from 'react';
import { MapPin, TrendingUp, TrendingDown, Target, CheckCircle2, AlertCircle, Star, Award, BarChart3 } from 'lucide-react';

interface BranchLocation {
  id: string;
  name: string;
  city: string;
  region: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  performance: {
    sales2024: number;
    sales2025: number;
    growth: number;
    commission2024: number;
    commission2025: number;
    commissionGrowth: number;
    targetAchievement: number;
    employeeCount: number;
    avgCommissionPerEmployee: number;
  };
  achievements: string[];
}

interface GeoPerformanceProps {
  branches: BranchLocation[];
  className?: string;
}

export function GeoPerformance({ branches, className = '' }: GeoPerformanceProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'growth' | 'commission'>('sales');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Group branches by region
  const branchesByRegion = useMemo(() => {
    const regions = [...new Set(branches.map(branch => branch.region))];

    return regions.reduce((acc, region) => {
      acc[region] = branches.filter(branch => branch.region === region);
      return acc;
    }, {} as Record<string, BranchLocation[]>);
  }, [branches]);

  // Calculate regional performance
  const regionalPerformance = useMemo(() => {
    return Object.entries(branchesByRegion).map(([region, regionBranches]) => {
      const totalSales2024 = regionBranches.reduce((sum, branch) => sum + branch.performance.sales2024, 0);
      const totalSales2025 = regionBranches.reduce((sum, branch) => sum + branch.performance.sales2025, 0);
      const totalCommission2024 = regionBranches.reduce((sum, branch) => sum + branch.performance.commission2024, 0);
      const totalCommission2025 = regionBranches.reduce((sum, branch) => sum + branch.performance.commission2025, 0);
      const avgGrowth = regionBranches.reduce((sum, branch) => sum + branch.performance.growth, 0) / regionBranches.length;
      const avgTargetAchievement = regionBranches.reduce((sum, branch) => sum + branch.performance.targetAchievement, 0) / regionBranches.length;

      return {
        region,
        branchCount: regionBranches.length,
        totalSales2024,
        totalSales2025,
        growth: ((totalSales2025 - totalSales2024) / totalSales2024) * 100,
        totalCommission2024,
        totalCommission2025,
        commissionGrowth: ((totalCommission2025 - totalCommission2024) / totalCommission2024) * 100,
        avgGrowth,
        avgTargetAchievement,
        topBranch: regionBranches.reduce((max, branch) => 
          branch.performance.sales2025 > max.performance.sales2025 ? branch : max
        )
      };
    });
  }, [branchesByRegion]);

  // Get performance status
  const getPerformanceStatus = (value: number, threshold: { good: number; average: number; poor: number }) => {
    if (value >= threshold.good) return { status: 'excellent', color: 'text-emerald-600', icon: <CheckCircle2 className="text-emerald-500" /> };
    if (value >= threshold.average) return { status: 'good', color: 'text-blue-600', icon: <Star className="text-blue-500" /> };
    if (value >= threshold.poor) return { status: 'average', color: 'text-amber-600', icon: <Target className="text-amber-500" /> };
    return { status: 'poor', color: 'text-rose-600', icon: <AlertCircle className="text-rose-500" /> };
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

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <MapPin className="text-blue-500" size={18} />
          أداء الفروع حسب الموقع
        </h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">المقياس:</label>
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
            <label className="text-xs text-slate-600 dark:text-slate-300">العرض:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="map">خريطة</option>
              <option value="list">قائمة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Regional Overview */}
      <div className="mb-6">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">نظرة عامة على الأداء حسب المنطقة</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionalPerformance.map(region => {
            const salesThreshold = { good: 20, average: 10, poor: 0 };
            const performance = getPerformanceStatus(region.growth, salesThreshold);

            return (
              <div 
                key={region.region} 
                className={`p-4 rounded-md border cursor-pointer transition-colors ${
                  selectedRegion === region.region 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedRegion(region.region === selectedRegion ? null : region.region)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-medium text-slate-800 dark:text-slate-200">{region.region}</h5>
                  <div className={`text-xs font-medium flex items-center gap-1 ${performance.color}`}>
                    {performance.icon}
                    {performance.status === 'excellent' && 'ممتاز'}
                    {performance.status === 'good' && 'جيد'}
                    {performance.status === 'average' && 'متوسط'}
                    {performance.status === 'poor' && 'ضعيف'}
                  </div>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {region.branchCount} فرع
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">إجمالي المبيعات</div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(region.totalSales2025)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">معدل النمو</div>
                    <div className={`font-medium flex items-center gap-1 ${
                      region.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {getTrendIcon(region.totalSales2025, region.totalSales2024)}
                      {formatPercentage(region.growth)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  أفضل فرع: {region.topBranch.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branch Details */}
      {selectedRegion && (
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
            تفاصيل الفروع في {selectedRegion}
          </h4>

          <div className="space-y-3">
            {branchesByRegion[selectedRegion].map(branch => {
              const performance = getPerformanceStatus(
                branch.performance.growth, 
                { good: 15, average: 5, poor: 0 }
              );

              return (
                <div key={branch.id} className="p-3 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-slate-200">{branch.name}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {branch.city} • {branch.region}
                      </p>
                    </div>

                    <div className={`text-xs font-medium flex items-center gap-1 ${performance.color}`}>
                      {performance.icon}
                      {performance.status === 'excellent' && 'ممتاز'}
                      {performance.status === 'good' && 'جيد'}
                      {performance.status === 'average' && 'متوسط'}
                      {performance.status === 'poor' && 'ضعيف'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">المبيعات</div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(branch.performance.sales2025)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">النمو</div>
                      <div className={`text-sm font-medium flex items-center gap-1 ${
                        branch.performance.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {getTrendIcon(branch.performance.sales2025, branch.performance.sales2024)}
                        {formatPercentage(branch.performance.growth)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">العمولات</div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(branch.performance.commission2025)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">تحقيق الهدف</div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {branch.performance.targetAchievement.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {branch.achievements.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الإنجازات:</div>
                      <div className="flex flex-wrap gap-1">
                        {branch.achievements.slice(0, 3).map((achievement, index) => (
                          <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            {achievement}
                          </span>
                        ))}
                        {branch.achievements.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            +{branch.achievements.length - 3} أخرى
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="mb-6">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
            خريطة الأداء الجغرافي
          </h4>

          <div className="h-80 flex items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-md">
            <div className="text-center text-slate-500 dark:text-slate-400">
              <BarChart3 size={32} className="mx-auto mb-2" />
              <p>خريطة الأداء الجغرافي سيتم إضافتها قريبًا</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div>
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
          مقاييس الأداء
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="text-blue-500" size={16} />
              <div className="text-xs text-slate-500 dark:text-slate-400">أعلى أداء</div>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {regionalPerformance.length > 0 ? regionalPerformance[0].region : '-'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {formatPercentage(regionalPerformance[0]?.growth || 0)} نمو
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-emerald-500" size={16} />
              <div className="text-xs text-slate-500 dark:text-slate-400">متوسط النمو</div>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {formatPercentage(
                regionalPerformance.reduce((sum, region) => sum + region.growth, 0) / regionalPerformance.length || 0
              )}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {regionalPerformance.length} منطقة
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-amber-500" size={16} />
              <div className="text-xs text-slate-500 dark:text-slate-400">أفضل فرع</div>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {branches.reduce((max, branch) => 
                branch.performance.sales2025 > max.performance.sales2025 ? branch : max
              )?.name || '-'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {formatCurrency(
                branches.reduce((max, branch) => 
                  branch.performance.sales2025 > max.performance.sales2025 ? branch : max
                )?.performance.sales2025 || 0
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
