import React, { useState, useMemo } from 'react';
import { User, Star, Award, TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  position: string;
  branch: string;
  avatar?: string;
  performance: {
    sales2024: number;
    sales2025: number;
    growth: number;
    commission2024: number;
    commission2025: number;
    commissionGrowth: number;
    achievements: string[];
    goalsCompleted: number;
    totalGoals: number;
  };
}

interface EmployeePerformanceProps {
  employees: Employee[];
  className?: string;
}

export function EmployeePerformance({ employees, className = '' }: EmployeePerformanceProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'sales' | 'growth' | 'commission'>('sales');
  const [filterBy, setFilterBy] = useState<'all' | 'top' | 'improving' | 'needs-attention'>('all');

  // Filter and sort employees
  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply filters
    if (filterBy === 'top') {
      filtered = filtered.filter(emp => emp.performance.sales2025 > 100000 && emp.performance.growth > 10);
    } else if (filterBy === 'improving') {
      filtered = filtered.filter(emp => emp.performance.growth > 5 && emp.performance.growth <= 10);
    } else if (filterBy === 'needs-attention') {
      filtered = filtered.filter(emp => emp.performance.growth <= 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'sales':
          return b.performance.sales2025 - a.performance.sales2025;
        case 'growth':
          return b.performance.growth - a.performance.growth;
        case 'commission':
          return b.performance.commission2025 - a.performance.commission2025;
        default:
          return 0;
      }
    });

    return filtered;
  }, [employees, sortBy, filterBy]);

  // Calculate performance metrics
  const getPerformanceLevel = (employee: Employee) => {
    const { growth, sales2025 } = employee.performance;

    if (growth >= 15 && sales2025 > 150000) return { level: 'excellent', color: 'text-emerald-600', icon: <Award className="text-emerald-500" /> };
    if (growth >= 10 && sales2025 > 100000) return { level: 'good', color: 'text-blue-600', icon: <Star className="text-blue-500" /> };
    if (growth >= 5) return { level: 'satisfactory', color: 'text-amber-600', icon: <Target className="text-amber-500" /> };
    return { level: 'needs-improvement', color: 'text-rose-600', icon: <TrendingDown className="text-rose-500" /> };
  };

  // Get performance trend
  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="text-emerald-500" size={16} />;
    if (growth < 0) return <TrendingDown className="text-rose-500" size={16} />;
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

  // Calculate progress percentage
  const calculateProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <User className="text-blue-500" size={18} />
          أداء الموظفين
        </h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">فرز حسب:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="sales">المبيعات</option>
              <option value="growth">النمو</option>
              <option value="commission">العمولات</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">تصفية:</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="all">الكل</option>
              <option value="top">الأعلى أداءً</option>
              <option value="improving">تحسن مؤخرًا</option>
              <option value="needs-attention">يحتاج اهتمامًا</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(employee => {
            const performance = getPerformanceLevel(employee);
            const progress = calculateProgress(employee.performance.goalsCompleted, employee.performance.totalGoals);

            return (
              <div 
                key={employee.id} 
                className={`p-4 rounded-md border cursor-pointer transition-colors ${
                  selectedEmployee === employee.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => setSelectedEmployee(employee.id)}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="text-slate-500" size={24} />
                      )}
                    </div>
                  </div>

                  {/* Employee Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {employee.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {employee.position} • {employee.branch}
                        </p>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${performance.color} bg-opacity-10`}>
                        {performance.icon}
                        {performance.level === 'excellent' && 'ممتاز'}
                        {performance.level === 'good' && 'جيد'}
                        {performance.level === 'satisfactory' && 'مقبول'}
                        {performance.level === 'needs-improvement' && 'يحتاج تحسين'}
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <p className="text-xs text-slate-500 dark:text-slate-400">المبيعات</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          {formatCurrency(employee.performance.sales2025)}
                          {getTrendIcon(employee.performance.growth)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {employee.performance.growth >= 0 ? '+' : ''}{employee.performance.growth.toFixed(1)}% من العام الماضي
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <p className="text-xs text-slate-500 dark:text-slate-400">العمولات</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(employee.performance.commission2025)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {employee.performance.commissionGrowth >= 0 ? '+' : ''}{employee.performance.commissionGrowth.toFixed(1)}% نمو
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <p className="text-xs text-slate-500 dark:text-slate-400">الأهداف</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {employee.performance.goalsCompleted}/{employee.performance.totalGoals}
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              progress >= 75 ? 'bg-emerald-500' : 
                              progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Achievements */}
                    {employee.performance.achievements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {employee.performance.achievements.slice(0, 3).map((achievement, index) => (
                          <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            {achievement}
                          </span>
                        ))}
                        {employee.performance.achievements.length > 3 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            +{employee.performance.achievements.length - 3} أخرى
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
            لا توجد بيانات للموظفين
          </div>
        )}
      </div>

      {/* Employee Details */}
      {selectedEmployee && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-slate-700 dark:text-slate-300">تفاصيل الأداء</h4>
            <button 
              onClick={() => setSelectedEmployee(null)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              إغلاق
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              يمكن هنا عرض تقارير مفصلة عن أداء الموظف المحدد، بما في ذلك تاريخ المبيعات، 
              تقدم الأهداف، والإنجازات خلال العام.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
