import { PropsWithChildren } from 'react';

export default function CommissionsLayout({ children }: PropsWithChildren) {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-500">
      <div className="fixed inset-0 bg-slate-50 dark:bg-[#0f172a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 dark:from-blue-900/20 via-slate-50 dark:via-[#0f172a] to-slate-50 dark:to-[#0f172a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-100/40 dark:from-indigo-900/20 via-transparent to-transparent" />
      
      {/* Texture */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      
      <div className="relative z-10 w-full px-0 py-0">
        {children}
      </div>
    </div>
  );
}
