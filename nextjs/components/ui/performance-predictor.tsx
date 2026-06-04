import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

interface HistoricalData {
  period: string;
  sales: number;
  growth: number;
}

interface BranchPerformance {
  name: string;
  historical: HistoricalData[];
  currentSales: number;
  currentGrowth: number;
}

interface PerformancePredictionProps {
  branches: BranchPerformance[];
  className?: string;
}

export function PerformancePredictor({ branches, className = '' }: PerformancePredictionProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [predictionMonths, setPredictionMonths] = useState<number>(3);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(85);

  // Simple moving average calculation
  const calculateMovingAverage = (data: number[], window: number) => {
    if (data.length < window) return data.reduce((a, b) => a + b, 0) / data.length;

    const lastWindow = data.slice(-window);
    return lastWindow.reduce((a, b) => a + b, 0) / window;
  };

  // Simple trend calculation
  const calculateTrend = (data: number[]) => {
    if (data.length < 2) return 0;

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  };

  // Predict future performance
  const predictions = useMemo(() => {
    if (!selectedBranch) return null;

    const branch = branches.find(b => b.name === selectedBranch);
    if (!branch || branch.historical.length < 3) return null;

    // Calculate average growth rate
    const growthRates = branch.historical.map(d => d.growth);
    const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

    // Calculate moving average of sales
    const salesData = branch.historical.map(d => d.sales);
    const movingAvg = calculateMovingAverage(salesData, 3);

    // Calculate trend
    const trend = calculateTrend(salesData);

    // Generate predictions
    const predictions = [];
    let currentSales = branch.currentSales;

    for (let i = 1; i <= predictionMonths; i++) {
      // Simple prediction based on average growth and trend
      const growthFactor = (avgGrowth + trend) / 2;
      const predictedSales = currentSales * (1 + growthFactor / 100);

      predictions.push({
        month: `+${i}`,
        predictedSales: Math.round(predictedSales),
        predictedGrowth: growthFactor,
        confidence: Math.max(50, confidenceLevel - (i * 5)) // Decrease confidence for further predictions
      });

      currentSales = predictedSales;
    }

    return {
      branch: selectedBranch,
      currentSales: branch.currentSales,
      currentGrowth: branch.currentGrowth,
      avgGrowth,
      movingAvg,
      trend,
      predictions
    };
  }, [selectedBranch, branches, predictionMonths, confidenceLevel]);

  // Get risk assessment
  const getRiskAssessment = (branch: BranchPerformance) => {
    if (branch.historical.length < 3) return { level: 'غير محدد', color: 'text-slate-500', icon: <AlertTriangle size={16} /> };

    const recentGrowth = branch.historical.slice(-3).map(d => d.growth);
    const avgRecentGrowth = recentGrowth.reduce((a, b) => a + b, 0) / recentGrowth.length;

    if (avgRecentGrowth > 10) {
      return { level: 'منخفض', color: 'text-emerald-600', icon: <TrendingUp size={16} /> };
    } else if (avgRecentGrowth < -5) {
      return { level: 'عالي', color: 'text-rose-600', icon: <TrendingDown size={16} /> };
    } else {
      return { level: 'متوسط', color: 'text-amber-600', icon: <Target size={16} /> };
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="text-blue-500" size={18} />
          تنبؤ بالأداء المستقبلي
        </h3>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1 text-sm"
          >
            <option value="">اختر فرع</option>
            {branches.map(branch => (
              <option key={branch.name} value={branch.name}>{branch.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">الشهور:</label>
            <select
              value={predictionMonths}
              onChange={(e) => setPredictionMonths(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              {[3, 6, 9, 12].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">ثقة:</label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              {[70, 80, 85, 90, 95].map(level => (
                <option key={level} value={level}>{level}%</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {branches.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">اختر فرع للتحليل</h4>
          <div className="flex flex-wrap gap-2">
            {branches.map(branch => {
              const risk = getRiskAssessment(branch);
              return (
                <button
                  key={branch.name}
                  onClick={() => setSelectedBranch(branch.name)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${
                    selectedBranch === branch.name 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {branch.name}
                  <span className={`text-xs ${risk.color}`}>
                    {risk.icon} {risk.level}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {predictions ? (
        <div className="space-y-4">
          {/* Current Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
              <p className="text-xs text-slate-500 dark:text-slate-400">المبيعات الحالية</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {predictions.currentSales.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
              <p className="text-xs text-slate-500 dark:text-slate-400">معدل النمو الحالي</p>
              <p className={`text-lg font-bold ${predictions.currentGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {predictions.currentGrowth >= 0 ? '+' : ''}{predictions.currentGrowth.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
              <p className="text-xs text-slate-500 dark:text-slate-400">متوسط النمو التاريخي</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {predictions.avgGrowth.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Predictions */}
          <div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
              تنبؤات الأداء المستقبلي ({predictionMonths} شهر)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {predictions.predictions.map((pred, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      الشهر {pred.month}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      pred.confidence >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      pred.confidence >= 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {pred.confidence}% ثقة
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {pred.predictedSales.toLocaleString()}
                  </div>
                  <div className={`text-sm flex items-center gap-1 ${
                    pred.predictedGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {pred.predictedGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {pred.predictedGrowth >= 0 ? '+' : ''}{pred.predictedGrowth.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">تحليل الاتجاه</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              بناءً على البيانات التاريخية، يتوقع أن يكون نمو الفرع في الفترة القادمة{' '}
              {predictions.trend >= 0 ? 'إيجابيًا' : 'سلبيًا'}{' '}
              بمعدل {Math.abs(predictions.trend).toFixed(1)}%{' '}
              مقارنة بالفترة السابقة.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          {selectedBranch ? 'لا توجد بيانات كافية للتنبؤ' : 'يرجى اختيار فرع'}
        </div>
      )}
    </div>
  );
}
