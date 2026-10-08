import { Home, AlertTriangle, Bell, User, Navigation } from 'lucide-react';
import { ROUTES } from './routes';

export const BOTTOM_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, route: ROUTES.HOME },
  { id: 'live-tracking', label: 'Tracking', icon: Navigation, route: ROUTES.LIVE_TRACKING },
  { id: 'sos', label: 'SOS', icon: AlertTriangle, route: ROUTES.EMERGENCY, isCenter: true },
  { id: 'alerts', label: 'Alerts', icon: Bell, route: ROUTES.ALERTS },
  { id: 'profile', label: 'Profile', icon: User, route: ROUTES.PROFILE }
];
