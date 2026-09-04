import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftAddon, rightAddon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && <div className="absolute left-3 text-neutral-400 pointer-events-none">{leftAddon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all ${
              leftAddon ? 'pl-9' : ''
            } ${rightAddon ? 'pr-9' : ''} ${error ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E5E5]'} ${className}`}
            {...props}
          />
          {rightAddon && <div className="absolute right-3 text-neutral-400">{rightAddon}</div>}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#6B7280]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E5E5]'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#6B7280]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
