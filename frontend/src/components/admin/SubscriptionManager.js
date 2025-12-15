import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, Package, Users, Building2, DollarSign, TrendingUp, 
  Edit, Trash2, Check, X, Search, UserPlus, Zap, Copy
} from 'lucide-react';

const SubscriptionManager = ({ BACKEND_URL, fetchWithAuth }) => {
  const [activeTab, setActiveTab] = useState('bundles');
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);

  // Bundle form
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    products: [],
    monthly_price: '',
    is_active: true
  });

  // Assignment form
  const [assignForm, setAssignForm] = useState({
    bundle_id: '',
    entity_type: 'user',
    entity_id: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadBundles(),
      loadProducts(),
      loadAssignments(),
      loadStats(),
      loadUsers(),
      loadCompanies()
    ]);
    setLoading(false);
  };

  const loadBundles = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles`);
      if (res.ok) {
        const data = await res.json();
        setBundles(data.bundles || []);
      }
    } catch (e) {
      console.error('Failed to load bundles:', e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/assignments`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load assignments:', e);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/stats/overview`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users?limit=500`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/companies`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || data || []);
      }
    } catch (e) {
      console.error('Failed to load companies:', e);
    }
  };

  const handleCreateBundle = async () => {
    if (!bundleForm.name || !bundleForm.monthly_price || bundleForm.products.length === 0) {
      toast.error('Please fill in bundle name, price, and select at least one product');
      return;
    }

    try {
      const payload = {
        name: bundleForm.name,
        description: bundleForm.description,
        products: bundleForm.products.map(p => ({
          product_id: p.id,
          product_name: p.name,
          included_seats: p.included_seats || 5,
          included_storage_gb: 10
        })),
        monthly_price: parseFloat(bundleForm.monthly_price),
        is_active: bundleForm.is_active
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Bundle created successfully');
        setShowBundleModal(false);
        resetBundleForm();
        loadBundles();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create bundle');
      }
    } catch (e) {
      toast.error('Failed to create bundle');
    }
  };

  const handleUpdateBundle = async () => {
    if (!bundleForm.name || !bundleForm.monthly_price) {
      toast.error('Please fill in bundle name and price');
      return;
    }

    try {
      const payload = {
        name: bundleForm.name,
        description: bundleForm.description,
        products: bundleForm.products.map(p => ({
          product_id: p.id || p.product_id,
          product_name: p.name || p.product_name,
          included_seats: p.included_seats || 5,
          included_storage_gb: 10
        })),
        monthly_price: parseFloat(bundleForm.monthly_price),
        is_active: bundleForm.is_active
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/${editingBundle.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Bundle updated successfully');
        setShowBundleModal(false);
        setEditingBundle(null);
        resetBundleForm();
        loadBundles();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to update bundle');
      }
    } catch (e) {
      toast.error('Failed to update bundle');
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/${bundleId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Bundle deleted');
        loadBundles();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to delete bundle');
      }
    } catch (e) {
      toast.error('Failed to delete bundle');
    }
  };

  const handleAssignBundle = async () => {
    if (!assignForm.bundle_id || !assignForm.entity_id) {
      toast.error('Please select a bundle and a user/company');
      return;
    }

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/assign`, {
        method: 'POST',
        body: JSON.stringify(assignForm)
      });

      if (res.ok) {
        toast.success('Subscription assigned successfully');
        setShowAssignModal(false);
        setAssignForm({ bundle_id: '', entity_type: 'user', entity_id: '', notes: '' });
        loadAssignments();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to assign subscription');
      }
    } catch (e) {
      toast.error('Failed to assign subscription');
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bundles/assignments/${assignmentId}/cancel`, {
        method: 'PUT'
      });

      if (res.ok) {
        toast.success('Subscription cancelled');
        loadAssignments();
        loadStats();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to cancel subscription');
      }
    } catch (e) {
      toast.error('Failed to cancel subscription');
    }
  };

  const openEditBundle = (bundle) => {
    setEditingBundle(bundle);
    setBundleForm({
      name: bundle.name,
      description: bundle.description || '',
      products: bundle.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        price: p.product_price || 0,
        included_seats: p.included_seats || 5
      })),
      monthly_price: bundle.monthly_price.toString(),
      is_active: bundle.is_active
    });
    setShowBundleModal(true);
  };

  const openAssignModal = (bundle = null) => {
    setSelectedBundle(bundle);
    setAssignForm({
      bundle_id: bundle?.id || '',
      entity_type: 'user',
      entity_id: '',
      notes: ''
    });
    setShowAssignModal(true);
  };

  const resetBundleForm = () => {
    setBundleForm({
      name: '',
      description: '',
      products: [],
      monthly_price: '',
      is_active: true
    });
    setEditingBundle(null);
  };

  const toggleProductInBundle = (product) => {
    const exists = bundleForm.products.find(p => p.id === product.id);
    if (exists) {
      setBundleForm(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== product.id)
      }));
    } else {
      setBundleForm(prev => ({
        ...prev,
        products: [...prev.products, { ...product, included_seats: product.default_seats || 5 }]
      }));
    }
  };

  const calculateOriginalPrice = () => {
    return bundleForm.products.reduce((sum, p) => sum + (p.price || 0), 0);
  };

  const calculateDiscount = () => {
    const original = calculateOriginalPrice();
    const monthly = parseFloat(bundleForm.monthly_price) || 0;
    if (original > 0 && monthly > 0) {
      return Math.round(((original - monthly) / original) * 100);
    }
    return 0;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Manager</h1>
          <p className="text-gray-600">Create product bundles and assign subscriptions to users and companies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAssignModal()} variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Subscription
          </Button>
          <Button onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bundles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_bundles}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_assignments}</p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">User Subscriptions</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.user_subscriptions}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Company Subscriptions</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.company_subscriptions}</p>
                </div>
                <Building2 className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Monthly Revenue (MRR)</p>
                  <p className="text-2xl font-bold">${stats.mrr?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bundles">
            <Package className="w-4 h-4 mr-2" />
            Product Bundles ({bundles.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <Users className="w-4 h-4 mr-2" />
            Subscriptions ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Zap className="w-4 h-4 mr-2" />
            Available Products ({products.length})
          </TabsTrigger>
        </TabsList>

        {/* Bundles Tab */}
        <TabsContent value="bundles" className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading bundles...</p>
            </div>
          ) : bundles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bundles Yet</h3>
                <p className="text-gray-600 mb-4">Create your first product bundle to get started</p>
                <Button onClick={() => { resetBundleForm(); setShowBundleModal(true); }} className="bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bundle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map(bundle => (
                <Card key={bundle.id} className={`relative ${!bundle.is_active ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{bundle.name}</CardTitle>
                        <CardDescription className="mt-1">{bundle.description}</CardDescription>
                      </div>
                      <Badge className={bundle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {bundle.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pricing */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">${bundle.monthly_price}</span>
                      <span className="text-gray-500">/month</span>
                      {bundle.discount_percentage > 0 && (
                        <Badge className="bg-red-100 text-red-800 ml-2">
                          {bundle.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                    {bundle.original_price > bundle.monthly_price && (
                      <p className="text-sm text-gray-500 line-through">
                        Original: ${bundle.original_price}/month
                      </p>
                    )}

                    {/* Products in Bundle */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Included Products:</p>
                      <div className="space-y-1">
                        {bundle.products?.map((prod, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                            {prod.product_name} ({prod.included_seats} seats)
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assignment Count */}
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-500">
                        {bundle.assignments_count || 0} active subscription(s)
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => openEditBundle(bundle)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openAssignModal(bundle)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteBundle(bundle.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {assignments.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No subscriptions assigned yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bundle</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Start Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assignments.map(assignment => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {assignment.entity_type === 'user' ? (
                                <Users className="w-4 h-4 text-purple-500" />
                              ) : (
                                <Building2 className="w-4 h-4 text-orange-500" />
                              )}
                              <span className="font-medium">{assignment.entity_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {assignment.entity_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{assignment.bundle_name}</td>
                          <td className="px-4 py-3 font-medium">${assignment.monthly_price}/mo</td>
                          <td className="px-4 py-3">
                            <Badge className={
                              assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                              assignment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }>
                              {assignment.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(assignment.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {assignment.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600"
                                onClick={() => handleCancelAssignment(assignment.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">${product.price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">{product.default_seats} seats included</p>
                    <div className="space-y-1">
                      {product.features?.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Badge className={product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                      {product.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Bundle Modal */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Create Product Bundle'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Bundle Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Bundle Name *</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="e.g., Enterprise Suite"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  placeholder="Describe what's included in this bundle"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <Label className="mb-2 block">Select Products to Include *</Label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {products.map(product => {
                  const isSelected = bundleForm.products.some(p => p.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProductInBundle(product)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{product.name}</span>
                        {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                      </div>
                      <p className="text-sm text-gray-600">${product.price}/mo</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Products Summary */}
            {bundleForm.products.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Products ({bundleForm.products.length})</h4>
                <div className="space-y-2">
                  {bundleForm.products.map(prod => (
                    <div key={prod.id} className="flex items-center justify-between text-sm">
                      <span>{prod.name}</span>
                      <span className="text-gray-600">${prod.price}/mo</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Original Total:</span>
                    <span>${calculateOriginalPrice()}/mo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Bundle Price *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    value={bundleForm.monthly_price}
                    onChange={(e) => setBundleForm({ ...bundleForm, monthly_price: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
                {calculateDiscount() > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {calculateDiscount()}% discount from original price
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={bundleForm.is_active}
                  onCheckedChange={(checked) => setBundleForm({ ...bundleForm, is_active: checked })}
                />
                <Label>Bundle is Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBundleModal(false); resetBundleForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={editingBundle ? handleUpdateBundle : handleCreateBundle}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingBundle ? 'Update Bundle' : 'Create Bundle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Subscription Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Bundle Selection */}
            <div>
              <Label>Select Bundle *</Label>
              <Select 
                value={assignForm.bundle_id} 
                onValueChange={(v) => setAssignForm({ ...assignForm, bundle_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundles.filter(b => b.is_active).map(bundle => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.name} (${bundle.monthly_price}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity Type */}
            <div>
              <Label>Assign To *</Label>
              <Select 
                value={assignForm.entity_type} 
                onValueChange={(v) => setAssignForm({ ...assignForm, entity_type: v, entity_id: '' })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Individual User</SelectItem>
                  <SelectItem value="company">Company/Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Selection */}
            <div>
              <Label>{assignForm.entity_type === 'user' ? 'Select User *' : 'Select Company *'}</Label>
              <Select 
                value={assignForm.entity_id} 
                onValueChange={(v) => setAssignForm({ ...assignForm, entity_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Choose a ${assignForm.entity_type}`} />
                </SelectTrigger>
                <SelectContent>
                  {assignForm.entity_type === 'user' ? (
                    users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))
                  ) : (
                    companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                placeholder="Any notes about this subscription"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignBundle} className="bg-blue-600 hover:bg-blue-700">
              Assign Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManager;
