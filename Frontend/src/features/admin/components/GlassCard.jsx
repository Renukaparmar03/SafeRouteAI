import React from 'react';
import { twMerge } from 'tailwind-merge';

const GlassCard = ({ children, className }) => {
  return (
    <div 
      className={twMerge(
        "bg-white/70 backdrop-blur-md border border-white/40 shadow-soft rounded-2xl overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
