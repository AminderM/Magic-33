import React, { useState } from 'react';
import { DriverAppProvider, useDriverApp } from './DriverAppProvider';
import DriverLogin from './DriverLogin';
import LoadsList from './LoadsList';
import LoadDetail from './LoadDetail';
import DriverProfileTab from './DriverProfileTab';
import { Package, User } from 'lucide-react';

// Bottom Navigation
const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'loads', label: 'Loads', icon: Package },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-area-bottom">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 ${
                isActive ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Main App Content
const DriverAppContent = () => {
  const { user } = useDriverApp();
  const [activeTab, setActiveTab] = useState('loads');
  const [selectedLoad, setSelectedLoad] = useState(null);

  // Not logged in - show login
  if (!user) {
    return <DriverLogin />;
  }

  // Viewing load detail
  if (selectedLoad) {
    return (
      <LoadDetail 
        load={selectedLoad} 
        onBack={() => setSelectedLoad(null)} 
      />
    );
  }

  // Main app with tabs
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {activeTab === 'loads' && (
        <LoadsList onSelectLoad={setSelectedLoad} />
      )}
      {activeTab === 'profile' && (
        <DriverProfileTab />
      )}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

// Wrapper Component
const DriverMobileApp = () => {
  return (
    <DriverAppProvider>
      <div className="min-h-screen bg-slate-900">
        <DriverAppContent />
      </div>
    </DriverAppProvider>
  );
};

export default DriverMobileApp;
