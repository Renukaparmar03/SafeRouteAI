import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  isLoading = false,
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-95';
  
  const variants = {
    primary: 'bg-primary text-white shadow-soft hover:bg-opacity-90',
    secondary: 'bg-secondary text-white shadow-soft hover:bg-opacity-90',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:bg-opacity-10',
    ghost: 'text-text-secondary hover:bg-border hover:text-text-primary',
    danger: 'bg-danger text-white shadow-soft hover:bg-opacity-90',
  };

  const sizes = {
    sm: 'px-4 py-2 text-small',
    md: 'px-6 py-3 text-button',
    lg: 'px-8 py-4 text-button w-full',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed active:scale-100',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
