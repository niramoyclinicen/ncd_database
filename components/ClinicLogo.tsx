import React, { useState } from 'react';
import { dbService } from '../dbService';

interface ClinicLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoUrl?: string;
  className?: string;
  showAura?: boolean;
}

const hexClip = 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)';

export const ClinicLogo: React.FC<ClinicLogoProps> = ({
  size = 'md',
  logoUrl,
  className = '',
  showAura = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // If logoUrl prop is provided, use it. Otherwise, query dbService
  const activeLogoUrl = logoUrl !== undefined ? logoUrl : dbService.getClinicProfile().logoUrl;

  // Size mapping
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-[11px]',
    md: 'text-sm font-black',
    lg: 'text-xl font-black',
    xl: 'text-2xl font-black',
  };

  const crossSizes = {
    sm: { w: 'w-1', h: 'h-5', w2: 'w-5', h2: 'h-1' },
    md: { w: 'w-1.5', h: 'h-6', w2: 'w-6', h2: 'h-1.5' },
    lg: { w: 'w-1.5', h: 'h-8', w2: 'w-8', h2: 'h-1.5' },
    xl: { w: 'w-2', h: 'h-10', w2: 'w-10', h2: 'h-2' },
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const currentTextSize = textSizes[size] || textSizes.md;
  const cross = crossSizes[size] || crossSizes.md;

  // If custom logo image is provided and hasn't failed to load
  if (activeLogoUrl && !imgError) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${currentSizeClass} ${className} group`}>
        {showAura && (
          <div className="absolute -inset-1 rounded-2xl bg-cyan-400/25 blur-md pointer-events-none group-hover:bg-cyan-400/40 transition-all duration-300" />
        )}
        <div className="relative w-full h-full rounded-2xl bg-slate-900/90 border-2 border-cyan-400/60 p-1.5 flex items-center justify-center shadow-lg shadow-cyan-950/50 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:border-cyan-300">
          <img
            src={activeLogoUrl}
            alt="Clinic Official Logo"
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      </div>
    );
  }

  // Unified Prestigious Hex Logo (Default Brand Emblem)
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${currentSizeClass} ${className} group`}>
      {/* Outer Hex Glow Ring */}
      {showAura && (
        <div
          className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-teal-400 opacity-70 blur-md group-hover:opacity-100 transition-all duration-500 animate-pulse pointer-events-none"
          style={{ clipPath: hexClip }}
        />
      )}

      {/* Main Solid Hex Container */}
      <div
        className="relative w-full h-full bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.5)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] transition-all duration-500"
        style={{ clipPath: hexClip }}
      >
        {/* Subtle Inner Medical Cross Accent */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <div className={`${cross.w} ${cross.h} bg-cyan-400 rounded-full`} />
          <div className={`absolute ${cross.w2} ${cross.h2} bg-cyan-400 rounded-full`} />
        </div>

        {/* Center Typography "NcD" */}
        <div className="relative z-10 flex items-center justify-center tracking-tighter">
          <span
            className={`${currentTextSize} font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans`}
          >
            NcD
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClinicLogo;
