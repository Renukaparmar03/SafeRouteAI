import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, SlidersHorizontal, MapPin, 
  Calendar, Users, Car, Clock, MoreVertical,
  ShieldCheck, Route, FileText, Navigation, ArrowRight,
  Luggage
} from 'lucide-react';
import { clsx } from 'clsx';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import Button from '../../../components/ui/Button';
import { MOCK_TRIPS, TRIP_TABS } from '../../../constants/mockMyTripsData';
import { ROUTES } from '../../../constants/routes';

const MyTripsScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');

  const filteredTrips = MOCK_TRIPS.filter(trip => trip.status === activeTab);

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface z-20">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text-primary tracking-wide">
          My Trips
        </h1>
        <button className="p-2 -mr-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface px-2 border-b border-border shadow-sm z-10">
        {TRIP_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors relative",
                isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-[100px] scrollbar-hide">
        {filteredTrips.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="bg-surface rounded-2xl p-4 shadow-sm border border-border">
                
                <div className="flex gap-4">
                  {/* Left: Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                    <img src={trip.image} alt="Destination" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Clock className="w-3 h-3 text-primary" />
                      <span className="text-[9px] font-bold text-text-primary">{trip.eta}</span>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 text-text-primary font-bold text-[14px] truncate">
                        <span className="truncate">{trip.source}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <button className="p-1 -mr-2 text-text-secondary">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-1">
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{trip.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{trip.travelers}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <Car className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{trip.mode}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-secondary">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{trip.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk / Insights Badge */}
                {(activeTab === 'upcoming' || activeTab === 'ongoing' || activeTab === 'completed') && (
                  <div className={clsx(
                    "mt-4 rounded-xl p-3 flex items-start gap-3 border",
                    trip.riskLevel === 'Low Risk' || trip.riskLevel === 'Safe' ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
                  )}>
                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                      <ShieldCheck className={clsx(
                        "w-5 h-5 mb-0.5",
                        trip.riskLevel === 'Low Risk' || trip.riskLevel === 'Safe' ? "text-success" : "text-warning"
                      )} />
                      <span className={clsx(
                        "text-[10px] font-bold",
                        trip.riskLevel === 'Low Risk' || trip.riskLevel === 'Safe' ? "text-success" : "text-warning"
                      )}>{trip.riskScore}</span>
                    </div>
                    <div className="border-l border-black/10 pl-3">
                      <ul className="flex flex-col gap-1">
                        {trip.aiInsights.map((insight, idx) => (
                          <li key={idx} className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-text-secondary opacity-50" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="flex-1 py-2 text-[12px] rounded-lg border-border/80 text-text-secondary hover:text-text-primary"
                  >
                    View Details
                  </Button>
                  
                  {activeTab === 'upcoming' && (
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        sessionStorage.setItem('isJourneyActive', 'true');
                        navigate(ROUTES.LIVE_TRACKING);
                      }}
                      className="flex-1 py-2 text-[12px] rounded-lg gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Start Journey
                    </Button>
                  )}
                  {activeTab === 'ongoing' && (
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        sessionStorage.setItem('isJourneyActive', 'true');
                        navigate(ROUTES.LIVE_TRACKING);
                      }}
                      className="flex-1 py-2 text-[12px] rounded-lg gap-1.5"
                    >
                      <Route className="w-3.5 h-3.5" /> Continue
                    </Button>
                  )}
                  {activeTab === 'completed' && (
                    <Button variant="primary" className="flex-1 py-2 text-[12px] rounded-lg gap-1.5 bg-text-primary hover:bg-text-primary/90 text-white shadow-none">
                      <FileText className="w-3.5 h-3.5" /> Summary
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 pb-10 px-4 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-5 border border-primary/10">
              <Luggage className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-[16px] font-bold text-text-primary mb-2">No trips found</h3>
            <p className="text-[12px] text-text-secondary font-medium mb-6 max-w-[220px]">
              Plan your next trip with SafeRoute AI to get smart routes and real-time safety updates.
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate(ROUTES.TRIP_PLANNER)}
              className="py-3 px-8 rounded-xl text-[13px] shadow-lg shadow-primary/20"
            >
              Plan a Trip
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

export default MyTripsScreen;
