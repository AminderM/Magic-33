import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ==================== Chart Components ====================

// Cash Flow Trend Chart
const AccountingTrendChart = ({ receivables, payables }) => {
  const chartData = useMemo(() => {
    // Group by month
    const monthlyData = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData[key] = { month: key, ar: 0, ap: 0, net: 0 };
    }
    
    // Sum AR by month
    receivables.forEach(r => {
      const date = new Date(r.created_at);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[key]) {
        monthlyData[key].ar += r.amount || 0;
      }
    });
    
    // Sum AP by month
    payables.forEach(p => {
      const date = new Date(p.created_at);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[key]) {
        monthlyData[key].ap += p.amount || 0;
      }
    });
    
    // Calculate net
    Object.values(monthlyData).forEach(d => {
      d.net = d.ar - d.ap;
    });
    
    return Object.values(monthlyData);
  }, [receivables, payables]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="ar" name="Receivables" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
          <Line type="monotone" dataKey="ap" name="Payables" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
          <Line type="monotone" dataKey="net" name="Net Cash Flow" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#3b82f6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Collections Performance Pie Chart
const CollectionsChart = ({ receivables }) => {
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];
  
  const pieData = useMemo(() => {
    const paid = receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amount || 0), 0);
    const pending = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount || 0), 0);
    const overdue = receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + (r.amount || 0), 0);
    const partial = receivables.filter(r => r.status === 'partial').reduce((sum, r) => sum + (r.amount || 0), 0);
    
    return [
      { name: 'Paid', value: paid },
      { name: 'Pending', value: pending },
      { name: 'Overdue', value: overdue },
      { name: 'Partial', value: partial }
    ].filter(d => d.value > 0);
  }, [receivables]);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  const collectionRate = total > 0 
    ? ((pieData.find(d => d.name === 'Paid')?.value || 0) / total * 100).toFixed(1) 
    : 0;

  return (
    <div className="h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-2xl font-bold text-gray-900">{collectionRate}%</div>
        <div className="text-xs text-gray-500">Collection Rate</div>
      </div>
    </div>
  );
};

// Aging Row Component (helper for AgingReport)
const AgingRow = ({ label, ar, ap, colorClass }) => (
  <div className={`grid grid-cols-3 gap-4 p-3 ${colorClass} rounded-lg`}>
    <span className="font-medium">{label}</span>
    <span className="text-right text-green-700">${ar.toLocaleString()}</span>
    <span className="text-right text-red-700">${ap.toLocaleString()}</span>
  </div>
);

// Aging Report Component
const AgingReport = ({ receivables, payables }) => {
  const agingData = useMemo(() => {
    const today = new Date();
    
    const calculateAging = (items, dateField = 'due_date') => {
      const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
      
      items.filter(item => item.status !== 'paid').forEach(item => {
        const dueDate = new Date(item[dateField]);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 0) buckets.current += item.amount || 0;
        else if (daysOverdue <= 30) buckets.days30 += item.amount || 0;
        else if (daysOverdue <= 60) buckets.days60 += item.amount || 0;
        else if (daysOverdue <= 90) buckets.days90 += item.amount || 0;
        else buckets.over90 += item.amount || 0;
      });
      
      return buckets;
    };
    
    return {
      ar: calculateAging(receivables),
      ap: calculateAging(payables)
    };
  }, [receivables, payables]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-4 px-3 py-2 bg-gray-100 rounded-lg font-semibold text-sm">
        <span>Aging Bucket</span>
        <span className="text-right text-green-700">AR Outstanding</span>
        <span className="text-right text-red-700">AP Outstanding</span>
      </div>
      <AgingRow label="Current" ar={agingData.ar.current} ap={agingData.ap.current} colorClass="bg-green-50" />
      <AgingRow label="1-30 Days" ar={agingData.ar.days30} ap={agingData.ap.days30} colorClass="bg-yellow-50" />
      <AgingRow label="31-60 Days" ar={agingData.ar.days60} ap={agingData.ap.days60} colorClass="bg-orange-50" />
      <AgingRow label="61-90 Days" ar={agingData.ar.days90} ap={agingData.ap.days90} colorClass="bg-red-50" />
      <AgingRow label="Over 90 Days" ar={agingData.ar.over90} ap={agingData.ap.over90} colorClass="bg-red-100" />
    </div>
  );
};

