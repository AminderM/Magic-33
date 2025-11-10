import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, DollarSign, TrendingUp, Calendar, 
  Plus, Edit, Trash2, Phone, Mail, Building,
  CheckCircle, Clock, Target, Award
} from 'lucide-react';

const CRMView = ({ fetchWithAuth, BACKEND_URL }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  
  // Form states
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'lead',
    source: ''
  });
  
  const [dealForm, setDealForm] = useState({
    name: '',
    value: 0,
    stage: 'prospecting',
    contact_id: '',
    probability: 50,
    description: ''
  });
  
  const [activityForm, setActivityForm] = useState({
    type: 'call',
    subject: '',
    description: '',
    contact_id: '',
    completed: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsRes, dealsRes, activitiesRes, dashboardRes] = await Promise.all([
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/deals`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/activities`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/dashboard`)
      ]);

      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (dashboardRes.ok) setDashboard(await dashboardRes.json());
    } catch (e) {
      toast.error('Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts`, {
        method: 'POST',
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        toast.success('Contact created successfully');
        setIsContactModalOpen(false);
        loadData();
        resetContactForm();
      }
    } catch (e) {
      toast.error('Failed to create contact');
    }
  };

  const handleUpdateContact = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts/${editingContact.id}`, {
        method: 'PUT',
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        toast.success('Contact updated successfully');
        setIsContactModalOpen(false);
        loadData();
        resetContactForm();
      }
    } catch (e) {
      toast.error('Failed to update contact');
    }
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Contact deleted');
        loadData();
      }
    } catch (e) {
      toast.error('Failed to delete contact');
    }
  };

  const handleCreateDeal = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/deals`, {
        method: 'POST',
        body: JSON.stringify(dealForm)
      });
      if (res.ok) {
        toast.success('Deal created successfully');
        setIsDealModalOpen(false);
        loadData();
        resetDealForm();
      }
    } catch (e) {
      toast.error('Failed to create deal');
    }
  };

  const handleCreateActivity = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/activities`, {
        method: 'POST',
        body: JSON.stringify(activityForm)
      });
      if (res.ok) {
        toast.success('Activity created successfully');
        setIsActivityModalOpen(false);
        loadData();
        resetActivityForm();
      }
    } catch (e) {
      toast.error('Failed to create activity');
    }
  };

  const resetContactForm = () => {
    setContactForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      status: 'lead',
      source: ''
    });
    setEditingContact(null);
  };

  const resetDealForm = () => {
    setDealForm({
      name: '',
      value: 0,
      stage: 'prospecting',
      contact_id: '',
      probability: 50,
      description: ''
    });
    setEditingDeal(null);
  };

  const resetActivityForm = () => {
    setActivityForm({
      type: 'call',
      subject: '',
      description: '',
      contact_id: '',
      completed: false
    });
  };

  const openEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      status: contact.status,
      source: contact.source || ''
    });
    setIsContactModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      lead: 'bg-yellow-100 text-yellow-800',
      prospect: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const getStageBadge = (stage) => {
    const variants = {
      prospecting: 'bg-purple-100 text-purple-800',
      qualification: 'bg-blue-100 text-blue-800',
      proposal: 'bg-indigo-100 text-indigo-800',
      negotiation: 'bg-orange-100 text-orange-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800'
    };
    return <Badge className={variants[stage] || 'bg-gray-100'}>{stage.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">CRM</h2>
          <p className="text-gray-600 mt-2">Customer Relationship Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          {['dashboard', 'contacts', 'deals', 'activities'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.total_contacts}</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboard.leads} leads</p>
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
                    <p className="text-sm font-medium text-gray-600">Total Deal Value</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">${dashboard.total_deal_value.toLocaleString()}</p>
                    <p className="text-xs text-green-600 mt-1">{dashboard.won_deals_count} won</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.conversion_rate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">{dashboard.customers} customers</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Activities</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboard.pending_activities}</p>
                    <p className="text-xs text-gray-500 mt-1">to complete</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deals by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Deals by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(dashboard.deals_by_stage).map(([stage, count]) => (
                  <div key={stage} className="border rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize mt-1">{stage.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Contacts</h3>
            <Button onClick={() => { resetContactForm(); setIsContactModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(contact => (
              <Card key={contact.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{contact.first_name} {contact.last_name}</h4>
                      {contact.position && <p className="text-sm text-gray-600">{contact.position}</p>}
                      {contact.company && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {contact.company}
                        </div>
                      )}
                    </div>
                    {getStatusBadge(contact.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    {contact.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {contact.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => openEditContact(contact)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteContact(contact.id)}>
                      <Trash2 className="w-3 h-3 mr-1 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Deals Tab */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Deals</h3>
            <Button onClick={() => { resetDealForm(); setIsDealModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>

          <div className="space-y-4">
            {deals.map(deal => {
              const contact = contacts.find(c => c.id === deal.contact_id);
              return (
                <Card key={deal.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{deal.name}</h4>
                          {getStageBadge(deal.stage)}
                        </div>
                        {contact && (
                          <p className="text-sm text-gray-600 mt-1">
                            Contact: {contact.first_name} {contact.last_name}
                          </p>
                        )}
                        {deal.description && (
                          <p className="text-sm text-gray-600 mt-2">{deal.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${deal.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">{deal.probability}% probability</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Activities</h3>
            <Button onClick={() => { resetActivityForm(); setIsActivityModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>

          <div className="space-y-3">
            {activities.map(activity => {
              const contact = contacts.find(c => c.id === activity.contact_id);
              return (
                <Card key={activity.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {activity.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                            <h4 className="font-semibold">{activity.subject}</h4>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                          {contact && (
                            <p className="text-xs text-gray-500 mt-1">
                              Contact: {contact.first_name} {contact.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update contact information' : 'Create a new contact in your CRM'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={contactForm.first_name}
                onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={contactForm.last_name}
                onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                value={contactForm.position}
                onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={contactForm.status} onValueChange={(val) => setContactForm({ ...contactForm, status: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={contactForm.source}
                onChange={(e) => setContactForm({ ...contactForm, source: e.target.value })}
                placeholder="e.g., Website, Referral"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsContactModalOpen(false); resetContactForm(); }}>
              Cancel
            </Button>
            <Button onClick={editingContact ? handleUpdateContact : handleCreateContact}>
              {editingContact ? 'Update' : 'Create'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Modal */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>Create a new deal in your pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Deal Name *</Label>
              <Input
                value={dealForm.name}
                onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Value ($) *</Label>
                <Input
                  type="number"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Probability (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={dealForm.probability}
                  onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) || 50 })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={dealForm.stage} onValueChange={(val) => setDealForm({ ...dealForm, stage: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecting">Prospecting</SelectItem>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact</Label>
              <Select value={dealForm.contact_id} onValueChange={(val) => setDealForm({ ...dealForm, contact_id: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={dealForm.description}
                onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDealModalOpen(false); resetDealForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeal}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>Log an activity or create a task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Type</Label>
              <Select value={activityForm.type} onValueChange={(val) => setActivityForm({ ...activityForm, type: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Related Contact</Label>
              <Select value={activityForm.contact_id} onValueChange={(val) => setActivityForm({ ...activityForm, contact_id: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsActivityModalOpen(false); resetActivityForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateActivity}>Create Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMView;
