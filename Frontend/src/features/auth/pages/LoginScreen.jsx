import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { LABELS } from '../../../constants/labels';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useAuth } from '../../../context/AuthContext';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const { login } = useAuth();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await login({
        emailOrPhone: formData.emailOrPhone.trim(),
        password: formData.password
      });
      const target = location.state?.from && location.state.from !== ROUTES.LOGIN ? location.state.from : ROUTES.HOME;
      navigate(user.role === 'admin' && !location.state?.from ? '/admin/home' : target, { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
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
            Welcome Back!
          </h1>
          <p className="text-text-secondary text-[15px] font-normal">
            Sign in to continue
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
      <form onSubmit={handleLogin} className="w-full flex flex-col z-10 relative">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium border border-red-200">
            {errorMessage}
          </div>
        )}
        
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

        <div className="w-full flex justify-end mb-8 mt-1">
          <button 
            type="button" 
            className="text-primary text-[14px] font-semibold hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button 
          type="submit"
          variant="primary" 
          size="lg" 
          isLoading={isLoading}
          className="w-full py-4 text-[16px] font-semibold rounded-xl bg-primary shadow-lg shadow-primary/20"
        >
          {LABELS.BUTTONS.LOGIN}
        </Button>
        
        {/* Sign Up Link right below login button */}
        <div className="w-full mt-8 flex justify-center items-center">
          <p className="text-text-secondary text-[14px] font-medium">
            Don't have an account?{' '}
            <Link to={ROUTES.SIGNUP} className="text-primary font-bold hover:underline">
              {LABELS.BUTTONS.SIGNUP}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;
