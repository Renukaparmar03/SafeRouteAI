import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Navigation, MapPin, AlertTriangle, ShieldCheck, Clock, ShieldAlert, ChevronUp, ChevronDown
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import { ROUTES } from '../../../constants/routes';
import { MOCK_ROUTE_DETAILS } from '../../../constants/mockMapData';

const LiveTrackingScreen = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const isJourneyActive = sessionStorage.getItem('isJourneyActive') === 'true';

  if (!isJourneyActive) {
    return (
      <div className="flex flex-col h-screen w-full bg-surface relative overflow-hidden font-sans">
        <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface z-20 border-b border-border shadow-sm">
          <button onClick={() => navigate(ROUTES.HOME)} className="p-2 -ml-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-[16px] font-bold text-text-primary">Live Tracking</h1>
          <div className="w-10"></div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Navigation className="w-8 h-8 text-primary opacity-50" />
          </div>
          <h2 className="text-[18px] font-bold text-text-primary mb-2">Live Tracking is not available</h2>
          <p className="text-[13px] text-text-secondary font-medium mb-8">
            Start a journey from the Trip Planner or My Trips to begin live tracking.
          </p>
          <Button 
            variant="primary"
            onClick={() => navigate(ROUTES.TRIP_PLANNER)}
            className="w-full py-3.5 rounded-xl font-bold"
          >
            Plan a Trip
          </Button>
        </div>

        <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-[#e5e9ea] flex flex-col font-sans overflow-hidden">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 pt-6 z-20 flex flex-col gap-3 pointer-events-none">
        <div className="flex justify-between items-center w-full pointer-events-auto">
          <button 
            onClick={() => navigate(ROUTES.HOME)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          
          <h1 className="text-lg font-bold text-text-primary bg-white/90 backdrop-blur-md px-5 py-2 rounded-full shadow-soft">
            Live Tracking
          </h1>

          <button 
            onClick={() => navigate(ROUTES.EMERGENCY)}
            className="w-10 h-10 rounded-full bg-danger flex items-center justify-center shadow-lg shadow-danger/40 active:scale-95 transition-all animate-pulse"
          >
            <ShieldAlert className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Compact Trip Info Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border pointer-events-auto mx-auto w-full max-w-sm mt-2">
          <div className="relative">
            <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-border border-dashed border-l-2" />
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
               <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                 <div className="w-2 h-2 bg-primary rounded-full" />
               </div>
               <div className="flex-1">
                 <p className="text-[10px] font-bold text-text-secondary uppercase">From</p>
                 <p className="text-sm font-semibold text-text-primary truncate">Current Location</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center shrink-0 border border-danger/20">
                 <MapPin className="w-3 h-3 text-danger" />
               </div>
               <div className="flex-1">
                 <p className="text-[10px] font-bold text-text-secondary uppercase">To</p>
                 <p className="text-sm font-semibold text-text-primary truncate">{MOCK_ROUTE_DETAILS.destination}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Map Area (Background) */}
      <div className="absolute inset-0 z-0 bg-[#F1F5F9]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
           {/* Parks / Water Overlays */}
           <path d="M 250,50 Q 300,100 350,50 T 400,150 L 400,0 L 250,0 Z" fill="#22C55E" opacity="0.08" />
           {/* Roads */}
           <path d="M 100,228 Q 200,250 300,192" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 8" />
           <path d="M 100,228 Q 200,250 300,192" fill="none" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
        </svg>

        {/* Live User Location Pin */}
        <div className="absolute top-[38%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="w-14 h-14 bg-primary/20 rounded-full animate-ping absolute -inset-3" />
            <div className="w-8 h-8 bg-primary rounded-full shadow-lg flex items-center justify-center border-2 border-surface relative z-10">
              <Navigation className="w-4 h-4 text-white" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Destination Marker */}
        <div className="absolute top-[32%] left-[75%] transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-8 h-8 bg-danger rounded-full shadow-lg flex items-center justify-center border-2 border-surface">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      {/* Bottom Information Card (Journey Progress) */}
      <div className="absolute bottom-[80px] left-0 w-full z-20">
        <div className="bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-white/50 transition-all duration-300">
          
          {/* Pull Tab / Header */}
          <div 
            className="w-full flex flex-col items-center cursor-pointer mb-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mb-4" />
          </div>

          <div 
            className="flex justify-between items-start cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div>
              <h2 className="text-[22px] font-black text-text-primary mb-1">12 min <span className="text-[14px] text-text-secondary font-medium">ETA</span></h2>
              <p className="text-[14px] font-bold text-text-secondary flex items-center gap-1">
                <Navigation className="w-4 h-4 text-primary" /> 4.2 km remaining
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="text-[11px] font-bold text-success uppercase">Safe Route</span>
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 m-0'}`}>
            <div className="space-y-3 mb-6">
            {/* Live Progress */}
            <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-text-secondary uppercase font-bold">Next Turn</p>
                <p className="text-[13px] font-bold text-text-primary truncate">In 300m, Turn left onto MG Road</p>
              </div>
            </div>
            
            {/* Safety Alerts */}
            <div className="flex items-center gap-3 bg-danger/5 p-3 rounded-xl border border-danger/20">
              <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-danger" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-danger uppercase font-bold">Live Alert</p>
                <p className="text-[12px] font-medium text-text-primary">Approaching low-lit area in 500m</p>
              </div>
            </div>
          </div>

            <Button 
              variant="outline" 
              onClick={() => {
                sessionStorage.removeItem('isJourneyActive');
                navigate(ROUTES.HOME);
              }}
              className="w-full py-3.5 text-[14px] font-bold border-danger/50 text-danger hover:bg-danger/10"
            >
              Stop Navigation
            </Button>
          </div>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
};

export default LiveTrackingScreen;
