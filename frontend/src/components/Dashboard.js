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
import DriverPortalView from './DriverPortalView';
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
                  <TabsList className={`grid w-full ${showAdminTabs ? 'grid-cols-6' : 'grid-cols-4'}`}>
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
                    <TabsTrigger value="driver-portal" data-testid="driver-portal-tab">
                      <i className="fas fa-mobile-alt mr-2"></i>
                      Driver Portal Demo
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
                      {/* <DriverManagement onStatsUpdate={setStats} /> */}
                      <div className="p-8 text-center">
                        <h3 className="text-xl font-semibold mb-2">Driver Management</h3>
                        <p className="text-gray-600">Driver management features coming soon</p>
                      </div>
                    </TabsContent>
                  )}

                  <TabsContent value="tracking" className="mt-6">
                    <LocationTracking selectedEquipmentId={selectedEquipmentForTracking} />
                  </TabsContent>

                  <TabsContent value="driver-portal" className="mt-6">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                        <h2 className="text-2xl font-bold mb-2">Driver Portal Demo</h2>
                        <p className="text-blue-100">
                          Experience the Driver Portal interface - designed for drivers to manage their loads, update status in real-time, and navigate routes.
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">🚀 Quick Access Options:</h3>
                        <div className="space-y-3">
                          <a
                            href="https://logistics-nano.emergent.host/driver-demo.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <i className="fas fa-external-link-alt text-blue-600 text-xl"></i>
                              <div>
                                <h4 className="font-semibold text-gray-900">Open Full Demo (New Tab)</h4>
                                <p className="text-sm text-gray-600">Interactive standalone demo with mock data</p>
                              </div>
                            </div>
                          </a>

                          <div className="p-4 border-2 border-gray-200 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-2">
                              <i className="fas fa-mobile-alt text-purple-600 mr-2"></i>
                              Mobile App Access
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                              The complete React Native mobile app is available at <code className="bg-gray-100 px-2 py-1 rounded">/app/mobile/</code>
                            </p>
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-xs text-gray-700 font-mono">
                                cd /app/mobile<br/>
                                yarn install<br/>
                                yarn android  # or yarn ios
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            <i className="fas fa-check-circle text-green-600 mr-2"></i>
                            Driver Features
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>• View assigned loads dashboard</li>
                            <li>• Accept/reject load assignments</li>
                            <li>• Real-time status updates</li>
                            <li>• GPS navigation integration</li>
                            <li>• Profile management</li>
                            <li>• Owner-operator signup</li>
                          </ul>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            <i className="fas fa-server text-blue-600 mr-2"></i>
                            Backend APIs
                          </h3>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>• POST /api/driver/login</li>
                            <li>• POST /api/driver/signup</li>
                            <li>• GET /api/driver/loads</li>
                            <li>• PUT /api/driver/loads/:id/status</li>
                            <li>• GET /api/driver/loads/:id/route</li>
                            <li>• 9 total endpoints working</li>
                          </ul>
                        </div>
                      </div>
                    </div>
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
