import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Home, Users, TrendingUp, Package, LogOut } from 'lucide-react';
import SubscriptionManagerNew from './SubscriptionManagerNew';

const AdminConsole = () => {
  const { fetchWithAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const [activeView, setActiveView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState(null);
  const [newIntegration, setNewIntegration] = useState({ provider: 'samsara', name: '', client_id: '', client_secret: '', scopes: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isAdminUI = useMemo(() => {
    if (!user) return false;
    if (user.role === 'platform_admin') return true;
    if (user.email && user.email.toLowerCase() === 'aminderpro@gmail.com') return true; // backend allowlist mirror
    return false;
  }, [user]);

  const refreshTenants = async () => {
    try {
      const tenantsRes = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants`);
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data);
        setFiltered(data);
      }
    } catch (e) {
      toast.error('Failed to refresh tenants');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [plansRes, tenantsRes] = await Promise.all([
          fetchWithAuth(`${BACKEND_URL}/api/admin/plans`),
          fetchWithAuth(`${BACKEND_URL}/api/admin/tenants`)
        ]);
        if (plansRes.ok) {
          setPlans(await plansRes.json());
        } else {
          if (plansRes.status === 403) toast.error('Not authorized to view Admin Console');
        }
        if (tenantsRes.ok) {
          const data = await tenantsRes.json();
          setTenants(data);
          setFiltered(data);
        }
      } catch (e) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [BACKEND_URL, fetchWithAuth]);

  useEffect(() => {
    if (!query) { setFiltered(tenants); return; }
    const q = query.toLowerCase();
    setFiltered(tenants.filter(t => (t.name||'').toLowerCase().includes(q)));
  }, [query, tenants]);

  const planIdToLabel = (id) => plans.find(p => p.id === id)?.label || id;

  const onSelectTenant = async (tenant) => {
    setSelected(tenant);
    setIntegrations(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants/${tenant.id}/integrations`);
      if (res.ok) setIntegrations(await res.json());
    } catch (e) {
      // non-blocking
    }
  };

  const updateSelected = (patch) => setSelected(prev => ({ ...prev, ...patch }));

  const saveTenant = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        plan: selected.plan,
        seats: selected.seats,
        feature_flags: selected.feature_flags,
      };
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        toast.success('Tenant updated');
        setTenants(ts => ts.map(t => t.id === updated.id ? updated : t));
        setFiltered(fs => fs.map(t => t.id === updated.id ? updated : t));
        setSelected(updated);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update tenant');
      }
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addIntegration = async () => {
    if (!selected) return;
    try {
      const body = {
        provider: newIntegration.provider,
        name: newIntegration.name,
        client_id: newIntegration.client_id,
        client_secret: newIntegration.client_secret,
        scopes: newIntegration.scopes ? newIntegration.scopes.split(',').map(s => s.trim()) : []
      };
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants/${selected.id}/integrations`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
        toast.success('Integration added');
        setNewIntegration({ provider: 'samsara', name: '', client_id: '', client_secret: '', scopes: '' });
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to add integration');
      }
    } catch (e) {
      toast.error('Failed to add integration');
    }
  };

  if (!isAdminUI) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Unauthorized</h2>
        <p className="text-gray-600 mt-2">You do not have access to the Admin Console.</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Sidebar Navigation Items
  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'subscription', label: 'Subscription Manager', icon: Users },
    { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
  ];

  const handleProductClick = (product) => {
    // Check if this is the Transportation Management System
    const isTMS = product.label === 'Transportation Management System' || 
                  product.id?.includes('tms_');
    
    if (isTMS && product.status === 'active') {
      // Launch the TMS Dashboard application
      navigate('/dashboard');
    } else {
      // Show product details for other products
      setSelectedProduct(product);
      setActiveView('product-detail');
    }
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setActiveView('products');
  };

  // Render different views based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeView tenants={tenants} plans={plans} loading={loading} />;
      case 'subscription':
        return <SubscriptionManagerNew 
          tenants={tenants}
          plans={plans}
          fetchWithAuth={fetchWithAuth}
          BACKEND_URL={BACKEND_URL}
          refreshTenants={refreshTenants}
        />;
      case 'analytics':
        return <SalesAnalyticsView tenants={tenants} />;
      case 'products':
        return <ProductsView plans={plans} onProductClick={handleProductClick} />;
      case 'product-detail':
        return <ProductDetailView product={selectedProduct} onBack={handleBackToProducts} tenants={tenants} />;
      default:
        return <HomeView tenants={tenants} plans={plans} loading={loading} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Admin Console</h1>
          <p className="text-sm text-gray-500 mt-1">Platform Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="px-4 py-2 mb-2">
            <div className="text-sm font-medium text-gray-800">{user?.full_name}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Home View Component
const HomeView = ({ tenants, plans, loading }) => {
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.subscription_status === 'active').length;
  const totalRevenue = tenants.reduce((sum, t) => {
    const plan = plans.find(p => p.id === t.plan);
    return sum + (plan?.price || 0) * (t.seats || 1);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-600 mt-2">Welcome to the Platform Admin Console</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalTenants}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeTenants}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Plans</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{plans.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-3">
              {tenants.slice(0, 5).map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">{tenant.company_email || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{tenant.plan}</div>
                    <div className={`text-xs ${tenant.subscription_status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                      {tenant.subscription_status || 'No subscription'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Subscription Manager View Component
const SubscriptionManagerView = ({ 
  tenants, filtered, query, setQuery, selected, onSelectTenant, 
  plans, planIdToLabel, updateSelected, saveTenant, saving, loading,
  integrations, newIntegration, setNewIntegration, addIntegration 
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Subscription Manager</h2>
        <p className="text-gray-600 mt-2">Manage tenant subscriptions, plans, and features</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search companies" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-3" />
              <div className="max-h-[520px] overflow-auto divide-y">
                {loading ? (
                  <div className="py-10 text-center text-gray-500">Loading...</div>
                ) : (
                  filtered.map(t => (
                    <button key={t.id} className={`w-full text-left p-3 hover:bg-gray-50 ${selected?.id===t.id?'bg-blue-50':''}`} onClick={() => onSelectTenant(t)}>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-gray-500">{planIdToLabel(t.plan)} • Seats: {t.seats} • {t.subscription_status || 'no sub'}</div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selected ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">Select a tenant to manage</CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{selected.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Plan</Label>
                      <Select value={selected.plan} onValueChange={(val) => updateSelected({ plan: val })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select plan" /></SelectTrigger>
                        <SelectContent>
                          {plans.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Seats</Label>
                      <Input type="number" min={1} value={selected.seats ?? 1} onChange={(e) => updateSelected({ seats: parseInt(e.target.value||'1',10) })} className="mt-1" />
                    </div>
                    <div>
                      <Label>Subscription</Label>
                      <div className="mt-2 text-sm">{selected.subscription_status || 'No subscription'}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Feature Flags</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(selected.feature_flags || {}).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between border rounded px-3 py-2">
                          <div className="text-sm font-medium">{key}</div>
                          <Switch checked={!!val} onCheckedChange={(v) => updateSelected({ feature_flags: { ...(selected.feature_flags||{}), [key]: !!v } })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveTenant} disabled={saving}>{saving? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integrations (ELD)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Existing</div>
                    <div className="space-y-2">
                      {integrations?.eld?.length ? integrations.eld.map((i, idx) => (
                        <div key={idx} className="border rounded p-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{i.provider} {i.name ? `• ${i.name}` : ''}</div>
                            <div className="text-xs text-gray-500">Client ID: {i.client_id || '—'} • Secret: {i.client_secret_masked || '—'} • Scopes: {(i.scopes||[]).join(', ')}</div>
                          </div>
                          <div className="text-xs text-gray-400">{new Date(i.created_at).toLocaleString()}</div>
                        </div>
                      )) : (
                        <div className="text-sm text-gray-500">No integrations yet</div>
                      )}
                    </div>
                  </div>

                  <div className="border rounded p-3 space-y-2">
                    <div className="text-sm font-medium">Add Integration</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Provider</Label>
                        <Select value={newIntegration.provider} onValueChange={(v) => setNewIntegration(prev=>({...prev, provider: v}))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="samsara">Samsara</SelectItem>
                            <SelectItem value="motive">Motive (KeepTruckin)</SelectItem>
                            <SelectItem value="geotab">Geotab</SelectItem>
                            <SelectItem value="verizon_connect">Verizon Connect</SelectItem>
                            <SelectItem value="omnitracs">Omnitracs</SelectItem>
                            <SelectItem value="trimble">Trimble</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Name</Label>
                        <Input value={newIntegration.name} onChange={(e)=>setNewIntegration(prev=>({...prev, name: e.target.value}))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Client ID</Label>
                        <Input value={newIntegration.client_id} onChange={(e)=>setNewIntegration(prev=>({...prev, client_id: e.target.value}))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Client Secret</Label>
                        <Input value={newIntegration.client_secret} onChange={(e)=>setNewIntegration(prev=>({...prev, client_secret: e.target.value}))} className="mt-1" />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Scopes (comma separated)</Label>
                        <Input value={newIntegration.scopes} onChange={(e)=>setNewIntegration(prev=>({...prev, scopes: e.target.value}))} className="mt-1" placeholder="e.g. vehicles.read, trips.read" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addIntegration}>Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Sales Analytics View Component
const SalesAnalyticsView = ({ tenants }) => {
  const activeSubscriptions = tenants.filter(t => t.subscription_status === 'active').length;
  const pendingSubscriptions = tenants.filter(t => !t.subscription_status || t.subscription_status === 'pending').length;
  const canceledSubscriptions = tenants.filter(t => t.subscription_status === 'canceled').length;

  // Calculate plan distribution
  const planDistribution = tenants.reduce((acc, tenant) => {
    acc[tenant.plan] = (acc[tenant.plan] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Sales Analytics</h2>
        <p className="text-gray-600 mt-2">Track revenue, subscriptions, and growth metrics</p>
      </div>

      {/* Subscription Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{activeSubscriptions}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingSubscriptions}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Canceled</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{canceledSubscriptions}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(planDistribution).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{plan.replace('_', ' ').toUpperCase()}</h3>
                    <p className="text-sm text-gray-500">{count} tenant{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tenants by Seats */}
      <Card>
        <CardHeader>
          <CardTitle>Top Tenants by Seats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...tenants]
              .sort((a, b) => (b.seats || 0) - (a.seats || 0))
              .slice(0, 10)
              .map((tenant, index) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">{tenant.plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{tenant.seats || 1}</div>
                    <div className="text-xs text-gray-500">seats</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Products View Component
const ProductsView = ({ plans, onProductClick }) => {
  const [selectedTier, setSelectedTier] = useState({});

  // Group plans by product label
  const groupedProducts = React.useMemo(() => {
    const groups = {};
    plans.forEach(plan => {
      if (!groups[plan.label]) {
        groups[plan.label] = [];
      }
      groups[plan.label].push(plan);
    });
    return groups;
  }, [plans]);

  // Get unique products (one per label)
  const uniqueProducts = React.useMemo(() => {
    return Object.entries(groupedProducts).map(([label, plans]) => {
      // For TMS, default to first tier; for others, just return the plan
      const defaultPlan = plans[0];
      return {
        ...defaultPlan,
        tiers: plans.length > 1 ? plans : null,
      };
    });
  }, [groupedProducts]);

  const handleTierChange = (productLabel, tierId) => {
    setSelectedTier(prev => ({ ...prev, [productLabel]: tierId }));
  };

  const getCurrentPlan = (product) => {
    if (!product.tiers) return product;
    const selectedTierId = selectedTier[product.label];
    return product.tiers.find(p => p.id === selectedTierId) || product.tiers[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Products</h2>
        <p className="text-gray-600 mt-2">Manage subscription plans and pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {uniqueProducts.map((product) => {
          const currentPlan = getCurrentPlan(product);
          const isActive = currentPlan.status === 'active';
          
          return (
            <Card 
              key={product.label}
              className={`relative border-2 transition-all ${
                isActive ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-white'
                }`}>
                  {isActive ? 'ACTIVE' : 'Coming Soon'}
                </span>
              </div>

              <CardHeader className="pb-4">
                {/* Icon placeholder */}
                <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${
                  isActive ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Package className={`w-8 h-8 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <CardTitle className="text-xl">{currentPlan.label}</CardTitle>
                <p className="text-sm text-gray-600">{currentPlan.subtitle}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Tier Selector for TMS */}
                {product.tiers && (
                  <div className="pb-2">
                    <Select
                      value={selectedTier[product.label] || product.tiers[0].id}
                      onValueChange={(value) => handleTierChange(product.label, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {product.tiers.map(tier => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {currentPlan.description}
                </p>

                {/* Key Features */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Features:</h3>
                  <ul className="space-y-1">
                    {currentPlan.features?.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing */}
                <div className="pt-4 border-t">
                  <div className="text-3xl font-bold text-gray-900">
                    ${currentPlan.price}
                    <span className="text-base font-normal text-gray-500">/month</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">per month</p>
                </div>

                {/* Action Button */}
                <Button 
                  className={`w-full ${
                    isActive 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-default'
                  }`}
                  disabled={!isActive}
                  onClick={() => isActive && onProductClick(currentPlan)}
                >
                  {isActive ? (
                    currentPlan.label === 'Transportation Management System' ? 'Launch TMS →' : 'Launch App'
                  ) : 'Notify Me'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {uniqueProducts.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No products available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Product Detail View Component
const ProductDetailView = ({ product, onBack, tenants }) => {
  if (!product) return null;

  const tenantsWithThisPlan = tenants.filter(t => t.plan === product.id);
  const totalRevenue = tenantsWithThisPlan.reduce((sum, t) => sum + (product.price * (t.seats || 1)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Products
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{product.label}</h2>
          <p className="text-gray-600 mt-1">{product.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Price</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${product.price}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{tenantsWithThisPlan.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Plan ID</Label>
                <p className="text-lg font-medium mt-1">{product.id}</p>
              </div>
              <div>
                <Label className="text-gray-600">Default Seats</Label>
                <p className="text-lg font-medium mt-1">{product.default_seats} users</p>
              </div>
              <div>
                <Label className="text-gray-600">Price per Seat</Label>
                <p className="text-lg font-medium mt-1">${(product.price / product.default_seats).toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-gray-600">Total Features</Label>
                <p className="text-lg font-medium mt-1">{product.features?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(product.feature_flags || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 p-2 border rounded">
                  <div className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Features ({product.features?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.features?.map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm font-bold">✓</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {tenantsWithThisPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tenants Using This Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenantsWithThisPlan.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">{tenant.company_email || 'No email'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{tenant.seats} seats</div>
                    <div className="text-xs text-gray-500">
                      ${(product.price * (tenant.seats || 1)).toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminConsole;
