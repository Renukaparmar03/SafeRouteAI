import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LABELS } from '../../../constants/labels';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/ui/Button';

const SOSConfirmScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const L = LABELS.SOS_CONFIRM;
  const L_EMERGENCY = LABELS.EMERGENCY.TYPES;

  const selectedType = location.state?.type;
  
  const getEmergencyTypeLabel = (id) => {
    switch (id) {
      case 'health': return L_EMERGENCY.HEALTH;
      case 'police': return L_EMERGENCY.POLICE;
      case 'ambulance': return L_EMERGENCY.AMBULANCE;
      case 'fire': return L_EMERGENCY.FIRE;
      case 'vehicle': return L_EMERGENCY.VEHICLE;
      case 'women_safety': return L_EMERGENCY.WOMEN_SAFETY;
      case 'disaster': return L_EMERGENCY.DISASTER;
      case 'others': return L_EMERGENCY.OTHERS;
      default: return L.DEFAULTS.TYPE;
    }
  };

  const displayType = getEmergencyTypeLabel(selectedType);

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-white flex flex-col font-sans overflow-hidden">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 flex flex-col items-center">
        
        {/* Title */}
        <h1 className="text-[18px] font-bold text-text-primary mb-12">
          {L.TITLE}
        </h1>

        {/* Pulsing SOS Circle */}
        <div className="relative flex items-center justify-center mb-16">
          {/* Outer Pulse 2 */}
          <div className="absolute w-[240px] h-[240px] rounded-full bg-danger/5 animate-ping" style={{ animationDuration: '2s' }}></div>
          {/* Outer Pulse 1 */}
          <div className="absolute w-[180px] h-[180px] rounded-full bg-danger/10 animate-pulse"></div>
          {/* Inner Solid Circle */}
          <div className="relative w-[130px] h-[130px] rounded-full bg-danger flex items-center justify-center shadow-lg shadow-danger/40 z-10">
            <span className="text-white text-[32px] font-black tracking-widest">
              SOS
            </span>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-10 px-2">
          <h2 className="text-[20px] font-bold text-text-primary mb-2">
            {L.HEADING}
          </h2>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            {L.SUBHEADING}
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full bg-surface border border-border/50 rounded-[20px] p-5 flex flex-col gap-4 shadow-sm mb-6">
          
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">{L.DETAILS.TYPE}</span>
            <span className="text-[13px] font-bold text-text-primary">{displayType}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">{L.DETAILS.LOCATION}</span>
            <span className="text-[13px] font-bold text-text-primary">{L.DEFAULTS.LOCATION}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">{L.DETAILS.TIME}</span>
            <span className="text-[13px] font-bold text-text-primary">{L.DEFAULTS.TIME}</span>
          </div>

        </div>

      </div>

      {/* Fixed Bottom Button */}
      <div className="px-5 pb-8 pt-2 shrink-0 bg-white">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate(ROUTES.HOME)}
          className="w-full py-4 rounded-[16px] border-danger text-danger hover:bg-danger/5 text-[15px] font-bold transition-all"
        >
          {L.CANCEL_BUTTON}
        </Button>
      </div>

    </div>
  );
};

export default SOSConfirmScreen;
