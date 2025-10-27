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
  const [showRateConfirmation, setShowRateConfirmation] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsingDocument, setParsingDocument] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
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
    confirmed_rate: '',
    notes: '',
    start_date: '',
    end_date: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadOrders();
    loadEquipment();
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

  const loadEquipment = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmedRateChange = (value) => {
    // Remove all non-numeric characters except decimal point
    let numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (numericValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = numericValue.split('.');
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    const decimalIndex = numericValue.indexOf('.');
    if (decimalIndex !== -1 && numericValue.length - decimalIndex > 3) {
      numericValue = numericValue.substring(0, decimalIndex + 3);
    }
    
    setFormData(prev => ({ ...prev, confirmed_rate: numericValue }));
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const number = parseFloat(value);
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const resetForm = () => {
    setFormData({
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
      confirmed_rate: '',
      notes: '',
      start_date: '',
      end_date: ''
    });
  };

  const handleSubmitOrder = async () => {
    try {
      // Validate required fields
      if (!formData.equipment_id) {
        toast.error('Please select equipment');
        return;
      }
      if (!formData.pickup_location || !formData.delivery_location) {
        toast.error('Please provide pickup and delivery locations');
        return;
      }
      if (!formData.start_date || !formData.end_date) {
        toast.error('Please provide start and end dates');
        return;
      }

      const orderData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        cubes: formData.cubes ? parseFloat(formData.cubes) : null,
        confirmed_rate: formData.confirmed_rate ? parseFloat(formData.confirmed_rate) : null,
        pickup_time_planned: formData.pickup_time_planned || null,
        delivery_time_planned: formData.delivery_time_planned || null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };

      // Determine if we're creating or updating
      const isEditing = editingOrder !== null;
      const url = isEditing 
        ? `${BACKEND_URL}/api/bookings/${editingOrder.id}`
        : `${BACKEND_URL}/api/bookings`;
      
      const response = await fetchWithAuth(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        toast.success(isEditing ? 'Order updated successfully!' : 'Order created successfully!');
        setShowOrderForm(false);
        setEditingOrder(null);
        resetForm();
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || (isEditing ? 'Failed to update order' : 'Failed to create order'));
      }
    } catch (error) {
      toast.error(isEditing ? 'Error updating order' : 'Error creating order');
    }
  };

  const handleEditOrder = (order) => {
    // Only allow editing if order is pending
    if (order.status !== 'pending') {
      toast.error('Only orders with "Pending" status can be edited');
      return;
    }

    // Convert datetime fields for form inputs
    const formatDateForInput = (dateTime) => {
      if (!dateTime) return '';
      const date = new Date(dateTime);
      return date.toISOString().slice(0, 10);
    };

    const formatDateTimeForInput = (dateTime) => {
      if (!dateTime) return '';
      const date = new Date(dateTime);
      return date.toISOString().slice(0, 16);
    };

    // Populate form with order data
    setFormData({
      equipment_id: order.equipment_id || '',
      shipper_name: order.shipper_name || '',
      shipper_address: order.shipper_address || '',
      pickup_location: order.pickup_location || '',
      pickup_city: order.pickup_city || '',
      pickup_state: order.pickup_state || '',
      pickup_country: order.pickup_country || 'USA',
      delivery_location: order.delivery_location || '',
      delivery_city: order.delivery_city || '',
      delivery_state: order.delivery_state || '',
      delivery_country: order.delivery_country || 'USA',
      commodity: order.commodity || '',
      weight: order.weight || '',
      cubes: order.cubes || '',
      tractor_number: order.tractor_number || '',
      trailer_number: order.trailer_number || '',
      driver_name: order.driver_name || '',
      driver_id: order.driver_id || '',
      pickup_time_planned: formatDateTimeForInput(order.pickup_time_planned),
      delivery_time_planned: formatDateTimeForInput(order.delivery_time_planned),
      confirmed_rate: order.confirmed_rate || '',
      notes: order.notes || '',
      start_date: formatDateForInput(order.start_date),
      end_date: formatDateForInput(order.end_date)
    });

    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_transit_pickup', label: 'In-Transit Pick up' },
    { value: 'at_pickup', label: 'At Pick up' },
    { value: 'in_transit_delivery', label: 'In Transit to Delivery' },
    { value: 'at_delivery', label: 'At Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'invoiced', label: 'Invoiced' },
    { value: 'payment_overdue', label: 'Payment OverDue' },
    { value: 'paid', label: 'Paid' }
  ];

  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      planned: 'bg-blue-100 text-blue-800 border-blue-300',
      in_transit_pickup: 'bg-purple-100 text-purple-800 border-purple-300',
      at_pickup: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      in_transit_delivery: 'bg-purple-100 text-purple-800 border-purple-300',
      at_delivery: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      invoiced: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      payment_overdue: 'bg-red-100 text-red-800 border-red-300',
      paid: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    };
    return statusColors[status] || statusColors.pending;
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${orderId}/status?status=${newStatus}`, {
        method: 'PATCH'
      });

      if (response.ok) {
        toast.success('Status updated successfully');
        loadOrders();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating status');
    }
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleParseRateConfirmation = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setParsingDocument(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', uploadedFile);

      // Use fetch directly with Authorization header for file upload
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/bookings/parse-rate-confirmation`, {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          // Pre-fill the form with extracted data
          const extractedData = result.data;
          
          setFormData(prev => ({
            ...prev,
            shipper_name: extractedData.shipper_name || '',
            shipper_address: extractedData.shipper_address || '',
            pickup_location: extractedData.pickup_location || '',
            pickup_city: extractedData.pickup_city || '',
            pickup_state: extractedData.pickup_state || '',
            pickup_country: extractedData.pickup_country || 'USA',
            delivery_location: extractedData.delivery_location || '',
            delivery_city: extractedData.delivery_city || '',
            delivery_state: extractedData.delivery_state || '',
            delivery_country: extractedData.delivery_country || 'USA',
            commodity: extractedData.commodity || '',
            weight: extractedData.weight || '',
            cubes: extractedData.cubes || '',
            tractor_number: extractedData.tractor_number || '',
            trailer_number: extractedData.trailer_number || '',
            driver_name: extractedData.driver_name || '',
            driver_id: extractedData.driver_id || '',
            pickup_time_planned: extractedData.pickup_time_planned ? extractedData.pickup_time_planned.slice(0, 16) : '',
            delivery_time_planned: extractedData.delivery_time_planned ? extractedData.delivery_time_planned.slice(0, 16) : '',
            confirmed_rate: extractedData.confirmed_rate || '',
            notes: extractedData.notes || ''
          }));

          toast.success('Document parsed successfully! Review and submit the order.');
          setShowRateConfirmation(false);
          setShowOrderForm(true);
        } else {
          toast.error('Failed to extract data from document');
        }
      } else {
        const error = await response.json();
        
        // Handle different error formats
        let errorMessage = 'Failed to parse document';
        
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            // Handle FastAPI validation errors
            errorMessage = error.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
          } else if (typeof error.detail === 'object') {
            errorMessage = JSON.stringify(error.detail);
          }
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      toast.error(`Error parsing document: ${error.message || 'Unknown error'}`);
    } finally {
      setParsingDocument(false);
    }
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
          
          {/* Rate Confirmation Dialog */}
          <Dialog open={showRateConfirmation} onOpenChange={setShowRateConfirmation}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <i className="fas fa-file-invoice mr-2"></i>
                Rate Confirmation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Rate Confirmation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-sm text-gray-600">
                  Upload a rate confirmation document (PDF or image) and our AI will automatically extract order details.
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rate-confirmation-file">Document File</Label>
                  <Input
                    id="rate-confirmation-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={parsingDocument}
                  />
                  {uploadedFile && (
                    <div className="text-sm text-green-600 flex items-center">
                      <i className="fas fa-check-circle mr-2"></i>
                      {uploadedFile.name}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-blue-600 mt-0.5 mr-2"></i>
                    <div>
                      <p className="font-semibold text-blue-900">AI-Powered Extraction</p>
                      <p className="text-blue-700 mt-1">
                        Our AI will extract shipper details, pickup/delivery locations, commodity info, and more from your document.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRateConfirmation(false);
                      setUploadedFile(null);
                    }}
                    disabled={parsingDocument}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleParseRateConfirmation}
                    disabled={!uploadedFile || parsingDocument}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {parsingDocument ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Parsing Document...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic mr-2"></i>
                        Parse & Create Order
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <i className="fas fa-plus mr-2"></i>
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? 'Edit Order' : 'Create New Order'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Equipment Selection */}
                <div className="space-y-2">
                  <Label htmlFor="equipment_id">Equipment *</Label>
                  <Select value={formData.equipment_id} onValueChange={(value) => handleInputChange('equipment_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map(eq => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shipper Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Shipper Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shipper_name">Shipper Name</Label>
                      <Input
                        id="shipper_name"
                        value={formData.shipper_name}
                        onChange={(e) => handleInputChange('shipper_name', e.target.value)}
                        placeholder="Enter shipper name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipper_address">Shipper Address</Label>
                      <Input
                        id="shipper_address"
                        value={formData.shipper_address}
                        onChange={(e) => handleInputChange('shipper_address', e.target.value)}
                        placeholder="Enter shipper address"
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Pickup Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup_location">Pickup Location *</Label>
                      <Input
                        id="pickup_location"
                        value={formData.pickup_location}
                        onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                        placeholder="Enter pickup address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_city">Pickup City</Label>
                      <Input
                        id="pickup_city"
                        value={formData.pickup_city}
                        onChange={(e) => handleInputChange('pickup_city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_state">Pickup State</Label>
                      <Input
                        id="pickup_state"
                        value={formData.pickup_state}
                        onChange={(e) => handleInputChange('pickup_state', e.target.value)}
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_country">Pickup Country</Label>
                      <Input
                        id="pickup_country"
                        value={formData.pickup_country}
                        onChange={(e) => handleInputChange('pickup_country', e.target.value)}
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_time_planned">Planned Pickup Time</Label>
                      <Input
                        id="pickup_time_planned"
                        type="datetime-local"
                        value={formData.pickup_time_planned}
                        onChange={(e) => handleInputChange('pickup_time_planned', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Delivery Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_location">Delivery Location *</Label>
                      <Input
                        id="delivery_location"
                        value={formData.delivery_location}
                        onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                        placeholder="Enter delivery address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_city">Delivery City</Label>
                      <Input
                        id="delivery_city"
                        value={formData.delivery_city}
                        onChange={(e) => handleInputChange('delivery_city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_state">Delivery State</Label>
                      <Input
                        id="delivery_state"
                        value={formData.delivery_state}
                        onChange={(e) => handleInputChange('delivery_state', e.target.value)}
                        placeholder="Enter state"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_country">Delivery Country</Label>
                      <Input
                        id="delivery_country"
                        value={formData.delivery_country}
                        onChange={(e) => handleInputChange('delivery_country', e.target.value)}
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_time_planned">Planned Delivery Time</Label>
                      <Input
                        id="delivery_time_planned"
                        type="datetime-local"
                        value={formData.delivery_time_planned}
                        onChange={(e) => handleInputChange('delivery_time_planned', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Cargo Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Cargo Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commodity">Commodity</Label>
                      <Input
                        id="commodity"
                        value={formData.commodity}
                        onChange={(e) => handleInputChange('commodity', e.target.value)}
                        placeholder="Enter commodity type"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (lbs)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="Enter weight"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cubes">Cubes (cu ft)</Label>
                      <Input
                        id="cubes"
                        type="number"
                        value={formData.cubes}
                        onChange={(e) => handleInputChange('cubes', e.target.value)}
                        placeholder="Enter cubic feet"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle and Driver Information */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Vehicle & Driver Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tractor_number">Tractor Number</Label>
                      <Input
                        id="tractor_number"
                        value={formData.tractor_number}
                        onChange={(e) => handleInputChange('tractor_number', e.target.value)}
                        placeholder="Enter tractor number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trailer_number">Trailer Number</Label>
                      <Input
                        id="trailer_number"
                        value={formData.trailer_number}
                        onChange={(e) => handleInputChange('trailer_number', e.target.value)}
                        placeholder="Enter trailer number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_name">Driver Name</Label>
                      <Input
                        id="driver_name"
                        value={formData.driver_name}
                        onChange={(e) => handleInputChange('driver_name', e.target.value)}
                        placeholder="Enter driver name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driver_id">Driver ID</Label>
                      <Input
                        id="driver_id"
                        value={formData.driver_id}
                        onChange={(e) => handleInputChange('driver_id', e.target.value)}
                        placeholder="Enter driver ID"
                      />
                    </div>
                  </div>
                </div>

                {/* Date and Notes */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmed_rate">Confirmed Rate ($)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          id="confirmed_rate"
                          type="text"
                          value={formData.confirmed_rate}
                          onChange={(e) => handleConfirmedRateChange(e.target.value)}
                          onBlur={(e) => {
                            // Format on blur
                            if (formData.confirmed_rate) {
                              const formatted = formatCurrency(formData.confirmed_rate);
                              if (formatted) {
                                setFormData(prev => ({ ...prev, confirmed_rate: parseFloat(formData.confirmed_rate).toFixed(2) }));
                              }
                            }
                          }}
                          onFocus={(e) => {
                            // Remove formatting on focus for easier editing
                            if (formData.confirmed_rate) {
                              e.target.select();
                            }
                          }}
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Enter numeric value only (e.g., 1250.50)</p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Enter any additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => {
                    setShowOrderForm(false);
                    setEditingOrder(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitOrder} className="btn-primary">
                    {editingOrder ? 'Update Order' : 'Create Order'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
            <div className="flex gap-2 flex-wrap">
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
                variant={filterStatus === 'planned' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('planned')}
                size="sm"
              >
                Planned
              </Button>
              <Button
                variant={filterStatus === 'in_transit_pickup' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('in_transit_pickup')}
                size="sm"
              >
                In-Transit
              </Button>
              <Button
                variant={filterStatus === 'delivered' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('delivered')}
                size="sm"
              >
                Delivered
              </Button>
              <Button
                variant={filterStatus === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('paid')}
                size="sm"
              >
                Paid
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Confirmed Rate</th>
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
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className={`w-48 ${getStatusColor(order.status)} border`}>
                            <SelectValue>
                              {getStatusLabel(order.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-green-700">
                        {order.confirmed_rate ? `$${order.confirmed_rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
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
                          <Button size="sm" variant="outline" title="View Order">
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditOrder(order)}
                            disabled={order.status !== 'pending'}
                            title={order.status === 'pending' ? 'Edit Order' : 'Only pending orders can be edited'}
                            className={order.status !== 'pending' ? 'opacity-50 cursor-not-allowed' : ''}
                          >
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
