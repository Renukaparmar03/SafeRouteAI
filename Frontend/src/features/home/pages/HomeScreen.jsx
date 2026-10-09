import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Bell, Search, MapPin, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/ui/Button';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import HomeBannerBg from '../../../assets/images/home-banner-real.jpg';
import CardMapImg from '../../../assets/images/card-map-compass.jpg';
import CardAiImg from '../../../assets/images/card-ai-traveler.jpg';
import CardSafetyImg from '../../../assets/images/card-safety-sign.jpg';
import CardTripsImg from '../../../assets/images/card-trips-notebook.jpg';
import TipBgMountain from '../../../assets/images/tip-bg-mountain.jpg';
import AppLogo from '../../../assets/images/logo.png';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { useCurrentLocation } from '../../../hooks/useGeolocation';
import { mapService } from '../../../services/mapService';
import { safetyService } from '../../../services/riskService';
import PlaceSuggestions, { usePlaceSearch } from '../../../components/common/PlaceSuggestions';
import { formatCoords } from '../../../utils/format';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useCurrentLocation('if-granted');
  const position = location.position;
  const [placeName, setPlaceName] = useState(null);
  const [safety, setSafety] = useState({ status: 'idle', data: null });
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const suggestions = usePlaceSearch(search, { enabled: searchFocused, near: position });

  const firstName = user?.name?.split(' ')[0] || 'Renuka';

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
        : 'Indore City, Indore';

  const safetyData = safety.data;

  const handleSelectPlace = (place) => {
    setSearch(place.name);
    setSearchFocused(false);
    navigate(ROUTES.MAP, { state: { destination: place } });
  };

  const quickActions = [
    {
      id: 'map',
      label: 'Map',
      subtext: 'Explore nearby places and safe routes',
      image: CardMapImg,
      route: ROUTES.MAP
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      subtext: 'Ask anything about your trip',
      image: CardAiImg,
      route: ROUTES.ASSISTANT
    },
    {
      id: 'safety',
      label: 'Safety Check',
      subtext: 'Check your safety status & surroundings',
      image: CardSafetyImg,
      route: ROUTES.SAFETY_CHECK
    },
    {
      id: 'trips',
      label: 'My Trips',
      subtext: 'View your trips, plans and history',
      image: CardTripsImg,
      route: ROUTES.MY_TRIPS
    },
  ];

  return (
    <div
      className="relative w-full h-screen max-w-md mx-auto flex flex-col font-sans overflow-hidden bg-[#F8FAFC]"
    >

      {/* Perfect Soft Brand Theme Header Container */}
      <div className="w-full bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#EEF2FF] px-5 pt-5 pb-3.5 flex items-center justify-between border-b border-indigo-100/90 shadow-sm shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] overflow-hidden shadow-sm border border-indigo-200/80 shrink-0 bg-slate-900 flex items-center justify-center">
            <img src={AppLogo} alt="SafeRoute AI Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-slate-900 text-[16px] font-bold tracking-tight capitalize leading-tight">
              {firstName}
            </h1>
            <button
              type="button"
              onClick={() => !position && location.request().catch(() => {})}
              className="flex items-center mt-0.5 text-slate-600 text-left hover:text-slate-800 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-[#5054EF]" />
              <p className="text-[11.5px] font-medium text-slate-600 truncate max-w-[170px]">{locationText}</p>
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(ROUTES.ALERTS)}
          aria-label={`Alerts${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          className="relative p-2 bg-white text-slate-700 hover:bg-slate-50 rounded-full shadow-sm border border-indigo-100 transition-all active:scale-95"
        >
          <Bell className="w-4.5 h-4.5 text-slate-700" />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-5 pt-4">

        {/* Search Bar */}
        <div className="w-full mb-4 relative z-30">
          <div className="w-full bg-white rounded-full flex items-center px-4 py-3 shadow-sm border border-slate-200/80">
            <Search className="w-4.5 h-4.5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && suggestions.results[0] && handleSelectPlace(suggestions.results[0])}
              className="flex-1 bg-transparent text-[13.5px] text-slate-800 outline-none placeholder:text-slate-400 font-normal"
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
        <div className="relative w-full rounded-[22px] overflow-hidden shadow-sm mb-4 bg-slate-900 min-h-[175px] flex flex-col justify-center">
          <img
            src={HomeBannerBg}
            alt="Plan Your Trip"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
          <div className="relative z-10 p-5 pt-6">
            <h2 className="text-white text-[22px] font-bold mb-1.5 tracking-tight">Plan Your Trip</h2>
            <p className="text-gray-100 text-[12.5px] font-normal leading-snug mb-4 max-w-[220px] opacity-95">
              Get a safer journey, better routes, and travel with confidence.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.TRIP_PLANNER)}
              className="bg-[#5054EF] hover:bg-[#4347E2] text-white rounded-full px-5 py-2.5 text-[13px] font-semibold shadow-md h-auto inline-flex items-center gap-1.5 border-0 w-auto"
            >
              Plan Trip <ArrowRight className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Quick Actions (2x2 Grid with Reference Photo Backgrounds) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.route)}
              className="group relative flex flex-col justify-end p-4 rounded-[20px] overflow-hidden border border-black/5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left w-full h-[140px] bg-slate-900"
            >
              <img
                src={action.image}
                alt={action.label}
                className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

              <div className="relative z-10">
                <h3 className="text-white text-[15px] font-bold tracking-tight mb-0.5">{action.label}</h3>
                <p className="text-gray-200 text-[11px] font-normal leading-tight opacity-90">{action.subtext}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Safety Status Card */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.SAFETY_CHECK)}
          className="w-full rounded-[18px] p-4 flex items-center justify-between shadow-sm border border-red-200/80 bg-gradient-to-r from-[#FFF0F0] via-[#FFEBEB] to-[#FFDADA] relative overflow-hidden mb-3.5 text-left transition-all hover:shadow-md"
        >
          {/* Subtle background location watermark */}
          <MapPin className="absolute -right-3 -bottom-3 w-24 h-24 text-red-500/10 pointer-events-none" />

          <div>
            <p className="text-red-500 text-[10px] font-bold tracking-wider uppercase mb-0.5">SAFETY STATUS</p>
            <h3 className="text-slate-900 text-[13.5px] font-semibold">
              You are in <span className="text-red-600 font-bold">High-Risk Zone</span>
            </h3>
          </div>

          <div className="bg-red-500/15 text-red-600 hover:bg-red-500/25 px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 z-10">
            View Details <ArrowRight className="w-3 h-3" />
          </div>
        </button>

        {/* AI Travel Tip Card */}
        <div className="relative w-full rounded-[20px] p-4.5 overflow-hidden shadow-sm border border-blue-200/60 bg-gradient-to-r from-[#EBF3FF] via-[#E8F1FF] to-[#DCEBFF] min-h-[105px] flex flex-col justify-center">
          <img
            src={TipBgMountain}
            alt="Mountains"
            className="absolute inset-y-0 right-0 w-2/3 h-full object-cover opacity-35 mix-blend-multiply"
          />
          
          <div className="relative z-10 max-w-[85%]">
            <h3 className="text-[#1E1B4B] text-[15px] font-bold mb-1">AI Travel Tip</h3>
            <p className="text-slate-600 text-[11.5px] font-normal leading-snug">
              Keep your phone charged, share your live location and avoid isolated areas at night.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

export default HomeScreen;


