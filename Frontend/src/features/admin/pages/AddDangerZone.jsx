import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const AddDangerZone = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    riskLevel: 'Medium',
    activeTime: 'Always',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    alert('Danger Zone saved successfully!');
    navigate('/admin/zones');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/50 border border-gray-200 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Add Danger Zone</h1>
          <p className="text-text-secondary text-sm">Create a new high-risk area on the map</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Form */}
        <GlassCard className="p-8">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="name">
                Zone Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                placeholder="e.g. Highway 45 Construction"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="lat">
                  Latitude
                </label>
                <input
                  id="lat"
                  type="text"
                  value={formData.lat}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="40.7128"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="lng">
                  Longitude
                </label>
                <input
                  id="lng"
                  type="text"
                  value={formData.lng}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="-74.0060"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="riskLevel">
                  Risk Level
                </label>
                <select
                  id="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                >
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                  <option value="Critical">Critical (Avoid)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="activeTime">
                  Active Time
                </label>
                <select
                  id="activeTime"
                  value={formData.activeTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                >
                  <option value="Always">Always Active</option>
                  <option value="NightOnly">Night Time Only</option>
                  <option value="DayOnly">Day Time Only</option>
                  <option value="Custom">Custom Schedule...</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2" htmlFor="description">
                Description / Warning Message
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                placeholder="Describe why this zone is dangerous..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl font-semibold text-text-secondary hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-semibold shadow-lg shadow-danger/25 transition-all duration-200 flex items-center gap-2"
              >
                <Save className="w-5 h-5" /> Save Zone
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Right Side - Interactive Map Area */}
        <GlassCard className="p-0 border-0 h-full min-h-[400px] relative overflow-hidden bg-[#E5E3DF]">
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <MapPin className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium text-sm">Interactive map will load here.</p>
            <p className="text-gray-400 text-xs mt-1">Drag the pin to set location.</p>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Location Selector</p>
                <p className="text-xs text-text-secondary mt-1">You can either type the exact coordinates or drop the pin on the map directly.</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// Ensure we have AlertTriangle for the snippet above
import { AlertTriangle } from 'lucide-react';

export default AddDangerZone;
