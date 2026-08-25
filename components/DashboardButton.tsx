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
        p-4 md:p-6 w-full min-h-[7.5rem] sm:min-h-[10rem] lg:h-52 active:scale-95 
        rounded-[1.5rem] md:rounded-[2rem] border border-white/10 dark:border-slate-700/50 
        bg-gradient-to-br from-white/5 to-transparent dark:from-slate-800/60 dark:to-slate-900/40 
        backdrop-blur-md shadow-lg transition-all duration-300 ease-out
        hover:scale-[1.02] md:hover:scale-105 hover:-translate-y-1 md:hover:-translate-y-2 
        hover:shadow-[0_15px_40px_rgba(0,120,255,0.15)] dark:hover:shadow-[0_20px_50px_rgba(8,112,184,0.4)] hover:z-40
        animate-fade-in-up ${borderColor}
      `}
      style={{ animationDelay: delay }}
    >
      <div className={`
        absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20
        bg-gradient-to-br ${colorFrom} ${colorTo} transition-opacity duration-300
      `} />
      
      <div className={`
        mb-2 md:mb-3 lg:mb-4 p-2 md:p-3 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300
        group-hover:scale-110 group-hover:text-blue-600 dark:group-hover:text-white transition-all duration-300 shadow-inner
      `}>
        {React.isValidElement(icon) ? (
          <div className="scale-75 md:scale-90 lg:scale-100">
            {React.cloneElement(icon as React.ReactElement<any>, { size: 40 })}
          </div>
        ) : (
          icon
        )}
      </div>
      
      <div className="text-center z-10 w-full px-2">
        {typeof label === 'string' ? (
           <span className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white tracking-wide transition-colors">
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
