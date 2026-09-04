import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border-2 border-dashed border-[#E5E5E5] bg-white/60">
      <div className="p-3.5 rounded-2xl bg-orange-50 text-[#F97316] mb-4 border border-orange-100 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#111111] mb-1.5 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-[#6B7280] max-w-sm mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" size="sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
