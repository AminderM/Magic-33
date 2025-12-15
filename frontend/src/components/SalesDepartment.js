import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import RouteMapPreview from './RouteMapPreview';
import PlacesAutocomplete from './PlacesAutocomplete';
import DraggableFreightCalculator from './DraggableFreightCalculator';

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
    <Card className="h-[280px] flex flex-col">
      <CardHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <i className={`fas ${config.icon} text-gray-500`}></i>
            Unit Converter
          </CardTitle>
          <Select value={conversionType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
      <CardContent className="space-y-2 p-4 flex-1 overflow-y-auto">
        <div>
          <Label className="text-xs font-medium text-gray-600 mb-1 block">{config.fromUnit}</Label>
          <Input 
            type="number"
            placeholder={`Enter ${config.fromUnit.toLowerCase()}`}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value, true)}
            className="h-9 border-gray-200 rounded-lg"
          />
        </div>

        <div className="text-center py-1">
          <i className="fas fa-exchange-alt text-gray-400 text-sm"></i>
        </div>

        <div>
          <Label className="text-xs font-medium text-gray-600 mb-1 block">{config.toUnit}</Label>
          <Input 
            type="number"
            placeholder={`Enter ${config.toUnit.toLowerCase()}`}
            value={outputValue}
            onChange={(e) => handleInputChange(e.target.value, false)}
            className="h-9 border-gray-200 rounded-lg"
          />
        </div>

        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Quick Reference:</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {config.quickRef.slice(0, 2).map((ref, idx) => (
              <div key={idx}>
                <span className="font-semibold">{ref.label}:</span> {ref.value}
              </div>
            ))}
          </div>
        </div>
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
  const [loads, setLoads] = useState([]);
  const [quoteCounter, setQuoteCounter] = useState(1);
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
  
  // Multi-tab Freight Calculator state
  const [quoteTabs, setQuoteTabs] = useState([
    {
      id: 1,
      name: 'Quote 1',
      data: {
        pickupLocation: '',
        destination: '',
        stops: [],
        distance: 0,
        ratePerMile: 0,
        ratePerLbs: 0,
        fuelSurcharge: 0,
        ratePerStop: 0,
        accessorialCharges: 0,
        accessoryName: '',
        margin: 0,
        ftlLtlPercentage: 0,
        consignor: '',
        consignee: '',
        customer: ''
      },
      routeData: null,
      currentStop: ''
    }
  ]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [nextTabId, setNextTabId] = useState(2);

  // Google Maps integration
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);

  // Get active quote tab
  const activeQuoteTab = quoteTabs.find(tab => tab.id === activeTabId) || quoteTabs[0];
  const quoteData = activeQuoteTab.data;
  const routeData = activeQuoteTab.routeData;
  const currentStop = activeQuoteTab.currentStop;

  // Update active tab
  const updateActiveTab = (updates) => {
    setQuoteTabs(tabs => tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, ...updates }
        : tab
    ));
  };

  const setQuoteData = (newData) => {
    updateActiveTab({ data: typeof newData === 'function' ? newData(quoteData) : newData });
  };

  const setRouteData = (newRouteData) => {
    updateActiveTab({ routeData: newRouteData });
  };

  const setCurrentStop = (newStop) => {
    updateActiveTab({ currentStop: newStop });
  };

  useEffect(() => {
    loadSalesData();
    loadGoogleMapsKey();
    loadRateQuotes();
    loadLoads();
  }, [fetchWithAuth, BACKEND_URL]);

  // Load loads from database
  const loadLoads = async () => {
    if (!fetchWithAuth || !BACKEND_URL) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/bookings/requests`);
      if (res.ok) {
        const data = await res.json();
        setLoads(data || []);
      }
    } catch (error) {
      console.error('Error loading loads:', error);
    }
  };

  // Load rate quotes from database
  const loadRateQuotes = async () => {
    if (!fetchWithAuth || !BACKEND_URL) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/sales/rate-quotes`);
      if (res.ok) {
        const data = await res.json();
        const formattedQuotes = (data.quotes || []).map(q => ({
          id: q.id,
          quoteNumber: q.quote_number,
          pickupLocation: q.pickup || 'Not specified',
          destination: q.destination || 'Not specified',
          distance: q.distance || 0,
          totalAmount: q.total_quote?.toFixed(2) || '0.00',
          status: q.status || 'draft',
          createdAt: q.created_at,
          ratePerMile: q.base_rate || 0,
          fuelSurcharge: q.fuel_surcharge || 0,
          ratePerStop: 0,
          accessorialCharges: q.accessorials || 0,
          margin: 0,
          ftlLtlPercentage: q.ftl_ltl_percentage || 0,
          consignor: q.consignor || '',
          consignee: q.consignee || '',
          customer: q.customer || ''
        }));
        setQuotes(formattedQuotes);
        
        // Update quote counter based on existing quotes
        if (data.quotes && data.quotes.length > 0) {
          const maxNumber = Math.max(...data.quotes.map(q => {
            const num = parseInt(q.quote_number?.replace('RQ-', '') || '0');
            return isNaN(num) ? 0 : num;
          }));
          setQuoteCounter(maxNumber + 1);
        }
      }
    } catch (e) {
      console.error('Failed to load rate quotes:', e);
    }
  };

  const loadGoogleMapsKey = async () => {
    if (!fetchWithAuth || !BACKEND_URL) {
      console.log('fetchWithAuth or BACKEND_URL not available');
      return;
    }
    
    try {
      console.log('Loading Google Maps API key...');
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/integrations/google-maps/key`);
      console.log('Google Maps API key response:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Google Maps data:', data);
        if (data.configured && data.api_key) {
          setGoogleMapsApiKey(data.api_key);
          console.log('Google Maps API key loaded successfully');
        } else {
          console.log('Google Maps not configured or no API key');
        }
      }
    } catch (e) {
      console.error('Failed to load Google Maps API key:', e);
    }
  };

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

  const pushToRateQuotes = async () => {
    const quoteNumber = `RQ-${String(quoteCounter).padStart(4, '0')}`;
    
    // Prepare quote data for backend
    const quotePayload = {
      quote_number: quoteNumber,
      pickup: quoteData.pickupLocation || 'Not specified',
      destination: quoteData.destination || 'Not specified',
      stops: quoteData.stops || [],
      distance: quoteData.distance || 0,
      base_rate: (quoteData.distance * quoteData.ratePerMile) || 0,
      fuel_surcharge: quoteData.fuelSurcharge || 0,
      accessorials: quoteData.accessorialCharges || 0,
      total_quote: parseFloat(calculateTotalQuote()) || 0,
      consignor: quoteData.consignor || null,
      consignee: quoteData.consignee || null,
      customer: quoteData.customer || null,
      ftl_ltl_percentage: quoteData.ftlLtlPercentage || null,
      status: 'draft'
    };
    
    try {
      // Save to backend
      const res = await fetchWithAuth(`${BACKEND_URL}/api/sales/rate-quotes`, {
        method: 'POST',
        body: JSON.stringify(quotePayload)
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Create local quote object for state
        const newQuote = {
          id: data.quote_id,
          quoteNumber: data.quote_number,
          pickupLocation: quoteData.pickupLocation || 'Not specified',
          destination: quoteData.destination || 'Not specified',
          distance: quoteData.distance,
          totalAmount: calculateTotalQuote(),
          status: 'draft',
          createdAt: new Date().toISOString(),
          ratePerMile: quoteData.ratePerMile,
          fuelSurcharge: quoteData.fuelSurcharge,
          ratePerStop: quoteData.ratePerStop,
          accessorialCharges: quoteData.accessorialCharges,
          margin: quoteData.margin,
          ftlLtlPercentage: quoteData.ftlLtlPercentage,
          consignor: quoteData.consignor || '',
          consignee: quoteData.consignee || '',
          customer: quoteData.customer || ''
        };
        
        setQuotes([newQuote, ...quotes]);
        setQuoteCounter(quoteCounter + 1);
        setActiveTab('quotes');
        toast.success(`Quote ${data.quote_number} created and saved successfully`);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save quote');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote. Please try again.');
    }
  };

  // Create a load from a rate quote
  const createLoadFromQuote = async (quote) => {
    try {
      // Parse pickup location to extract city/state
      const pickupParts = quote.pickupLocation?.split(',').map(s => s.trim()) || [];
      const deliveryParts = quote.destination?.split(',').map(s => s.trim()) || [];
      
      const loadData = {
        pickup_location: quote.pickupLocation || '',
        pickup_city: pickupParts[0] || '',
        pickup_state: pickupParts[1] || '',
        pickup_country: 'USA',
        delivery_location: quote.destination || '',
        delivery_city: deliveryParts[0] || '',
        delivery_state: deliveryParts[1] || '',
        delivery_country: 'USA',
        shipper_name: quote.consignor || '',
        shipper_address: '',
        commodity: '',
        weight: '',
        cubes: '',
        confirmed_rate: parseFloat(quote.totalAmount) || 0,
        notes: `Created from Rate Quote ${quote.quoteNumber}`,
        source_quote_id: quote.id,
        source_quote_number: quote.quoteNumber
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/bookings/from-quote`, {
        method: 'POST',
        body: JSON.stringify(loadData)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Load created successfully from ${quote.quoteNumber}`);
        // Reload loads to show the new load
        loadLoads();
        // Switch to loads tab
        setActiveTab('loads');
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create load');
      }
    } catch (error) {
      console.error('Error creating load:', error);
      toast.error('Failed to create load. Please try again.');
    }
  };

  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const generateEmail = async (quote) => {
    try {
      toast.info('AI Assistant is generating your professional email...');
      
      const quoteDetails = `
Generate a professional rate quotation email for the following details:

QUOTE NUMBER: ${quote.quoteNumber}
DATE: ${new Date(quote.createdAt).toLocaleDateString()}

CUSTOMER INFORMATION:
- Customer: ${quote.customer}
- Consignor: ${quote.consignor}
- Consignee: ${quote.consignee}

ROUTE DETAILS:
- Pickup Location: ${quote.pickupLocation}
- Destination: ${quote.destination}
- Distance: ${quote.distance} miles

PRICING BREAKDOWN:
- Rate per Mile: $${quote.ratePerMile}
- Fuel Surcharge: $${quote.fuelSurcharge}
- Rate per Stop: $${quote.ratePerStop}
- Accessorial Charges: $${quote.accessorialCharges}
- Margin: ${quote.margin}%
- FTL/LTL: ${quote.ftlLtlPercentage}%

TOTAL AMOUNT: $${quote.totalAmount}

Please generate:
1. A professional email subject line
2. A complete professional email body with proper formatting, greeting, quote details, terms, and closing

Format the response EXACTLY as:
Subject: [subject line]

Body:
[email body]
      `.trim();

      const response = await fetchWithAuth(`${BACKEND_URL}/api/tms-chat/message`, {
        method: 'POST',
        body: JSON.stringify({
          message: quoteDetails,
          context: 'sales'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse the AI response to extract subject and body
        const emailContent = data.response || '';
        
        setGeneratedEmail({
          content: emailContent,
          quote: quote
        });
        setShowEmailModal(true);
        
        toast.success('Professional quotation email generated successfully!');
      } else {
        throw new Error('Failed to generate email');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email. Please try again.');
    }
  };

  const copyEmailToClipboard = () => {
    if (!generatedEmail) return;
    
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedEmail.content)
          .then(() => {
            toast.success('Email copied to clipboard!');
          })
          .catch(() => {
            // Fallback to older method
            fallbackCopyToClipboard(generatedEmail.content);
          });
      } else {
        // Use fallback method directly
        fallbackCopyToClipboard(generatedEmail.content);
      }
    } catch (error) {
      // Use fallback method
      fallbackCopyToClipboard(generatedEmail.content);
    }
  };

  const fallbackCopyToClipboard = (text) => {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success('Email copied to clipboard!');
      } else {
        toast.error('Failed to copy. Please select and copy manually.');
      }
    } catch (error) {
      console.error('Fallback copy failed:', error);
      toast.error('Failed to copy. Please select and copy manually.');
    }
    
    document.body.removeChild(textArea);
  };

  const isQuoteComplete = (quote) => {
    return quote.consignor && quote.consignee && quote.customer;
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Sales & Business Development
            </h1>
            <p className="text-sm text-gray-500 mt-1">Lead generation, CRM, rate quotes & customer management</p>
          </div>
          {activeTab === 'leads' && (
            <Button onClick={() => setShowAddLeadModal(true)} className="bg-[#F7B501] hover:bg-[#e5a701] rounded-lg">
              <i className="fas fa-plus mr-2"></i>
              Add New Lead
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="px-6 pt-4 bg-gray-50">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
          <TabsTrigger value="analytics" className="text-sm px-2">
            <i className="fas fa-chart-line mr-1.5 text-xs"></i>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="text-sm px-2">
            <i className="fas fa-funnel-dollar mr-1.5 text-xs"></i>
            <span className="hidden sm:inline">Sales </span>Pipeline
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-sm px-2">
            <i className="fas fa-user-plus mr-1.5 text-xs"></i>
            Leads
          </TabsTrigger>
          <TabsTrigger value="customers" className="text-sm px-2">
            <i className="fas fa-building mr-1.5 text-xs"></i>
            Customers
          </TabsTrigger>
          <TabsTrigger value="calculator" className="text-sm px-2">
            <i className="fas fa-calculator mr-1.5 text-xs"></i>
            <span className="hidden lg:inline">Freight </span>Calculator
          </TabsTrigger>
          <TabsTrigger value="quotes" className="text-sm px-2">
            <i className="fas fa-file-invoice-dollar mr-1.5 text-xs"></i>
            <span className="hidden sm:inline">Rate </span>Quotes
          </TabsTrigger>
          <TabsTrigger value="loads" className="text-sm px-2">
            <i className="fas fa-truck-loading mr-1.5 text-xs"></i>
            Loads
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 pb-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
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

            <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Active Opportunities</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{opportunities.length}</p>
                  </div>
                  <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-handshake text-gray-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Pipeline Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ${opportunities.reduce((sum, opp) => sum + opp.value, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-gray-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Active Customers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</p>
                  </div>
                  <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-building text-gray-600 text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Content */}
          <div className="grid gap-6">
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <CardTitle className="text-base font-semibold text-gray-900">Sales & Business Analytics</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-20">
                  <i className="fas fa-chart-pie text-gray-300 text-6xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Analytics Dashboard Coming Soon</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Comprehensive sales analytics, performance metrics, and business insights will be displayed here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6 pb-6">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-300">
            <CardHeader className="border-b-2 border-gray-300 px-4 py-3">
              <CardTitle className="text-base font-bold text-gray-900">Active Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {opportunities.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-handshake text-gray-400 text-5xl mb-4"></i>
                  <p className="text-gray-600">No opportunities yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Opportunity</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Company</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Value</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Stage</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Probability</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Close Date</th>
                        <th className="px-4 py-2.5 text-center text-sm font-bold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <tr key={opp.id} className="border-b border-gray-300 hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{opp.title}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{opp.company}</td>
                          <td className="px-4 py-2.5 text-sm text-green-600 font-semibold border-r border-gray-300">${opp.value.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <Badge className={getStatusColor(opp.stage)}>{opp.stage.replace('_', ' ').toUpperCase()}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`${getStageColor(opp.stage)} h-2 rounded-full`}
                                  style={{ width: `${opp.probability}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-700">{opp.probability}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{new Date(opp.close_date).toLocaleDateString()}</td>
                          <td className="px-4 py-2.5 text-sm text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-edit mr-1 text-xs"></i>
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-file-alt mr-1 text-xs"></i>
                                Proposal
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
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-6">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-300">
            <CardHeader className="border-b-2 border-gray-300 px-4 py-3">
              <CardTitle className="text-base font-bold text-gray-900">Lead Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-user-plus text-gray-400 text-5xl mb-4"></i>
                  <p className="text-gray-600">No leads yet</p>
                  <Button onClick={() => setShowAddLeadModal(true)} className="mt-4">
                    Add Your First Lead
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Company</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Contact Person</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Email</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Phone</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Source</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Status</th>
                        <th className="px-4 py-2.5 text-center text-sm font-bold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-gray-300 hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{lead.company_name}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{lead.contact_person}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-envelope text-gray-400 text-xs"></i>
                              {lead.email}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-phone text-gray-400 text-xs"></i>
                              {lead.phone}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300 capitalize">{lead.source.replace('_', ' ')}</td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <Badge className={getStatusColor(lead.status)}>{lead.status.toUpperCase()}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-phone mr-1 text-xs"></i>
                                Contact
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-arrow-right mr-1 text-xs"></i>
                                Convert
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
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-6">
          <Card className="bg-white rounded-lg shadow-sm border border-gray-300">
            <CardHeader className="border-b-2 border-gray-300 px-4 py-3">
              <CardTitle className="text-base font-bold text-gray-900">Customer Database</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-building text-gray-400 text-5xl mb-4"></i>
                  <p className="text-gray-600">No customers yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Company</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Contact Person</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Email</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Phone</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Total Revenue</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Loads</th>
                        <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Status</th>
                        <th className="px-4 py-2.5 text-center text-sm font-bold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b border-gray-300 hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{customer.company_name}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{customer.contact_person}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-envelope text-gray-400 text-xs"></i>
                              {customer.email}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">
                            <div className="flex items-center gap-1">
                              <i className="fas fa-phone text-gray-400 text-xs"></i>
                              {customer.phone}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-green-600 font-semibold border-r border-gray-300">${customer.total_revenue.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{customer.loads_count} completed</td>
                          <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                            <Badge className="bg-green-500 text-white">ACTIVE</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-center">
                            <div className="flex gap-1.5 justify-center">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-eye mr-1 text-xs"></i>
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-file-invoice mr-1 text-xs"></i>
                                Quote
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                <i className="fas fa-history mr-1 text-xs"></i>
                                History
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
        </TabsContent>

        {/* Freight Calculator Tab */}
        <TabsContent value="calculator" className="mt-6">
          {/* Multi-Quote Tabs Bar */}
          <div className="mb-4 flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2 overflow-x-auto">
            <div className="flex gap-1 flex-1 overflow-x-auto">
              {quoteTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all
                    ${tab.id === activeTabId 
                      ? 'bg-[#F7B501] text-white shadow-sm' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <i className="fas fa-file-invoice text-xs flex-shrink-0"></i>
                  <input
                    type="text"
                    value={tab.name}
                    onChange={(e) => {
                      e.stopPropagation();
                      setQuoteTabs(tabs => tabs.map(t => 
                        t.id === tab.id ? { ...t, name: e.target.value } : t
                      ));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={`
                      text-sm font-medium bg-transparent border-none outline-none w-20
                      ${tab.id === activeTabId ? 'text-white placeholder-white/70' : 'text-gray-700'}
                    `}
                    placeholder="Quote"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quoteTabs.length === 1) {
                        toast.error('Cannot close the last quote tab');
                        return;
                      }
                      const newTabs = quoteTabs.filter(t => t.id !== tab.id);
                      setQuoteTabs(newTabs);
                      if (tab.id === activeTabId && newTabs.length > 0) {
                        setActiveTabId(newTabs[0].id);
                      }
                      toast.success(`${tab.name} closed - all data cleared`);
                    }}
                    className={`
                      flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors
                      ${tab.id === activeTabId ? 'text-white hover:bg-white/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}
                    `}
                    title="Close quote"
                  >
                    <i className="fas fa-times text-sm"></i>
                  </button>
                </div>
              ))}
            </div>
            
            {/* Add New Quote Tab Button */}
            <button
              onClick={() => {
                const newTab = {
                  id: nextTabId,
                  name: `Quote ${nextTabId}`,
                  data: {
                    pickupLocation: '',
                    destination: '',
                    stops: [],
                    distance: 0,
                    ratePerMile: 0,
                    ratePerLbs: 0,
                    fuelSurcharge: 0,
                    ratePerStop: 0,
                    accessorialCharges: 0,
                    accessoryName: '',
                    margin: 0,
                    ftlLtlPercentage: 0,
                    consignor: '',
                    consignee: '',
                    customer: ''
                  },
                  routeData: null,
                  currentStop: ''
                };
                setQuoteTabs([...quoteTabs, newTab]);
                setActiveTabId(newTab.id);
                setNextTabId(nextTabId + 1);
                toast.success('New quote created');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-[#F7B501] hover:bg-[#e5a701] text-white rounded-md transition-colors flex-shrink-0"
            >
              <i className="fas fa-plus text-xs"></i>
              <span className="text-sm font-medium">New Quote</span>
            </button>
          </div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-2">
                {/* Left Column - Quote Calculator + Total Quote */}
                <div className="space-y-4 w-full lg:w-[280px] flex-shrink-0">
                  {/* Quote Calculator */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[480px] flex flex-col">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <i className="fas fa-dollar-sign text-gray-500"></i>
                        Quote Calculator
                      </h4>
                    </div>
                    <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Rate per Mile</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.ratePerMile || ''}
                            onChange={(e) => setQuoteData({...quoteData, ratePerMile: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Fuel Surcharge</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.fuelSurcharge || ''}
                            onChange={(e) => setQuoteData({...quoteData, fuelSurcharge: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Rate per Stop</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.ratePerStop || ''}
                            onChange={(e) => setQuoteData({...quoteData, ratePerStop: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Rate per Lbs</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            value={quoteData.ratePerLbs || ''}
                            onChange={(e) => setQuoteData({...quoteData, ratePerLbs: parseFloat(e.target.value) || 0})}
                            className="pl-7 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">FTL/LTL (%)</Label>
                        <div className="relative">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                          <Input 
                            type="number" 
                            placeholder="0"
                            min="0"
                            max="100"
                            step="1"
                            value={quoteData.ftlLtlPercentage || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              const clampedValue = Math.min(Math.max(value, 0), 100);
                              setQuoteData({...quoteData, ftlLtlPercentage: clampedValue});
                            }}
                            className="pr-7 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">0% = LTL</span> (Less Than Truck Load) | <span className="font-medium">100% = FTL</span> (Full Truck Load)
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Accessorial Charges</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              step="0.01"
                              value={quoteData.accessorialCharges || ''}
                              onChange={(e) => setQuoteData({...quoteData, accessorialCharges: parseFloat(e.target.value) || 0})}
                              className="pl-7 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                            />
                          </div>
                          <div className="relative flex-1">
                            <Input 
                              type="text" 
                              placeholder="Name"
                              value={quoteData.accessoryName || ''}
                              onChange={(e) => setQuoteData({...quoteData, accessoryName: e.target.value})}
                              className="h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 mb-1 block">Margin (%)</Label>
                        <div className="relative">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                          <Input 
                            type="number" 
                            placeholder="0"
                            step="1"
                            value={quoteData.margin || ''}
                            onChange={(e) => setQuoteData({...quoteData, margin: parseFloat(e.target.value) || 0})}
                            className="pr-8 h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>

                      {/* Required Fields for Email Generation */}
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <div>
                          <Label className="text-xs font-medium text-gray-600 mb-1 block">
                            Consignor <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Enter consignor name"
                            value={quoteData.consignor || ''}
                            onChange={(e) => setQuoteData({...quoteData, consignor: e.target.value})}
                            className="h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 mb-1 block">
                            Consignee <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Enter consignee name"
                            value={quoteData.consignee || ''}
                            onChange={(e) => setQuoteData({...quoteData, consignee: e.target.value})}
                            className="h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 mb-1 block">
                            Customer <span className="text-red-500">*</span>
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Enter customer name"
                            value={quoteData.customer || ''}
                            onChange={(e) => setQuoteData({...quoteData, customer: e.target.value})}
                            className="h-8 text-sm border-gray-200 rounded-lg focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                          />
                        </div>
                      </div>

                      {/* Route Distance Display */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-route text-[#F7B501]"></i>
                            <Label className="text-xs font-medium text-gray-700">Route Distance</Label>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-gray-900">
                              {routeData ? routeData.distanceValue.toFixed(2) : quoteData.distance || '0.00'}
                            </span>
                            <span className="text-xs font-medium text-gray-500">miles</span>
                          </div>
                        </div>
                        {routeData && (
                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                            <i className="fas fa-clock text-xs"></i>
                            <span>Est. {routeData.durationValue.toFixed(1)} hours</span>
                          </div>
                        )}
                        {!routeData && !quoteData.distance && (
                          <p className="mt-1 text-xs text-gray-400 italic">
                            Enter pickup & destination to calculate
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Total Rate Card - Below Quote Calculator */}
                  <div className="bg-gradient-to-br from-[#F7B501] to-[#e5a701] rounded-2xl shadow-md border border-[#e5a701] p-5 h-[275px] flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white/90">Total Quote</h4>
                      <i className="fas fa-file-invoice-dollar text-white/60 text-lg"></i>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-5xl font-bold text-white mb-2">${calculateTotalQuote()}</div>
                      <p className="text-sm text-white/90">Generated from calculator inputs</p>
                    </div>
                    <Button 
                      onClick={pushToRateQuotes}
                      className="w-full bg-white hover:bg-gray-50 text-[#F7B501] font-semibold rounded-lg shadow-sm h-11"
                    >
                      <i className="fas fa-arrow-right mr-2"></i>
                      Push to Rate Quotes
                    </Button>
                  </div>
                </div>

                {/* Right Column - Map + Unit Converter + Route Calculator */}
                <div className="space-y-4 flex-1">
                  {/* Map Display with Google Maps Integration - Bigger */}
                  <RouteMapPreview
                    pickup={quoteData.pickupLocation}
                    destination={quoteData.destination}
                    stops={quoteData.stops}
                    apiKey={googleMapsApiKey}
                    onRouteCalculated={(data) => {
                      setRouteData(data);
                      setQuoteData({...quoteData, distance: data.distanceValue});
                      toast.success(`Route calculated: ${data.distance} in ${data.duration}`);
                    }}
                  />

                  {/* Bottom Row - Unit Converter and Route Calculator */}
                  <div className="flex gap-4 items-start">
                    {/* Unit Converter - 364px width */}
                    <div className="flex-[0.9]">
                      <UnifiedConverter />
                    </div>

                    {/* Route Calculator - 404px width */}
                    <div className="border border-gray-200 rounded-xl bg-white shadow-sm h-[280px] flex-1 flex flex-col overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <i className="fas fa-route text-blue-500"></i>
                          Route Calculator
                        </h4>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-evenly">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                            <i className="fas fa-map-marker-alt text-green-500"></i>
                          </div>
                          <PlacesAutocomplete
                            placeholder="Pickup location"
                            value={quoteData.pickupLocation}
                            onChange={(value) => setQuoteData({...quoteData, pickupLocation: value})}
                            apiKey={googleMapsApiKey}
                            className="pl-10 h-9 border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        
                        {/* Add Stop Section */}
                        <div className="space-y-2">
                          <div className="relative flex gap-2">
                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                                <i className="fas fa-map-pin text-gray-400"></i>
                              </div>
                              <PlacesAutocomplete
                                placeholder="Add stop (optional)"
                                value={currentStop}
                                onChange={(value) => setCurrentStop(value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && currentStop.trim()) {
                                    e.preventDefault();
                                    setQuoteData({
                                      ...quoteData, 
                                      stops: [...quoteData.stops, currentStop]
                                    });
                                    setCurrentStop('');
                                    toast.success('Stop added to route');
                                  }
                                }}
                                apiKey={googleMapsApiKey}
                                className="pl-10 h-9 border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
                              />
                            </div>
                            <Button
                              onClick={() => {
                                if (currentStop.trim()) {
                                  setQuoteData({
                                    ...quoteData, 
                                    stops: [...quoteData.stops, currentStop]
                                  });
                                  setCurrentStop('');
                                  toast.success('Stop added to route');
                                }
                              }}
                              size="sm"
                              className="h-9 w-9 p-0 bg-[#F7B501] hover:bg-[#e5a701] text-white"
                            >
                              <i className="fas fa-plus"></i>
                            </Button>
                          </div>
                          
                          {/* List of Added Stops */}
                          {quoteData.stops.length > 0 && (
                            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                              {quoteData.stops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg px-3 py-2 text-xs border border-blue-100 hover:border-blue-200 transition-all">
                                  <i className="fas fa-map-pin text-blue-500 text-xs"></i>
                                  <span className="flex-1 truncate text-gray-700 font-medium">Stop {index + 1}: {stop}</span>
                                  <button
                                    onClick={() => {
                                      const newStops = quoteData.stops.filter((_, i) => i !== index);
                                      setQuoteData({...quoteData, stops: newStops});
                                      toast.success(`Stop ${index + 1} removed from route`);
                                    }}
                                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 transition-all shadow-sm hover:shadow"
                                    title="Remove this stop"
                                  >
                                    <i className="fas fa-times text-xs"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
                            <i className="fas fa-map-marker-alt text-red-500"></i>
                          </div>
                          <PlacesAutocomplete
                            placeholder="Destination"
                            value={quoteData.destination}
                            onChange={(value) => setQuoteData({...quoteData, destination: value})}
                            apiKey={googleMapsApiKey}
                            className="pl-10 h-9 border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          />
                        </div>

                        <Button 
                          onClick={() => {
                            if (!quoteData.pickupLocation || !quoteData.destination) {
                              toast.error('Please enter both pickup and destination locations');
                              return;
                            }
                            if (!googleMapsApiKey) {
                              toast.error('Google Maps not configured. Please add API key in Admin Console.');
                              return;
                            }
                            toast.info('Calculating route...');
                          }}
                          className="w-full bg-[#F7B501] hover:bg-[#e5a701] text-white rounded-lg shadow-sm h-10"
                        >
                          <i className="fas fa-calculator mr-2"></i>
                          Calculate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Quotes Tab */}
        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rate Quotes</CardTitle>
                <Button onClick={() => setActiveTab('calculator')}>
                  <i className="fas fa-plus mr-2"></i>
                  Create New Quote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-invoice-dollar text-gray-400 text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No Quotes Yet</h3>
                  <p className="text-gray-600 mb-4">Create professional rate quotes using the Freight Calculator</p>
                  <Button onClick={() => setActiveTab('calculator')} className="bg-blue-600 hover:bg-blue-700">
                    <i className="fas fa-calculator mr-2"></i>
                    Go to Freight Calculator
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-file-invoice text-blue-600 text-xl"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-blue-600 text-lg">
                                {quote.quoteNumber}
                              </h4>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">Rate Quote</Badge>
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              {quote.pickupLocation} → {quote.destination}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Created {new Date(quote.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-700">${quote.totalAmount}</div>
                          <Badge className={quote.status === 'incomplete' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {quote.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Required Info Section */}
                      <div className="grid grid-cols-3 gap-3 text-sm mb-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-gray-600 block">Consignor:</span>
                          <span className={`font-semibold ${quote.consignor ? 'text-gray-900' : 'text-red-500'}`}>
                            {quote.consignor || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Consignee:</span>
                          <span className={`font-semibold ${quote.consignee ? 'text-gray-900' : 'text-red-500'}`}>
                            {quote.consignee || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block">Customer:</span>
                          <span className={`font-semibold ${quote.customer ? 'text-gray-900' : 'text-red-500'}`}>
                            {quote.customer || 'Not specified'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Rate/Mile:</span>
                          <span className="font-semibold ml-1">${quote.ratePerMile}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Fuel Surcharge:</span>
                          <span className="font-semibold ml-1">${quote.fuelSurcharge}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Rate/Stop:</span>
                          <span className="font-semibold ml-1">${quote.ratePerStop}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Margin:</span>
                          <span className="font-semibold ml-1">{quote.margin}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm">
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateEmail(quote)}
                          disabled={!isQuoteComplete(quote)}
                          className={!isQuoteComplete(quote) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}
                        >
                          <i className="fas fa-envelope mr-1"></i>
                          Generate Email
                        </Button>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-check mr-1"></i>
                          Mark Complete
                        </Button>
                      </div>
                      {!isQuoteComplete(quote) && (
                        <p className="text-xs text-red-500 mt-2">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Please add Consignor, Consignee, and Customer to generate email
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

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

      {/* Generated Email Modal */}
      {showEmailModal && generatedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  <i className="fas fa-envelope mr-2 text-blue-600"></i>
                  Generated Email - {generatedEmail.quote.quoteNumber}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailModal(false)}
                  className="hover:bg-gray-100"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-info-circle text-blue-600"></i>
                    <span className="font-semibold text-blue-900">AI-Generated Professional Email</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Review the generated email below. You can copy it to your clipboard and paste it into your email client.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
{generatedEmail.content}
                  </pre>
                </div>
              </div>
            </CardContent>
            <div className="border-t border-gray-200 p-4 flex gap-2 flex-shrink-0">
              <Button
                onClick={copyEmailToClipboard}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <i className="fas fa-copy mr-2"></i>
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setShowEmailModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SalesDepartment;
