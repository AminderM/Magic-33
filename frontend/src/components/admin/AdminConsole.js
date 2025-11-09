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

  const isAdminUI = useMemo(() => {
    if (!user) return false;
    if (user.role === 'platform_admin') return true;
    if (user.email && user.email.toLowerCase() === 'aminderpro@gmail.com') return true; // backend allowlist mirror
    return false;
  }, [user]);

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

  // Render different views based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeView tenants={tenants} plans={plans} loading={loading} />;
      case 'subscription':
        return <SubscriptionManagerView 
          tenants={tenants}
          filtered={filtered}
          query={query}
          setQuery={setQuery}
          selected={selected}
          onSelectTenant={onSelectTenant}
          plans={plans}
          planIdToLabel={planIdToLabel}
          updateSelected={updateSelected}
          saveTenant={saveTenant}
          saving={saving}
          loading={loading}
          integrations={integrations}
          newIntegration={newIntegration}
          setNewIntegration={setNewIntegration}
          addIntegration={addIntegration}
        />;
      case 'analytics':
        return <SalesAnalyticsView tenants={tenants} />;
      case 'products':
        return <ProductsView plans={plans} />;
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

export default AdminConsole;
