import React from 'react';

interface NewLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
}

export default function NewLogo({ size = 'md', variant = 'full', className = '' }: NewLogoProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      text: 'text-sm',
      icon: 'w-6 h-6'
    },
    md: {
      container: 'w-10 h-10',
      text: 'text-base',
      icon: 'w-8 h-8'
    },
    lg: {
      container: 'w-12 h-12',
      text: 'text-lg',
      icon: 'w-10 h-10'
    },
    xl: {
      container: 'w-16 h-16',
      text: 'text-xl',
      icon: 'w-12 h-12'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.container} ${className}`}>
      {/* New Logo Icon - Circle with graduation cap */}
      <div className={`${currentSize.icon} bg-[#003AB7] rounded-full flex items-center justify-center flex-shrink-0`}>
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="w-full h-full p-2"
        >
          <path d="M12 2L2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7l-10-5z"/>
          <polyline points="2 17 22 12 17"/>
          <polyline points="2 12 7 7 12"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </div>
      
      {/* Logo Text */}
      {variant !== 'icon-only' && (
        <div className="ml-3">
          <div className="font-bold text-[#003AB7] font-['Be_Vietnam_Pro'] ${currentSize.text}">
            Du Học Cost
          </div>
          {variant === 'full' && (
            <div className="text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro'] leading-tight">
              TBT Group
            </div>
          )}
        </div>
      )}
    </div>
  );
}
