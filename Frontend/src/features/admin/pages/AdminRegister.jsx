import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Check for admin code logic or mock API call
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'admin',
          adminCode: 'secure-code-to-create-admins' // Hardcoded to bypass the UI field requirement
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      alert('Admin registration successful! Please login.');
      navigate('/admin/login');
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
              Create a new administrative account to manage platform safety, users, and critical alerts.
            </p>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-text-primary mb-2">Create Account</h2>
            <p className="text-text-secondary text-[15px]">Register for an admin role</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium border border-red-200">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1" htmlFor="email">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="admin@travelsafety.ai"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-primary/25 transition-all duration-200 flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Registering...' : 'Sign Up as Admin'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            <div className="w-full mt-4 flex justify-center items-center">
              <p className="text-text-secondary text-[14px] font-medium">
                Already have an admin account?{' '}
                <Link to="/admin/login" className="text-primary font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdminRegister;
