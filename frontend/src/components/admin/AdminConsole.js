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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-gray-600">Manage tenants, plans, features and integrations</p>
        </div>
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
                    <button key={t.id} className={`w-full text-left p-3 hover:bg-gray-50 ${selected?.id===t.id?'bg-gray-50':''}`} onClick={() => onSelectTenant(t)}>
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

export default AdminConsole;
