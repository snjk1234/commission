import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Target } from 'lucide-react';

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'critical' | 'suggestion';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

interface QuickInsightsProps {
  insights: Insight[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export function QuickInsights({ insights, autoRefresh = true, refreshInterval = 30000, className = '' }: QuickInsightsProps) {
  const [visibleInsights, setVisibleInsights] = useState<Insight[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter insights by type and priority
  useEffect(() => {
    // Sort insights: critical first, then positive, then warning, then suggestions
    const sorted = [...insights].sort((a, b) => {
      const typeOrder = { 'critical': 0, 'positive': 1, 'warning': 2, 'suggestion': 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    // Limit to top 5 insights
    setVisibleInsights(sorted.slice(0, 5));
  }, [insights]);

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Simulate data refresh
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Get icon based on type
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-amber-500" size={20} />;
      case 'critical':
        return <AlertCircle className="text-rose-500" size={20} />;
      case 'suggestion':
        return <Lightbulb className="text-blue-500" size={20} />;
      default:
        return <Target className="text-slate-500" size={20} />;
    }
  };

  // Get color based on type
  const getColor = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      case 'suggestion':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  // Get title color based on type
  const getTitleColor = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'text-emerald-800 dark:text-emerald-300';
      case 'warning':
        return 'text-amber-800 dark:text-amber-300';
      case 'critical':
        return 'text-rose-800 dark:text-rose-300';
      case 'suggestion':
        return 'text-blue-800 dark:text-blue-300';
      default:
        return 'text-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <TrendingUp className="text-blue-500" size={18} />
          الرؤى السريعة
        </h3>
        {autoRefresh && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isRefreshing ? 'جاري التحديث...' : 'محدث'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {visibleInsights.length > 0 ? (
          visibleInsights.map(insight => (
            <div 
              key={insight.id} 
              className={`p-3 rounded-md border ${getColor(insight.type)} transition-all duration-300 hover:shadow-sm`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {insight.icon || getIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm font-medium ${getTitleColor(insight.type)} truncate`}>
                      {insight.title}
                    </h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      insight.type === 'positive' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                      insight.type === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                      insight.type === 'critical' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {insight.type === 'positive' && 'إيجابي'}
                      {insight.type === 'warning' && 'تنبيه'}
                      {insight.type === 'critical' && 'حرج'}
                      {insight.type === 'suggestion' && 'اقتراح'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <button
                      onClick={insight.action.onClick}
                      className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {insight.action.label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
            لا توجد رؤى حالية
          </div>
        )}
      </div>

      {visibleInsights.length > 3 && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            عرض جميع الرؤى ({insights.length})
          </button>
        </div>
      )}
    </div>
  );
}
