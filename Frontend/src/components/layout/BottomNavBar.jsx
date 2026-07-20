import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { BOTTOM_NAV_ITEMS } from '../../constants/navigation';

const BottomNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface border-t border-border px-6 py-2 pb-6 z-50 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.route;
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="relative -top-6 flex flex-col items-center justify-center bg-danger rounded-full w-16 h-16 shadow-lg shadow-danger/30 hover:scale-105 transition-transform active:scale-95"
            >
              <Icon className="w-7 h-7 text-white" />
              <span className="text-white text-[10px] font-bold mt-0.5">{item.label}</span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.route)}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 w-12 transition-colors active:scale-95',
              isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            <span className={clsx(
              'text-[10px] font-medium transition-all',
              isActive ? 'font-bold' : ''
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavBar;
