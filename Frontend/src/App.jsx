import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Import Pages
import SplashScreen from './features/auth/pages/SplashScreen';
import OnboardingScreen from './features/auth/pages/OnboardingScreen';
import LoginScreen from './features/auth/pages/LoginScreen';
import SignupScreen from './features/auth/pages/SignupScreen';
import HomeScreen from './features/home/pages/HomeScreen';
import TripPlannerScreen from './features/trips/pages/TripPlannerScreen';
import TripDetailsScreen from './features/trips/pages/TripDetailsScreen';
import EmergencyScreen from './features/emergency/pages/EmergencyScreen';
import SOSConfirmScreen from './features/emergency/pages/SOSConfirmScreen';
import AlertsScreen from './features/alerts/pages/AlertsScreen';
import ProfileScreen from './features/profile/pages/ProfileScreen';
import LiveMapScreen from './features/map/pages/LiveMapScreen';
import LiveTrackingScreen from './features/map/pages/LiveTrackingScreen';
import AssistantScreen from './features/assistant/pages/AssistantScreen';
import MyTripsScreen from './features/trips/pages/MyTripsScreen';
import SafetyCheckScreen from './features/safety/pages/SafetyCheckScreen';

// Admin Imports
import AdminLayout from './features/admin/layouts/AdminLayout';
import AdminLogin from './features/admin/pages/AdminLogin';
import AdminRegister from './features/admin/pages/AdminRegister';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import ZoneManagement from './features/admin/pages/ZoneManagement';
import AddDangerZone from './features/admin/pages/AddDangerZone';
import UserManagement from './features/admin/pages/UserManagement';
import ReportsManagement from './features/admin/pages/ReportsManagement';

// Placeholder for other pages to avoid errors
const Placeholder = ({ title }) => (
  <div className="flex h-screen items-center justify-center bg-background text-text-primary">
    <h1 className="text-subheading">{title} (Coming Soon)</h1>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Portal (Desktop Layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<AdminDashboard />} />
          <Route path="zones" element={<ZoneManagement />} />
          <Route path="add-danger-zone" element={<AddDangerZone />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="danger-zones" element={<Placeholder title="Danger Zones" />} />
          <Route path="settings" element={<Placeholder title="Settings" />} />
        </Route>

        {/* User App (Mobile Layout) */}
        <Route element={
          <div className="w-full min-h-screen bg-surface flex justify-center">
            <div className="w-full max-w-md bg-background shadow-soft min-h-screen relative overflow-hidden">
              <Outlet />
            </div>
          </div>
        }>
          <Route path={ROUTES.SPLASH} element={<SplashScreen />} />

          {/* Future Routes */}
          <Route path={ROUTES.ONBOARDING} element={<OnboardingScreen />} />
          <Route path={ROUTES.LOGIN} element={<LoginScreen />} />
          <Route path={ROUTES.SIGNUP} element={<SignupScreen />} />
          <Route path={ROUTES.HOME} element={<HomeScreen />} />
          <Route path={ROUTES.TRIP_PLANNER} element={<TripPlannerScreen />} />
          <Route path={ROUTES.TRIP_DETAILS} element={<TripDetailsScreen />} />
          <Route path={ROUTES.EMERGENCY} element={<EmergencyScreen />} />
          <Route path={ROUTES.SOS_CONFIRM} element={<SOSConfirmScreen />} />
          <Route path={ROUTES.ALERTS} element={<AlertsScreen />} />
          <Route path={ROUTES.PROFILE} element={<ProfileScreen />} />
          <Route path={ROUTES.MAP} element={<LiveMapScreen />} />
          <Route path={ROUTES.LIVE_TRACKING} element={<LiveTrackingScreen />} />
          <Route path={ROUTES.ASSISTANT} element={<AssistantScreen />} />
          <Route path={ROUTES.MY_TRIPS} element={<MyTripsScreen />} />
          <Route path={ROUTES.SAFETY_CHECK} element={<SafetyCheckScreen />} />

          {/* 404 Fallback */}
          <Route path="*" element={<Placeholder title="404 Not Found" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
