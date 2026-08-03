import React from 'react';
import { Search, Filter, AlertOctagon, CheckCircle, Clock } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const ReportsManagement = () => {
  const reports = [
    { id: '#REP-092', user: 'Renuka Parmar', type: 'SOS Alert', location: 'Downtown Sector 4', time: '10 mins ago', status: 'Pending', severity: 'Critical' },
    { id: '#REP-091', user: 'Amit Kumar', type: 'Unsafe Route', location: 'Highway 45', time: '2 hours ago', status: 'Investigating', severity: 'High' },
    { id: '#REP-090', user: 'Neha Singh', type: 'App Issue', location: 'N/A', time: '5 hours ago', status: 'Resolved', severity: 'Low' },
    { id: '#REP-089', user: 'Rahul Verma', type: 'Suspicious Activity', location: 'Metro Station Exit B', time: '1 day ago', status: 'Resolved', severity: 'Medium' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports & SOS</h1>
          <p className="text-text-secondary text-sm">Manage user safety reports and system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="pl-9 pr-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary hover:border-primary/50 transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-5 border-l-4 border-l-danger">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Active SOS Alerts</p>
              <p className="text-3xl font-bold text-text-primary">3</p>
            </div>
            <div className="p-3 bg-danger/10 rounded-full text-danger">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 border-l-4 border-l-warning">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-text-primary">14</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-full text-warning">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5 border-l-4 border-l-success">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-secondary mb-1">Resolved Today</p>
              <p className="text-3xl font-bold text-text-primary">28</p>
            </div>
            <div className="p-3 bg-success/10 rounded-full text-success">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type & Severity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-primary">{report.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-text-primary">{report.type}</div>
                    <div className={`text-[11px] font-bold mt-1 uppercase ${
                      report.severity === 'Critical' ? 'text-danger' : 
                      report.severity === 'High' ? 'text-orange-500' : 
                      report.severity === 'Medium' ? 'text-warning' : 'text-success'
                    }`}>{report.severity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-secondary">
                    {report.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">{report.location}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{report.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      report.status === 'Pending' ? 'bg-danger/10 text-danger' : 
                      report.status === 'Investigating' ? 'bg-warning/10 text-warning' : 
                      'bg-success/10 text-success'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-text-primary shadow-sm hover:border-primary hover:text-primary transition-all">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default ReportsManagement;
