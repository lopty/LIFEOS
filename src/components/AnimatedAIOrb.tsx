import React from 'react';

interface AnimatedAIOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  isProcessing?: boolean;
  className?: string;
}

export const AnimatedAIOrb: React.FC<AnimatedAIOrbProps> = ({
  size = 'md',
  isProcessing = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    hero: 'w-24 h-24 sm:w-28 sm:h-28',
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer ambient glow */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-700 ${sizeClasses} ${
          isProcessing ? 'scale-125 opacity-70' : 'scale-110 opacity-40'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(82, 120, 245, 0.4) 0%, rgba(169, 149, 244, 0.25) 50%, transparent 75%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Main Luminous Orb */}
      <div
        className={`relative rounded-full overflow-hidden shadow-lg transition-transform duration-500 animate-orb-float ${sizeClasses} ${
          isProcessing ? 'scale-105' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, #5278F5 0%, #7B9AF8 30%, #A995F4 70%, #F5C6D9 100%)',
          boxShadow: isProcessing
            ? '0 8px 32px rgba(82, 120, 245, 0.45), inset 0 2px 8px rgba(255, 255, 255, 0.6)'
            : '0 6px 24px rgba(82, 120, 245, 0.25), inset 0 2px 6px rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Internal iridescent light swirls */}
        <div
          className={`absolute inset-0 opacity-80 mix-blend-overlay ${
            isProcessing ? 'animate-orb-swirl' : ''
          }`}
          style={{
            background: 'radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 50%), radial-gradient(circle at 75% 80%, rgba(169, 149, 244, 0.8) 0%, transparent 60%)',
          }}
        />

        {/* Highlight sheen curve */}
        <div
          className="absolute -top-1/4 -left-1/4 w-full h-full rounded-full opacity-60 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.75) 0%, transparent 65%)',
          }}
        />
      </div>
    </div>
  );
};
