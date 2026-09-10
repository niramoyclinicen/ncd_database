import React from 'react';

interface DashboardButtonProps {
  label: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  glowGradient: string;
  borderColor: string;
  iconBgColor?: string;
  delay: string;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({
  label,
  icon,
  onClick,
  glowGradient,
  borderColor,
  iconBgColor,
  delay,
}) => {
  return (
    <div
      className="w-full h-full animate-fade-in-up relative"
      style={{ animationDelay: delay }}
    >
      <div className="relative group w-full h-full transition-all duration-300 ease-out hover:z-40 hover:scale-105 sm:hover:scale-[1.07] lg:hover:scale-110 hover:-translate-y-1.5 sm:hover:-translate-y-2.5 active:scale-95 active:-translate-y-1">
        {/* Outer Side/Perimeter Glow Aura - Placed strictly behind the card (-z-10) with blur, extending outside the edges */}
        <div
          className={`
            absolute -inset-1.5 sm:-inset-2 rounded-2xl sm:rounded-3xl
            bg-gradient-to-r ${glowGradient}
            opacity-0 group-hover:opacity-90 group-active:opacity-90 blur-md sm:blur-xl
            transition-all duration-300 -z-10 pointer-events-none
          `}
        />

        {/* Main Solid Card - Clean, crisp, high-contrast dark background so text is 100% sharp and no haze can bleed inside */}
        <button
          onClick={onClick}
          className={`
            relative flex flex-col items-center justify-center cursor-pointer w-full
            py-1 px-1 xs:py-1.5 xs:px-1.5 sm:py-2 sm:px-2 md:py-3.5 md:px-3 lg:py-6 lg:px-6 
            h-[110px] xs:h-[118px] sm:h-28 md:h-[154px] lg:h-48 xl:h-52 active:scale-95
            rounded-2xl sm:rounded-3xl border-2 ${borderColor}
            bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl transition-all duration-300
          `}
        >
          {/* Icon circle */}
          <div
            className={`
              mb-0.5 xs:mb-1 sm:mb-1.5 md:mb-1.5 lg:mb-3 p-1.5 xs:p-2 sm:p-2.5 md:p-2.5 lg:p-3 rounded-full
              bg-slate-800/90 border border-slate-700/80 text-slate-300
              ${iconBgColor || 'group-hover:text-white'}
              group-hover:scale-115 group-active:scale-115
              transition-all duration-300 shadow-inner
            `}
          >
            {React.isValidElement(icon) ? (
              <div className="scale-[0.68] xs:scale-[0.75] sm:scale-80 md:scale-85 lg:scale-100">
                {React.cloneElement(icon as React.ReactElement<any>, { size: 36 })}
              </div>
            ) : (
              icon
            )}
          </div>

          {/* Text Container - razor sharp text, no blur, clearly enlarges with the card */}
          <div className="text-center z-10 w-full px-1 sm:px-2 group-hover:scale-105 group-active:scale-105 transition-transform duration-300">
            {typeof label === 'string' ? (
              <span className="text-lg md:text-xl font-bold text-slate-200 group-hover:text-white tracking-wide transition-colors">
                {label}
              </span>
            ) : (
              label
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardButton;

