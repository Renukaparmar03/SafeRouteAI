import React from 'react';
import { Search, MoreVertical, Shield, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const UserManagement = () => {
  const users = [
    { id: '101', name: 'Renuka Parmar', email: 'renuka@example.com', trips: 45, status: 'Active', risk: 'Safe' },
    { id: '102', name: 'Vishal Sharma', email: 'vishal@example.com', trips: 12, status: 'Active', risk: 'Safe' },
    { id: '103', name: 'Amit Kumar', email: 'amit@example.com', trips: 89, status: 'Suspended', risk: 'High' },
    { id: '104', name: 'Neha Singh', email: 'neha@example.com', trips: 34, status: 'Active', risk: 'Medium' },
    { id: '105', name: 'Rahul Verma', email: 'rahul@example.com', trips: 3, status: 'Active', risk: 'Safe' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary text-sm">View and manage platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="pl-9 pr-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
            Export CSV
          </button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Trips</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Profile</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-text-primary">{user.name}</div>
                        <div className="text-xs text-text-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-primary font-medium">{user.trips}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.risk === 'Safe' ? 'bg-success/10 text-success' : 
                      user.risk === 'Medium' ? 'bg-warning/10 text-warning' : 
                      'bg-danger/10 text-danger'
                    }`}>
                      {user.risk === 'Safe' ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {user.risk}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Showing 1 to 5 of 12,450 entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-white transition-colors disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 bg-primary text-white rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-colors">Next</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default UserManagement;
