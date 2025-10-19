import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EquipmentManagement from './EquipmentManagement';
import DriverManagement from './DriverManagement';
import LocationTracking from './LocationTracking';

const FleetManagement = () => {
  const { user, fetchWithAuth } = useAuth();
  const [fleetStats, setFleetStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    onDutyEquipment: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    activeBookings: 0,
    utilizationRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      // Load equipment data
      const equipmentResponse = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
        
        const available = equipmentData.filter(eq => eq.is_available).length;
        const onDuty = equipmentData.filter(eq => !eq.is_available && eq.current_driver_id).length;
        
        setFleetStats(prev => ({
          ...prev,
          totalEquipment: equipmentData.length,
          availableEquipment: available,
          onDutyEquipment: onDuty,
          utilizationRate: equipmentData.length > 0 ? Math.round((onDuty / equipmentData.length) * 100) : 0
        }));
      }

      // Load drivers data
      const driversResponse = await fetchWithAuth(`${BACKEND_URL}/api/drivers/my`);
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        setDrivers(driversData);
        
        const activeDriversCount = driversData.filter(driver => driver.is_active).length;
        setFleetStats(prev => ({
          ...prev,
          totalDrivers: driversData.length,
          activeDrivers: activeDriversCount
        }));
      }

      // Load booking data for revenue and active bookings
      const bookingsResponse = await fetchWithAuth(`${BACKEND_URL}/api/bookings/requests`);
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        
        const activeBookings = bookingsData.filter(booking => 
          ['pending', 'approved'].includes(booking.status)
        ).length;
        
        const totalRevenue = bookingsData
          .filter(booking => booking.status === 'completed')
          .reduce((sum, booking) => sum + (booking.total_cost || 0), 0);
        
        setFleetStats(prev => ({
          ...prev,
          activeBookings,
          totalRevenue
        }));
        
        // Generate recent activity from bookings
        const recentActivities = bookingsData
          .slice(0, 5)
          .map(booking => ({
            id: booking.id,
            type: 'booking',
            description: `New booking for ${getEquipmentName(booking.equipment_id)}`,
            timestamp: booking.created_at,
            status: booking.status,
            amount: booking.total_cost
          }));
        
        setRecentActivity(recentActivities);
      }

    } catch (error) {
      toast.error('Error loading fleet data');
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Unknown Equipment';
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      unavailable: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      onduty: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6\">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4\">
        <div>
          <h1 className="text-3xl font-bold text-gray-900\" data-testid=\"fleet-management-title\">
            Fleet Management
          </h1>
          <p className="text-gray-600 mt-1\">
            Comprehensive overview and management of your fleet operations
          </p>
        </div>
        
        <div className="flex items-center space-x-3\">
          <Button 
            variant=\"outline\" 
            onClick={loadFleetData}
            data-testid=\"refresh-fleet-data-btn\"
          >
            <i className="fas fa-sync-alt mr-2\"></i>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Fleet Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        <Card className="dashboard-card\">
          <CardContent className="p-6\">
            <div className="flex items-center justify-between\">
              <div>
                <p className="text-sm font-medium text-gray-600\">Total Equipment</p>
                <p className="text-3xl font-bold text-blue-600\" data-testid=\"total-equipment-count\">
                  {fleetStats.totalEquipment}
                </p>
                <p className="text-xs text-gray-500 mt-1\">
                  {fleetStats.availableEquipment} available
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center\">
                <i className="fas fa-truck text-blue-600 text-xl\"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card\">
          <CardContent className="p-6\">
            <div className="flex items-center justify-between\">
              <div>
                <p className="text-sm font-medium text-gray-600\">Fleet Utilization</p>
                <p className="text-3xl font-bold text-green-600\" data-testid=\"utilization-rate\">
                  {fleetStats.utilizationRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1\">
                  {fleetStats.onDutyEquipment} units on duty
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center\">
                <i className="fas fa-chart-line text-green-600 text-xl\"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card\">
          <CardContent className="p-6\">
            <div className="flex items-center justify-between\">
              <div>
                <p className="text-sm font-medium text-gray-600\">Active Drivers</p>
                <p className="text-3xl font-bold text-purple-600\" data-testid=\"active-drivers-count\">
                  {fleetStats.activeDrivers}
                </p>
                <p className="text-xs text-gray-500 mt-1\">
                  of {fleetStats.totalDrivers} total
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center\">
                <i className="fas fa-users text-purple-600 text-xl\"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card\">
          <CardContent className="p-6\">
            <div className="flex items-center justify-between\">
              <div>
                <p className="text-sm font-medium text-gray-600\">Total Revenue</p>
                <p className="text-3xl font-bold text-orange-600\" data-testid=\"total-revenue\">
                  {formatCurrency(fleetStats.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1\">
                  {fleetStats.activeBookings} active bookings
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center\">
                <i className="fas fa-dollar-sign text-orange-600 text-xl\"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full\">
        <TabsList className="grid w-full grid-cols-5\">
          <TabsTrigger value=\"overview\" data-testid=\"overview-tab\">
            <i className="fas fa-dashboard mr-2\"></i>
            Overview
          </TabsTrigger>
          <TabsTrigger value=\"equipment\" data-testid=\"equipment-tab\">
            <i className="fas fa-truck mr-2\"></i>
            Equipment
          </TabsTrigger>
          <TabsTrigger value=\"drivers\" data-testid=\"drivers-tab\">
            <i className="fas fa-users mr-2\"></i>
            Drivers
          </TabsTrigger>
          <TabsTrigger value=\"tracking\" data-testid=\"tracking-tab\">
            <i className="fas fa-map-marker-alt mr-2\"></i>
            Live Tracking
          </TabsTrigger>
          <TabsTrigger value=\"analytics\" data-testid=\"analytics-tab\">
            <i className="fas fa-chart-bar mr-2\"></i>
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value=\"overview\" className="mt-6\">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Fleet Status Overview */}
            <Card className="dashboard-card\">
              <CardHeader>
                <CardTitle className="flex items-center\">
                  <i className="fas fa-tachometer-alt mr-2 text-blue-600\"></i>
                  Fleet Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4\">
                  {equipment.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg\" data-testid={`fleet-item-${item.id}`}>
                      <div className="flex items-center space-x-3\">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center\">
                          <i className="fas fa-truck text-blue-600\"></i>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900\">{item.name}</p>
                          <p className="text-sm text-gray-500\">{item.equipment_type?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2\">
                        <Badge className={getStatusColor(item.is_available ? 'available' : 'unavailable')}>
                          {item.is_available ? 'Available' : 'In Use'}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900\">
                          {formatCurrency(item.daily_rate)}/day
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {equipment.length === 0 && (
                    <div className="text-center py-8 text-gray-500\">
                      <i className="fas fa-truck text-4xl mb-4 opacity-50\"></i>
                      <p>No equipment in your fleet yet</p>
                      <Button 
                        onClick={() => setActiveTab('equipment')} 
                        className="mt-4 btn-primary\"
                        data-testid=\"add-first-equipment-btn\"
                      >
                        Add Your First Equipment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="dashboard-card\">
              <CardHeader>
                <CardTitle className="flex items-center justify-between\">
                  <span className="flex items-center\">
                    <i className="fas fa-clock mr-2 text-green-600\"></i>
                    Recent Activity
                  </span>
                  <Button size=\"sm\" variant=\"outline\" data-testid=\"view-all-activity-btn\">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4\">
                  {recentActivity.length > 0 ? recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border-l-4 border-blue-200 bg-blue-50 rounded-r-lg\" data-testid={`activity-${activity.id}`}>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0\">
                        <i className="fas fa-calendar text-blue-600 text-sm\"></i>
                      </div>
                      <div className="flex-1 min-w-0\">
                        <p className="text-sm font-medium text-gray-900\">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1\">
                          <p className="text-xs text-gray-500\">{formatDate(activity.timestamp)}</p>
                          {activity.amount && (
                            <span className="text-xs font-medium text-green-600\">
                              {formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500\">
                      <i className="fas fa-history text-4xl mb-4 opacity-50\"></i>
                      <p>No recent activity</p>
                      <p className="text-xs mt-2\">Activity will appear here as you use the platform</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="dashboard-card mt-6\">
            <CardHeader>
              <CardTitle className="flex items-center\">
                <i className="fas fa-bolt mr-2 text-yellow-600\"></i>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
                <Button 
                  onClick={() => setActiveTab('equipment')} 
                  className="flex flex-col items-center p-6 h-auto space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200\"
                  variant=\"outline\"
                  data-testid=\"quick-add-equipment-btn\"
                >
                  <i className="fas fa-plus-circle text-2xl\"></i>
                  <span>Add Equipment</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('drivers')} 
                  className="flex flex-col items-center p-6 h-auto space-y-2 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200\"
                  variant=\"outline\"
                  data-testid=\"quick-add-driver-btn\"
                >
                  <i className="fas fa-user-plus text-2xl\"></i>
                  <span>Add Driver</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('tracking')} 
                  className="flex flex-col items-center p-6 h-auto space-y-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200\"
                  variant=\"outline\"
                  data-testid=\"quick-track-fleet-btn\"
                >
                  <i className="fas fa-map-marked-alt text-2xl\"></i>
                  <span>Track Fleet</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab('analytics')} 
                  className="flex flex-col items-center p-6 h-auto space-y-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-orange-200\"
                  variant=\"outline\"
                  data-testid=\"quick-view-analytics-btn\"
                >
                  <i className="fas fa-chart-line text-2xl\"></i>
                  <span>View Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value=\"equipment\" className="mt-6\">
          <EquipmentManagement onStatsUpdate={setFleetStats} />
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value=\"drivers\" className="mt-6\">
          <DriverManagement onStatsUpdate={setFleetStats} />
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value=\"tracking\" className="mt-6\">
          <LocationTracking />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value=\"analytics\" className="mt-6\">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* Performance Metrics */}
            <Card className="dashboard-card\">
              <CardHeader>
                <CardTitle className="flex items-center\">
                  <i className="fas fa-chart-bar mr-2 text-blue-600\"></i>
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6\">
                  <div>
                    <div className="flex justify-between items-center mb-2\">
                      <span className="text-sm font-medium text-gray-600\">Fleet Utilization</span>
                      <span className="text-sm font-bold text-blue-600\">{fleetStats.utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2\">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300\" 
                        style={{ width: `${fleetStats.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2\">
                      <span className="text-sm font-medium text-gray-600\">Driver Efficiency</span>
                      <span className="text-sm font-bold text-green-600\">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2\">
                      <div className="bg-green-600 h-2 rounded-full transition-all duration-300\" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2\">
                      <span className="text-sm font-medium text-gray-600\">Equipment Health</span>
                      <span className="text-sm font-bold text-yellow-600\">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2\">
                      <div className="bg-yellow-500 h-2 rounded-full transition-all duration-300\" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Analytics */}
            <Card className="dashboard-card\">
              <CardHeader>
                <CardTitle className="flex items-center\">
                  <i className="fas fa-dollar-sign mr-2 text-green-600\"></i>
                  Revenue Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4\">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg\">
                    <div>
                      <p className="text-sm font-medium text-gray-600\">This Month</p>
                      <p className="text-2xl font-bold text-green-600\">{formatCurrency(fleetStats.totalRevenue * 0.3)}</p>
                    </div>
                    <i className="fas fa-arrow-up text-green-600 text-xl\"></i>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg\">
                    <div>
                      <p className="text-sm font-medium text-gray-600\">Average per Equipment</p>
                      <p className="text-2xl font-bold text-blue-600\">
                        {formatCurrency(fleetStats.totalEquipment > 0 ? fleetStats.totalRevenue / fleetStats.totalEquipment : 0)}
                      </p>
                    </div>
                    <i className="fas fa-calculator text-blue-600 text-xl\"></i>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg\">
                    <div>
                      <p className="text-sm font-medium text-gray-600\">Projected Annual</p>
                      <p className="text-2xl font-bold text-purple-600\">{formatCurrency(fleetStats.totalRevenue * 4)}</p>
                    </div>
                    <i className="fas fa-chart-line text-purple-600 text-xl\"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipment Type Distribution */}
          <Card className="dashboard-card mt-6\">
            <CardHeader>
              <CardTitle className="flex items-center\">
                <i className="fas fa-pie-chart mr-2 text-orange-600\"></i>
                Fleet Composition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
                {Object.entries(
                  equipment.reduce((acc, item) => {
                    const type = item.equipment_type?.replace('_', ' ').toUpperCase() || 'UNKNOWN';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg\">
                    <div>
                      <p className="font-semibold text-gray-900\">{type}</p>
                      <p className="text-sm text-gray-500\">{count} units</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600\">
                      {fleetStats.totalEquipment > 0 ? Math.round((count / fleetStats.totalEquipment) * 100) : 0}%
                    </div>
                  </div>
                ))}
                
                {equipment.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500\">
                    <i className="fas fa-chart-pie text-4xl mb-4 opacity-50\"></i>
                    <p>No equipment data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;"