// Cash Flow Projection Component
const CashFlowProjection = ({ receivables, payables }) => {
  const projectionData = useMemo(() => {
    const today = new Date();
    const projections = [];
    let runningBalance = 0;
    
    // Get expected inflows (AR pending/sent) and outflows (AP pending)
    const expectedInflows = receivables
      .filter(r => ['pending', 'sent'].includes(r.status))
      .map(r => ({ date: new Date(r.due_date), amount: r.amount, type: 'inflow', description: r.customer_name }));
    
    const expectedOutflows = payables
      .filter(p => p.status === 'pending')
      .map(p => ({ date: new Date(p.due_date), amount: p.amount, type: 'outflow', description: p.vendor_name }));
    
    // Combine and sort by date
    const allTransactions = [...expectedInflows, ...expectedOutflows]
      .filter(t => {
        const daysDiff = Math.floor((t.date - today) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 30;
      })
      .sort((a, b) => a.date - b.date);
    
    // Generate weekly projections
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (week - 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + week * 7);
      
      const weekTransactions = allTransactions.filter(t => t.date >= weekStart && t.date < weekEnd);
      const inflow = weekTransactions.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0);
      const outflow = weekTransactions.filter(t => t.type === 'outflow').reduce((sum, t) => sum + t.amount, 0);
      runningBalance += inflow - outflow;
      
      projections.push({
        week: `Week ${week}`,
        inflow,
        outflow,
        net: inflow - outflow,
        balance: runningBalance
      });
    }
    
    return projections;
  }, [receivables, payables]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={projectionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="inflow" name="Expected Inflow" fill="#22c55e" />
          <Bar dataKey="outflow" name="Expected Outflow" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==================== Main Component ====================

const AccountingDepartment = ({ BACKEND_URL, fetchWithAuth }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null); // 'ar' or 'ap'
  const [paymentItem, setPaymentItem] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'check',
    reference_number: '',
    notes: ''
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Receipt processing state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [parsedReceiptData, setParsedReceiptData] = useState(null);
  const [receiptType, setReceiptType] = useState(null); // 'ar' or 'ap'

  // AR Filters
  const [arFilters, setArFilters] = useState({
    invoiceNumber: 'all',
    customer: 'all',
    status: 'all',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: ''
  });

  // AP Filters
  const [apFilters, setApFilters] = useState({
    billNumber: 'all',
    vendor: 'all',
    status: 'all',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: ''
  });

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    invoice_number: '',
    amount: '',
    due_date: '',
    description: '',
    load_reference: '',
    status: 'pending'
  });

  // Bill form
  const [billForm, setBillForm] = useState({
    vendor_name: '',
    vendor_email: '',
    bill_number: '',
    amount: '',
    due_date: '',
    description: '',
    category: 'fuel',
    status: 'pending'
  });

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({});

  useEffect(() => {
    loadData();
    loadAlerts();
  }, [fetchWithAuth, BACKEND_URL]);

  const loadAlerts = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setAlertsSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load AR
      const arRes = await fetchWithAuth(`${BACKEND_URL}/api/accounting/receivables`);
      if (arRes.ok) {
        const arData = await arRes.json();
        setReceivables(arData.receivables || []);
      }

      // Load AP
      const apRes = await fetchWithAuth(`${BACKEND_URL}/api/accounting/payables`);
      if (apRes.ok) {
        const apData = await apRes.json();
        setPayables(apData.payables || []);
      }
    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered AR
  const filteredReceivables = receivables.filter(item => {
    if (arFilters.invoiceNumber !== 'all' && item.invoice_number !== arFilters.invoiceNumber) return false;
    if (arFilters.customer !== 'all' && item.customer_name !== arFilters.customer) return false;
    if (arFilters.status !== 'all' && item.status !== arFilters.status) return false;
    if (arFilters.amountMin && item.amount < parseFloat(arFilters.amountMin)) return false;
    if (arFilters.amountMax && item.amount > parseFloat(arFilters.amountMax)) return false;
    if (arFilters.dateFrom || arFilters.dateTo) {
      const itemDate = new Date(item.created_at);
      if (arFilters.dateFrom && itemDate < new Date(arFilters.dateFrom)) return false;
      if (arFilters.dateTo && itemDate > new Date(arFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Filtered AP
  const filteredPayables = payables.filter(item => {
    if (apFilters.billNumber !== 'all' && item.bill_number !== apFilters.billNumber) return false;
    if (apFilters.vendor !== 'all' && item.vendor_name !== apFilters.vendor) return false;
    if (apFilters.status !== 'all' && item.status !== apFilters.status) return false;
    if (apFilters.amountMin && item.amount < parseFloat(apFilters.amountMin)) return false;
    if (apFilters.amountMax && item.amount > parseFloat(apFilters.amountMax)) return false;
    if (apFilters.dateFrom || apFilters.dateTo) {
      const itemDate = new Date(item.created_at);
      if (apFilters.dateFrom && itemDate < new Date(apFilters.dateFrom)) return false;
      if (apFilters.dateTo && itemDate > new Date(apFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Unique values for filters
  const uniqueInvoiceNumbers = [...new Set(receivables.map(r => r.invoice_number).filter(Boolean))];
  const uniqueCustomers = [...new Set(receivables.map(r => r.customer_name).filter(Boolean))];
  const uniqueBillNumbers = [...new Set(payables.map(p => p.bill_number).filter(Boolean))];
  const uniqueVendors = [...new Set(payables.map(p => p.vendor_name).filter(Boolean))];

  // Calculate totals
  const totalAR = receivables.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalARPending = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalAROverdue = receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalARPaid = receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalAP = payables.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAPPending = payables.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAPOverdue = payables.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAPPaid = payables.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);

  // Create Invoice
  const handleCreateInvoice = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/receivables`, {
        method: 'POST',
        body: JSON.stringify(invoiceForm)
      });

      if (res.ok) {
        toast.success('Invoice created successfully');
        setShowInvoiceModal(false);
        setInvoiceForm({
          customer_name: '',
          customer_email: '',
          invoice_number: '',
          amount: '',
          due_date: '',
          description: '',
          load_reference: '',
          status: 'pending'
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  // Create Bill
  const handleCreateBill = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/payables`, {
        method: 'POST',
        body: JSON.stringify(billForm)
      });

      if (res.ok) {
        toast.success('Bill created successfully');
        setShowBillModal(false);
        setBillForm({
          vendor_name: '',
          vendor_email: '',
          bill_number: '',
          amount: '',
          due_date: '',
          description: '',
          category: 'fuel',
          status: 'pending'
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create bill');
      }
    } catch (error) {
      toast.error('Failed to create bill');
    }
  };

  // Update status
  const handleStatusChange = async (type, id, newStatus) => {
    try {
      const endpoint = type === 'ar' ? 'receivables' : 'payables';
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success('Status updated successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Payment functions
  const openPaymentModal = (type, item) => {
    setPaymentType(type);
    setPaymentItem(item);
    setPaymentForm({
      amount: '',
      payment_method: 'check',
      reference_number: '',
      notes: ''
    });
    setShowPaymentModal(true);
    
    // Load payment history asynchronously
    loadPaymentHistory(type, item.id);
  };

  const loadPaymentHistory = async (type, itemId) => {
    setLoadingPayments(true);
    try {
      const endpoint = type === 'ar' 
        ? `${BACKEND_URL}/api/accounting/receivables/${itemId}/payments`
        : `${BACKEND_URL}/api/accounting/payables/${itemId}/payments`;
      
      const res = await fetchWithAuth(endpoint);
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const endpoint = paymentType === 'ar'
        ? `${BACKEND_URL}/api/accounting/receivables/${paymentItem.id}/payments`
        : `${BACKEND_URL}/api/accounting/payables/${paymentItem.id}/payments`;

      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number,
          notes: paymentForm.notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Payment of $${parseFloat(paymentForm.amount).toLocaleString()} recorded successfully`);
        
        // Reset form and reload
        setPaymentForm({
          amount: '',
          payment_method: 'check',
          reference_number: '',
          notes: ''
        });
        
        // Reload payment history and data
        await loadPaymentHistory(paymentType, paymentItem.id);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Receipt processing functions
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setParsedReceiptData(null);
      setReceiptType(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async () => {
    if (!receiptFile) {
      toast.error('Please upload a receipt image first');
      return;
    }

    setProcessingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);

      // Use fetch directly for FormData (don't set Content-Type, let browser handle it)
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/accounting/parse-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setParsedReceiptData(data.parsed_data);
        setReceiptType(data.suggested_type); // 'ar' or 'ap'
        toast.success('Receipt processed successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to process receipt');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt');
    } finally {
      setProcessingReceipt(false);
    }
  };

  const submitParsedReceipt = async () => {
    if (!parsedReceiptData || !receiptType) {
      toast.error('Please process a receipt first');
      return;
    }

    try {
      const endpoint = receiptType === 'ar' 
        ? `${BACKEND_URL}/api/accounting/receivables`
        : `${BACKEND_URL}/api/accounting/payables`;

      const payload = receiptType === 'ar' 
        ? {
            customer_name: parsedReceiptData.party_name || 'Unknown Customer',
            customer_email: parsedReceiptData.email || '',
            invoice_number: parsedReceiptData.document_number || `INV-${Date.now()}`,
            amount: parsedReceiptData.amount || 0,
            due_date: parsedReceiptData.date || new Date().toISOString().split('T')[0],
            description: parsedReceiptData.description || 'Imported from receipt',
            load_reference: parsedReceiptData.reference || ''
          }
        : {
            vendor_name: parsedReceiptData.party_name || 'Unknown Vendor',
            vendor_email: parsedReceiptData.email || '',
            bill_number: parsedReceiptData.document_number || `BILL-${Date.now()}`,
            amount: parsedReceiptData.amount || 0,
            due_date: parsedReceiptData.date || new Date().toISOString().split('T')[0],
            description: parsedReceiptData.description || 'Imported from receipt',
            category: parsedReceiptData.category || 'other'
          };

      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`Entry added to ${receiptType === 'ar' ? 'Accounts Receivable' : 'Accounts Payable'}!`);
        // Reset receipt state
        setReceiptFile(null);
        setReceiptPreview(null);
        setParsedReceiptData(null);
        setReceiptType(null);
        loadData();
        // Switch to the appropriate tab
        setActiveTab(receiptType === 'ar' ? 'receivables' : 'payables');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast.error('Failed to create entry');
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setParsedReceiptData(null);
    setReceiptType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Accounting</h1>
          <p className="text-sm text-gray-500">Manage invoices, bills, and financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowInvoiceModal(true)} className="bg-green-600 hover:bg-green-700">
            <i className="fas fa-plus mr-2"></i>
            New Invoice
          </Button>
          <Button onClick={() => setShowBillModal(true)} variant="outline">
            <i className="fas fa-plus mr-2"></i>
            New Bill
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600">Total Receivable</p>
                <p className="text-2xl font-bold text-green-700">${totalAR.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-down text-green-600"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              <span className="font-medium">{receivables.length}</span> invoices
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600">Total Payable</p>
                <p className="text-2xl font-bold text-red-700">${totalAP.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-up text-red-600"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-red-600">
              <span className="font-medium">{payables.length}</span> bills
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600">Overdue AR</p>
                <p className="text-2xl font-bold text-yellow-700">${totalAROverdue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              <span className="font-medium">{receivables.filter(r => r.status === 'overdue').length}</span> overdue
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600">Net Position</p>
                <p className={`text-2xl font-bold ${totalAR - totalAP >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  ${(totalAR - totalAP).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <i className="fas fa-balance-scale text-blue-600"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">AR - AP Balance</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white rounded-xl p-1 border border-gray-200 shadow-sm max-w-2xl">
          <TabsTrigger value="analytics" className="text-sm">
            <i className="fas fa-chart-line mr-2"></i>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="receipts" className="text-sm">
            <i className="fas fa-receipt mr-2"></i>
            Receipts
          </TabsTrigger>
          <TabsTrigger value="receivables" className="text-sm">
            <i className="fas fa-file-invoice-dollar mr-2"></i>
            Accounts Receivable
          </TabsTrigger>
          <TabsTrigger value="payables" className="text-sm">
            <i className="fas fa-file-invoice mr-2"></i>
            Accounts Payable
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Top Row - Summary Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* AR Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-arrow-circle-down text-green-600 mr-2"></i>
                    Accounts Receivable Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">Pending</span>
                      <span className="text-lg font-bold text-yellow-700">${totalARPending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-800">Overdue</span>
                      <span className="text-lg font-bold text-red-700">${totalAROverdue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Paid</span>
                      <span className="text-lg font-bold text-green-700">${totalARPaid.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="text-xl font-bold text-gray-900">${totalAR.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AP Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-arrow-circle-up text-red-600 mr-2"></i>
                    Accounts Payable Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">Pending</span>
                      <span className="text-lg font-bold text-yellow-700">${totalAPPending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-800">Overdue</span>
                      <span className="text-lg font-bold text-red-700">${totalAPOverdue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Paid</span>
                      <span className="text-lg font-bold text-green-700">${totalAPPaid.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="text-xl font-bold text-gray-900">${totalAP.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row - Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* AR/AP Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-chart-line text-blue-600 mr-2"></i>
                    Cash Flow Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountingTrendChart receivables={receivables} payables={payables} />
                </CardContent>
              </Card>

              {/* Collections Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-chart-pie text-purple-600 mr-2"></i>
                    Collections Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CollectionsChart receivables={receivables} />
                </CardContent>
              </Card>
            </div>

            {/* Third Row - Aging Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-calendar-alt text-orange-600 mr-2"></i>
                  Aging Report Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgingReport receivables={receivables} payables={payables} />
              </CardContent>
            </Card>

            {/* Fourth Row - Cash Flow Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-piggy-bank text-teal-600 mr-2"></i>
                  Cash Flow Projection (Next 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowProjection receivables={receivables} payables={payables} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-upload text-blue-600 mr-2"></i>
                  Upload Receipt
                </CardTitle>
                <p className="text-sm text-gray-600">Upload a receipt image for AI processing</p>
              </CardHeader>
              <CardContent>
                {!receiptPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <i className="fas fa-cloud-upload-alt text-gray-400 text-4xl mb-4"></i>
                      <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400">PNG, JPG, JPEG up to 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={clearReceipt}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={processReceipt} 
                        disabled={processingReceipt}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {processingReceipt ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic mr-2"></i>
                            Process with AI
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={clearReceipt}>
                        <i className="fas fa-redo mr-2"></i>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parsed Data Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-file-alt text-purple-600 mr-2"></i>
                  Extracted Data
                </CardTitle>
                <p className="text-sm text-gray-600">Review and confirm extracted information</p>
              </CardHeader>
              <CardContent>
                {!parsedReceiptData ? (
                  <div className="text-center py-12">
                    <i className="fas fa-file-invoice text-gray-300 text-5xl mb-4"></i>
                    <p className="text-gray-500">Upload and process a receipt to see extracted data</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Suggested Type */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                      <span className="font-medium text-gray-700">Suggested Category:</span>
                      <Badge className={receiptType === 'ar' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {receiptType === 'ar' ? '📥 Accounts Receivable' : '📤 Accounts Payable'}
                      </Badge>
                    </div>

                    {/* Toggle Type */}
                    <div className="flex gap-2">
                      <Button
                        variant={receiptType === 'ar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReceiptType('ar')}
                        className={receiptType === 'ar' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        <i className="fas fa-arrow-down mr-1"></i> Receivable
                      </Button>
                      <Button
                        variant={receiptType === 'ap' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReceiptType('ap')}
                        className={receiptType === 'ap' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        <i className="fas fa-arrow-up mr-1"></i> Payable
                      </Button>
                    </div>

                    {/* Extracted Fields */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">{receiptType === 'ar' ? 'Customer' : 'Vendor'}</Label>
                          <Input 
                            value={parsedReceiptData.party_name || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, party_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Amount ($)</Label>
                          <Input 
                            type="number"
                            value={parsedReceiptData.amount || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, amount: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Date</Label>
                          <Input 
                            type="date"
                            value={parsedReceiptData.date || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Document #</Label>
                          <Input 
                            value={parsedReceiptData.document_number || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, document_number: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Description</Label>
                        <Input 
                          value={parsedReceiptData.description || ''} 
                          onChange={(e) => setParsedReceiptData({...parsedReceiptData, description: e.target.value})}
                        />
                      </div>
                      {receiptType === 'ap' && (
                        <div>
                          <Label className="text-xs text-gray-500">Category</Label>
                          <Select 
                            value={parsedReceiptData.category || 'other'} 
                            onValueChange={(value) => setParsedReceiptData({...parsedReceiptData, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fuel">Fuel</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="tolls">Tolls</SelectItem>
                              <SelectItem value="supplies">Supplies</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button 
                      onClick={submitParsedReceipt} 
                      className={`w-full ${receiptType === 'ar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      <i className={`fas ${receiptType === 'ar' ? 'fa-file-invoice-dollar' : 'fa-file-invoice'} mr-2`}></i>
                      Add to {receiptType === 'ar' ? 'Accounts Receivable' : 'Accounts Payable'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounts Receivable Tab */}
        <TabsContent value="receivables" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Accounts Receivable ({filteredReceivables.length})</CardTitle>
                  <span className="text-xs text-gray-500">{receivables.length} total</span>
                </div>
                <Button onClick={() => setShowInvoiceModal(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                  <i className="fas fa-plus mr-2"></i>
                  New Invoice
                </Button>
              </div>
            </CardHeader>

            {/* AR Filter Bar */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice #</label>
                  <select
                    value={arFilters.invoiceNumber}
                    onChange={(e) => setArFilters({ ...arFilters, invoiceNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    {uniqueInvoiceNumbers.map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
                  <select
                    value={arFilters.customer}
                    onChange={(e) => setArFilters({ ...arFilters, customer: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    {uniqueCustomers.map(c => (
                      <option key={c} value={c}>{c.length > 15 ? c.substring(0, 15) + '...' : c}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={arFilters.amountMin}
                      onChange={(e) => setArFilters({ ...arFilters, amountMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="number"
                      value={arFilters.amountMax}
                      onChange={(e) => setArFilters({ ...arFilters, amountMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={arFilters.status}
                    onChange={(e) => setArFilters({ ...arFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={arFilters.dateFrom}
                      onChange={(e) => setArFilters({ ...arFilters, dateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="date"
                      value={arFilters.dateTo}
                      onChange={(e) => setArFilters({ ...arFilters, dateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {(arFilters.invoiceNumber !== 'all' || arFilters.customer !== 'all' || 
                  arFilters.amountMin || arFilters.amountMax || arFilters.status !== 'all' ||
                  arFilters.dateFrom || arFilters.dateTo) && (
                  <button
                    onClick={() => setArFilters({
                      invoiceNumber: 'all', customer: 'all', status: 'all',
                      amountMin: '', amountMax: '', dateFrom: '', dateTo: ''
                    })}
                    className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded whitespace-nowrap"
                  >
                    <i className="fas fa-times mr-1"></i>Clear
                  </button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              {filteredReceivables.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-invoice-dollar text-gray-400 text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No Invoices</h3>
                  <p className="text-gray-600 mb-4">Create your first invoice to track receivables</p>
                  <Button onClick={() => setShowInvoiceModal(true)} className="bg-green-600 hover:bg-green-700">
                    <i className="fas fa-plus mr-2"></i>Create Invoice
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Invoice #</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Paid/Balance</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Load Ref</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReceivables.map((item, index) => (
                        <tr key={item.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 font-medium text-blue-600">
                            <div className="flex items-center gap-1">
                              {item.invoice_number}
                              {item.auto_generated && (
                                <span className="text-xs text-green-600" title="Auto-generated from load">
                                  <i className="fas fa-link"></i>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.customer_name}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">${item.amount?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="text-green-600">Paid: ${(item.amount_paid || 0).toLocaleString()}</div>
                              <div className="text-red-600">Due: ${((item.amount || 0) - (item.amount_paid || 0)).toLocaleString()}</div>
                              {/* Mini progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-green-500 h-1 rounded-full"
                                  style={{ width: `${Math.min(100, ((item.amount_paid || 0) / (item.amount || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {item.load_reference ? (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <i className="fas fa-truck mr-1"></i>
                                {item.load_reference}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {item.status !== 'paid' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => openPaymentModal('ar', item)}
                                >
                                  <i className="fas fa-dollar-sign mr-1"></i>
                                  Pay
                                </Button>
                              )}
                              <Select value={item.status} onValueChange={(value) => handleStatusChange('ar', item.id, value)}>
                                <SelectTrigger className="h-7 w-[90px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="sent">Sent</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                              </Select>
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

        {/* Accounts Payable Tab */}
        <TabsContent value="payables" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Accounts Payable ({filteredPayables.length})</CardTitle>
                  <span className="text-xs text-gray-500">{payables.length} total</span>
                </div>
                <Button onClick={() => setShowBillModal(true)} size="sm" variant="outline">
                  <i className="fas fa-plus mr-2"></i>
                  New Bill
                </Button>
              </div>
            </CardHeader>

            {/* AP Filter Bar */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bill #</label>
                  <select
                    value={apFilters.billNumber}
                    onChange={(e) => setApFilters({ ...apFilters, billNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    {uniqueBillNumbers.map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
                  <select
                    value={apFilters.vendor}
                    onChange={(e) => setApFilters({ ...apFilters, vendor: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    {uniqueVendors.map(v => (
                      <option key={v} value={v}>{v.length > 15 ? v.substring(0, 15) + '...' : v}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={apFilters.amountMin}
                      onChange={(e) => setApFilters({ ...apFilters, amountMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="number"
                      value={apFilters.amountMax}
                      onChange={(e) => setApFilters({ ...apFilters, amountMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={apFilters.status}
                    onChange={(e) => setApFilters({ ...apFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Range</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={apFilters.dateFrom}
                      onChange={(e) => setApFilters({ ...apFilters, dateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="date"
                      value={apFilters.dateTo}
                      onChange={(e) => setApFilters({ ...apFilters, dateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {(apFilters.billNumber !== 'all' || apFilters.vendor !== 'all' || 
                  apFilters.amountMin || apFilters.amountMax || apFilters.status !== 'all' ||
                  apFilters.dateFrom || apFilters.dateTo) && (
                  <button
                    onClick={() => setApFilters({
                      billNumber: 'all', vendor: 'all', status: 'all',
                      amountMin: '', amountMax: '', dateFrom: '', dateTo: ''
                    })}
                    className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded whitespace-nowrap"
                  >
                    <i className="fas fa-times mr-1"></i>Clear
                  </button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              {filteredPayables.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-invoice text-gray-400 text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No Bills</h3>
                  <p className="text-gray-600 mb-4">Create your first bill to track payables</p>
                  <Button onClick={() => setShowBillModal(true)} variant="outline">
                    <i className="fas fa-plus mr-2"></i>Create Bill
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Bill #</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Vendor</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Paid/Balance</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Load Ref</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayables.map((item, index) => (
                        <tr key={item.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-4 py-3 font-medium text-blue-600">
                            <div className="flex items-center gap-1">
                              {item.bill_number}
                              {item.auto_generated && (
                                <span className="text-xs text-green-600" title="Auto-generated from load">
                                  <i className="fas fa-link"></i>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.vendor_name}</td>
                          <td className="px-4 py-3 font-semibold text-red-700">${item.amount?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="text-green-600">Paid: ${(item.amount_paid || 0).toLocaleString()}</div>
                              <div className="text-red-600">Due: ${((item.amount || 0) - (item.amount_paid || 0)).toLocaleString()}</div>
                              {/* Mini progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full"
                                  style={{ width: `${Math.min(100, ((item.amount_paid || 0) / (item.amount || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 capitalize">{item.category || '-'}</td>
                          <td className="px-4 py-3">
                            {item.load_reference ? (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <i className="fas fa-truck mr-1"></i>
                                {item.load_reference}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {item.status !== 'paid' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                                  onClick={() => openPaymentModal('ap', item)}
                                >
                                  <i className="fas fa-dollar-sign mr-1"></i>
                                  Pay
                                </Button>
                              )}
                              <Select value={item.status} onValueChange={(value) => handleStatusChange('ap', item.id, value)}>
                                <SelectTrigger className="h-7 w-[90px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                              </Select>
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
      </Tabs>

      {/* Create Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number *</Label>
                <Input
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={invoiceForm.customer_name}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Customer Email</Label>
              <Input
                type="email"
                value={invoiceForm.customer_email}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Load Reference</Label>
              <Input
                value={invoiceForm.load_reference}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, load_reference: e.target.value })}
                placeholder="LD-XXXXXXXX"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                placeholder="Invoice description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} className="bg-green-600 hover:bg-green-700">Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bill Modal */}
      <Dialog open={showBillModal} onOpenChange={setShowBillModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Number *</Label>
                <Input
                  value={billForm.bill_number}
                  onChange={(e) => setBillForm({ ...billForm, bill_number: e.target.value })}
                  placeholder="BILL-001"
                />
              </div>
              <div>
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={billForm.vendor_name}
                onChange={(e) => setBillForm({ ...billForm, vendor_name: e.target.value })}
                placeholder="Vendor name"
              />
            </div>
            <div>
              <Label>Vendor Email</Label>
              <Input
                type="email"
                value={billForm.vendor_email}
                onChange={(e) => setBillForm({ ...billForm, vendor_email: e.target.value })}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={billForm.due_date}
                  onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={billForm.category} onValueChange={(v) => setBillForm({ ...billForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="tolls">Tolls</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                placeholder="Bill description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBillModal(false)}>Cancel</Button>
            <Button onClick={handleCreateBill}>Create Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {paymentType === 'ar' ? 'Record Payment Received' : 'Record Payment Made'}
            </DialogTitle>
          </DialogHeader>
          
          {paymentItem && (
            <div className="space-y-4">
              {/* Invoice/Bill Summary */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{paymentType === 'ar' ? 'Invoice #' : 'Bill #'}:</span>
                  <span className="font-medium">{paymentType === 'ar' ? paymentItem.invoice_number : paymentItem.bill_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{paymentType === 'ar' ? 'Customer' : 'Vendor'}:</span>
                  <span className="font-medium">{paymentType === 'ar' ? paymentItem.customer_name : paymentItem.vendor_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-gray-900">${paymentItem.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">${(paymentItem.amount_paid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Balance Due:</span>
                  <span className="font-bold text-red-600">${((paymentItem.amount || 0) - (paymentItem.amount_paid || 0)).toLocaleString()}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((paymentItem.amount_paid || 0) / (paymentItem.amount || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {((paymentItem.amount_paid || 0) / (paymentItem.amount || 1) * 100).toFixed(0)}% paid
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 bg-gray-50 border-b">
                    <h4 className="font-medium text-sm">Payment History</h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {paymentHistory.map((payment, idx) => (
                      <div key={idx} className="p-2 border-b last:border-b-0 text-sm flex justify-between items-center">
                        <div>
                          <span className="font-medium text-green-600">${payment.amount?.toLocaleString()}</span>
                          <span className="text-gray-500 ml-2">via {payment.payment_method}</span>
                          {payment.reference_number && (
                            <span className="text-gray-400 ml-2">#{payment.reference_number}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(payment.recorded_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Payment Form */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium text-sm">Record New Payment</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Amount ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                      max={(paymentItem.amount || 0) - (paymentItem.amount_paid || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Payment Method</Label>
                    <Select 
                      value={paymentForm.payment_method} 
                      onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Reference Number</Label>
                  <Input
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    placeholder="Check #, Transaction ID, etc."
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button 
              onClick={handleRecordPayment}
              className={paymentType === 'ar' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              <i className="fas fa-check mr-2"></i>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingDepartment;
