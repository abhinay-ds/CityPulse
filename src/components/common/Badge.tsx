import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'orange' | 'blue' | 'red' | 'amber' | 'slate';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold tracking-wide uppercase',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              variant === 'green'
                ? 'bg-emerald-400'
                : variant === 'orange'
                ? 'bg-orange-400'
                : variant === 'red'
                ? 'bg-rose-400'
                : 'bg-blue-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              variant === 'green'
                ? 'bg-emerald-500'
                : variant === 'orange'
                ? 'bg-orange-500'
                : variant === 'red'
                ? 'bg-rose-500'
                : 'bg-blue-500'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
};
