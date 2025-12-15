import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Settings, Trash2, Check, X, Zap, Key, ExternalLink, Truck, Map, Shield, CheckCircle } from 'lucide-react';

// Built-in/Active Integrations that are already implemented in the app
const ACTIVE_INTEGRATIONS = [
  {
    id: 'fmcsa',
    name: 'FMCSA QCMobile API',
    description: 'Federal Motor Carrier Safety Administration carrier data lookup. Search carriers by DOT# or company name to get safety scores, authority status, insurance info, and crash history.',
    category: 'Transportation & Compliance',
    status: 'active',
    icon: Truck,
    features: [
      'DOT# lookup',
      'Company name search',
      'Safety BASIC scores',
      'Authority & insurance status',
      'Crash history data',
      'Fleet information'
    ],
    usedIn: ['Admin Console → Carrier Lookup', 'User Management → Create User'],
    apiEndpoints: ['/api/fmcsa/carrier/dot/{dot_number}', '/api/fmcsa/carrier/search', '/api/fmcsa/carrier/lookup'],
    configuredDate: '2024-12-12'
  },
  {
    id: 'google_maps',
    name: 'Google Maps Platform',
    description: 'Google Maps APIs for route calculation, distance/duration estimation, and location autocomplete in the Freight Calculator.',
    category: 'Mapping & Routing',
    status: 'active',
    icon: Map,
    features: [
      'Route calculation',
      'Distance estimation',
      'Duration calculation',
      'Multi-stop routing',
      'Places autocomplete',
      'Canadian location support'
    ],
    usedIn: ['Sales → Freight Calculator'],
    apiEndpoints: ['/api/sales/calculate-route'],
    configuredDate: '2024-12-10'
  }
];

