import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bell, Search, Map as MapIcon, Bot, Briefcase, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/ui/Button';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import HomeBannerBg from '../../../assets/images/home-banner.png';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { useCurrentLocation } from '../../../hooks/useGeolocation';
import { mapService } from '../../../services/mapService';
import { safetyService } from '../../../services/riskService';
import PlaceSuggestions, { usePlaceSearch } from '../../../components/common/PlaceSuggestions';
import { formatCoords } from '../../../utils/format';

const STATUS_STYLES = {
  LOW: { card: 'bg-[#ECFDF5] border-[#A7F3D0]', icon: 'bg-success shadow-[0_4px_12px_rgba(34,197,94,0.3)]', text: 'text-success', badge: 'bg-success' },
  MEDIUM: { card: 'bg-[#FFFBEB] border-[#FDE68A]', icon: 'bg-warning shadow-[0_4px_12px_rgba(245,158,11,0.3)]', text: 'text-warning', badge: 'bg-warning' },
  HIGH: { card: 'bg-[#FEF2F2] border-[#FECACA]', icon: 'bg-danger shadow-[0_4px_12px_rgba(239,68,68,0.3)]', text: 'text-danger', badge: 'bg-danger' },
  NONE: { card: 'bg-surface border-border', icon: 'bg-text-secondary/60', text: 'text-text-secondary', badge: 'bg-text-secondary/60' },
};

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  // Location is read automatically only if the user already granted permission earlier.
  const location = useCurrentLocation('if-granted');
  const position = location.position;
  const [placeName, setPlaceName] = useState(null);
  const [safety, setSafety] = useState({ status: 'idle', data: null });
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const suggestions = usePlaceSearch(search, { enabled: searchFocused, near: position });

  const firstName = user?.name?.split(' ')[0] || 'Traveller';
  const avatar =
    user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.id || 'traveller')}&backgroundColor=e5e7eb`;

  useEffect(() => {
    if (!position) return undefined;
    let cancelled = false;
    mapService
      .reverseGeocode(position)
      .then((place) => !cancelled && setPlaceName(place.shortName || place.name))
      .catch(() => !cancelled && setPlaceName(null));
    setSafety({ status: 'loading', data: null });
    safetyService
      .check(position)
      .then((data) => !cancelled && setSafety({ status: 'success', data }))
      .catch(() => !cancelled && setSafety({ status: 'error', data: null }));
    return () => {
      cancelled = true;
    };
  }, [position]);

  const locationText = position
    ? placeName || formatCoords(position.latitude, position.longitude)
    : location.status === 'loading'
      ? 'Locating…'
      : location.status === 'error'
        ? 'Location unavailable'
        : 'Tap to enable location';

  const safetyData = safety.data;
  const statusStyle = STATUS_STYLES[safetyData?.riskLevel || 'NONE'];
  const weather = safetyData?.weather;
  const weatherLine = weather
    ? ` Now: ${weather.condition}, ${Math.round(weather.temperature)}°C${
        Number.isFinite(weather.precipitationProbability) ? `, ${weather.precipitationProbability}% chance of rain` : ''
      }.`
    : '';
  const tip = !position
    ? 'Enable location to get tips based on live weather and nearby risk zones.'
    : safety.status === 'loading'
      ? 'Checking live weather and nearby risk zones…'
      : safety.status === 'error'
        ? 'Weather data is currently unavailable.'
        : `${safetyData?.advice?.[0]?.text || 'No specific advice right now'}.${weatherLine}`;

  const handleSelectPlace = (place) => {
    setSearch(place.name);
    setSearchFocused(false);
    navigate(ROUTES.MAP, { state: { destination: place } });
  };

  const quickActions = [
    {
      id: 'map',
      label: 'Map',
      subtext: 'Explore Routes',
      icon: MapIcon,
      color: 'text-indigo-600',
      gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #F5F3FF 100%)',
      hoverShadow: 'hover:shadow-[0_12px_24px_rgba(99,102,241,0.15)]',
      decorColor: 'from-indigo-300/20 to-transparent',
      route: ROUTES.MAP
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      subtext: 'Ask Anything',
      icon: Bot,
      color: 'text-purple-600',
      gradient: 'linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 50%, #F5F3FF 100%)',
      hoverShadow: 'hover:shadow-[0_12px_24px_rgba(217,70,239,0.15)]',
      decorColor: 'from-purple-300/20 to-transparent',
      route: ROUTES.ASSISTANT
    },
    {
      id: 'safety',
      label: 'Safety Check',
      subtext: 'Check Area Safety',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #F5F3FF 100%)',
      hoverShadow: 'hover:shadow-[0_12px_24px_rgba(16,185,129,0.15)]',
      decorColor: 'from-emerald-300/20 to-transparent',
      route: ROUTES.SAFETY_CHECK
    },
    {
      id: 'trips',
      label: 'My Trips',
      subtext: 'View your trips',
      icon: Briefcase,
      color: 'text-rose-600',
      gradient: 'linear-gradient(135deg, #FFF5F5 0%, #FFE4E6 50%, #F5F3FF 100%)',
      hoverShadow: 'hover:shadow-[0_12px_24px_rgba(244,63,94,0.15)]',
      decorColor: 'from-rose-300/20 to-transparent',
      route: ROUTES.MY_TRIPS
    },
  ];

  return (
    <div
      className="relative w-full h-screen max-w-md mx-auto flex flex-col font-sans overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F0E5FF 0%, #FFFFFF 35%)' }}
    >

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-5 pt-8">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-soft shrink-0">
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-text-primary text-[18px] font-bold">
                Hi, {firstName} 👋
              </h1>
              <button
                type="button"
                onClick={() => !position && location.request().catch(() => {})}
                className="flex items-center mt-0.5 text-text-secondary text-left"
              >
                <MapPin className="w-3 h-3 mr-1 shrink-0" />
                <p className="text-[12px] font-medium truncate max-w-[150px]">{locationText}</p>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white rounded-full px-3 py-1.5 flex items-center shadow-sm border border-border/50 shrink-0">
              <span className="text-[12px] font-semibold text-text-primary">
                {weather ? `${weather.icon} ${Math.round(weather.temperature)}°C` : '🌡️ --'}
              </span>
            </div>
            <button
              onClick={() => navigate(ROUTES.ALERTS)}
              aria-label={`Alerts${unreadCount ? ` (${unreadCount} unread)` : ''}`}
              className="relative p-2 text-text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white"></span>}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full mb-6 relative z-30">
          <div className="w-full bg-white rounded-[16px] flex items-center px-4 py-3 shadow-soft border border-border/50">
            <Search className="w-4 h-4 text-text-secondary mr-2" />
            <input
              type="text"
              placeholder="Search destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && suggestions.results[0] && handleSelectPlace(suggestions.results[0])}
              className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
          <PlaceSuggestions
            open={searchFocused && search.trim().length >= 3}
            results={suggestions.results}
            loading={suggestions.loading}
            error={suggestions.error}
            onSelect={handleSelectPlace}
          />
        </div>

        {/* Hero Banner */}
        <div className="relative w-full rounded-[20px] overflow-hidden shadow-soft mb-6 bg-black/80 min-h-[160px] flex flex-col justify-center">
          <img
            src={HomeBannerBg}
            alt="Plan Your Trip"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="relative z-10 p-5 pt-6">
            <h2 className="text-white text-[20px] font-bold mb-1.5">Plan Your Trip</h2>
            <p className="text-gray-100 text-[13px] leading-snug mb-5 max-w-[210px]">
              Get AI suggestions, best routes and safety insights.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.TRIP_PLANNER)}
              className="bg-white text-primary hover:bg-gray-50 rounded-xl px-5 py-2.5 text-[13px] font-bold shadow-md h-auto inline-flex w-auto"
            >
              Plan Trip
            </Button>
          </div>
        </div>

        {/* Quick Actions (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              style={{ background: action.gradient }}
              className={`group relative flex flex-col items-start p-4 rounded-[20px] overflow-hidden border border-white/40 shadow-soft transition-all duration-300 hover:-translate-y-1 ${action.hoverShadow} active:scale-95 text-left w-full h-[120px]`}
            >
              {/* Subtle decorative background shapes */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${action.decorColor} blur-md pointer-events-none`}></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/20 blur-sm pointer-events-none"></div>

              {/* Large soft background illustration */}
              <div className="absolute bottom-[-8px] right-[-8px] opacity-10 pointer-events-none transform rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[20deg]">
                <action.icon className={`w-20 h-20 ${action.color}`} />
              </div>

              {/* Floating Glassmorphism Icon Container */}
              <div className="backdrop-blur-md bg-white/40 border border-white/60 shadow-sm rounded-[12px] w-9 h-9 flex items-center justify-center mb-2.5 transition-all duration-300 group-hover:scale-105 group-hover:bg-white/50">
                <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
              </div>

              {/* Card Titles */}
              <h3 className="text-text-primary text-[13.5px] font-bold tracking-tight mb-0.5 z-10">{action.label}</h3>
              <p className="text-text-secondary text-[11px] font-medium leading-tight z-10 max-w-[85%]">{action.subtext}</p>
            </button>
          ))}
        </div>

        {/* Safety Status Card */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.SAFETY_CHECK)}
          className={clsx('w-full rounded-[16px] p-4 flex items-center justify-between shadow-sm border mb-4 text-left', statusStyle.card)}
        >
          <div className="flex items-center">
            <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center shrink-0', statusStyle.icon)}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-text-primary text-[12px] font-medium mb-0.5">Safety Status</p>
              <h3 className="text-text-primary text-[14px] font-bold">
                {safetyData ? (
                  <>
                    You are in <span className={statusStyle.text}>{safetyData.label.replace(/^Inside /, '')}</span>
                  </>
                ) : safety.status === 'loading' ? (
                  'Checking your area…'
                ) : safety.status === 'error' ? (
                  'Safety data unavailable'
                ) : (
                  'Enable location to check'
                )}
              </h3>
            </div>
          </div>
          <div className={clsx('text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm shrink-0', statusStyle.badge)}>
            RISK: {safetyData ? safetyData.riskLevel : '--'}
          </div>
        </button>

        {/* AI Tip Card */}
        <div className="w-full bg-primary/5 rounded-[16px] p-4 flex items-start border border-primary/20">
          <div className="mt-0.5 shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="ml-3">
            <h3 className="text-primary text-[13px] font-bold mb-1">AI Travel Tip</h3>
            <p className="text-text-secondary text-[12px] leading-relaxed">{tip}</p>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

export default HomeScreen;
