import { Building2 } from 'lucide-react';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import acquireLogoMark from '@/assets/acquire-logo-mark.png';

interface BrandLogoProps {
  variant?: 'full' | 'mark' | 'light' | 'dark';
  className?: string;
  iconClassName?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
}

/**
 * Centralized brand logo component.
 * Renders uploaded logo or falls back to icon + text.
 */
export function BrandLogo({
  variant = 'full',
  className,
  iconClassName,
  showTitle = true,
  showSubtitle = false,
  titleClassName,
  subtitleClassName,
}: BrandLogoProps) {
  const { settings, getAsset, getSiteTitle, getSiteSubtitle } = useBrandSettings();
  const [imgError, setImgError] = useState(false);

  const urlMap = {
    full: 'logo_full_url',
    mark: 'logo_mark_url',
    light: 'logo_light_url',
    dark: 'logo_dark_url',
  } as const;

  const logoUrl = getAsset(urlMap[variant]);

  if (logoUrl && !imgError) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <img
          src={logoUrl}
          alt={getSiteTitle()}
          className={cn('h-9 w-auto object-contain', iconClassName)}
          onError={() => setImgError(true)}
        />
        {showTitle && variant !== 'mark' && (
          <div>
            <span className={cn('font-semibold tracking-tight', titleClassName)}>{getSiteTitle()}</span>
            {showSubtitle && (
              <p className={cn('text-[10px] uppercase tracking-wider font-medium', subtitleClassName)}>
                {getSiteSubtitle()}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback: generated logo + text
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src={acquireLogoMark}
        alt={getSiteTitle()}
        className={cn('h-9 w-9 rounded-xl object-cover', iconClassName)}
      />
      {showTitle && (
        <div>
          <span className={cn('font-semibold tracking-tight', titleClassName)}>{getSiteTitle()}</span>
          {showSubtitle && (
            <p className={cn('text-[10px] uppercase tracking-wider font-medium', subtitleClassName)}>
              {getSiteSubtitle()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
