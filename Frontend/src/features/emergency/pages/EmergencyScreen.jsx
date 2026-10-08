import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartPulse, Shield, Ambulance, Flame, Car, ShieldAlert, CloudRain, MoreHorizontal, Phone, MapPin } from 'lucide-react';
import { LABELS } from '../../../constants/labels';
import { ROUTES } from '../../../constants/routes';
import { clsx } from 'clsx';
import Modal from '../../../components/common/Modal';
import { Spinner } from '../../../components/common/StateViews';
import { getCurrentPosition } from '../../../hooks/useGeolocation';
import { emergencyService } from '../../../services/emergencyService';
import { useJourney } from '../../../context/JourneyContext';

const EmergencyScreen = () => {
  const navigate = useNavigate();
  const journey = useJourney();
  const [selectedType, setSelectedType] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const L = LABELS.EMERGENCY;

  const emergencyTypes = [
    { id: 'health', label: L.TYPES.HEALTH, icon: HeartPulse, color: 'text-danger' },
    { id: 'police', label: L.TYPES.POLICE, icon: Shield, color: 'text-primary' },
    { id: 'ambulance', label: L.TYPES.AMBULANCE, icon: Ambulance, color: 'text-danger' },
    { id: 'fire', label: L.TYPES.FIRE, icon: Flame, color: 'text-orange-500' },
    { id: 'vehicle', label: L.TYPES.VEHICLE, icon: Car, color: 'text-primary' },
    { id: 'women_safety', label: L.TYPES.WOMEN_SAFETY, icon: ShieldAlert, color: 'text-purple-600' },
    { id: 'disaster', label: L.TYPES.DISASTER, icon: CloudRain, color: 'text-slate-500' },
    { id: 'others', label: L.TYPES.OTHERS, icon: MoreHorizontal, color: 'text-slate-800' },
  ];
  const selectedLabel = emergencyTypes.find((t) => t.id === selectedType)?.label || L.TYPES.OTHERS;

  const handleConfirm = async () => {
    setSending(true);
    setError('');
    let position = null;
    try {
      position = await getCurrentPosition({ timeout: 10000, maximumAge: 10000 });
    } catch (err) {
      // Fall back to the last live-tracking fix if the browser cannot give a fresh one.
      position = journey.position;
      if (!position) {
        setError(`${err.message} Your SOS needs a location. Please call 112 directly.`);
        setSending(false);
        return;
      }
    }

    try {
      const result = await emergencyService.triggerSos({
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy ?? undefined,
        tripId: journey.trip?.id,
        emergencyType: selectedType || 'others',
      });
      setConfirmOpen(false);
      navigate(ROUTES.SOS_CONFIRM, { state: { type: selectedType, result } });
    } catch (err) {
      setError(`${err.message} If you are in danger, call 112 now.`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-[#0F172A] flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-white hover:bg-white/10 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] font-bold text-white absolute left-1/2 -translate-x-1/2">
          {L.TITLE}
        </h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">

        {/* Top Banner */}
        <div className="w-full bg-[#E11D48] rounded-[16px] py-4 px-4 text-center shadow-lg shadow-danger/20 mb-5">
          <span className="text-white text-[14px] sm:text-[15px] font-bold tracking-wide">
            {L.BANNER}
          </span>
        </div>

        {/* Section Title */}
        <h2 className="text-white text-[14px] font-bold mb-4">
          {L.SUBTITLE}
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
          {emergencyTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={clsx(
                  "rounded-[16px] py-4 px-2 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border-2",
                  isSelected
                    ? "bg-[#fff0f2] border-[#E11D48]"
                    : "bg-white border-transparent hover:bg-gray-50"
                )}
              >
                <type.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${type.color}`} strokeWidth={2.5} />
                <span className="text-[#0F172A] text-[11px] sm:text-[12px] font-bold text-center">
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom SOS Button */}
      <div className="px-5 pb-6 pt-2 shrink-0 bg-[#0F172A]">
        <button
          onClick={() => {
            setError('');
            setConfirmOpen(true);
          }}
          className="w-full bg-[#E11D48] rounded-[20px] py-4 sm:py-5 flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(225,29,72,0.4)] active:scale-[0.98] transition-all hover:bg-[#BE123C]"
        >
          <span className="text-white text-[24px] sm:text-[28px] font-black tracking-widest mb-0.5">
            {L.SOS_BUTTON}
          </span>
          <span className="text-white/90 text-[12px] sm:text-[13px] font-medium">
            {L.SOS_SUBTEXT}
          </span>
        </button>
      </div>

      {/* SOS Confirmation */}
      <Modal open={confirmOpen} onClose={sending ? undefined : () => setConfirmOpen(false)} title="Send SOS?">
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
          This sends your <span className="font-bold text-text-primary">live location</span> and emergency type{' '}
          (<span className="font-bold text-text-primary">{selectedLabel}</span>) to the SafeRoute response team and records it for your emergency contacts.
        </p>
        <div className="flex items-center gap-2 bg-background rounded-xl p-3 border border-border mb-4">
          <MapPin className="w-4 h-4 text-danger shrink-0" />
          <p className="text-[12px] text-text-secondary font-medium">Your browser may ask for location permission.</p>
        </div>
        {error && <p className="text-[12px] text-danger font-semibold mb-4">{error}</p>}
        <button
          onClick={handleConfirm}
          disabled={sending}
          className="w-full bg-[#E11D48] rounded-[16px] py-4 flex items-center justify-center gap-2 text-white text-[16px] font-black tracking-wider shadow-[0_8px_30px_rgba(225,29,72,0.35)] active:scale-[0.98] disabled:opacity-70"
        >
          {sending ? <Spinner className="border-white border-t-transparent" /> : null}
          {sending ? 'Sending SOS…' : 'Yes, Send SOS'}
        </button>
        <a
          href="tel:112"
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-[16px] border-2 border-danger text-danger text-[14px] font-bold"
        >
          <Phone className="w-4 h-4" /> Call 112
        </a>
        <button
          onClick={() => setConfirmOpen(false)}
          disabled={sending}
          className="mt-2 w-full py-3 text-[13px] font-semibold text-text-secondary"
        >
          Cancel
        </button>
      </Modal>
    </div>
  );
};

export default EmergencyScreen;
