import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { LABELS } from '../../../constants/labels';
import Button from '../../../components/ui/Button';

// Background image
import SplashBg from '../../../assets/images/splash-bg.png';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    navigate(ROUTES.ONBOARDING);
  };

  const handleGuest = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto overflow-hidden bg-[#0A0B1A] flex flex-col items-center justify-end font-sans">
      {/* Background Image Container with Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* scale-[1.15] is used to crop out any fake mobile status bar/notches in the generated image */}
        <img 
          src={SplashBg} 
          alt="Mountain Landscape" 
          className="w-full h-full object-cover object-center scale-[1.15] origin-center"
        />
        {/* Soft dark gradient overlay to make the mountain visible but text readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-[#0A0B1A]/70 to-[#0A0B1A]/10 h-full w-full" />
      </div>

      {/* Bottom Content Section */}
      <div 
        className={`w-full z-20 px-6 pb-12 flex flex-col items-center text-center transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}
      >
        <h1 className="text-white text-[36px] font-bold tracking-tight mb-2 drop-shadow-md">
          SafeRoute <span className="text-primary">AI</span>
        </h1>
        
        <p className="text-white text-[16px] font-semibold mb-2 drop-shadow-md tracking-wide">
          {LABELS.TAGLINE}
        </p>
        
        <p className="text-gray-300 text-[14px] font-normal mb-8 drop-shadow-sm">
          {LABELS.SUBTITLE}
        </p>

        {/* Pagination Dots */}
        <div className="flex gap-2 mb-10">
          <div className="w-6 h-1.5 rounded-full bg-primary" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-4 items-center">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleNext}
            className="w-full py-4 text-[16px] font-semibold rounded-[20px] shadow-lg shadow-primary/20"
          >
            Get Started
          </Button>
          
          <button 
            onClick={handleGuest}
            className="text-white/70 hover:text-white text-[14px] font-medium transition-colors py-2 active:scale-95"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
