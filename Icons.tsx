
import React from 'react';

interface DashboardButtonProps {
  label: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  delay: string;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({
  label,
  icon,
  onClick,
  colorFrom,
  colorTo,
  borderColor,
  delay,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative group flex flex-col items-center justify-center
        p-6 h-60 w-full rounded-2xl border bg-white dark:bg-slate-800/50 backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:!scale-110 hover:!-translate-y-3 hover:!shadow-[0_20px_50px_rgba(0,120,255,0.2)] dark:hover:!shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] hover:!z-50
        animate-fade-in-up border-slate-200 dark:border-slate-700 ${borderColor}
      `}
      style={{ animationDelay: delay }}
    >
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20
        bg-gradient-to-br ${colorFrom} ${colorTo} transition-opacity duration-300
      `} />
      
      <div className={`
        mb-6 p-4 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300
        group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-white transition-all duration-300
        shadow-inner
      `}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 40 }) : icon}
      </div>
      
      <div className="text-center z-10 w-full">
        {typeof label === 'string' ? (
           <span className="text-xl font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white tracking-wide transition-colors">
             {label}
           </span>
        ) : (
           label
        )}
      </div>
    </button>
  );
};

export default DashboardButton;
