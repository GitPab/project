import React from 'react';
import { X, Megaphone, Sparkles, GraduationCap, Calendar, ArrowRight } from 'lucide-react';

interface MarketingBannerProps {
  variant?: 'promo' | 'announcement' | 'feature' | 'event';
  title: string;
  description: string;
  ctaText?: string;
  ctaAction?: () => void;
  onClose?: () => void;
  className?: string;
  expiryDate?: string;
  badge?: string;
}

export default function MarketingBanner({
  variant = 'promo',
  title,
  description,
  ctaText,
  ctaAction,
  onClose,
  className = '',
  expiryDate,
  badge
}: MarketingBannerProps) {
  const variants = {
    promo: {
      bg: 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800',
      icon: Sparkles,
      iconColor: 'text-yellow-300'
    },
    announcement: {
      bg: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700',
      icon: Megaphone,
      iconColor: 'text-white'
    },
    feature: {
      bg: 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-700',
      icon: GraduationCap,
      iconColor: 'text-yellow-200'
    },
    event: {
      bg: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-600',
      icon: Calendar,
      iconColor: 'text-white'
    }
  };

  const { bg, icon: Icon, iconColor } = variants[variant];

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-lg ${bg} ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white rounded-full" />
        <div className="absolute -bottom-1/2 -left-1/2 w-2/3 h-2/3 bg-white rounded-full" />
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}

      <div className="relative px-6 py-5 flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 bg-white/20 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-lg font-['Be_Vietnam_Pro']">
              {title}
            </h3>
            {badge && (
              <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          
          <p className="text-white/90 text-sm mt-1 font-['Be_Vietnam_Pro'] leading-relaxed">
            {description}
          </p>

          {expiryDate && (
            <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Hết hạn: {expiryDate}
            </p>
          )}

          {ctaText && ctaAction && (
            <button
              onClick={ctaAction}
              className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-white text-blue-700 font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors"
            >
              {ctaText}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Pre-configured banner templates for common use cases
export function PromoBanner(props: Omit<MarketingBannerProps, 'variant'>) {
  return <MarketingBanner {...props} variant="promo" />;
}

export function AnnouncementBanner(props: Omit<MarketingBannerProps, 'variant'>) {
  return <MarketingBanner {...props} variant="announcement" />;
}

export function FeatureBanner(props: Omit<MarketingBannerProps, 'variant'>) {
  return <MarketingBanner {...props} variant="feature" />;
}

export function EventBanner(props: Omit<MarketingBannerProps, 'variant'>) {
  return <MarketingBanner {...props} variant="event" />;
}
