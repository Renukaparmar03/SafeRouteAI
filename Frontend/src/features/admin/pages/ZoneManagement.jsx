import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Plus, Navigation, AlertCircle, MoreVertical } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ZoneManagement = () => {
  const navigate = useNavigate();

  const zones = [
    { id: '1', name: 'Downtown Sector 4', type: 'Danger', riskLevel: 'High', status: 'Active', addedBy: 'Auto-AI' },
    { id: '2', name: 'Highway 45 Construction', type: 'Danger', riskLevel: 'Medium', status: 'Active', addedBy: 'Admin' },
    { id: '3', name: 'Central Park Area', type: 'Safe', riskLevel: 'Safe', status: 'Verified', addedBy: 'Admin' },
    { id: '4', name: 'North End Street', type: 'Danger', riskLevel: 'Critical', status: 'Active', addedBy: 'User Report' },
    { id: '5', name: 'University Campus', type: 'Safe', riskLevel: 'Safe', status: 'Verified', addedBy: 'Admin' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Zone Management</h1>
          <p className="text-text-secondary text-sm">Monitor and configure Safe and Danger zones</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/add-danger-zone')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Danger Zone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Placeholder */}
        <GlassCard className="lg:col-span-3 h-[400px] relative overflow-hidden flex flex-col p-0 border-0">
          {/* Mock Map UI */}
          <div className="absolute inset-0 bg-[#E5E3DF]">
            <img src="https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-73.9851,40.7589,12,0/1200x400?access_token=mock" 
                 alt="Map view" 
                 className="w-full h-full object-cover opacity-60" 
                 onError={(e) => { e.target.style.display = 'none'; }} />
                 
            {/* Map UI overlays */}
            <div className="absolute top-4 left-4 right-4 flex gap-2">
              <div className="flex-1 bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search location to add or view zone..." className="bg-transparent border-none outline-none w-full text-sm font-medium" />
              </div>
            </div>

            {/* Mock Pins */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-danger/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-danger rounded-full border-2 border-white shadow-sm"></div>
            </div>
            
            <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-success rounded-full border-2 border-white shadow-sm"></div>
            </div>
          </div>
        </GlassCard>

        {/* Zones Table */}
        <GlassCard className="lg:col-span-3 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-text-primary text-lg">Configured Zones</h3>
            <div className="flex gap-2">
              <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-1.5 outline-none font-medium">
                <option>All Zones</option>
                <option>Danger Zones</option>
                <option>Safe Zones</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Risk</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${zone.type === 'Danger' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-text-primary">{zone.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        zone.riskLevel === 'Safe' ? 'bg-success/10 text-success' : 
                        zone.riskLevel === 'Medium' ? 'bg-warning/10 text-warning' : 
                        'bg-danger/10 text-danger'
                      }`}>
                        {zone.type} - {zone.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-medium">
                      {zone.addedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary">
                        <span className={`w-2 h-2 rounded-full ${zone.status === 'Active' || zone.status === 'Verified' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {zone.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-primary transition-colors p-1">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ZoneManagement;
