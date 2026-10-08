import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, Shield, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { ErrorState, LoadingState } from '../../../components/common/StateViews';
import { useAsync } from '../../../hooks/useAsync';
import { adminService } from '../../../services/adminService';
import { formatDate } from '../../../utils/format';

const PAGE_SIZE = 20;

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState(null);
  const [actionError, setActionError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const users = useAsync(() => adminService.users({ search: query || undefined, page, limit: PAGE_SIZE }), [query, page]);
  const list = users.data?.users || [];
  const total = users.data?.total || 0;
  const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(page * PAGE_SIZE, total);

  const toggleActive = async (user) => {
    setMenuFor(null);
    setActionError('');
    try {
      const updated = await adminService.updateUser(user.id, { isActive: !user.isActive });
      users.setData((d) => ({ ...d, users: d.users.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u)) }));
    } catch (error) {
      setActionError(error.message);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setActionError('');
    try {
      const all = [];
      for (let p = 1; ; p += 1) {
        const data = await adminService.users({ search: query || undefined, page: p, limit: 100 });
        all.push(...data.users);
        if (all.length >= data.total || !data.users.length) break;
      }
      const rows = [
        ['Name', 'Email', 'Phone', 'Role', 'Trips', 'High alerts (30d)', 'Risk profile', 'Status', 'Joined'],
        ...all.map((u) => [u.name, u.email, u.phone, u.role, u.trips, u.highAlerts30d, u.riskProfile, u.isActive ? 'Active' : 'Suspended', formatDate(u.createdAt)]),
      ];
      const blob = new Blob([rows.map((r) => r.map(csvEscape).join(',')).join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saferoute-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6" onClick={() => setMenuFor(null)}>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <button
            onClick={exportCsv}
            disabled={exporting || !total}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {actionError && <p className="text-sm text-danger font-medium">{actionError}</p>}

      <GlassCard className="overflow-visible">
        {users.loading && !users.data ? (
          <LoadingState label="Loading users…" />
        ) : users.status === 'error' ? (
          <ErrorState message={users.error.message} onRetry={users.reload} />
        ) : (
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
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-text-secondary">No users found.</td>
                </tr>
              )}
              {list.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-text-primary">
                          {user.name}
                          {user.role === 'admin' && <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">ADMIN</span>}
                          {user.isDemo && <span className="ml-2 text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">DEMO</span>}
                        </div>
                        <div className="text-xs text-text-secondary">{user.email || user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-primary font-medium">{user.trips}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      title={`${user.highAlerts30d} high-severity alerts in the last 30 days`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.riskProfile === 'Safe' ? 'bg-success/10 text-success' :
                      user.riskProfile === 'Medium' ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {user.riskProfile === 'Safe' ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {user.riskProfile === 'Safe' ? 'No alerts' : user.riskProfile}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuFor(menuFor === user.id ? null : user.id);
                      }}
                      className="text-gray-400 hover:text-primary transition-colors p-1"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {menuFor === user.id && (
                      <div className="absolute right-6 top-12 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40 text-left" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => toggleActive(user)} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${user.isActive ? 'text-danger' : 'text-success'}`}>
                          {user.isActive ? 'Suspend user' : 'Reactivate user'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Showing {from} to {to} of {total.toLocaleString()} entries</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-white transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={to >= total}
              className="px-3 py-1 bg-primary text-white rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default UserManagement;
