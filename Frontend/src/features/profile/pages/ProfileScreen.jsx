import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, User, Phone, Map, MapPin, Settings, LogOut, ChevronRight } from 'lucide-react';
import { LABELS } from '../../../constants/labels';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import { ROUTES } from '../../../constants/routes';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const L = LABELS.PROFILE;

  const menuItems = [
    { id: 'personal', icon: User, label: L.MENU.PERSONAL_INFO },
    { id: 'emergency', icon: Phone, label: L.MENU.EMERGENCY_CONTACTS, badge: '3' },
    { id: 'history', icon: Map, label: L.MENU.TRAVEL_HISTORY },
    { id: 'saved', icon: MapPin, label: L.MENU.SAVED_PLACES },
    { id: 'settings', icon: Settings, label: L.MENU.SETTINGS },
    { id: 'logout', icon: LogOut, label: L.MENU.LOGOUT, isDanger: true },
  ];

  const handleLogout = () => {
    // In a real app, clear tokens/state here
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-surface flex flex-col font-sans overflow-hidden">
      
      {/* Top Header - Purple Background */}
      <div className="bg-primary pt-16 pb-24 px-6 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-[72px] h-[72px] rounded-full border-4 border-white/20 overflow-hidden shrink-0">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Renuka&backgroundColor=e5e7eb" 
              alt="Profile" 
              className="w-full h-full object-cover bg-white"
            />
          </div>
          {/* User Info */}
          <div>
            <h1 className="text-[20px] font-bold text-white mb-0.5">
              {L.USER.NAME}
            </h1>
            <p className="text-[13px] text-white/80">
              {L.USER.EMAIL}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content - Overlapping White Card */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 relative z-10 px-5 pt-8 pb-28 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] overflow-y-auto">
        
        <div className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <button 
                onClick={item.id === 'logout' ? handleLogout : undefined}
                className="w-full flex items-center justify-between py-4 group active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <item.icon 
                    className={`w-5 h-5 ${item.isDanger ? 'text-danger' : 'text-text-secondary group-hover:text-primary transition-colors'}`} 
                    strokeWidth={2}
                  />
                  <span className={`text-[15px] font-semibold ${item.isDanger ? 'text-danger' : 'text-text-primary'}`}>
                    {item.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Badge */}
                  {item.badge && (
                    <div className="w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </div>
                  )}
                  {/* Chevron */}
                  <ChevronRight className="w-5 h-5 text-text-secondary/50" />
                </div>
              </button>

              {/* Separator Line */}
              {index < menuItems.length - 1 && (
                <div className="h-[1px] w-full bg-border/40 my-1"></div>
              )}
            </React.Fragment>
          ))}
        </div>

      </div>

      <BottomNavBar />
    </div>
  );
};

export default ProfileScreen;
