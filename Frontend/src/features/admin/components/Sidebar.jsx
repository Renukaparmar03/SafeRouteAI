import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  LayoutDashboard, Users, MapPin, Navigation, Bell, 
  Bot, Map, BarChart3, BellRing, Settings, LogOut, 
  ChevronDown, ChevronRight, ShieldAlert
} from 'lucide-react';

const NavGroup = ({ item, isActive, isActiveGroup, location }) => {
  const [isOpen, setIsOpen] = useState(isActiveGroup);
  const Icon = item.icon;

  if (!item.subItems) {
    return (
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-primary text-white shadow-md shadow-primary/20' 
            : 'text-text-secondary hover:bg-white/50 hover:text-primary'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium text-[15px]">{item.name}</span>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
          isActiveGroup
            ? 'text-primary bg-primary/5'
            : 'text-text-secondary hover:bg-white/50 hover:text-primary'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-medium text-[15px]">{item.name}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="pl-11 pr-2 space-y-1 py-1">
          {item.subItems.map((sub, i) => {
            const isSubActive = location.pathname === sub.path;
            return (
              <Link
                key={i}
                to={sub.path}
                className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isSubActive
                    ? 'text-primary font-bold bg-primary/10'
                    : 'text-text-secondary hover:text-primary hover:bg-white/50'
                }`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
 
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };


  const navItems = [
    { name: 'Dashboard', path: '/admin/home', icon: LayoutDashboard },
    { 
      name: 'User Management', icon: Users, prefix: '/admin/users',
      subItems: [
        { name: 'All Users', path: '/admin/users' },
        { name: 'User Activity', path: '/admin/users/activity' },
        { name: 'Blocked Users', path: '/admin/users/blocked' }
      ]
    },
    {
      name: 'Safety Map Mgt', icon: MapPin, prefix: '/admin/map',
      subItems: [
        { name: 'Danger Zones', path: '/admin/danger-zones' },
        { name: 'Safe Zones', path: '/admin/zones' },
        { name: 'Add New Zone', path: '/admin/danger-zones/add' },
        { name: 'Zone Reports', path: '/admin/map/reports' }
      ]
    },
    {
      name: 'Trip Management', icon: Navigation, prefix: '/admin/trips',
      subItems: [
        { name: 'Active Trips', path: '/admin/trips/active' },
        { name: 'Completed Trips', path: '/admin/trips/completed' },
        { name: 'Emergency Trips', path: '/admin/trips/emergency' },
        { name: 'Trip History', path: '/admin/trips/history' }
      ]
    },
    {
      name: 'Alert & Emergency', icon: Bell, prefix: '/admin/alerts',
      subItems: [
        { name: 'Live Alerts', path: '/admin/alerts/live' },
        { name: 'SOS Requests', path: '/admin/alerts/sos' },
        { name: 'Emergency Cases', path: '/admin/alerts/cases' },
        { name: 'Alert History', path: '/admin/alerts/history' }
      ]
    },
    {
      name: 'AI Management', icon: Bot, prefix: '/admin/ai',
      subItems: [
        { name: 'AI Assistant Logs', path: '/admin/ai/logs' },
        { name: 'Risk Prediction Data', path: '/admin/ai/predictions' },
        { name: 'AI Responses', path: '/admin/ai/responses' }
      ]
    },
    {
      name: 'Location & Tracking', icon: Map, prefix: '/admin/tracking',
      subItems: [
        { name: 'Live Users Map', path: '/admin/tracking/live' },
        { name: 'Location History', path: '/admin/tracking/history' },
        { name: 'Tracking Settings', path: '/admin/tracking/settings' }
      ]
    },
    {
      name: 'Analytics', icon: BarChart3, prefix: '/admin/analytics',
      subItems: [
        { name: 'User Statistics', path: '/admin/analytics/users' },
        { name: 'Zone Analytics', path: '/admin/analytics/zones' },
        { name: 'Trip Analytics', path: '/admin/analytics/trips' },
        { name: 'Safety Reports', path: '/admin/reports' }
      ]
    },
    {
      name: 'Notifications', icon: BellRing, prefix: '/admin/notifications',
      subItems: [
        { name: 'Send Notification', path: '/admin/notifications/send' },
        { name: 'Notification History', path: '/admin/notifications/history' },
        { name: 'Templates', path: '/admin/notifications/templates' }
      ]
    },
    {
      name: 'Settings', icon: Settings, prefix: '/admin/settings',
      subItems: [
        { name: 'Admin Profile', path: '/admin/settings/profile' },
        { name: 'App Settings', path: '/admin/settings/app' },
        { name: 'Map API Settings', path: '/admin/settings/map' },
        { name: 'Security Settings', path: '/admin/settings/security' }
      ]
    }
  ];

  return (
    <div className="w-72 h-screen bg-white/70 backdrop-blur-md border-r border-white/40 flex flex-col fixed left-0 top-0 shadow-sm">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">TravelSafety AI</h1>
          <p className="text-xs text-text-secondary font-medium">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const isActiveGroup = item.subItems?.some(sub => location.pathname === sub.path) || (item.prefix && location.pathname.startsWith(item.prefix));
          
          return (
            <NavGroup 
              key={index} 
              item={item} 
              isActive={isActive} 
              isActiveGroup={isActiveGroup} 
              location={location} 
            />
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/40 shrink-0">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-[15px]">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
