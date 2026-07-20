import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  className,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full flex flex-col gap-1.5 mb-4">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-text-primary text-[14px] font-semibold"
        >
          {label}
        </label>
      )}
      
      <div className="relative w-full">
        <input
          ref={ref}
          id={inputId}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={cn(
            'w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-[14px] text-text-primary placeholder:text-text-secondary outline-none transition-all duration-200',
            'focus:border-primary focus:ring-1 focus:ring-primary',
            error && 'border-danger focus:border-danger focus:ring-danger',
            isPassword && 'pr-12',
            className
          )}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-danger text-[12px] font-medium mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
