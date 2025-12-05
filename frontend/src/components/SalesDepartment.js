import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Unified Converter Component
const UnifiedConverter = () => {
  const [conversionType, setConversionType] = useState('weight');
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');

  const conversionConfig = {
    weight: {
      icon: 'fa-weight',
      color: 'green',
      fromUnit: 'Pounds (lbs)',
      toUnit: 'Kilograms (kg)',
      fromToRatio: 0.453592,
      toFromRatio: 2.20462,
      quickRef: [
        { label: '1 lb', value: '0.453 kg' },
        { label: '1 kg', value: '2.205 lbs' },
        { label: '1 ton (US)', value: '907 kg' },
        { label: '1 tonne', value: '2,205 lbs' }
      ]
    },
    temperature: {
      icon: 'fa-thermometer-half',
      color: 'red',
      fromUnit: 'Fahrenheit (°F)',
      toUnit: 'Celsius (°C)',
      convertFromTo: (f) => ((f - 32) * 5/9).toFixed(2),
      convertToFrom: (c) => ((c * 9/5) + 32).toFixed(2),
      quickRef: [
        { label: 'Freezing', value: '32°F / 0°C' },
        { label: 'Room Temp', value: '68°F / 20°C' },
        { label: 'Body Temp', value: '98.6°F / 37°C' },
        { label: 'Boiling', value: '212°F / 100°C' }
      ]
    },
    distance: {
      icon: 'fa-ruler',
      color: 'purple',
      fromUnit: 'Miles',
      toUnit: 'Kilometers',
      fromToRatio: 1.60934,
      toFromRatio: 0.621371,
      quickRef: [
        { label: '1 mile', value: '1.609 km' },
        { label: '1 km', value: '0.621 miles' },
        { label: '100 miles', value: '161 km' },
        { label: '100 km', value: '62 miles' }
      ]
    }
  };

  const config = conversionConfig[conversionType];

  const handleInputChange = (value, isFromUnit) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || value === '') {
      setInputValue('');
      setOutputValue('');
      return;
    }

    if (isFromUnit) {
      setInputValue(value);
      if (conversionType === 'temperature') {
        setOutputValue(config.convertFromTo(numValue));
      } else {
        setOutputValue((numValue * config.fromToRatio).toFixed(2));
      }
    } else {
      setOutputValue(value);
      if (conversionType === 'temperature') {
        setInputValue(config.convertToFrom(numValue));
      } else {
        setInputValue((numValue * config.toFromRatio).toFixed(2));
      }
    }
  };

  const handleTypeChange = (newType) => {
    setConversionType(newType);
    setInputValue('');
    setOutputValue('');
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <i className={`fas ${config.icon} text-${config.color}-600`}></i>
            Unit Converter
          </CardTitle>
          <Select value={conversionType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{config.fromUnit}</Label>
          <Input 
            type="number"
            placeholder={`Enter ${config.fromUnit.toLowerCase()}`}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value, true)}
          />
        </div>

        <div className="text-center">
          <i className="fas fa-exchange-alt text-gray-400"></i>
        </div>

        <div>
          <Label>{config.toUnit}</Label>
          <Input 
            type="number"
            placeholder={`Enter ${config.toUnit.toLowerCase()}`}
            value={outputValue}
            onChange={(e) => handleInputChange(e.target.value, false)}
          />
        </div>

        <div className={`p-3 bg-${config.color}-50 rounded-lg border border-${config.color}-200`}>
          <p className="text-xs text-gray-600 mb-2">Quick Reference:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {config.quickRef.map((ref, idx) => (
              <div key={idx}>
                <span className="font-semibold">{ref.label}:</span> {ref.value}
              </div>
            ))}
          </div>
        </div>

        {conversionType === 'temperature' && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-900 mb-1">Formulas:</p>
            <div className="text-xs text-gray-700 space-y-1">
              <div>°F = (°C × 9/5) + 32</div>
              <div>°C = (°F - 32) × 5/9</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SalesDepartment = ({ BACKEND_URL, fetchWithAuth }) => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'new'
  });
  
  // Freight Calculator state
  const [quoteData, setQuoteData] = useState({
    pickupLocation: '',
    destination: '',
    stops: [],
    distance: 0,
    ratePerMile: 0,
    fuelSurcharge: 0,
    ratePerStop: 0,
    accessorialCharges: 0,
    margin: 0
  });

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      // Load mock data for now - you can replace with actual API calls
      setLeads([
        {
          id: '1',
          company_name: 'ABC Logistics Inc',
          contact_person: 'John Smith',
          email: 'john@abclogistics.com',
          phone: '555-0101',
          source: 'website',
          status: 'new',
          created_at: new Date().toISOString(),
          estimated_value: 50000
        },
        {
          id: '2',
          company_name: 'XYZ Transport Co',
          contact_person: 'Sarah Johnson',
          email: 'sarah@xyztransport.com',
          phone: '555-0102',
          source: 'referral',
          status: 'contacted',
          created_at: new Date().toISOString(),
          estimated_value: 75000
        },
        {
          id: '3',
          company_name: 'Global Shipping Ltd',
          contact_person: 'Mike Davis',
          email: 'mike@globalship.com',
          phone: '555-0103',
          source: 'cold_call',
          status: 'qualified',
          created_at: new Date().toISOString(),
          estimated_value: 120000
        }
      ]);

      setOpportunities([
        {
          id: '1',
          title: 'Quarterly Contract - ABC Logistics',
          company: 'ABC Logistics Inc',
          value: 50000,
          stage: 'proposal',
          probability: 60,
          close_date: '2024-12-31'
        },
        {
          id: '2',
          title: 'Annual Partnership - Global Shipping',
          company: 'Global Shipping Ltd',
          value: 250000,
          stage: 'negotiation',
          probability: 80,
          close_date: '2024-12-15'
        }
      ]);

      setCustomers([
        {
          id: '1',
          company_name: 'FastTrack Distribution',
          contact_person: 'Emily Brown',
          email: 'emily@fasttrack.com',
          phone: '555-0201',
          status: 'active',
          total_revenue: 150000,
          loads_count: 45
        },
        {
          id: '2',
          company_name: 'QuickMove Freight',
          contact_person: 'David Wilson',
          email: 'david@quickmove.com',
          phone: '555-0202',
          status: 'active',
          total_revenue: 220000,
          loads_count: 68
        }
      ]);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = () => {
    if (!newLead.company_name || !newLead.contact_person || !newLead.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const lead = {
      id: Date.now().toString(),
      ...newLead,
      created_at: new Date().toISOString(),
      estimated_value: 0
    };

    setLeads([lead, ...leads]);
    toast.success('Lead added successfully!');
    setShowAddLeadModal(false);
    setNewLead({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      source: 'website',
      status: 'new'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-purple-100 text-purple-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-500 text-white',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStageColor = (stage) => {
    const colors = {
      prospecting: 'bg-blue-500',
      qualification: 'bg-yellow-500',
      proposal: 'bg-purple-500',
      negotiation: 'bg-orange-500',
      closed_won: 'bg-green-500',
      closed_lost: 'bg-red-500'
    };
    return colors[stage] || 'bg-gray-500';
  };

  const calculateTotalQuote = () => {
    const subtotal = 
      (quoteData.distance * quoteData.ratePerMile) +
      quoteData.fuelSurcharge +
      (quoteData.stops.length * quoteData.ratePerStop) +
      quoteData.accessorialCharges;
    
    const total = subtotal + (subtotal * (quoteData.margin / 100));
    return total.toFixed(2);
  };

  const pushToRateQuotes = () => {
    const newQuote = {
      id: Date.now().toString(),
      pickupLocation: quoteData.pickupLocation || 'Not specified',
      destination: quoteData.destination || 'Not specified',
      distance: quoteData.distance,
      totalAmount: calculateTotalQuote(),
      status: 'incomplete',
      createdAt: new Date().toISOString(),
      ratePerMile: quoteData.ratePerMile,
      fuelSurcharge: quoteData.fuelSurcharge,
      ratePerStop: quoteData.ratePerStop,
      accessorialCharges: quoteData.accessorialCharges,
      margin: quoteData.margin
    };
    
    setQuotes([newQuote, ...quotes]);
    setActiveTab('quotes');
    toast.success('Quote pushed to Rate Quotes tab');
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">📈</span>
              Sales & Business Development
            </h1>
            <p className="text-gray-600 mt-2">Lead generation, CRM, rate quotes & customer management</p>
          </div>
          {activeTab === 'leads' && (
            <Button onClick={() => setShowAddLeadModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-plus mr-2"></i>
              Add New Lead
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-plus text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-handshake text-purple-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${opportunities.reduce((sum, opp) => sum + opp.value, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-building text-orange-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">
            <i className="fas fa-funnel-dollar mr-2"></i>
            Sales Pipeline
          </TabsTrigger>
          <TabsTrigger value="leads">
            <i className="fas fa-user-plus mr-2"></i>
            Leads
          </TabsTrigger>
          <TabsTrigger value="customers">
            <i className="fas fa-building mr-2"></i>
            Customers
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <i className="fas fa-calculator mr-2"></i>
            Freight Calculator
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <i className="fas fa-file-invoice-dollar mr-2"></i>
            Rate Quotes
          </TabsTrigger>
        </TabsList>

        {/* Sales Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                {opportunities.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-handshake text-gray-400 text-5xl mb-4"></i>
                    <p className="text-gray-600">No opportunities yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {opportunities.map((opp) => (
                      <div key={opp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{opp.title}</h3>
                            <p className="text-sm text-gray-600">{opp.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">${opp.value.toLocaleString()}</p>
                            <Badge className={getStatusColor(opp.stage)}>{opp.stage.replace('_', ' ').toUpperCase()}</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Close Date</p>
                            <p className="font-medium">{new Date(opp.close_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Probability</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${getStageColor(opp.stage)} h-2 rounded-full`}
                                  style={{ width: `${opp.probability}%` }}
                                ></div>
                              </div>
                              <span className="font-medium">{opp.probability}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <i className="fas fa-edit mr-1"></i>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <i className="fas fa-file-alt mr-1"></i>
                            Create Proposal
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-user-plus text-gray-400 text-5xl mb-4"></i>
                  <p className="text-gray-600">No leads yet</p>
                  <Button onClick={() => setShowAddLeadModal(true)} className="mt-4">
                    Add Your First Lead
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {lead.company_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{lead.company_name}</h3>
                            <p className="text-sm text-gray-600">{lead.contact_person}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <i className="fas fa-envelope text-gray-400"></i>
                                {lead.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-phone text-gray-400"></i>
                                {lead.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Badge>
                          <p className="text-sm text-gray-600 mt-2">Source: {lead.source.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-phone mr-1"></i>
                          Contact
                        </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-arrow-right mr-1"></i>
                          Convert to Opportunity
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Database</CardTitle>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-building text-gray-400 text-5xl mb-4"></i>
                  <p className="text-gray-600">No customers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.company_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{customer.company_name}</h3>
                            <p className="text-sm text-gray-600">{customer.contact_person}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <i className="fas fa-envelope text-gray-400"></i>
                                {customer.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-phone text-gray-400"></i>
                                {customer.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                          <div className="mt-3 space-y-1">
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-xl font-bold text-green-600">${customer.total_revenue.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{customer.loads_count} loads completed</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <i className="fas fa-eye mr-1"></i>
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-file-invoice mr-1"></i>
                          Create Quote
                        </Button>
                        <Button size="sm" variant="outline">
                          <i className="fas fa-history mr-1"></i>
                          Load History
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Freight Calculator Tab */}
        <TabsContent value="calculator" className="mt-6">
          {/* Top Section - Distance Calculator & Map Side by Side */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-map-marked-alt text-blue-600"></i>
                Distance Calculator & Route Mapper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Calculator Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label>Pickup Location</Label>
                    <Input 
                      placeholder="Enter pickup address or city, state"
                      className="mb-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Add Stops (Optional)</Label>
                    <div className="space-y-2">
                      <Input 
                        placeholder="Stop 1: City, State"
                        className="mb-2"
                      />
                      <Button variant="outline" size="sm" className="w-full">
                        <i className="fas fa-plus mr-2"></i>
                        Add Another Stop
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Destination</Label>
                    <Input 
                      placeholder="Enter destination address or city, state"
                    />
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <i className="fas fa-route mr-2"></i>
                    Calculate Distance & View Map
                  </Button>

                  {/* Quote Calculator */}
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">Freight Quote Calculator</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-600">Rate per Mile ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Fuel Surcharge ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Rate per Stop ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Accessorial Charges ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Margin (%)</Label>
                        <Input 
                          type="number" 
                          placeholder="0"
                          step="1"
                          className="mt-1"
                        />
                      </div>
                      <div className="pt-3 border-t border-green-300">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-900">Total Quote:</span>
                          <span className="text-2xl font-bold text-green-700">$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Map Display */}
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full">
                    <i className="fas fa-external-link-alt mr-2"></i>
                    Open in Google Maps
                  </Button>
                  <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-[560px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <i className="fas fa-map text-6xl mb-4"></i>
                      <p className="text-lg font-semibold mb-2">Interactive Map</p>
                      <p className="text-sm">Route visualization will appear here</p>
                      <p className="text-xs mt-2">Enter locations and click Calculate</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unified Unit Converter */}
          <UnifiedConverter />
        </TabsContent>

        {/* Rate Quotes Tab */}
        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rate Quotes</CardTitle>
                <Button>
                  <i className="fas fa-plus mr-2"></i>
                  Create New Quote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <i className="fas fa-file-invoice-dollar text-gray-400 text-5xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">Quote Generator</h3>
                <p className="text-gray-600 mb-4">Create professional rate quotes for your customers</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <i className="fas fa-calculator mr-2"></i>
                  Generate Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Add New Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                  placeholder="ABC Logistics Inc"
                />
              </div>
              <div>
                <Label>Contact Person *</Label>
                <Input
                  value={newLead.contact_person}
                  onChange={(e) => setNewLead({ ...newLead, contact_person: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="555-0100"
                />
              </div>
              <div>
                <Label>Source</Label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="email">Email Campaign</option>
                  <option value="social_media">Social Media</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddLead} className="flex-1">
                  Add Lead
                </Button>
                <Button onClick={() => setShowAddLeadModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesDepartment;
