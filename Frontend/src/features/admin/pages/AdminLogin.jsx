import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../../../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      // role: 'admin' makes the server reject non-admin accounts.
      await login({ emailOrPhone: email.trim(), password, role: 'admin' });
      navigate(location.state?.from || '/admin/home', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FFFFFF] to-[#EDE9FE] flex items-center justify-center p-6 font-sans">
      <GlassCard className="w-full max-w-[900px] flex flex-col md:flex-row p-0">
        {/* Left Side - Illustration */}
        <div className="md:w-1/2 bg-primary p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="z-10 relative text-white">
            <div className="flex items-center gap-3 mb-8">
              <ShieldAlert className="w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">TravelSafety AI</h1>
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Secure Admin<br />Portal
            </h2>
            <p className="text-white/80 text-[15px] max-w-sm">
              Manage users, track safety zones, and monitor live reports across the platform with advanced AI analytics.
            </p>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-text-primary mb-2">Welcome Back</h2>
            <p className="text-text-secondary text-[15px]">Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium border border-red-200">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="email">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="admin@travelsafety.ai"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between mt-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <button type="button" className="text-sm font-semibold text-primary hover:underline">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-primary/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <div className="w-full mt-4 flex justify-center items-center">
              <p className="text-text-secondary text-[14px] font-medium">
                Don't have an admin account?{' '}
                <Link to="/admin/register" className="text-primary font-bold hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdminLogin;
