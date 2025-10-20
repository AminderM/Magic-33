import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const OrderManagement = () => {
  const { user, fetchWithAuth } = useAuth();
  const [orders, setOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    shipper_name: '',
    shipper_address: '',
    pickup_location: '',
    pickup_city: '',
    pickup_state: '',
    pickup_country: 'USA',
    delivery_location: '',
    delivery_city: '',
    delivery_state: '',
    delivery_country: 'USA',
    commodity: '',
    weight: '',
    cubes: '',
    tractor_number: '',
    trailer_number: '',
    driver_name: '',
    driver_id: '',
    pickup_time_planned: '',
    delivery_time_planned: '',
    notes: '',
    start_date: '',
    end_date: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      let endpoint = `${BACKEND_URL}/api/bookings/my`;
      
      if (user?.role === 'fleet_owner') {
        endpoint = `${BACKEND_URL}/api/bookings/requests`;
      }
      
      const response = await fetchWithAuth(endpoint);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      rejected: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    return (
      <Badge className={`${statusStyles[status] || statusStyles.pending} border`}>
        {status?.toUpperCase()}
      </Badge>
    );
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipper_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.commodity?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">Track and manage all shipment orders</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadOrders}>
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>
          <Button className="btn-primary">
            <i className="fas fa-plus mr-2"></i>
            New Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by order #, shipper, driver, or commodity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                size="sm"
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('approved')}
                size="sm"
              >
                Approved
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('completed')}
                size="sm"
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-clipboard-list text-gray-400 text-5xl mb-4"></i>
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Order #</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Shipper Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Shipper Address</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Pickup Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Pickup City</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Pickup State</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Pickup Country</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Delivery Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Delivery City</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Delivery State</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Delivery Country</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Commodity</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Weight (lbs)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Cubes (cu ft)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Tractor #</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Trailer #</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Driver Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Driver ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Pickup Time (Planned)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Pickup Time (Actual)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Delivery Time (Planned)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Delivery Time (Actual)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600">
                        {order.order_number || order.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.shipper_name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.shipper_address || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.pickup_location || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.pickup_city || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.pickup_state || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.pickup_country || 'USA'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.delivery_location || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.delivery_city || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.delivery_state || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.delivery_country || 'USA'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.commodity || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {order.weight ? order.weight.toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {order.cubes ? order.cubes.toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.tractor_number || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.trailer_number || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.driver_name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{order.driver_id || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(order.pickup_time_planned)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(order.pickup_time_actual)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(order.delivery_time_planned)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDateTime(order.delivery_time_actual)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-edit"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderManagement;
