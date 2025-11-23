import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EquipmentManagement from './EquipmentManagement';
import DriverManagement from './DriverManagement';
import OrderManagement from './OrderManagement';
import LocationTracking from './LocationTracking';
import FleetManagement from './FleetManagement';
import CompanyProfile from './CompanyProfile';
import TMSChatAssistant from './TMSChatAssistant';
import DepartmentPanel from './DepartmentPanel';

const Dashboard = () => {
  const { user, logout, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const isPlatformAdmin = user?.role === 'platform_admin' || (user?.email && user.email.toLowerCase() === 'aminderpro@gmail.com');
  const [activeTab, setActiveTab] = useState((user?.role === 'fleet_owner' || isPlatformAdmin) ? 'fleet' : 'equipment');
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load company info
      try {
        const companyResponse = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`);
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompany(companyData);
        }
      } catch (error) {
        console.log('No company found for user');
      }

      // Load equipment stats
      if (user?.role === 'fleet_owner') {
        try {
          const equipmentResponse = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
          if (equipmentResponse.ok) {
            const equipmentData = await equipmentResponse.json();
            const availableCount = equipmentData.filter(eq => eq.is_available).length;
            setStats(prev => ({
              ...prev,
              totalEquipment: equipmentData.length,
              availableEquipment: availableCount
            }));
          }
        } catch (error) {
          console.error('Error loading equipment:', error);
        }

        // Load driver stats
        try {
          const driversResponse = await fetchWithAuth(`${BACKEND_URL}/api/drivers/my`);
          if (driversResponse.ok) {
            const driversData = await driversResponse.json();
            setStats(prev => ({ ...prev, totalDrivers: driversData.length }));
          }
        } catch (error) {
          console.error('Error loading drivers:', error);
        }
      }

      // Load booking stats
      try {
        const bookingsResponse = await fetchWithAuth(`${BACKEND_URL}/api/bookings/my`);
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          const activeCount = bookingsData.filter(booking => 
            ['pending', 'approved'].includes(booking.status)
          ).length;
          setStats(prev => ({ ...prev, activeBookings: activeCount }));
        }
      } catch (error) {
        console.error('Error loading bookings:', error);
      }
    } catch (error) {
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending Verification', className: 'status-pending' },
      verified: { label: 'Verified', className: 'status-verified' },
      rejected: { label: 'Rejected', className: 'status-rejected' }
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

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
                    onClick={logout}
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
            {/* Department-specific content will go here in Phase 2 */}
            {/* For now, showing current TMS tabs as default */}
            <Card className="dashboard-card">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className={`grid w-full ${(user?.role === 'fleet_owner' || isPlatformAdmin) ? 'grid-cols-5' : 'grid-cols-3'}`}>
                    {(user?.role === 'fleet_owner' || isPlatformAdmin) && (
                      <TabsTrigger value="fleet" data-testid="fleet-tab">
                        <i className="fas fa-tachometer-alt mr-2"></i>
                        Transport Hub - TMS
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="equipment" data-testid="equipment-tab">
                      <i className="fas fa-truck mr-2"></i>
                      Equipment
                    </TabsTrigger>
                    {(user?.role === 'fleet_owner' || isPlatformAdmin) && (
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

                  {(user?.role === 'fleet_owner' || isPlatformAdmin) && (
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

                  {(user?.role === 'fleet_owner' || isPlatformAdmin) && (
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