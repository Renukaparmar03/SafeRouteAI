import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Map as MapIcon, Bot, AlertTriangle, Briefcase, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/ui/Button';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import HomeBannerBg from '../../../assets/images/home-banner.png';

const HomeScreen = () => {
  const navigate = useNavigate();

  // Mock User Data
  const user = {
    name: 'Renuka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Renuka&backgroundColor=e5e7eb', // Simple placeholder avatar
    location: 'Mumbai, India',
  };

  const quickActions = [
    { id: 'map', label: 'Map', subtext: 'Explore Routes', icon: MapIcon, color: 'text-success', bg: 'bg-success/10', route: ROUTES.MAP },
    { id: 'ai', label: 'AI Assistant', subtext: 'Ask Anything', icon: Bot, color: 'text-primary', bg: 'bg-primary/10', route: ROUTES.ASSISTANT },
    { id: 'safety', label: 'Safety Check', subtext: 'Check Area Safety', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', route: ROUTES.SAFETY_CHECK },
    { id: 'trips', label: 'My Trips', subtext: 'View your trips', icon: Briefcase, color: 'text-secondary', bg: 'bg-secondary/10', route: ROUTES.MY_TRIPS },
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
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-text-primary text-[18px] font-bold">
                Hi, {user.name} 👋
              </h1>
              <div className="flex items-center mt-0.5 text-text-secondary">
                <MapPin className="w-3 h-3 mr-1" />
                <p className="text-[12px] font-medium">{user.location}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-full px-3 py-1.5 flex items-center shadow-sm border border-border/50 shrink-0">
              <span className="text-[12px] font-semibold text-text-primary">🌤️ 26°C</span>
            </div>
            <button className="relative p-2 text-text-primary hover:bg-black/5 rounded-full transition-colors active:scale-95">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white"></span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full mb-6">
          <div className="w-full bg-white rounded-[16px] flex items-center px-4 py-3 shadow-soft border border-border/50">
            <Search className="w-4 h-4 text-text-secondary mr-2" />
            <input 
              type="text" 
              placeholder="Search destination..." 
              className="flex-1 bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
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
              className="flex flex-col items-start bg-white p-4 rounded-[16px] shadow-soft border border-border/40 hover:shadow-md transition-shadow active:scale-95 text-left"
            >
              <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center mb-2.5`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <h3 className="text-text-primary text-[14px] font-bold mb-0.5">{action.label}</h3>
              <p className="text-text-secondary text-[11px] leading-tight">{action.subtext}</p>
            </button>
          ))}
        </div>

        {/* Safety Status Card */}
        <div className="w-full bg-[#ECFDF5] rounded-[16px] p-4 flex items-center justify-between shadow-sm border border-[#A7F3D0] mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(34,197,94,0.3)]">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-text-primary text-[12px] font-medium mb-0.5">Safety Status</p>
              <h3 className="text-text-primary text-[14px] font-bold">
                You are in <span className="text-success">Safe Zone</span>
              </h3>
            </div>
          </div>
          <div className="bg-success text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide shadow-sm">
            RISK: LOW
          </div>
        </div>

        {/* AI Tip Card */}
        <div className="w-full bg-primary/5 rounded-[16px] p-4 flex items-start border border-primary/20">
          <div className="mt-0.5 shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="ml-3">
            <h3 className="text-primary text-[13px] font-bold mb-1">AI Travel Tip</h3>
            <p className="text-text-secondary text-[12px] leading-relaxed">
              Weather is clear for the next 4 hours. It's a great time to start your planned trip to the National Park.
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
