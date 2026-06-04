import React from 'react';

interface Step {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStep?: string;
  className?: string;
  onStepClick?: (stepId: string) => void;
}

export function ProgressTracker({ 
  steps, 
  currentStep,
  className = '',
  onStepClick 
}: ProgressTrackerProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === 'completed' || 
                           (currentStep && steps.findIndex(s => s.id === currentStep) > index);
        const isCurrent = step.id === currentStep;
        const isInProgress = step.status === 'in-progress' || 
                            (isCurrent && !isCompleted);

        return (
          <div key={step.id} className="flex items-start">
            {/* Step Connector */}
            {!isLast && (
              <div className={`flex flex-col items-center ml-4 mr-2 ${isCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
                <div className={`w-0.5 flex-1 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
            )}

            {/* Step Content */}
            <div className="flex-1">
              <div className="flex items-center">
                {/* Step Icon */}
                <div 
                  onClick={() => onStepClick && onStepClick(step.id)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 cursor-pointer transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : isInProgress 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : step.status === 'failed'
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isInProgress ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  ) : step.status === 'failed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step Info */}
                <div 
                  onClick={() => onStepClick && onStepClick(step.id)}
                  className={`ml-3 cursor-pointer transition-colors ${
                    isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <h3 className="font-medium">{step.title}</h3>
                  {step.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Step Status Message */}
              {step.status === 'failed' && (
                <div className="ml-13 mt-2 text-sm text-rose-600 dark:text-rose-400">
                  فشل في تنفيذ هذه الخطوة
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
