import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, AlertTriangle, 
  CloudSun, Navigation, Sparkles, MapPin,
  Info, Map, AlertCircle, Car, Cross, 
  Shield, Pill, Fuel, Thermometer, Droplets, ArrowRight
} from 'lucide-react';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import Button from '../../../components/ui/Button';
import { SAFETY_MOCK_DATA } from '../../../constants/mockSafetyData';

const ICON_MAP = {
  Map, AlertCircle, Car, Cross, Shield, Pill, Fuel
};

const CircularProgress = ({ score, status }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-success/20"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-success transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-black text-success leading-none">{score}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-success uppercase tracking-wider mt-1.5 bg-white px-2 py-0.5 rounded-full shadow-sm">{status}</span>
    </div>
  );
};

const SafetyCheckScreen = () => {
  const navigate = useNavigate();
  const data = SAFETY_MOCK_DATA;

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-background flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 bg-surface sticky top-0 z-20 border-b border-border shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-black/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-bold text-text-primary absolute left-1/2 -translate-x-1/2 tracking-wide">
          Safety Check
        </h1>
        <div className="w-10"></div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[120px] scrollbar-hide">
        
        {/* Main Status Card */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-5 mb-6 relative overflow-hidden shadow-sm flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center shadow-lg shadow-success/30">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-success uppercase tracking-wider mb-0.5">Current Area Status</p>
                <h2 className="text-[18px] font-black text-text-primary">{data.currentStatus.label}</h2>
              </div>
            </div>
            
            <CircularProgress score={data.currentStatus.score} status={data.currentStatus.statusLevel} />
          </div>
          
          <p className="text-[13px] font-medium text-text-secondary leading-relaxed relative z-10 bg-white/60 p-3 rounded-xl border border-success/10">
            {data.currentStatus.description}
          </p>
        </div>

        {/* Today's Safety Summary */}
        <div className="mb-6">
          <h3 className="text-[14px] font-bold text-text-primary mb-3">Today's Safety Forecast</h3>
          <div className="grid grid-cols-4 gap-2">
            {data.dailySummary.map(slot => (
              <div key={slot.id} className="bg-surface border border-border rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">{slot.time}</span>
                <div className={`w-full py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${slot.color}`}>
                  {slot.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-primary text-[14px]">AI Safety Advice</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {data.aiRecommendations.map(rec => {
              const Icon = ICON_MAP[rec.icon] || Info;
              return (
                <div key={rec.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-primary/10 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-[13px] text-text-primary font-medium leading-relaxed">{rec.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Grid: Weather & Alerts */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Weather */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <CloudSun className="w-4 h-4 text-warning" />
              </div>
              <span className="text-[12px] font-bold text-text-primary">Weather</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-secondary font-medium">Condition</span>
                <span className="text-[11px] text-text-primary font-bold">{data.weatherSummary.condition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1"><Thermometer className="w-3 h-3"/> Temp</span>
                <span className="text-[11px] text-text-primary font-bold">{data.weatherSummary.temperature}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1"><Droplets className="w-3 h-3"/> Rain</span>
                <span className="text-[11px] text-text-primary font-bold">{data.weatherSummary.rainProbability}</span>
              </div>
            </div>
          </div>

          {/* Road Alerts */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
             <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-danger" />
              </div>
              <span className="text-[12px] font-bold text-text-primary">Road Alerts</span>
            </div>
            <div className="mt-auto">
              <p className="text-[18px] font-black text-danger mb-1">{data.roadAlertsSummary.count}</p>
              <p className="text-[11px] text-text-secondary font-medium leading-snug">
                {data.roadAlertsSummary.shortSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Nearby Risk Zones */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-text-primary">Nearby Risk Zones</h3>
            <span className="text-[11px] font-bold text-danger bg-danger/10 px-2 py-1 rounded-md">{data.riskZones.length} Detected</span>
          </div>
          
          <div className="flex flex-col gap-3">
            {data.riskZones.map((zone) => (
              <div key={zone.id} className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[13px] font-bold text-text-primary">{zone.name}</h4>
                      <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1"><MapPin className="w-3 h-3"/> {zone.distance}</span>
                    </div>
                    <p className="text-[11px] text-danger font-bold mb-1">{zone.type}</p>
                    <p className="text-[11px] text-text-secondary font-medium flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      {zone.reason}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full py-2 text-[11px] h-auto rounded-lg border-border/80 flex items-center justify-center gap-1.5">
                  <Map className="w-3.5 h-3.5" /> View on Map
                </Button>
              </div>
            ))}
          </div>
        </div>



      </div>

      {/* Bottom Navigation */}
      <BottomNavBar />
    </div>
  );
};

export default SafetyCheckScreen;