const IntegrationsView = ({ fetchWithAuth, BACKEND_URL }) => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [testingIntegration, setTestingIntegration] = useState(null);

  // Available integration types with their configurations
  const INTEGRATION_TYPES = {
    llm: {
      label: 'AI/LLM Services',
      services: [
        { id: 'openai_gpt5', name: 'OpenAI GPT-5', description: 'Latest OpenAI model for text generation', fields: ['api_key', 'model'] },
        { id: 'openai_gpt4', name: 'OpenAI GPT-4', description: 'OpenAI GPT-4 for advanced text generation', fields: ['api_key', 'model'] },
        { id: 'claude_sonnet4', name: 'Claude Sonnet 4', description: 'Anthropic Claude for conversational AI', fields: ['api_key', 'model'] },
        { id: 'gemini_pro', name: 'Google Gemini Pro', description: 'Google Gemini for multimodal AI', fields: ['api_key', 'model'] },
      ]
    },
    transportation: {
      label: 'Transportation APIs',
      services: [
        { id: 'samsara', name: 'Samsara', description: 'Fleet management and ELD compliance', fields: ['api_key', 'client_id'] },
        { id: 'google_maps', name: 'Google Maps API', description: 'Route optimization and geocoding', fields: ['api_key'] },
        { id: 'dat', name: 'DAT Load Board', description: 'Freight matching and rate analytics', fields: ['api_key', 'username', 'password'] },
        { id: 'motive', name: 'Motive (KeepTruckin)', description: 'ELD and fleet management', fields: ['api_key'] },
      ]
    },
    payment: {
      label: 'Payment Services',
      services: [
        { id: 'stripe', name: 'Stripe', description: 'Payment processing', fields: ['api_key', 'secret_key'] },
        { id: 'paypal', name: 'PayPal', description: 'Payment gateway', fields: ['client_id', 'client_secret'] },
      ]
    },
    communication: {
      label: 'Communication Services',
      services: [
        { id: 'twilio', name: 'Twilio', description: 'SMS and voice communication', fields: ['account_sid', 'auth_token', 'phone_number'] },
        { id: 'sendgrid', name: 'SendGrid', description: 'Email delivery service', fields: ['api_key'] },
      ]
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations`);
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (e) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async (integrationData) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integrationData)
      });
      
      if (res.ok) {
        toast.success('Integration added successfully');
        loadIntegrations();
        setShowAddModal(false);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to add integration');
      }
    } catch (e) {
      toast.error('Failed to add integration');
    }
  };

  const handleUpdateIntegration = async (id, updates) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (res.ok) {
        toast.success('Integration updated successfully');
        loadIntegrations();
        setEditingIntegration(null);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to update integration');
      }
    } catch (e) {
      toast.error('Failed to update integration');
    }
  };

  const handleDeleteIntegration = async (id) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success('Integration deleted successfully');
        loadIntegrations();
      } else {
        toast.error('Failed to delete integration');
      }
    } catch (e) {
      toast.error('Failed to delete integration');
    }
  };

  const handleToggleIntegration = async (id, enabled) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (res.ok) {
        toast.success(enabled ? 'Integration enabled' : 'Integration disabled');
        loadIntegrations();
      } else {
        toast.error('Failed to toggle integration');
      }
    } catch (e) {
      toast.error('Failed to toggle integration');
    }
  };

  const handleTestIntegration = async (id) => {
    setTestingIntegration(id);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations/${id}/test`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          toast.success('Integration test successful! ✓');
        } else {
          toast.error(`Test failed: ${result.message}`);
        }
      } else {
        toast.error('Test failed - check credentials');
      }
    } catch (e) {
      toast.error('Test failed - connection error');
    } finally {
      setTestingIntegration(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Integrations</h2>
          <p className="text-gray-600 mt-2">Manage API services and third-party integrations</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{ACTIVE_INTEGRATIONS.length + integrations.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {ACTIVE_INTEGRATIONS.length + integrations.filter(i => i.enabled).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">
                  {integrations.filter(i => !i.enabled).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(INTEGRATION_TYPES).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations by Category */}
      {Object.entries(INTEGRATION_TYPES).map(([category, categoryData]) => {
        const categoryIntegrations = integrations.filter(i => {
          return categoryData.services.some(s => s.id === i.service_id);
        });

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold text-gray-800">{categoryData.label}</h3>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                {categoryIntegrations.length} configured
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryIntegrations.map(integration => {
                const serviceConfig = categoryData.services.find(s => s.id === integration.service_id);
                
                return (
                  <Card key={integration.id} className={`border-2 ${integration.enabled ? 'border-green-200' : 'border-gray-200'}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <span>{serviceConfig?.name || integration.name}</span>
                            {integration.enabled && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Active
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {serviceConfig?.description || integration.description}
                          </CardDescription>
                        </div>
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Integration Details */}
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4" />
                          <span>Configured: {new Date(integration.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingIntegration(integration)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestIntegration(integration.id)}
                          disabled={testingIntegration === integration.id}
                        >
                          {testingIntegration === integration.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteIntegration(integration.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {integrations.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No integrations configured yet</p>
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Integration Modal */}
      {(showAddModal || editingIntegration) && (
        <IntegrationModal
          integration={editingIntegration}
          integrationTypes={INTEGRATION_TYPES}
          onClose={() => {
            setShowAddModal(false);
            setEditingIntegration(null);
          }}
          onSave={(data) => {
            if (editingIntegration) {
              handleUpdateIntegration(editingIntegration.id, data);
            } else {
              handleAddIntegration(data);
            }
          }}
        />
      )}
    </div>
  );
};

// Modal Component for Add/Edit Integration
const IntegrationModal = ({ integration, integrationTypes, onClose, onSave }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    description: integration?.description || '',
    enabled: integration?.enabled ?? true,
    config: integration?.config || {}
  });

  useEffect(() => {
    if (integration) {
      // Find category and service for existing integration
      Object.entries(integrationTypes).forEach(([category, categoryData]) => {
        const service = categoryData.services.find(s => s.id === integration.service_id);
        if (service) {
          setSelectedCategory(category);
          setSelectedService(service.id);
        }
      });
    }
  }, [integration]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedService('');
    setFormData({ ...formData, config: {} });
  };

  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    const service = integrationTypes[selectedCategory].services.find(s => s.id === serviceId);
    setFormData({
      ...formData,
      name: service.name,
      description: service.description
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      service_id: selectedService,
      category: selectedCategory
    });
  };

  const selectedServiceConfig = selectedCategory && selectedService
    ? integrationTypes[selectedCategory].services.find(s => s.id === selectedService)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{integration ? 'Edit Integration' : 'Add New Integration'}</CardTitle>
          <CardDescription>
            Configure your API service or third-party integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selection */}
            {!integration && (
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(integrationTypes).map(([key, data]) => (
                      <SelectItem key={key} value={key}>{data.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Service Selection */}
            {selectedCategory && !integration && (
              <div>
                <Label>Service</Label>
                <Select value={selectedService} onValueChange={handleServiceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationTypes[selectedCategory].services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Configuration Fields */}
            {selectedServiceConfig && (
              <>
                <div>
                  <Label>Integration Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Production OpenAI"
                  />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>

                {selectedServiceConfig.fields.map(field => (
                  <div key={field}>
                    <Label>{field.replace('_', ' ').toUpperCase()}</Label>
                    <Input
                      type={field.includes('key') || field.includes('secret') || field.includes('password') ? 'password' : 'text'}
                      value={formData.config[field] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, [field]: e.target.value }
                      })}
                      placeholder={`Enter ${field}`}
                      required
                    />
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label>Enable this integration immediately</Label>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!selectedService}
              >
                {integration ? 'Update' : 'Add'} Integration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsView;
