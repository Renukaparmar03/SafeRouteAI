import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AdminLayout = () => {
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
