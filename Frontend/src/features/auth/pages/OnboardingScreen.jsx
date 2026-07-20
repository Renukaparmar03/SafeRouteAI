import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { LABELS } from '../../../constants/labels';
import Button from '../../../components/ui/Button';

// Onboarding Illustration
import OnboardingBg from '../../../assets/images/onboarding-1.png';

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade/slide in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    navigate(ROUTES.LOGIN); // Navigate to next step or login
  };

  const handleSkip = () => {
    navigate(ROUTES.SPLASH);
  };

  return (
    <div className="relative w-full h-screen max-w-md mx-auto overflow-hidden bg-[#0A0B1A] flex flex-col items-center justify-end font-sans">

      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* scale-[1.20] ensures that any thick white borders or fake frames in the image are pushed completely off-screen */}
        <img
          src={OnboardingBg}
          alt="Travel Safety Illustration"
          className="w-full h-full object-cover object-center scale-[1.45] origin-center"
        />
        {/* Soft dark gradient overlay for text readability matching splash screen style */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B1A] via-[#0A0B1A]/80 to-[#0A0B1A]/30 h-full w-full" />
      </div>

      {/* Bottom Content Section */}
      <div
        className={`w-full z-20 px-6 pb-12 flex flex-col items-center text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
      >
        <h2 className="text-white text-[32px] font-bold tracking-tight mb-3 drop-shadow-md leading-[1.2]">
          Travel Smarter,<br />
          Travel Safer
        </h2>

        <p className="text-gray-300 text-[15px] font-normal mb-8 max-w-[300px] drop-shadow-sm leading-relaxed">
          {LABELS.ONBOARDING.STEP_1.DESCRIPTION}
        </p>

        {/* Pagination Dots */}
        <div className="flex gap-2 mb-10 items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white/40 transition-all" />
          <div className="w-8 h-2 rounded-full bg-primary transition-all shadow-[0_0_10px_rgb(91,95,239,0.5)]" />
          <div className="w-2 h-2 rounded-full bg-white/40 transition-all" />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-4 items-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            className="w-full py-4 text-[16px] font-semibold rounded-[20px] shadow-lg shadow-primary/20 bg-primary"
          >
            Next
          </Button>

          <button
            onClick={handleSkip}
            className="text-white/70 hover:text-white text-[14px] font-medium transition-colors py-2 active:scale-95"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
