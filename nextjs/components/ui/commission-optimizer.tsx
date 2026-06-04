import React, { useState, useMemo } from 'react';
import { Settings, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface CommissionRule {
  id: string;
  name: string;
  description: string;
  currentRate: number;
  suggestedRate?: number;
  impact: {
    additionalCommission: number;
    motivationEffect: 'high' | 'medium' | 'low';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface CommissionOptimizerProps {
  branches: Array<{
    id: string;
    name: string;
    sales2024: number;
    sales2025: number;
    currentCommission: number;
    supervisorCommission: number;
  }>;
  className?: string;
}

export function CommissionOptimizer({ branches, className = '' }: CommissionOptimizerProps) {
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<'individual' | 'bulk'>('individual');
  const [simulationRate, setSimulationRate] = useState<number>(0);

  // Analyze commission opportunities
  const commissionRules = useMemo(() => {
    // In a real app, this would be based on more sophisticated algorithms
    const rules: CommissionRule[] = [];

    // Rule 1: High performers deserve higher rates
    const highPerformers = branches.filter(b => b.sales2025 > b.sales2024 * 1.2);
    if (highPerformers.length > 0) {
      const avgCurrentRate = highPerformers.reduce((sum, b) => sum + (b.currentCommission / b.sales2025), 0) / highPerformers.length;
      const suggestedRate = Math.min(avgCurrentRate * 1.1, 0.15); // Cap at 15%

      rules.push({
        id: 'high-performers',
        name: 'تحفيز الفروع عالية الأداء',
        description: 'زيادة معدل العمولة للفروع التي حققت نموًا يزيد عن 20%',
        currentRate: avgCurrentRate * 100,
        suggestedRate: suggestedRate * 100,
        impact: {
          additionalCommission: highPerformers.reduce((sum, b) => sum + (b.sales2025 * (suggestedRate - avgCurrentRate)), 0),
          motivationEffect: 'high',
          riskLevel: 'low'
        }
      });
    }

    // Rule 2: Underperforming branches need attention
    const underPerformers = branches.filter(b => b.sales2025 < b.sales2024 * 0.9);
    if (underPerformers.length > 0) {
      const avgCurrentRate = underPerformers.reduce((sum, b) => sum + (b.currentCommission / b.sales2025), 0) / underPerformers.length;
      const suggestedRate = Math.max(avgCurrentRate * 0.9, 0.05); // Floor at 5%

      rules.push({
        id: 'under-performers',
        name: 'تحفيز الفروع ذات الأداء المنخفض',
        description: 'تقليل معدل العمولة للفروع التي انخفضت مبيعاتها أكثر من 10%',
        currentRate: avgCurrentRate * 100,
        suggestedRate: suggestedRate * 100,
        impact: {
          additionalCommission: underPerformers.reduce((sum, b) => sum + (b.sales2025 * (suggestedRate - avgCurrentRate)), 0),
          motivationEffect: 'medium',
          riskLevel: 'medium'
        }
      });
    }

    // Rule 3: Supervisor commission optimization
    const avgSupervisorRate = branches.reduce((sum, b) => sum + (b.supervisorCommission / b.currentCommission), 0) / branches.length;

    rules.push({
      id: 'supervisor-optimization',
      name: 'تحسين عمولات المشرفين',
      description: 'تعديل نسبة عمولات المشرفين بناءً على حجم الفروع',
      currentRate: avgSupervisorRate * 100,
      suggestedRate: Math.min(avgSupervisorRate * 1.05, 0.1) * 100, // Cap at 10%
      impact: {
        additionalCommission: branches.reduce((sum, b) => sum + (b.currentCommission * 0.05), 0),
        motivationEffect: 'medium',
        riskLevel: 'low'
      }
    });

    return rules;
  }, [branches]);

  // Calculate simulation results
  const simulationResults = useMemo(() => {
    if (!simulationRate || simulationMode === 'bulk') return null;

    const selectedBranch = branches.find(b => b.id === selectedRule);
    if (!selectedBranch) return null;

    const currentCommission = selectedBranch.sales2025 * (simulationRate / 100);
    const difference = currentCommission - selectedBranch.currentCommission;

    return {
      branchName: selectedBranch.name,
      currentCommission: selectedBranch.currentCommission,
      newCommission: currentCommission,
      difference,
      percentageChange: (difference / selectedBranch.currentCommission) * 100
    };
  }, [simulationRate, simulationMode, selectedRule, branches]);

  // Get impact color based on risk level
  const getImpactColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'high':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  // Get motivation effect icon
  const getMotivationIcon = (effect: 'high' | 'medium' | 'low') => {
    switch (effect) {
      case 'high':
        return <TrendingUp className="text-emerald-500" size={16} />;
      case 'medium':
        return <Target className="text-amber-500" size={16} />;
      case 'low':
        return <TrendingDown className="text-rose-500" size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Settings className="text-blue-500" size={18} />
          محسن العمولات
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setSimulationMode('individual')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              simulationMode === 'individual' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            فرعي
          </button>
          <button
            onClick={() => setSimulationMode('bulk')}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              simulationMode === 'bulk' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            جماعي
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Commission Rules */}
        <div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">قواعد التحسين المقترحة</h4>
          <div className="space-y-3">
            {commissionRules.map(rule => (
              <div 
                key={rule.id} 
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedRule === rule.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedRule(rule.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="font-medium text-slate-800 dark:text-slate-200">{rule.name}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{rule.description}</p>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${getImpactColor(rule.impact.riskLevel)}`}>
                    {rule.impact.riskLevel === 'low' && 'مخاطر منخفضة'}
                    {rule.impact.riskLevel === 'medium' && 'مخاطر متوسطة'}
                    {rule.impact.riskLevel === 'high' && 'مخاطر عالية'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  <div className="text-xs">
                    <span className="text-slate-500">المعدل الحالي:</span>
                    <span className="font-medium ml-1">{rule.currentRate.toFixed(1)}%</span>
                  </div>
                  {rule.suggestedRate && (
                    <div className="text-xs">
                      <span className="text-slate-500">المعدل المقترح:</span>
                      <span className="font-medium ml-1 text-blue-600">{rule.suggestedRate.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="text-xs flex items-center gap-1">
                    <span className="text-slate-500">تأثير الحافز:</span>
                    <span className="font-medium flex items-center gap-1">
                      {getMotivationIcon(rule.impact.motivationEffect)}
                      {rule.impact.motivationEffect === 'high' && 'عالي'}
                      {rule.impact.motivationEffect === 'medium' && 'متوسط'}
                      {rule.impact.motivationEffect === 'low' && 'منخفض'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulation */}
        {simulationMode === 'individual' && selectedRule && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">محاكاة معدل عمولة فرعي</h4>

            <div className="flex items-end gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">معدل العمولة (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={simulationRate}
                  onChange={(e) => setSimulationRate(parseFloat(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm transition-colors">
                تطبيق
              </button>
            </div>

            {simulationResults && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">العمولة الحالية</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {simulationResults.currentCommission.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">العمولة الجديدة</p>
                    <p className="font-medium text-blue-600">
                      {simulationResults.newCommission.toFixed(2)} ر.س
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">التغيير</p>
                    <p className={`font-medium ${simulationResults.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {simulationResults.difference >= 0 ? '+' : ''}{simulationResults.difference.toFixed(2)} ر.س
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Simulation */}
        {simulationMode === 'bulk' && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">تأثير التغيير الجماعي</h4>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commissionRules.map(rule => (
                  <div key={rule.id} className="p-2 bg-white dark:bg-slate-700 rounded-md">
                    <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200">{rule.name}</h5>
                    <div className="mt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">التكلفة الإضافية:</span>
                        <span className="font-medium text-rose-600">
                          +{rule.impact.additionalCommission.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-slate-500">التأثير:</span>
                        <span className="font-medium flex items-center gap-1">
                          {getMotivationIcon(rule.impact.motivationEffect)}
                          {rule.impact.motivationEffect === 'high' && 'عالي'}
                          {rule.impact.motivationEffect === 'medium' && 'متوسط'}
                          {rule.impact.motivationEffect === 'low' && 'منخفض'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">التكلفة الإجمالية:</span>
                  <span className="text-lg font-bold text-rose-600">
                    +{commissionRules.reduce((sum, rule) => sum + rule.impact.additionalCommission, 0).toFixed(2)} ر.س
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
