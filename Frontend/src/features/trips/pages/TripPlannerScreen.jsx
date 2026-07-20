import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowUpDown, Calendar, ChevronDown, 
  ShieldCheck, Clock, Car, Bike, Bus, Train, Footprints,
  Zap, CircleOff, AlertTriangle, CloudSun, Route, Sparkles
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { LABELS } from '../../../constants/labels';
import { ROUTES } from '../../../constants/routes';
import { TRAVEL_MODES, TRIP_TYPES, ROUTE_PREFERENCES, AI_RECOMMENDATION } from '../../../constants/mockTripData';
import { clsx } from 'clsx';

// Icon Map for dynamic icon rendering
const ICON_MAP = {
  Car, Bike, Bus, Train, Footprints, ShieldCheck, Zap, Clock, CircleOff, AlertTriangle
};

const TripPlannerScreen = () => {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    from: LABELS.TRIP_PLANNER.DEFAULTS.FROM,
    to: LABELS.TRIP_PLANNER.DEFAULTS.TO,
    date: LABELS.TRIP_PLANNER.DEFAULTS.DATE,
    time: '08:30 AM',
    returnDate: '',
    travelers: LABELS.TRIP_PLANNER.DEFAULTS.TRAVELERS
  });

  const [selectedMode, setSelectedMode] = useState(TRAVEL_MODES[0].id);
  const [tripType, setTripType] = useState(TRIP_TYPES[0].id);
  const [selectedPreference, setSelectedPreference] = useState(ROUTE_PREFERENCES[0].id);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleSwap = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAnalyze = () => {
    setIsAnalyzed(true);
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-background flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface sticky top-0 z-10 border-b border-border shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text-primary absolute left-1/2 -translate-x-1/2 tracking-wide">
          Plan Your Trip
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-[120px] pt-4 scrollbar-hide">
        
        {/* Travel Mode Selector */}
        <div className="mb-6">
          <label className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3 block">Travel Mode</label>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TRAVEL_MODES.map(mode => {
              const Icon = ICON_MAP[mode.icon];
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-2xl border transition-all active:scale-95 shrink-0",
                    isSelected 
                      ? "bg-primary border-primary shadow-md shadow-primary/20 text-white" 
                      : "bg-surface border-border text-text-secondary hover:border-primary/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form className="flex flex-col gap-5">
          
          {/* Trip Type Toggle */}
          <div className="flex bg-surface border border-border rounded-xl p-1">
            {TRIP_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setTripType(type.id)}
                className={clsx(
                  "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
                  tripType === type.id 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-text-secondary hover:bg-background"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* From & To Fields with Swap Button */}
          <div className="relative flex flex-col gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            {/* From */}
            <div className="flex flex-col gap-1.5 border-b border-border pb-3 relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">From</label>
              <input 
                type="text" 
                name="from"
                value={formData.from}
                onChange={handleChange}
                className="w-full bg-transparent border-none text-sm font-semibold text-text-primary placeholder:text-text-secondary outline-none pr-10"
              />
            </div>
            
            {/* To */}
            <div className="flex flex-col gap-1.5 pt-1 relative">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">To</label>
              <input 
                type="text" 
                name="to"
                value={formData.to}
                onChange={handleChange}
                className="w-full bg-transparent border-none text-sm font-semibold text-text-primary placeholder:text-text-secondary outline-none pr-10"
              />
            </div>

            {/* Swap Button */}
            <button 
              type="button"
              onClick={handleSwap}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-background rounded-full flex items-center justify-center text-primary hover:bg-primary/10 active:scale-95 transition-all border border-border shadow-sm z-10"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Date & Time Row */}
          <div className="flex gap-4">
            {/* Travel Date */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Departure Date</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-3 pr-10 text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Departure Time */}
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Departure Time</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-3 pr-10 text-xs font-semibold text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Return Date (Conditional) */}
          {tripType === 'round-trip' && (
            <div className="flex flex-col gap-1.5 transition-all">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Return Date</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="returnDate"
                  placeholder="Select return date"
                  value={formData.returnDate}
                  onChange={handleChange}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 pr-10 text-sm font-semibold text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              </div>
            </div>
          )}

          {/* Route Preferences */}
          <div className="mt-4">
            <label className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3 block">Route Preferences</label>
            
            <div className="flex flex-col gap-2.5">
              {ROUTE_PREFERENCES.map((pref) => {
                const isSelected = selectedPreference === pref.id;
                const Icon = ICON_MAP[pref.icon];
                
                return (
                  <button
                    type="button"
                    key={pref.id}
                    onClick={() => setSelectedPreference(pref.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-3.5 rounded-xl border transition-all active:scale-[0.98]",
                      isSelected 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "bg-surface border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isSelected ? "bg-primary text-white" : "bg-background text-text-secondary"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={clsx("text-[13px] font-semibold", isSelected ? "text-primary" : "text-text-primary")}>
                        {pref.label}
                      </span>
                    </div>
                    
                    {pref.recommended && isSelected && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-1 rounded-md">Recommended</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {!isAnalyzed ? (
            <Button 
              type="button"
              variant="primary"
              size="lg"
              onClick={handleAnalyze}
              className="w-full mt-6 py-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/25"
            >
              Analyze Route
            </Button>
          ) : (
            <div className="mt-6 flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
              {/* AI Recommendation Card */}
              <div className="bg-surface border border-primary/20 rounded-2xl p-5 shadow-lg shadow-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-4 -mt-4" />
                
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-primary text-sm">AI Route Insight</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
                  <div className="bg-background rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">Distance</p>
                    <p className="text-sm font-bold text-text-primary">{AI_RECOMMENDATION.distance}</p>
                  </div>
                  <div className="bg-background rounded-xl p-3 border border-border">
                    <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">Est. Time</p>
                    <p className="text-sm font-bold text-text-primary">{AI_RECOMMENDATION.estimatedTime}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 relative z-10 border-t border-border/50 pt-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-success mb-0.5">{AI_RECOMMENDATION.riskLevel}</p>
                      <p className="text-xs text-text-secondary font-medium">{AI_RECOMMENDATION.recommendedRoute}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 mt-1">
                    <CloudSun className="w-4 h-4 text-warning mt-0.5" />
                    <p className="text-xs text-text-secondary font-medium">{AI_RECOMMENDATION.weatherSummary}</p>
                  </div>
                </div>
              </div>

              <Button 
                type="button"
                variant="primary"
                size="lg"
                onClick={() => {
                  sessionStorage.setItem('isJourneyActive', 'true');
                  navigate(ROUTES.LIVE_TRACKING);
                }}
                className="w-full py-4 rounded-xl text-sm font-bold shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                <Route className="w-4 h-4" />
                Start Journey
              </Button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default TripPlannerScreen;
