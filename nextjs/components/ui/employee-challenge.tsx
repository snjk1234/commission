import React, { useState, useMemo } from 'react';
import { Trophy, Star, Target, TrendingUp, TrendingDown, Award, Crown, Users, Calendar, CheckCircle2 } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  position: string;
  branch: string;
  avatar?: string;
  currentScore: number;
  previousScore: number;
  rank: number;
  achievements: string[];
  challenges: {
    id: string;
    name: string;
    progress: number;
    completed: boolean;
    reward?: string;
  }[];
}

interface EmployeeChallengeProps {
  employees: Employee[];
  className?: string;
}

export function EmployeeChallenge({ employees, className = '' }: EmployeeChallengeProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'rank' | 'improvement'>('score');
  const [timeFrame, setTimeFrame] = useState<'current' | 'previous'>('current');

  // Calculate rankings
  const rankings = useMemo(() => {
    const sorted = [...employees].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.currentScore - a.currentScore;
        case 'rank':
          return a.rank - b.rank;
        case 'improvement':
          return (b.currentScore - b.previousScore) - (a.currentScore - a.previousScore);
        default:
          return 0;
      }
    });

    return sorted.map((employee, index) => ({
      ...employee,
      displayRank: index + 1
    }));
  }, [employees, sortBy]);

  // Get top performers
  const topPerformers = useMemo(() => {
    return rankings.slice(0, 3);
  }, [rankings]);

  // Get performance level
  const getPerformanceLevel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return { level: 'excellent', color: 'text-emerald-600', icon: <Crown className="text-emerald-500" /> };
    if (percentage >= 75) return { level: 'very-good', color: 'text-blue-600', icon: <Star className="text-blue-500" /> };
    if (percentage >= 50) return { level: 'good', color: 'text-amber-600', icon: <Award className="text-amber-500" /> };
    return { level: 'needs-improvement', color: 'text-rose-600', icon: <TrendingDown className="text-rose-500" /> };
  };

  // Get trend icon
  const getTrendIcon = (current: number, previous: number) => {
    const change = current - previous;

    if (change > 0) return <TrendingUp className="text-emerald-500" size={16} />;
    if (change < 0) return <TrendingDown className="text-rose-500" size={16} />;
    return null;
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={20} />;
      case 2:
        return <Star className="text-gray-400" size={18} />;
      case 3:
        return <Award className="text-amber-600" size={18} />;
      default:
        return <span className="text-lg font-bold text-slate-500 dark:text-slate-400">#{rank}</span>;
    }
  };

  // Get challenge status
  const getChallengeStatus = (progress: number, completed: boolean) => {
    if (completed) return { status: 'completed', color: 'text-emerald-600', icon: <CheckCircle2 className="text-emerald-500" /> };
    if (progress >= 75) return { status: 'almost-there', color: 'text-blue-600', icon: <Star className="text-blue-500" /> };
    if (progress >= 50) return { status: 'in-progress', color: 'text-amber-600', icon: <Target className="text-amber-500" /> };
    return { status: 'just-started', color: 'text-slate-600', icon: <TrendingUp className="text-slate-500" /> };
  };

  return (
    <div className={`bg-white dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-md shadow-md p-4 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Trophy className="text-blue-500" size={18} />
          منافسة الموظفين
        </h3>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
            <label className="text-xs text-slate-600 dark:text-slate-300">فرز حسب:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent border-none text-sm px-2 py-1"
            >
              <option value="score">النقاط</option>
              <option value="rank">الترتيب</option>
              <option value="improvement">التقدم</option>
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
          {topPerformers.map((employee, index) => {
            const maxScore = rankings[0].currentScore;
            const performance = getPerformanceLevel(employee.currentScore, maxScore);

            return (
              <div key={employee.id} className="p-4 rounded-md border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  {getRankIcon(employee.displayRank)}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    {employee.avatar ? (
                      <img src={employee.avatar} alt={employee.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="text-slate-500" size={20} />
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-800 dark:text-slate-200">{employee.name}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{employee.branch}</p>
                  </div>
                </div>

                <div className={`text-sm font-medium ${performance.color} flex items-center gap-1 mb-2`}>
                  {performance.icon}
                  {performance.level === 'excellent' && 'ممتاز'}
                  {performance.level === 'very-good' && 'ممتاز جدًا'}
                  {performance.level === 'good' && 'جيد'}
                  {performance.level === 'needs-improvement' && 'يحتاج تحسين'}
                </div>

                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {employee.currentScore} نقطة
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {getTrendIcon(employee.currentScore, employee.previousScore)}
                  {employee.previousScore} نقطة
                </div>

                {employee.achievements.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">أحدث الإنجازات:</div>
                    <div className="flex flex-wrap gap-1">
                      {employee.achievements.slice(0, 2).map((achievement, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All Employees Ranking */}
      <div>
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">ترتيب جميع الموظفين</h4>
        <div className="space-y-3">
          {rankings.map((employee) => {
            const maxScore = rankings[0].currentScore;
            const performance = getPerformanceLevel(employee.currentScore, maxScore);

            return (
              <div key={employee.id} className="p-3 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {getRankIcon(employee.displayRank)}
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {employee.avatar ? (
                      <img src={employee.avatar} alt={employee.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="text-slate-500" size={16} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-slate-800 dark:text-slate-200 truncate">{employee.name}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{employee.branch} • {employee.position}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${performance.color} flex items-center gap-1`}>
                      {performance.icon}
                      {performance.level === 'excellent' && 'ممتاز'}
                      {performance.level === 'very-good' && 'ممتاز جدًا'}
                      {performance.level === 'good' && 'جيد'}
                      {performance.level === 'needs-improvement' && 'يحتاج تحسين'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {employee.currentScore} نقطة
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {getTrendIcon(employee.currentScore, employee.previousScore)}
                      {employee.previousScore}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {employee.challenges.filter(c => c.completed).length}/{employee.challenges.length} تحديات
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenges Overview */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">التحديات الشهرية</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-500" size={18} />
              <h5 className="font-medium text-slate-800 dark:text-slate-200">مبيعات شهرية</h5>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">الهدف: 100,000 ر.س</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">75% مكتمل</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-amber-500" size={18} />
              <h5 className="font-medium text-slate-800 dark:text-slate-200">عملاء جدد</h5>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">الهدف: 20 عميل</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">60% مكتمل</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-emerald-500" size={18} />
              <h5 className="font-medium text-slate-800 dark:text-slate-200">رضا العملاء</h5>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">الهدف: 90%</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '95%' }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">95% مكتمل</p>
          </div>
        </div>
      </div>
    </div>
  );
}
