import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  status: 'on-track' | 'at-risk' | 'achieved' | 'behind';
  branchId?: string;
  branchName?: string;
}

interface PerformanceTrackerProps {
  goals: Goal[];
  onGoalUpdate: (goalId: string, newValue: number) => void;
  onCreateGoal: (goal: Omit<Goal, 'id' | 'status'>) => void;
  className?: string;
}

export function PerformanceTracker({ goals, onGoalUpdate, onCreateGoal, className = '' }: PerformanceTrackerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetValue: 0,
    unit: 'ر.س',
    deadline: new Date(),
    branchId: '',
    branchName: ''
  });

  // Group goals by status
  const goalsByStatus = useMemo(() => {
    return {
      achieved: goals.filter(g => g.status === 'achieved'),
      onTrack: goals.filter(g => g.status === 'on-track'),
      atRisk: goals.filter(g => g.status === 'at-risk'),
      behind: goals.filter(g => g.status === 'behind')
    };
  }, [goals]);

  // Calculate progress percentage
  const calculateProgress = (goal: Goal) => {
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  // Determine status based on progress and deadline
  const determineStatus = (goal: Goal) => {
    const progress = calculateProgress(goal);
    const today = new Date();
    const daysLeft = Math.ceil((goal.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (progress >= 100) return 'achieved';
    if (daysLeft < 7 && progress < 50) return 'behind';
    if (daysLeft < 14 && progress < 75) return 'at-risk';
    return 'on-track';
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'achieved':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      case 'on-track':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'at-risk':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'behind':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'on-track':
        return <TrendingUp className="text-blue-500" size={16} />;
      case 'at-risk':
        return <AlertTriangle className="text-amber-500" size={16} />;
      case 'behind':
        return <TrendingDown className="text-rose-500" size={16} />;
      default:
        return <Target className="text-slate-500" size={16} />;
    }
  };

  // Handle creating a new goal
  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.targetValue) return;

    const goalWithStatus = {
      ...newGoal,
      status: determineStatus({
        ...newGoal,
        id: '',
        currentValue: 0
      }) as Goal['status']
    };

    onCreateGoal(goalWithStatus);
    setNewGoal({
      title: '',
      targetValue: 0,
      unit: 'ر.س',
      deadline: new Date(),
      branchId: '',
      branchName: ''
    });
    setShowCreateForm(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="text-blue-500" size={18} />
          متابعة الأهداف
        </h3>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-sm transition-colors"
        >
          <Award size={16} />
          هدف جديد
        </button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">إنشاء هدف جديد</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">عنوان الهدف</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                placeholder="مثال: زيادة المبيعات"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">القيمة المستهدفة</label>
              <input
                type="number"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                placeholder="مثال: 100000"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">الوحدة</label>
              <select
                value={newGoal.unit}
                onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
              >
                <option value="ر.س">ريال سعودي</option>
                <option value="%">نسبة مئوية</option>
                <option value="وحدة">وحدة</option>
                <option value="صفقة">صفقة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">الموعد النهائي</label>
              <input
                type="date"
                value={newGoal.deadline.toISOString().split('T')[0]}
                onChange={(e) => setNewGoal({...newGoal, deadline: new Date(e.target.value)})}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">الفرع (اختياري)</label>
              <input
                type="text"
                value={newGoal.branchName}
                onChange={(e) => setNewGoal({...newGoal, branchName: e.target.value})}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                placeholder="مثال: الرياض الرئيسي"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleCreateGoal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
            >
              إنشاء الهدف
            </button>
          </div>
        </div>
      )}

      {/* Goals by Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">المنجز</span>
            <CheckCircle2 className="text-emerald-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {goalsByStatus.achieved.length}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">ع المسار</span>
            <TrendingUp className="text-blue-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {goalsByStatus.onTrack.length}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">مخاطرة</span>
            <AlertTriangle className="text-amber-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {goalsByStatus.atRisk.length}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">متأخر</span>
            <TrendingDown className="text-rose-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {goalsByStatus.behind.length}
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length > 0 ? (
          goals.map(goal => (
            <div key={goal.id} className="p-4 rounded-md border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(goal.status)}
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">{goal.title}</h4>
                    {goal.branchName && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {goal.branchName}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span>الهدف: {goal.targetValue} {goal.unit}</span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(goal.deadline)}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                  {goal.status === 'achieved' && 'منجز'}
                  {goal.status === 'on-track' && 'على المسار'}
                  {goal.status === 'at-risk' && 'مخاطرة'}
                  {goal.status === 'behind' && 'متأخر'}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">التقدم</span>
                  <span className="font-medium">{calculateProgress(goal).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      goal.status === 'achieved' ? 'bg-emerald-500' :
                      goal.status === 'on-track' ? 'bg-blue-500' :
                      goal.status === 'at-risk' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-slate-500">القيمة الحالية: </span>
                  <span className="font-medium">{goal.currentValue} {goal.unit}</span>
                </div>
                <input
                  type="number"
                  value={goal.currentValue}
                  onChange={(e) => onGoalUpdate(goal.id, parseFloat(e.target.value))}
                  className="w-24 p-1 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-sm"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            لا توجد أهداف مسجلة
          </div>
        )}
      </div>
    </div>
  );
}
