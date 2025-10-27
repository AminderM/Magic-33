import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const DriverManagement = ({ onStatsUpdate }) => {
  const { user, fetchWithAuth } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('tile'); // 'list' or 'tile'
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/my`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
        // Update stats
        if (onStatsUpdate) {
          onStatsUpdate(prev => ({ ...prev, totalDrivers: data.length }));
        }
      }
    } catch (error) {
      toast.error('Error loading drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Driver account created successfully!');
        setShowAddForm(false);
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          password: ''
        });
        loadDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create driver account');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast.success('Password generated!');
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600">
            Create and manage driver accounts for your fleet
          </p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="add-driver-btn">
              <i className="fas fa-user-plus mr-2"></i>
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter driver's full name"
                  required
                  data-testid="driver-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter driver's email"
                  required
                  data-testid="driver-email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter driver's phone"
                  required
                  data-testid="driver-phone-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    required
                    data-testid="driver-password-input"
                  />
                  <Button 
                    type="button" 
                    onClick={generatePassword}
                    variant="outline"
                    size="sm"
                    data-testid="generate-password-btn"
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  The driver will use this password to login to their mobile app
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  data-testid="cancel-add-driver-btn"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  data-testid="save-driver-btn"
                >
                  {loading ? 'Creating...' : 'Create Driver Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search drivers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            data-testid="driver-search-input"
          />
        </div>
      </div>

      {/* Drivers Grid */}
      {filteredDrivers.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Drivers Added Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create driver accounts to allow your drivers to use the mobile app for real-time tracking and updates.
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
              data-testid="add-first-driver-btn"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Add Your First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="dashboard-card" data-testid={`driver-card-${driver.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {driver.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900" data-testid={`driver-name-${driver.id}`}>
                      {driver.full_name}
                    </h3>
                    <Badge className="status-verified text-xs">
                      Active Driver
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-envelope w-4 mr-2"></i>
                    {driver.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-phone w-4 mr-2"></i>
                    {driver.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-calendar w-4 mr-2"></i>
                    Joined {new Date(driver.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    data-testid={`edit-driver-btn-${driver.id}`}
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    data-testid={`track-driver-btn-${driver.id}`}
                  >
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    Track
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Driver Stats */}
      {drivers.length > 0 && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Driver Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{drivers.length}</div>
                <div className="text-sm text-gray-600">Total Drivers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {drivers.filter(d => d.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active Drivers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Drivers On Duty</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverManagement;