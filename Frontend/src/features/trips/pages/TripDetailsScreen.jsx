import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle } from 'lucide-react';
import { LABELS } from '../../../constants/labels';
import Button from '../../../components/ui/Button';
import MapRouteBg from '../../../assets/images/map-route-bg.png';

const TripDetailsScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-surface flex flex-col font-sans overflow-hidden">
      
      {/* Map Background (Top Half) */}
      <div className="absolute top-0 left-0 w-full h-[65%] z-0">
        <img 
          src={MapRouteBg} 
          alt="Route Map" 
          className="w-full h-full object-cover"
        />
        {/* Route Details Overlay on Map */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] bg-primary text-white px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-md z-10 whitespace-nowrap">
          {LABELS.TRIP_DETAILS.DEFAULTS.DURATION}
        </div>
      </div>

      {/* Bottom Sheet Card */}
      <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[24px] shadow-[0_-8px_20px_rgba(0,0,0,0.06)] z-20 flex flex-col h-[55%]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-[16px] font-bold text-text-primary">
            {LABELS.TRIP_DETAILS.TITLE}
          </h2>
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full text-text-secondary hover:bg-black/5 active:scale-95 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          
          {/* Route Text */}
          <div className="mb-5">
            <h3 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
              Indore <span className="text-text-secondary text-[14px]">→</span> Manali
            </h3>
            <p className="text-[12px] text-text-secondary mt-1">
              24 May 2025 &bull; 2 Travelers
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Distance */}
            <div className="bg-surface rounded-[12px] p-3 flex flex-col justify-center border border-border/50 shadow-sm">
              <span className="text-[11px] text-text-secondary mb-1">{LABELS.TRIP_DETAILS.DISTANCE}</span>
              <span className="text-[14px] font-bold text-text-primary">{LABELS.TRIP_DETAILS.DEFAULTS.DISTANCE}</span>
            </div>
            
            {/* Duration */}
            <div className="bg-surface rounded-[12px] p-3 flex flex-col justify-center border border-border/50 shadow-sm">
              <span className="text-[11px] text-text-secondary mb-1">{LABELS.TRIP_DETAILS.DURATION}</span>
              <span className="text-[14px] font-bold text-text-primary">{LABELS.TRIP_DETAILS.DEFAULTS.DURATION}</span>
            </div>
            
            {/* Risk Level */}
            <div className="bg-surface rounded-[12px] p-3 flex flex-col justify-center border border-border/50 shadow-sm">
              <span className="text-[11px] text-text-secondary mb-1">{LABELS.TRIP_DETAILS.RISK_LEVEL}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-[14px] font-bold text-warning">{LABELS.TRIP_DETAILS.DEFAULTS.RISK}</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-surface rounded-[16px] p-4 border border-border/50 mb-6 shadow-sm">
            <h4 className="text-[12px] font-bold text-text-primary mb-1.5">
              {LABELS.TRIP_DETAILS.AI_RECOMMENDATION_TITLE}
            </h4>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              {LABELS.TRIP_DETAILS.AI_RECOMMENDATION_TEXT}
            </p>
          </div>

          {/* Start Journey Button */}
          <Button 
            variant="primary"
            size="lg"
            className="w-full py-4 rounded-[14px] text-[15px] font-bold shadow-lg shadow-primary/25"
          >
            {LABELS.TRIP_DETAILS.START_BUTTON}
          </Button>

        </div>
      </div>
    </div>
  );
};

export default TripDetailsScreen;
