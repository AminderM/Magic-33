import React, { useState } from 'react';
import { DriverAppProvider, useDriverApp } from './DriverAppProvider';
import DriverLogin from './DriverLogin';
import MainDashboard from './MainDashboard';
import MenuScreen from './MenuScreen';
import AIAssistantScreen from './AIAssistantScreen';
import DocumentsScreen from './DocumentsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import RouteScreen from './RouteScreen';

// Screen management
const DriverAppContent = () => {
  const { user } = useDriverApp();
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // Not logged in
  if (!user) {
    return <DriverLogin />;
  }

  // Menu overlay
  if (showMenu) {
    return (
      <MenuScreen 
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          setShowMenu(false);
        }}
        onClose={() => setShowMenu(false)}
      />
    );
  }

  // Screen router
  const goBack = () => {
    setCurrentScreen('dashboard');
    setSelectedLoad(null);
  };

  switch (currentScreen) {
    case 'ai':
      return <AIAssistantScreen onBack={goBack} />;
    
    case 'profile':
      return <ProfileScreen onBack={goBack} />;
    
    case 'settings':
      return <SettingsScreen onBack={goBack} />;
    
    case 'route':
      return selectedLoad ? (
        <RouteScreen load={selectedLoad} onBack={goBack} />
      ) : (
        <MainDashboard 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
        />
      );
    
    case 'docs':
      return selectedLoad ? (
        <DocumentsScreen load={selectedLoad} onBack={goBack} />
      ) : (
        <MainDashboard 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
        />
      );
    
    case 'loads':
    case 'dashboard':
    default:
      return (
        <MainDashboard 
          onNavigate={(screen) => screen === 'menu' ? setShowMenu(true) : setCurrentScreen(screen)}
          onSelectLoad={(load, type) => {
            setSelectedLoad(load);
            setCurrentScreen(type);
          }}
        />
      );
  }
};

// Main wrapper
const DriverMobileApp = () => {
  return (
    <DriverAppProvider>
      <div className="min-h-screen bg-gray-950">
        <DriverAppContent />
      </div>
    </DriverAppProvider>
  );
};

export default DriverMobileApp;
