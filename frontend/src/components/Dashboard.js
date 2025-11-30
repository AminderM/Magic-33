import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EquipmentManagement from './EquipmentManagement';
// import DriverManagement from './DriverManagement';
import OrderManagement from './OrderManagement';
import LocationTracking from './LocationTracking';
import FleetManagement from './FleetManagement';
import CompanyProfile from './CompanyProfile';
import TMSChatAssistant from './TMSChatAssistant';
import DepartmentPanel from './DepartmentPanel';

const Dashboard = () => {
  const { user, logout, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const isPlatformAdmin = user?.role === 'platform_admin';
  const isFleetOwner = user?.role === 'fleet_owner';
  const showAdminTabs = isPlatformAdmin || isFleetOwner;
  
  // Set initial tab based on user role
  const [activeTab, setActiveTab] = useState(() => {
    return showAdminTabs ? 'fleet' : 'equipment';
  });
  
  const [activeDepartment, setActiveDepartment] = useState('dispatch');
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeBookings: 0,
    totalDrivers: 0,
    availableEquipment: 0
  });
  const [selectedEquipmentForTracking, setSelectedEquipmentForTracking] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Update active tab when user changes
  useEffect(() => {
    if (user && showAdminTabs && activeTab === 'equipment') {
      setActiveTab('fleet');
    }
  }, [user, showAdminTabs]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      verified: { color: 'bg-green-500', text: 'Verified' },
      suspended: { color: 'bg-red-500', text: 'Suspended' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        // Try current company endpoint first (for platform_admin)
        let res = await fetchWithAuth(`${BACKEND_URL}/api/companies/current`);
        if (!res.ok) {
          // Fallback to my company endpoint (for fleet_owner)
          res = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`);
        }
        
        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadCompanyData();
    } else {
      setLoading(false);
    }
  }, [user, BACKEND_URL, fetchWithAuth]);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="dashboard-header bg-primary text-primary-foreground flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold" data-testid="dashboard-title">
                Welcome, {user?.full_name}
              </h1>
              <p className="mt-1 opacity-90">
                {(user?.role || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-semibold">{company?.name || 'No Company'}</div>
                {company && getStatusBadge(company.verification_status)}
              </div>
              
              {/* Company/Profile/Admin Dropdown */}
              <div className="relative group">
                <Button 
                  variant="secondary"
                  className="">
                  <i className="fas fa-building mr-2"></i>
                  Company
                  <i className="fas fa-chevron-down ml-2"></i>
                </Button>
                <div className="absolute right-0 mt-2 w-56 bg-white text-foreground rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                  <button
                    onClick={() => navigate('/apps')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <i className="fas fa-th mr-2"></i>
                    Apps
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <i className="fas fa-id-card mr-2"></i>
                    Company Profile
                  </button>
                  {isPlatformAdmin && (
                    <>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => navigate('/admin')}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <i className="fas fa-tools mr-2"></i>
                        Admin Console
                      </button>
                    </>
                  )}
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Layout: Department Panel + Main Content + Chat Panel */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left Panel (20%) - Department Navigation */}
        <div className="w-1/5 h-full overflow-hidden">
          <DepartmentPanel 
            activeDepartment={activeDepartment} 
            onDepartmentChange={setActiveDepartment}
          />
        </div>

        {/* Middle Panel (60%) - Main Content */}
        <div className="w-3/5 h-full overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* Main Content Tabs */}
            <Card className="dashboard-card">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className={`grid w-full ${showAdminTabs ? 'grid-cols-5' : 'grid-cols-3'}`}>
                    {showAdminTabs && (
                      <TabsTrigger value="fleet" data-testid="fleet-tab">
                        <i className="fas fa-tachometer-alt mr-2"></i>
                        Transport Hub - TMS
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="equipment" data-testid="equipment-tab">
                      <i className="fas fa-truck mr-2"></i>
                      Equipment
                    </TabsTrigger>
                    {showAdminTabs && (
                      <TabsTrigger value="drivers" data-testid="drivers-tab">
                        <i className="fas fa-users mr-2"></i>
                        Drivers
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="bookings" data-testid="bookings-tab">
                      <i className="fas fa-shopping-cart mr-2"></i>
                      Loads
                    </TabsTrigger>
                    <TabsTrigger value="tracking" data-testid="tracking-tab">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      Tracking
                    </TabsTrigger>
                  </TabsList>

                  {showAdminTabs && (
                    <TabsContent value="fleet" className="mt-6">
                      <FleetManagement />
                    </TabsContent>
                  )}

                  <TabsContent value="equipment" className="mt-6">
                    <EquipmentManagement 
                      onStatsUpdate={setStats} 
                      onTrackEquipment={(equipmentId) => {
                        setSelectedEquipmentForTracking(equipmentId);
                        setActiveTab('tracking');
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="bookings" className="mt-6">
                    <OrderManagement />
                  </TabsContent>

                  {showAdminTabs && (
                    <TabsContent value="drivers" className="mt-6">
                      <DriverManagement onStatsUpdate={setStats} />
                    </TabsContent>
                  )}

                  <TabsContent value="tracking" className="mt-6">
                    <LocationTracking selectedEquipmentId={selectedEquipmentForTracking} />
                  </TabsContent>

                  <TabsContent value="profile" className="mt-6">
                    <CompanyProfile />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel (20%) - AI Chat Assistant */}
        <div className="w-1/5 h-full overflow-hidden">
          <TMSChatAssistant 
            fetchWithAuth={fetchWithAuth} 
            BACKEND_URL={BACKEND_URL} 
            user={user}
            activeDepartment={activeDepartment}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
