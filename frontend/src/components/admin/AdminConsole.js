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
import { Home, Users, TrendingUp, Package, LogOut, Zap } from 'lucide-react';
import SubscriptionManagerNew from './SubscriptionManagerNew';
import SalesAnalyticsNew from './SalesAnalyticsNew';
import CRMView from './CRMView';
import IntegrationsView from './IntegrationsView';
import RouteMateApp from '../route-mate/RouteMateApp';

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
        console.log('AdminConsole: Fetching plans from:', `${BACKEND_URL}/api/admin/plans`);
        const [plansRes, tenantsRes] = await Promise.all([
          fetchWithAuth(`${BACKEND_URL}/api/admin/plans`),
          fetchWithAuth(`${BACKEND_URL}/api/admin/tenants`)
        ]);
        console.log('AdminConsole: Plans response status:', plansRes.status, plansRes.ok);
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          console.log('AdminConsole: Plans loaded:', plansData.length, 'plans');
          setPlans(plansData);
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
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'crm', label: 'CRM', icon: Users }
  ];

  const handleProductClick = (product) => {
    // Check if this is the Transportation Management System
    const isTMS = product.label === 'Transportation Management System' || 
                  product.id?.includes('tms_');
    
    // Check if this is Integrated Route Mate
    const isRouteMate = product.label === 'Integrated Route Mate' ||
                        product.id === 'integrated_route_mate';
    
    if (isTMS && product.status === 'active') {
      // Launch the TMS Dashboard application in the same tab
      window.location.href = '/dashboard';
    } else if (isRouteMate) {
      // Launch Route Mate (can be coming_soon or active)
      setSelectedProduct(product);
      setActiveView('route-mate-app');
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
        return <SalesAnalyticsNew tenants={tenants} fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'products':
        return <ProductsView plans={plans} onProductClick={handleProductClick} />;
      case 'product-detail':
        return <ProductDetailView product={selectedProduct} onBack={handleBackToProducts} tenants={tenants} />;
      case 'route-mate-app':
        return <RouteMateApp onClose={handleBackToProducts} BACKEND_URL={BACKEND_URL} />;
      case 'integrations':
        return <IntegrationsView fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
      case 'crm':
        return <CRMView fetchWithAuth={fetchWithAuth} BACKEND_URL={BACKEND_URL} />;
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
const SalesAnalyticsView = ({ tenants, fetchWithAuth, BACKEND_URL }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly'); // monthly or weekly

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/analytics`);
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (e) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [fetchWithAuth, BACKEND_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-center text-gray-500 py-16">No analytics data available</div>;
  }

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

                {/* Action Buttons */}
                {currentPlan.label === 'Driver App' ? (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => onProductClick(currentPlan)}
                  >
                    <i className="fas fa-mobile-alt mr-2"></i>
                    View Interface Preview
                  </Button>
                ) : (
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
                      currentPlan.label === 'Transportation Management System' 
                        ? 'Launch TMS →' 
                        : currentPlan.label === 'Integrated Route Mate'
                        ? 'Launch Route Mate →'
                        : 'Launch App →'
                    ) : 'Notify Me'}
                  </Button>
                )}
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


// Driver App Interface Preview Component
const DriverAppInterfacePreview = ({ product, onBack }) => {
  const [activeScreen, setActiveScreen] = useState('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Products
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <i className="fas fa-mobile-alt text-purple-600"></i>
            {product.label} - Interface Preview
          </h2>
          <p className="text-gray-600 mt-1">{product.subtitle}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">📱 Mobile App Interface Wireframes</h3>
        <p>View how drivers will interact with your TMS through the mobile app on Android and iOS devices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Dashboard */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 text-white">
            <h4 className="font-semibold text-sm">Main Dashboard</h4>
            <p className="text-xs opacity-90">TMS-style Layout</p>
          </div>
          <CardContent className="p-0">
            <div className="bg-white">
              {/* Header with Menu */}
              <div className="bg-blue-600 text-white p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fas fa-truck text-xs"></i>
                  <span className="text-xs font-semibold">Driver TMS</span>
                </div>
                <button className="p-1.5 hover:bg-blue-700 rounded">
                  <i className="fas fa-bars text-sm"></i>
                </button>
              </div>
              
              {/* Load Cards */}
              <div className="p-2 space-y-2 bg-gray-50">
                <div className="bg-white rounded border p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold">ORD-001</span>
                    <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Pending</span>
                  </div>
                  <div className="space-y-1 text-[9px] text-gray-600">
                    <div className="flex items-center gap-1">
                      <i className="fas fa-map-marker-alt text-green-600"></i>
                      <span>LA, CA → Phoenix, AZ</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <button className="flex-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[8px] font-medium">
                      <i className="fas fa-route mr-0.5"></i>Route
                    </button>
                    <button className="flex-1 bg-green-50 text-green-600 px-2 py-1 rounded text-[8px] font-medium">
                      <i className="fas fa-camera mr-0.5"></i>Docs
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded border p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold">ORD-002</span>
                    <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">In Transit</span>
                  </div>
                  <div className="space-y-1 text-[9px] text-gray-600">
                    <div className="flex items-center gap-1">
                      <i className="fas fa-map-marker-alt text-green-600"></i>
                      <span>SD, CA → Vegas, NV</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <button className="flex-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-[8px] font-medium">
                      <i className="fas fa-route mr-0.5"></i>Route
                    </button>
                    <button className="flex-1 bg-green-50 text-green-600 px-2 py-1 rounded text-[8px] font-medium">
                      <i className="fas fa-camera mr-0.5"></i>Docs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Screen */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white">
            <h4 className="font-semibold text-sm">Dashboard</h4>
          </div>
          <CardContent className="p-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="bg-white rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <i className="fas fa-box text-blue-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold">ORD-001</p>
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Pending</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-600 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-green-600"></i>
                    <span>Los Angeles</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-red-600"></i>
                    <span>Phoenix</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                    <i className="fas fa-box text-blue-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold">ORD-002</p>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Planned</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Load Details Screen */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white">
            <h4 className="font-semibold text-sm">Load Details</h4>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="bg-blue-600 text-white p-2 rounded">
                <p className="text-xs font-bold">ORD-2024-001</p>
              </div>
              <div className="bg-white border rounded p-2 space-y-2">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-[10px] text-green-900 font-medium">PICKUP</p>
                  <p className="text-xs font-bold">123 Warehouse</p>
                  <p className="text-[10px] text-gray-600">LA, CA</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-[10px] text-red-900 font-medium">DELIVERY</p>
                  <p className="text-xs font-bold">456 Distribution</p>
                  <p className="text-[10px] text-gray-600">Phoenix, AZ</p>
                </div>
              </div>
              <div className="bg-green-600 text-white text-center py-1.5 rounded text-xs font-semibold">
                <i className="fas fa-check mr-1"></i>Accept Load
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Screen */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 text-white">
            <h4 className="font-semibold text-sm">Navigation</h4>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="bg-purple-600 text-white p-2 rounded text-xs">
                <p className="font-bold">Navigation</p>
              </div>
              <div className="bg-gray-200 rounded h-24 flex items-center justify-center">
                <i className="fas fa-map text-gray-400 text-2xl"></i>
              </div>
              <div className="bg-white border rounded p-2 text-[10px] space-y-1">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full text-white flex items-center justify-center text-[8px]">A</div>
                  <span className="text-xs">LA, CA</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center text-[8px]">B</div>
                  <span className="text-xs">Phoenix, AZ</span>
                </div>
              </div>
              <div className="bg-purple-600 text-white text-center py-1.5 rounded text-xs font-semibold">
                <i className="fas fa-directions mr-1"></i>Open Maps
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Driver Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {product.features?.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <i className="fas fa-check-circle text-green-600 mt-0.5"></i>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Platforms</p>
                <p className="text-base font-semibold">Android & iOS</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pricing</p>
                <p className="text-base font-semibold text-green-600">FREE</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Requirements</p>
                <p className="text-sm">Active TMS Subscription</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Backend APIs</p>
                <p className="text-sm">9 Endpoints Ready</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-600 mb-2">React Native App Location</p>
              <code className="text-xs bg-gray-100 p-2 rounded block">/app/mobile/</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Product Detail View Component
const ProductDetailView = ({ product, onBack, tenants }) => {
  if (!product) return null;

  const tenantsWithThisPlan = tenants.filter(t => t.plan === product.id);
  const totalRevenue = tenantsWithThisPlan.reduce((sum, t) => sum + (product.price * (t.seats || 1)), 0);

  // Special view for Driver App
  if (product.label === 'Driver App') {
    return <DriverAppInterfacePreview product={product} onBack={onBack} />;
  }

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
