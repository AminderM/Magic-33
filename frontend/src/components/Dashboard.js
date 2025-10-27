import React, { useState, useEffect } from 'react';
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

const Dashboard = () => {
  const { user, logout, fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'fleet_owner' ? 'fleet' : 'equipment');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white" data-testid="dashboard-title">
                Welcome, {user?.full_name}
              </h1>
              <p className="text-gray-300 mt-2">
                {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                <div className="font-semibold">{company?.name || 'No Company'}</div>
                {company && getStatusBadge(company.verification_status)}
              </div>
              
              {/* Company Profile Dropdown */}
              <div className="relative group">
                <Button 
                  variant="outline" 
                  className="text-white border-white hover:bg-white hover:text-gray-900"
                >
                  <i className="fas fa-building mr-2"></i>
                  Company
                  <i className="fas fa-chevron-down ml-2"></i>
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-id-card mr-2"></i>
                    Company Profile
                  </button>
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

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Equipment</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="total-equipment-stat">
                    {stats.totalEquipment}
                  </p>
                </div>
                <div className="text-blue-600 text-2xl">
                  <i className="fas fa-truck"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available Equipment</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="available-equipment-stat">
                    {stats.availableEquipment}
                  </p>
                </div>
                <div className="text-green-600 text-2xl">
                  <i className="fas fa-check-circle"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Bookings</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="active-bookings-stat">
                    {stats.activeBookings}
                  </p>
                </div>
                <div className="text-orange-600 text-2xl">
                  <i className="fas fa-calendar-check"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Drivers</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="total-drivers-stat">
                    {stats.totalDrivers}
                  </p>
                </div>
                <div className="text-purple-600 text-2xl">
                  <i className="fas fa-users"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${user?.role === 'fleet_owner' ? 'grid-cols-5' : 'grid-cols-3'}`}>
                {user?.role === 'fleet_owner' && (
                  <TabsTrigger value="fleet" data-testid="fleet-tab">
                    <i className="fas fa-tachometer-alt mr-2"></i>
                    Transport Hub - TMS
                  </TabsTrigger>
                )}
                <TabsTrigger value="equipment" data-testid="equipment-tab">
                  <i className="fas fa-truck mr-2"></i>
                  Equipment
                </TabsTrigger>
                {user?.role === 'fleet_owner' && (
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

              {user?.role === 'fleet_owner' && (
                <TabsContent value="fleet" className="mt-6">
                  <FleetManagement />
                </TabsContent>
              )}

              <TabsContent value="equipment" className="mt-6">
                <EquipmentManagement 
                  onStatsUpdate={setStats} 
                  onTrackEquipment={(equipmentId) => {
                    setSelectedEquipmentForTracking(equipmentId);
                    setActiveTab('location-tracking');
                  }}
                />
              </TabsContent>

              <TabsContent value="bookings" className="mt-6">
                <OrderManagement />
              </TabsContent>

              {user?.role === 'fleet_owner' && (
                <TabsContent value="drivers" className="mt-6">
                  <DriverManagement onStatsUpdate={setStats} />
                </TabsContent>
              )}

              <TabsContent value="tracking" className="mt-6">
                <LocationTracking />
              </TabsContent>

              <TabsContent value="profile" className="mt-6">
                <CompanyProfile />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;