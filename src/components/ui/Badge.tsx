import React from 'react';

export interface BadgeProps {
  status?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children, size = 'sm', className = '' }) => {
  let resolvedVariant = variant || 'default';

  if (status) {
    const s = status.toLowerCase();
    if (s === 'active' || s === 'available' || s === 'completed' || s === 'printed') {
      resolvedVariant = 'success';
    } else if (s === 'assigned' || s === 'generated' || s === 'sold') {
      resolvedVariant = 'orange';
    } else if (s === 'used' || s === 'reprinted') {
      resolvedVariant = 'info';
    } else if (s === 'cancelled' || s === 'error') {
      resolvedVariant = 'error';
    } else if (s === 'draft') {
      resolvedVariant = 'default';
    }
  }

  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    orange: 'bg-orange-50 text-[#c2410c] border-orange-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wider uppercase',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${variantStyles[resolvedVariant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
