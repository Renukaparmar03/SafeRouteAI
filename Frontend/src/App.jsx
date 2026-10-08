import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, Link } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { JourneyProvider } from './context/JourneyContext';
import { RequireAdmin, RequireAuth } from './components/common/RouteGuards';
import { LoadingState } from './components/common/StateViews';

// Import Pages
import SplashScreen from './features/auth/pages/SplashScreen';
const OnboardingScreen = lazy(() => import('./features/auth/pages/OnboardingScreen'));
const LoginScreen = lazy(() => import('./features/auth/pages/LoginScreen'));
const SignupScreen = lazy(() => import('./features/auth/pages/SignupScreen'));
const HomeScreen = lazy(() => import('./features/home/pages/HomeScreen'));
const TripPlannerScreen = lazy(() => import('./features/trips/pages/TripPlannerScreen'));
const TripDetailsScreen = lazy(() => import('./features/trips/pages/TripDetailsScreen'));
const EmergencyScreen = lazy(() => import('./features/emergency/pages/EmergencyScreen'));
const SOSConfirmScreen = lazy(() => import('./features/emergency/pages/SOSConfirmScreen'));
const AlertsScreen = lazy(() => import('./features/alerts/pages/AlertsScreen'));
const ProfileScreen = lazy(() => import('./features/profile/pages/ProfileScreen'));
const LiveMapScreen = lazy(() => import('./features/map/pages/LiveMapScreen'));
const LiveTrackingScreen = lazy(() => import('./features/map/pages/LiveTrackingScreen'));
const AssistantScreen = lazy(() => import('./features/assistant/pages/AssistantScreen'));
const MyTripsScreen = lazy(() => import('./features/trips/pages/MyTripsScreen'));
const SafetyCheckScreen = lazy(() => import('./features/safety/pages/SafetyCheckScreen'));

// Admin Imports
const AdminLayout = lazy(() => import('./features/admin/layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./features/admin/pages/AdminLogin'));
const AdminRegister = lazy(() => import('./features/admin/pages/AdminRegister'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));
const ZoneManagement = lazy(() => import('./features/admin/pages/ZoneManagement'));
const AddDangerZone = lazy(() => import('./features/admin/pages/AddDangerZone'));
const UserManagement = lazy(() => import('./features/admin/pages/UserManagement'));
const ReportsManagement = lazy(() => import('./features/admin/pages/ReportsManagement'));
const TripMonitoring = lazy(() => import('./features/admin/pages/TripMonitoring'));
const SendNotification = lazy(() => import('./features/admin/pages/SendNotification'));
const AdminSettings = lazy(() => import('./features/admin/pages/AdminSettings'));

const NotFound = () => (
  <div className="flex flex-col gap-3 h-screen items-center justify-center bg-background text-text-primary">
    <h1 className="text-subheading">404 Not Found</h1>
    <Link to={ROUTES.HOME} className="text-primary font-bold text-[14px] hover:underline">
      Go to Home
    </Link>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <JourneyProvider>
            <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center bg-background"><LoadingState /></div>}>
            <Routes>
              {/* Admin Portal (Desktop Layout) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<AdminDashboard />} />
                  <Route path="analytics/*" element={<AdminDashboard />} />
                  <Route path="zones" element={<ZoneManagement />} />
                  <Route path="danger-zones" element={<ZoneManagement />} />
                  <Route path="add-danger-zone" element={<AddDangerZone />} />
                  <Route path="danger-zones/add" element={<AddDangerZone />} />
                  <Route path="danger-zones/:id/edit" element={<AddDangerZone />} />
                  <Route path="users/*" element={<UserManagement />} />
                  <Route path="reports" element={<ReportsManagement />} />
                  <Route path="map/reports" element={<ReportsManagement />} />
                  <Route path="alerts/*" element={<ReportsManagement />} />
                  <Route path="trips/*" element={<TripMonitoring />} />
                  <Route path="tracking/live" element={<TripMonitoring />} />
                  <Route path="tracking/history" element={<TripMonitoring />} />
                  <Route path="notifications/*" element={<SendNotification />} />
                  <Route path="settings/*" element={<AdminSettings />} />
                  <Route path="tracking/settings" element={<AdminSettings />} />
                  <Route path="ai/*" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* User App (Mobile Layout) */}
              <Route
                element={
                  <div className="w-full min-h-screen bg-surface flex justify-center">
                    <div className="w-full max-w-md bg-background shadow-soft min-h-screen relative overflow-hidden">
                      <Outlet />
                    </div>
                  </div>
                }
              >
                <Route path={ROUTES.SPLASH} element={<SplashScreen />} />
                <Route path={ROUTES.ONBOARDING} element={<OnboardingScreen />} />
                <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
                <Route path={ROUTES.SIGNUP} element={<SignupScreen />} />

                <Route element={<RequireAuth />}>
                  <Route path={ROUTES.HOME} element={<HomeScreen />} />
                  <Route path={ROUTES.TRIP_PLANNER} element={<TripPlannerScreen />} />
                  <Route path={ROUTES.TRIP_DETAILS} element={<Navigate to={ROUTES.MY_TRIPS} replace />} />
                  <Route path={`${ROUTES.TRIP_DETAILS}/:id`} element={<TripDetailsScreen />} />
                  <Route path={ROUTES.EMERGENCY} element={<EmergencyScreen />} />
                  <Route path={ROUTES.SOS_CONFIRM} element={<SOSConfirmScreen />} />
                  <Route path={ROUTES.ALERTS} element={<AlertsScreen />} />
                  <Route path={ROUTES.PROFILE} element={<ProfileScreen />} />
                  <Route path={ROUTES.MAP} element={<LiveMapScreen />} />
                  <Route path={ROUTES.LIVE_TRACKING} element={<LiveTrackingScreen />} />
                  <Route path={ROUTES.ASSISTANT} element={<AssistantScreen />} />
                  <Route path={ROUTES.MY_TRIPS} element={<MyTripsScreen />} />
                  <Route path={ROUTES.SAFETY_CHECK} element={<SafetyCheckScreen />} />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            </Suspense>
          </JourneyProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
