import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, User, Search, Mic, 
  LocateFixed, ShieldAlert, Navigation,
  MapPin, Clock, Route, AlertTriangle, ShieldCheck, Layers, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import { MOCK_MAP_MARKERS, MOCK_ROUTE_DETAILS } from '../../../constants/mockMapData';
import { ROUTES } from '../../../constants/routes';

const LiveMapScreen = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  return (
    <div className="flex flex-col h-screen w-full bg-surface relative overflow-hidden">
      {/* Header - Absolute over Map */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-6 pb-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        {/* Increased mb-4 to mb-6 */}
        <div className="flex items-center justify-between mb-6 pointer-events-auto">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-surface/90 backdrop-blur-md rounded-full shadow-soft hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-md">Explore Map</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-surface/90 backdrop-blur-md rounded-full shadow-soft hover:bg-surface transition-colors">
              <Bell className="w-5 h-5 text-text-primary" />
            </button>
            <button className="p-2 bg-surface/90 backdrop-blur-md rounded-full shadow-soft hover:bg-surface transition-colors">
              <User className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-surface rounded-2xl px-4 py-3 shadow-lg border border-border/50 backdrop-blur-md pointer-events-auto">
          <Search className="w-5 h-5 text-text-secondary mr-3" />
          <input 
            type="text" 
            placeholder="Search destination..." 
            className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="p-2 -mr-2 hover:bg-background rounded-full transition-colors">
            <Mic className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Map Area (Full Screen) */}
      <div className="absolute inset-0 bg-[#F1F5F9] z-0 overflow-hidden pb-20">
        {/* Improved Map Background with subtle details */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
           {/* Parks / Water Overlays */}
           <path d="M 250,50 Q 300,100 350,50 T 400,150 L 400,0 L 250,0 Z" fill="#22C55E" opacity="0.08" />
           <path d="M 0,450 Q 100,400 150,500 T 0,600 Z" fill="#3B82F6" opacity="0.08" />
           <path d="M 100,200 Q 150,250 100,300 Q 50,250 100,200 Z" fill="#22C55E" opacity="0.08" />

           {/* Roads & Infrastructure */}
           <path d="M -50,150 Q 150,150 250,100 T 500,50" fill="none" stroke="#FFFFFF" strokeWidth="12" />
           <path d="M -50,300 Q 200,250 400,350" fill="none" stroke="#FFFFFF" strokeWidth="16" />
           <path d="M 180,0 L 220,600" fill="none" stroke="#FFFFFF" strokeWidth="14" />
           <path d="M 50,0 L 80,600" fill="none" stroke="#FFFFFF" strokeWidth="8" opacity="0.7" />
           
           {/* Navigation Route - Realistic curve connecting start (20%,65%) and end (75%,40%) */}
           {/* Start is ~ 80, 390. End is ~ 300, 240 */}
           <path d="M 80,390 Q 150,400 200,320 T 300,240" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 8" />
           <path d="M 80,390 Q 150,400 200,320 T 300,240" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
        </svg>



        {/* Safe Zone (Green Shield) */}
        <div className="absolute top-[40%] left-[75%] transform -translate-x-1/2 -translate-y-1/2 z-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-success/15 rounded-full pointer-events-none blur-[2px]" />
          <div className="relative z-10 bg-surface px-2.5 py-1 rounded-full shadow-sm text-[10px] font-bold text-success border border-success/20 flex items-center gap-1 mb-1.5 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3" />
            Safe Zone
          </div>
          <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center mx-auto border-2 border-success shadow-sm relative z-10">
             <ShieldCheck className="w-4 h-4 text-success" />
          </div>
        </div>
        
        {/* High Risk Zone (Red Danger) */}
        <div className="absolute top-[25%] left-[30%] transform -translate-x-1/2 -translate-y-1/2 z-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-danger/15 rounded-full pointer-events-none blur-[2px]" />
          <div className="relative z-10 bg-surface px-2.5 py-1 rounded-full shadow-sm text-[10px] font-bold text-danger border border-danger/20 flex items-center gap-1 mb-1.5 whitespace-nowrap">
            <ShieldAlert className="w-3 h-3" />
            High Risk
          </div>
          <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center mx-auto border-2 border-danger shadow-sm relative z-10">
             <ShieldAlert className="w-4 h-4 text-danger" />
          </div>
        </div>
        
        {/* Medium Risk Zone (Yellow Warning) */}
        <div className="absolute top-[55%] left-[60%] transform -translate-x-1/2 -translate-y-1/2 z-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-warning/15 rounded-full pointer-events-none blur-[2px]" />
          <div className="relative z-10 w-8 h-8 bg-surface rounded-full flex items-center justify-center border-2 border-warning shadow-sm">
             <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute left-4 bottom-28 bg-surface/90 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-border z-20">
          <div className="flex items-center gap-1.5 mb-3">
            <Info className="w-3.5 h-3.5 text-text-secondary" />
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Map Legend</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center border border-success/30">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
              </div>
              <span className="text-xs font-semibold text-text-primary">Safe Zone</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center border border-warning/30">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              </div>
              <span className="text-xs font-semibold text-text-primary">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center border border-danger/30">
                <ShieldAlert className="w-3.5 h-3.5 text-danger" />
              </div>
              <span className="text-xs font-semibold text-text-primary">High Risk</span>
            </div>
          </div>
        </div>

        {/* Floating Actions on Map */}
        <div className="absolute right-4 bottom-28 flex flex-col gap-3 z-20">
          <button className="w-11 h-11 bg-surface rounded-full shadow-lg flex items-center justify-center text-text-primary hover:text-primary transition-colors active:scale-95">
            <Layers className="w-5 h-5" />
          </button>
          <button className="w-11 h-11 bg-surface rounded-full shadow-lg flex items-center justify-center text-text-primary hover:text-primary transition-colors active:scale-95">
            <LocateFixed className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate(ROUTES.SOS_CONFIRM)}
            className="w-11 h-11 bg-danger rounded-full shadow-lg shadow-danger/30 flex items-center justify-center text-white hover:bg-red-600 transition-colors active:scale-95"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default LiveMapScreen;
