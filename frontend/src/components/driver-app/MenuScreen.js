import React from 'react';
import { useDriverApp } from './DriverAppProvider';

const MenuScreen = ({ onNavigate, onClose }) => {
  const { user, logout } = useDriverApp();

  const menuItems = [
    { id: 'ai', label: 'AI Assistant', sublabel: 'Ask me anything', icon: '🤖', color: 'from-purple-600 to-purple-700' },
    { id: 'loads', label: 'My Loads', sublabel: 'View assigned loads', icon: '📦', color: 'from-blue-600 to-blue-700' },
    { id: 'profile', label: 'Profile', sublabel: 'Account details', icon: '👤', color: 'from-gray-600 to-gray-700' },
    { id: 'settings', label: 'Settings', sublabel: 'App preferences', icon: '⚙️', color: 'from-gray-600 to-gray-700' },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-gray-950 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Driver TMS</h1>
          <p className="text-gray-400 text-sm">{user?.full_name}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              onClose();
            }}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center text-xl`}>
              {item.icon}
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{item.label}</p>
              <p className="text-gray-500 text-sm">{item.sublabel}</p>
            </div>
            <svg className="w-5 h-5 text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 pb-8">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600/20 border border-red-600/50 text-red-400 rounded-xl py-4 flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default MenuScreen;
