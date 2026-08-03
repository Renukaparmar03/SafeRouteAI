import React from 'react';
import { 
  Users, MapPin, Navigation, ShieldCheck, TrendingUp, AlertTriangle, 
  Bell, Activity, Map, BrainCircuit, Plus, Eye, ShieldAlert, ArrowRight, Clock, AlertOctagon
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const StatCard = ({ title, value, icon: Icon, trend, trendUp, type }) => (
  <GlassCard className="p-5">
    <div className="flex justify-between items-start mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        type === 'danger' ? 'bg-danger/10 text-danger' : 
        type === 'warning' ? 'bg-warning/10 text-warning' :
        type === 'success' ? 'bg-success/10 text-success' :
        'bg-primary/10 text-primary'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
        trendUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
      }`}>
        {trendUp ? '↑' : '↓'} {trend}
      </div>
    </div>
    <h3 className="text-text-secondary text-xs font-medium mb-1">{title}</h3>
    <h2 className="text-text-primary text-2xl font-bold">{value}</h2>
  </GlassCard>
);

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Safety Monitoring Hub</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time overview of network safety and active operations.</p>
      </div>

      {/* 1. Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value="12,450" icon={Users} trend="12.5%" trendUp={true} />
        <StatCard title="Active Trips" value="3,842" icon={Navigation} trend="5.4%" trendUp={true} />
        <StatCard title="Danger Zones" value="142" icon={AlertOctagon} trend="2.1%" trendUp={false} type="danger" />
        <StatCard title="Safe Zones" value="8,230" icon={ShieldCheck} trend="8.1%" trendUp={true} type="success" />
        <StatCard title="Emergency Alerts" value="5" icon={Bell} trend="14.2%" trendUp={false} type="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Emergency Monitoring Section */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col border-l-4 border-l-danger">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <ShieldAlert className="text-danger w-5 h-5" />
              Live Emergency Alerts
            </h3>
            <span className="px-3 py-1 bg-danger/10 text-danger text-xs font-bold rounded-full animate-pulse">
              5 ACTIVE ALERTS
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-danger/5 rounded-xl p-4 text-center">
              <h4 className="text-2xl font-bold text-danger mb-1">2</h4>
              <p className="text-xs text-text-secondary font-medium uppercase">SOS Triggered</p>
            </div>
            <div className="bg-warning/5 rounded-xl p-4 text-center">
              <h4 className="text-2xl font-bold text-warning mb-1">3</h4>
              <p className="text-xs text-text-secondary font-medium uppercase">Risk Warnings</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 text-center">
              <h4 className="text-2xl font-bold text-primary mb-1">12</h4>
              <p className="text-xs text-text-secondary font-medium uppercase">Resolved Today</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { type: 'SOS', msg: 'User initiated SOS via panic button', loc: 'Downtown Metro Station', time: 'Just now' },
              { type: 'SOS', msg: 'High stress level detected in biometric sync', loc: 'Industrial Area Sector 4', time: '2 min ago' },
              { type: 'WARNING', msg: 'User entered reported protest zone', loc: 'City Hall Square', time: '5 min ago' }
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between bg-white/40 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${alert.type === 'SOS' ? 'bg-danger' : 'bg-warning'}`}></div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{alert.msg}</p>
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {alert.loc}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500">{alert.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 3. Live Trip Monitoring Section */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
              <Activity className="text-primary w-5 h-5" />
              Live Trip Monitoring
            </h3>
            
            <div className="space-y-5 mb-8">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Active Travelers</span>
                <span className="text-lg font-bold text-text-primary">2,410</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Monitored Trips</span>
                <span className="text-lg font-bold text-text-primary">3,842</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-text-secondary">Overall Risk Status</span>
                <span className="text-sm font-bold text-success px-2 py-1 bg-success/10 rounded-md">Low / Stable</span>
              </div>
            </div>
          </div>
          
          <button className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2">
            <Map className="w-4 h-4" /> View Live Map
          </button>
        </GlassCard>

        {/* 4. Risk Heatmap Preview */}
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden relative min-h-[300px]">
          <div className="absolute inset-0 bg-gray-100/50 flex flex-col">
            <div className="p-6 relative z-10 flex-1">
               <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <MapPin className="text-text-primary w-5 h-5" />
                Risk Heatmap Overview
              </h3>
              
              <div className="mt-4 inline-block bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-sm border border-white">
                <p className="text-xs font-bold text-text-secondary uppercase mb-2">City Risk Levels</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-danger"></div>
                    <span className="text-sm text-text-primary font-medium">High Risk (Red)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <span className="text-sm text-text-primary font-medium">Medium Risk (Yellow)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                    <span className="text-sm text-text-primary font-medium">Safe (Green)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Abstract Map Background Simulation */}
            <div className="absolute right-0 bottom-0 w-2/3 h-full opacity-30 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 70% 30%, #ef4444 0%, transparent 40%), radial-gradient(circle at 30% 70%, #f59e0b 0%, transparent 40%), radial-gradient(circle at 50% 50%, #10b981 0%, transparent 60%)',
              filter: 'blur(30px)'
            }}></div>
          </div>
        </GlassCard>

        {/* 5. AI Safety Insights Card */}
        <GlassCard className="p-6 border-t-4 border-t-primary">
           <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
            <BrainCircuit className="text-primary w-5 h-5" />
            AI Safety Insights
          </h3>
          
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-xl">
              <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Most Risky Time</p>
              <p className="text-sm font-bold text-text-primary">11:00 PM - 2:00 AM</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl">
              <p className="text-xs text-text-secondary uppercase font-semibold mb-1">Most Reported Location</p>
              <p className="text-sm font-bold text-text-primary">Downtown North Sector</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-xl">
              <p className="text-xs text-text-secondary uppercase font-semibold mb-1">AI Prediction</p>
              <p className="text-sm font-medium text-text-primary">
                Risk expected to <span className="text-danger font-bold">increase</span> in East End due to upcoming public event.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* 6. Recent Activity Timeline */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-text-secondary" />
            Safety Timeline
          </h3>
          <div className="space-y-6">
            {[
              { title: 'SOS Alert Triggered', loc: 'Downtown Metro', time: '2 mins ago', type: 'critical' },
              { title: 'New Danger Zone Added', loc: 'Highway 45', time: '1 hour ago', type: 'warning' },
              { title: 'User Entered High-Risk Area', loc: 'Sector 7G', time: '2 hours ago', type: 'warning' },
              { title: 'Report Resolved', loc: 'Central Park', time: '3 hours ago', type: 'info' },
              { title: 'Safe Zone Verified', loc: 'West End Mall', time: '5 hours ago', type: 'success' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== 4 && <div className="absolute left-2.5 top-6 w-[1px] h-10 bg-gray-200"></div>}
                <div className={`w-5 h-5 rounded-full mt-0.5 shrink-0 border-2 border-white shadow-sm ${
                  activity.type === 'critical' ? 'bg-danger' : 
                  activity.type === 'warning' ? 'bg-warning' : 
                  activity.type === 'success' ? 'bg-success' : 'bg-primary'
                }`}></div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{activity.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{activity.loc}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 7. Quick Actions Panel */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-danger/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center group-hover:scale-110 transition">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">Add Danger Zone</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-success/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">Add Safe Zone</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-primary/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">View Reports</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-white/50 hover:bg-warning/10 border border-gray-100 rounded-xl transition group text-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">Send Alert</span>
            </button>
          </div>
        </GlassCard>

        {/* 8. Zone Statistics */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Zone Analytics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-text-primary">High Risk Zones</span>
                <span className="text-danger">15%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-danger w-[15%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-text-primary">Medium Risk Zones</span>
                <span className="text-warning">28%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-warning w-[28%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-text-primary">Safe / Low Risk Zones</span>
                <span className="text-success">57%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-success w-[57%]"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
             <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-secondary">Recently Updated</span>
              <span className="text-sm font-bold text-text-primary">24 Zones (Today)</span>
             </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

export default AdminDashboard;
