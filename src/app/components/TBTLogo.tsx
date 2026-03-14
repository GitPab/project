import React from 'react';

interface TBTLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
}

export default function TBTLogo({ size = 'md', variant = 'full', className = '' }: TBTLogoProps) {
  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      icon: 'w-12 h-12'
    },
    md: {
      container: 'w-16 h-16',
      icon: 'w-16 h-16'
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-20 h-20'
    },
    xl: {
      container: 'w-24 h-24',
      icon: 'w-24 h-24'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.container} ${className}`}>
      {/* TBT Group Logo Image - Only Image, No Text */}
      <div className={`${currentSize.icon} rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img 
          src="/img/tbt-logo.png" 
          alt="TBT Group Logo" 
          className="w-full h-full object-contain"
          style={{ display: 'block' }}
          onLoad={(e) => {
            console.log('✅ TBT Logo loaded successfully');
            const target = e.target as HTMLImageElement;
            target.style.display = 'block';
          }}
          onError={(e) => {
            console.error('❌ TBT Logo failed to load, checking fallback...');
            // Try alternative path
            const target = e.target as HTMLImageElement;
            target.src = './img/tbt-logo.png';
            target.onerror = () => {
              console.error('❌ Both paths failed, using text fallback');
              // Final fallback to text if both paths fail
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span class="text-white font-bold font-[\'Be_Vietnam_Pro\']">TBT</span>';
                parent.className = `${currentSize.icon} bg-gradient-to-br from-[#003AB7] to-[#558EFF] rounded-lg flex items-center justify-center flex-shrink-0`;
              }
            };
          }}
        />
      </div>
    </div>
  );
}
