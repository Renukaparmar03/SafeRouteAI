import React, { useState } from 'react';
import { BellRing, Send, Search } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { timeAgo } from '../../../utils/format';

const INPUT =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200';
const LABEL = 'block text-sm font-semibold text-text-primary mb-2';
const SEVERITY_CLS = { LOW: 'text-success', MEDIUM: 'text-warning', HIGH: 'text-orange-500', CRITICAL: 'text-danger' };
const TARGET_LABEL = { all: 'All users', 'active-trips': 'Users on active trips', user: 'Single user' };

const SendNotification = () => {
  const [form, setForm] = useState({ title: '', message: '', severity: 'MEDIUM', type: 'ADMIN_ALERT', target: 'all' });
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const history = useAsync(() => adminService.notificationHistory(), []);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const searchUsers = async () => {
    if (userQuery.trim().length < 2) return;
    try {
      const data = await adminService.users({ search: userQuery.trim(), limit: 8 });
      setUserResults(data.users);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (form.target === 'user' && !selectedUser) {
      setError('Select the user to notify.');
      return;
    }
    setSending(true);
    try {
      const data = await adminService.sendNotification({
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
        userId: form.target === 'user' ? selectedUser.id : undefined,
      });
      setResult(data);
      setForm((f) => ({ ...f, title: '', message: '' }));
      history.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Send Safety Notification</h1>
        <p className="text-text-secondary text-sm">Delivered in real time in the app (Socket.IO) and as a browser push (Firebase) when configured</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium border border-red-200">{error}</div>}
            {result && (
              <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium border border-success/20">
                Sent to {result.recipients} user{result.recipients === 1 ? '' : 's'}.{' '}
                {result.pushConfigured ? `${result.pushDelivered} push notification(s) delivered.` : 'Push is not configured on the server (in-app only).'}
              </div>
            )}
            <div>
              <label className={LABEL} htmlFor="title">Title</label>
              <input id="title" value={form.title} onChange={handleChange} className={INPUT} placeholder="e.g. Heavy rain advisory" required minLength={2} maxLength={200} />
            </div>
            <div>
              <label className={LABEL} htmlFor="message">Message</label>
              <textarea id="message" value={form.message} onChange={handleChange} rows={4} className={`${INPUT} resize-none`} placeholder="What should travellers know or do?" required minLength={2} maxLength={2000} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="severity">Severity</label>
                <select id="severity" value={form.severity} onChange={handleChange} className={INPUT}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="type">Type</label>
                <select id="type" value={form.type} onChange={handleChange} className={INPUT}>
                  <option value="ADMIN_ALERT">Safety alert</option>
                  <option value="WEATHER_ALERT">Weather alert</option>
                  <option value="RISK_ALERT">Risk alert</option>
                  <option value="TRIP_UPDATE">Trip update</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL} htmlFor="target">Target</label>
              <select id="target" value={form.target} onChange={handleChange} className={INPUT}>
                <option value="all">All users</option>
                <option value="active-trips">Users on active trips</option>
                <option value="user">A specific user</option>
              </select>
            </div>
            {form.target === 'user' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchUsers())}
                    className={INPUT}
                    placeholder="Search by name, email or phone"
                  />
                  <button type="button" onClick={searchUsers} className="px-4 rounded-xl bg-white border border-gray-200 text-primary">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {selectedUser && <p className="text-sm">Selected: <span className="font-semibold">{selectedUser.name}</span> ({selectedUser.email || selectedUser.phone})</p>}
                {userResults.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setUserResults([]);
                    }}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-white/60 hover:bg-white border border-gray-100 text-sm"
                  >
                    {u.name} <span className="text-text-secondary">{u.email || u.phone}</span>
                  </button>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
            <BellRing className="w-5 h-5 text-primary" /> Notification History
          </h3>
          {history.loading && !history.data ? (
            <LoadingState />
          ) : history.status === 'error' ? (
            <ErrorState message={history.error.message} onRetry={history.reload} />
          ) : history.data.length === 0 ? (
            <p className="text-sm text-text-secondary">No notifications sent yet.</p>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto">
              {history.data.map((h) => (
                <div key={`${h.title}-${h.createdAt}`} className="bg-white/50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-text-primary truncate">{h.title}</p>
                    <span className={`text-[11px] font-bold ${SEVERITY_CLS[h.severity]}`}>{h.severity}</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{h.message}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {TARGET_LABEL[h.target] || h.target} · {h.recipients} recipients · {h.read} read · {h.delivered} pushed · {timeAgo(h.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default SendNotification;
