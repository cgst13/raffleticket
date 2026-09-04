import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hover = false, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${
        hover ? 'transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-neutral-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E5E5E5] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-base font-semibold text-[#111111] tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-[#6B7280] ${className}`} {...props}>
    {children}
  </p>
);
