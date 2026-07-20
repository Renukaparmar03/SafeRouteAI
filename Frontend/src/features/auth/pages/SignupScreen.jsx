import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { LABELS } from '../../../constants/labels';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SignupScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    emailOrPhone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock signup logic
    setTimeout(() => {
      setIsLoading(false);
      navigate(ROUTES.HOME);
    }, 1500);
  };

  return (
    <div className="relative w-full min-h-screen max-w-md mx-auto bg-surface flex flex-col font-sans px-6 py-6 overflow-y-auto">
      
      {/* Top Navigation */}
      <div className="w-full flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-text-primary hover:bg-background transition-colors active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Header Section */}
      <div className="flex items-start justify-between w-full mb-10 relative">
        <div className="flex flex-col z-10 relative">
          <h1 className="text-text-primary text-[28px] font-bold tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-text-secondary text-[15px] font-normal">
            Sign up to get started
          </p>
        </div>
        
        {/* Mountain illustration decoration matching reference */}
        <div className="absolute right-0 top-0 w-[84px] h-[84px] -mt-2 -mr-2 flex items-center justify-center bg-primary/10 rounded-full overflow-hidden shrink-0">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-4 mr-2">
            {/* Back Right Mountain */}
            <path d="M75 35 L100 80 L45 80 Z" fill="#8B5CF6" />
            <path d="M75 35 L81 46 L76 49 L75 45 L70 51 L67 46 Z" fill="#FFFFFF" opacity="0.9" />
            
            {/* Back Left Mountain */}
            <path d="M25 45 L50 80 L0 80 Z" fill="#7C3AED" />
            
            {/* Front Center Mountain */}
            <path d="M50 25 L85 80 L15 80 Z" fill="#5B5FEF" />
            <path d="M50 25 L58 38 L52 42 L50 36 L44 44 L38 38 Z" fill="#FFFFFF" opacity="0.95" />
          </svg>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSignup} className="w-full flex flex-col z-10 relative">
        <Input 
          id="fullName"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <Input 
          id="emailOrPhone"
          label="Email or Phone"
          placeholder={LABELS.PLACEHOLDERS.EMAIL}
          value={formData.emailOrPhone}
          onChange={handleChange}
          required
        />
        
        <Input 
          id="password"
          label="Password"
          type="password"
          placeholder={LABELS.PLACEHOLDERS.PASSWORD}
          value={formData.password}
          onChange={handleChange}
          required
        />

        <div className="mt-8">
          <Button 
            type="submit"
            variant="primary" 
            size="lg" 
            isLoading={isLoading}
            className="w-full py-4 text-[16px] font-semibold rounded-xl bg-primary shadow-lg shadow-primary/20"
          >
            Create Account
          </Button>
        </div>
        
        {/* Log In Link right below signup button */}
        <div className="w-full mt-8 flex justify-center items-center">
          <p className="text-text-secondary text-[14px] font-medium">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary font-bold hover:underline">
              {LABELS.BUTTONS.LOGIN}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignupScreen;
