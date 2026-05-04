import { PropsWithChildren } from 'react';

export default function CommissionsLayout({ children }: PropsWithChildren) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#0f172a] font-sans antialiased text-slate-200">
      <div className="fixed inset-0 bg-[#0f172a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0f172a] to-[#0f172a]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
      
      {/* Texture */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
