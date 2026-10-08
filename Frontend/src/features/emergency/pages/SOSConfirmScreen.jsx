import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LABELS } from '../../../constants/labels';
import { ROUTES } from '../../../constants/routes';
import Button from '../../../components/ui/Button';
import { LoadingState } from '../../../components/common/StateViews';
import { emergencyService } from '../../../services/emergencyService';
import { useSocketEvent } from '../../../context/NotificationContext';
import { formatCoords, formatDateTime } from '../../../utils/format';

const SOSConfirmScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const L = LABELS.SOS_CONFIRM;
  const L_EMERGENCY = LABELS.EMERGENCY.TYPES;

  const [sos, setSos] = useState(location.state?.result?.sos || null);
  const [contacts] = useState(location.state?.result?.contacts || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  // Opened directly (e.g. after a refresh): show the user's active SOS, if any.
  useEffect(() => {
    if (location.state?.result) return;
    emergencyService
      .activeSos()
      .then((active) => {
        if (!active) navigate(ROUTES.EMERGENCY, { replace: true });
        else setSos(active);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [location.state, navigate]);

  // The response team can resolve the SOS from the admin portal.
  useSocketEvent('sos:updated', (updated) => {
    if (updated.id === sos?.id) setSos(updated);
  });

  const selectedType = location.state?.type || sos?.meta?.emergencyType;

  const getEmergencyTypeLabel = (id) => {
    switch (id) {
      case 'health': return L_EMERGENCY.HEALTH;
      case 'police': return L_EMERGENCY.POLICE;
      case 'ambulance': return L_EMERGENCY.AMBULANCE;
      case 'fire': return L_EMERGENCY.FIRE;
      case 'vehicle': return L_EMERGENCY.VEHICLE;
      case 'women_safety': return L_EMERGENCY.WOMEN_SAFETY;
      case 'disaster': return L_EMERGENCY.DISASTER;
      default: return L_EMERGENCY.OTHERS;
    }
  };

  const handleCancel = async () => {
    if (!sos || sos.status !== 'active') {
      navigate(ROUTES.HOME);
      return;
    }
    if (!window.confirm('Cancel this SOS? The response team will be told you are safe.')) return;
    setCancelling(true);
    setError('');
    try {
      await emergencyService.cancelSos(sos.id);
      navigate(ROUTES.HOME, { replace: true });
    } catch (err) {
      setError(err.message);
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <LoadingState label="Loading SOS status…" />
      </div>
    );
  }

  const displayType = getEmergencyTypeLabel(selectedType);
  const isActive = sos?.status === 'active';
  const address = sos?.meta?.address;
  const contactCount = contacts?.length ?? sos?.meta?.contacts?.length ?? 0;
  const smsConfigured = sos?.meta?.smsConfigured;

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
          {isActive && (
            <>
              {/* Outer Pulse 2 */}
              <div className="absolute w-[240px] h-[240px] rounded-full bg-danger/5 animate-ping" style={{ animationDuration: '2s' }}></div>
              {/* Outer Pulse 1 */}
              <div className="absolute w-[180px] h-[180px] rounded-full bg-danger/10 animate-pulse"></div>
            </>
          )}
          {/* Inner Solid Circle */}
          <div className={`relative w-[130px] h-[130px] rounded-full flex items-center justify-center shadow-lg z-10 ${isActive ? 'bg-danger shadow-danger/40' : 'bg-success shadow-success/40'}`}>
            <span className="text-white text-[32px] font-black tracking-widest">
              SOS
            </span>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-10 px-2">
          <h2 className="text-[20px] font-bold text-text-primary mb-2">
            {isActive ? L.HEADING : sos?.status === 'resolved' ? 'SOS resolved' : 'SOS closed'}
          </h2>
          <p className="text-[14px] text-text-secondary leading-relaxed">
            {isActive ? L.SUBHEADING : 'The response team has closed this SOS.'}
          </p>
        </div>

        {/* Details Card */}
        <div className="w-full bg-surface border border-border/50 rounded-[20px] p-5 flex flex-col gap-4 shadow-sm mb-6">

          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">{L.DETAILS.TYPE}</span>
            <span className="text-[13px] font-bold text-text-primary">{displayType}</span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-[13px] text-text-secondary shrink-0">{L.DETAILS.LOCATION}</span>
            <span className="text-[13px] font-bold text-text-primary text-right">
              {address || formatCoords(sos?.latitude, sos?.longitude)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[13px] text-text-secondary">{L.DETAILS.TIME}</span>
            <span className="text-[13px] font-bold text-text-primary">{formatDateTime(sos?.createdAt)}</span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-[13px] text-text-secondary shrink-0">Contacts</span>
            <span className="text-[12px] font-semibold text-text-primary text-right">
              {contactCount === 0
                ? 'No emergency contacts saved'
                : smsConfigured
                  ? `${contactCount} contact(s) being messaged`
                  : `${contactCount} contact(s) on file — SMS not configured, please call them`}
            </span>
          </div>

        </div>

        {error && <p className="text-[12px] text-danger font-semibold mb-4 text-center">{error}</p>}

        <a href="tel:112" className="text-[14px] font-bold text-danger underline">Call 112 (Emergency)</a>

      </div>

      {/* Fixed Bottom Button */}
      <div className="px-5 pb-8 pt-2 shrink-0 bg-white">
        <Button
          variant="outline"
          size="lg"
          onClick={handleCancel}
          isLoading={cancelling}
          className="w-full py-4 rounded-[16px] border-danger text-danger hover:bg-danger/5 text-[15px] font-bold transition-all"
        >
          {isActive ? L.CANCEL_BUTTON : 'Back to Home'}
        </Button>
      </div>

    </div>
  );
};

export default SOSConfirmScreen;
