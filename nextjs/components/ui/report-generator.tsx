import React, { useState } from 'react';
import { Download, FileText, Settings, X } from 'lucide-react';

interface ReportGeneratorProps {
  onGenerate: (options: ReportOptions) => void;
  className?: string;
}

interface ReportOptions {
  includeCharts: boolean;
  includeSupervisorData: boolean;
  includeBranchDetails: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  format: 'pdf' | 'excel' | 'csv';
}

export function ReportGenerator({ onGenerate, className = '' }: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    includeCharts: true,
    includeSupervisorData: true,
    includeBranchDetails: true,
    dateRange: {
      start: null,
      end: null
    },
    format: 'pdf'
  });

  const handleGenerate = () => {
    onGenerate(options);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
      >
        <Download size={18} />
        إنشاء تقرير
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">إنشاء تقرير مخصص</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Format */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">صيغة التقرير</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pdf', 'excel', 'csv'] as const).map(format => (
                      <button
                        key={format}
                        onClick={() => setOptions({...options, format})}
                        className={`p-3 rounded-md border transition-colors ${
                          options.format === format 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {format === 'pdf' && 'PDF'}
                        {format === 'excel' && 'Excel'}
                        {format === 'csv' && 'CSV'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Options */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">محتويات التقرير</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'includeCharts', label: 'تضمين الرسوم البيانية والرسوم البيانية' },
                      { id: 'includeSupervisorData', label: 'تضمين بيانات المشرفين والعمولات' },
                      { id: 'includeBranchDetails', label: 'تضمين تفاصيل كل فرع على حدة' }
                    ].map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options[item.id as keyof ReportOptions] as boolean}
                          onChange={(e) => setOptions({...options, [item.id]: e.target.checked})}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">نطاق التاريخ</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">من تاريخ</label>
                      <input
                        type="date"
                        value={options.dateRange.start ? options.dateRange.start.toISOString().split('T')[0] : ''}
                        onChange={(e) => setOptions({
                          ...options,
                          dateRange: {
                            ...options.dateRange,
                            start: e.target.value ? new Date(e.target.value) : null
                          }
                        })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">إلى تاريخ</label>
                      <input
                        type="date"
                        value={options.dateRange.end ? options.dateRange.end.toISOString().split('T')[0] : ''}
                        onChange={(e) => setOptions({
                          ...options,
                          dateRange: {
                            ...options.dateRange,
                            end: e.target.value ? new Date(e.target.value) : null
                          }
                        })}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2 transition-colors"
                >
                  <Download size={18} />
                  إنشاء التقرير
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
