import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useNotifications, useSocketEvent } from '../../../context/NotificationContext';

const AdminLayout = () => {
  const { showToast } = useNotifications();

  // Admins are alerted in real time whenever a traveller triggers SOS.
  useSocketEvent('sos:triggered', (sos) =>
    showToast({
      id: `sos-${sos.id}`,
      title: `SOS from ${sos.user?.name || 'a traveller'}`,
      message: sos.meta?.address || sos.message,
      severity: 'CRITICAL',
      type: 'SOS',
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F3FF] via-[#FFFFFF] to-[#EDE9FE] flex font-sans">
      <Sidebar />
      <div className="flex-1 ml-72 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
