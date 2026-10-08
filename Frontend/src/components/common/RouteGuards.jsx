import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { LoadingState } from './StateViews';

const FullScreenLoader = () => (
  <div className="w-full min-h-screen flex items-center justify-center bg-background">
    <LoadingState label="Loading SafeRoute AI…" />
  </div>
);

/** Signed-in users only (redirects to /login and comes back afterwards). */
export const RequireAuth = () => {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullScreenLoader />;
  if (status !== 'authenticated') return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  return <Outlet />;
};

/** Admins only. */
export const RequireAdmin = () => {
  const { status, isAdmin } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullScreenLoader />;
  if (status !== 'authenticated' || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};
