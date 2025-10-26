import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const CompanyProfile = () => {
  const { user, fetchWithAuth } = useAuth();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const isAdmin = user?.role === 'fleet_owner';

  useEffect(() => {
    loadCompanyProfile();
    loadCompanyUsers();
    loadDrivers();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading company:', error);
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyUsers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users/company`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/my`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCompany = async () => {
    if (!isAdmin) {
      toast.error('Only admins can edit company profile');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updated = await response.json();
        setCompany(updated);
        setIsEditing(false);
        toast.success('Company profile updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update company');
      }
    } catch (error) {
      toast.error('Error updating company');
    }
  };

  const handleLogoUpload = async (event) => {
    if (!isAdmin) {
      toast.error('Only admins can upload logo');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/companies/my/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setCompany(prev => ({ ...prev, logo_url: result.logo_url }));
        toast.success('Logo uploaded successfully');
        loadCompanyProfile();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload logo');
      }
    } catch (error) {
      toast.error('Error uploading logo');
    }
  };

  const handleDocumentUpload = async (documentType, event) => {
    if (!isAdmin) {
      toast.error('Only admins can upload documents');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${BACKEND_URL}/api/companies/my/upload-document?document_type=${documentType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        toast.success('Document uploaded successfully');
        loadCompanyProfile();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload document');
      }
    } catch (error) {
      toast.error('Error uploading document');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        loadCompanyUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No company profile found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Company Profile</h2>
          <p className="text-gray-600">Manage your company information and team</p>
        </div>
        {isAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <i className="fas fa-edit mr-2"></i>
            Edit Profile
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              setFormData(company);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveCompany}>
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Company Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Company Logo" className="w-full h-full object-contain" />
                  ) : (
                    <i className="fas fa-building text-4xl text-gray-400"></i>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Company Logo</h3>
                  {isAdmin && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button variant="outline" onClick={() => document.getElementById('logo-upload').click()}>
                        <i className="fas fa-upload mr-2"></i>
                        Upload Logo
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  ) : (
                    <p className="text-lg font-semibold">{company.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Company Type</Label>
                  <p className="text-lg capitalize">{company.company_type?.replace('_', ' ')}</p>
                </div>

                <div className="space-y-2">
                  <Label>MC Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.mc_number || ''}
                      onChange={(e) => handleInputChange('mc_number', e.target.value)}
                      placeholder="Enter MC#"
                    />
                  ) : (
                    <p className="text-lg">{company.mc_number || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>DOT Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.dot_number || ''}
                      onChange={(e) => handleInputChange('dot_number', e.target.value)}
                      placeholder="Enter DOT#"
                    />
                  ) : (
                    <p className="text-lg">{company.dot_number || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>NSC Number (Canadian)</Label>
                  {isEditing ? (
                    <Input
                      value={formData.nsc_number || ''}
                      onChange={(e) => handleInputChange('nsc_number', e.target.value)}
                      placeholder="Enter NSC#"
                    />
                  ) : (
                    <p className="text-lg">{company.nsc_number || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tax ID</Label>
                  <p className="text-lg">{company.tax_id || 'N/A'}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone_number || ''}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-lg">{company.phone_number || 'N/A'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Company Email (MC# Account)</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.company_email || ''}
                        onChange={(e) => handleInputChange('company_email', e.target.value)}
                        placeholder="Enter company email"
                      />
                    ) : (
                      <p className="text-lg">{company.company_email || 'N/A'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Correspondence Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.correspondence_email || ''}
                        onChange={(e) => handleInputChange('correspondence_email', e.target.value)}
                        placeholder="Enter correspondence email"
                      />
                    ) : (
                      <p className="text-lg">{company.correspondence_email || 'N/A'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Website</Label>
                    {isEditing ? (
                      <Input
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="Enter website URL"
                      />
                    ) : (
                      <p className="text-lg">
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {company.website}
                          </a>
                        ) : 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Street Address</Label>
                    {isEditing ? (
                      <Input
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg">{company.address}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    {isEditing ? (
                      <Input
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg">{company.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>State/Province</Label>
                    {isEditing ? (
                      <Input
                        value={formData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg">{company.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Zip/Postal Code</Label>
                    {isEditing ? (
                      <Input
                        value={formData.zip_code || ''}
                        onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg">{company.zip_code}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    {isEditing ? (
                      <Input
                        value={formData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                      />
                    ) : (
                      <p className="text-lg">{company.country || 'USA'}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Company Documents</CardTitle>
              <CardDescription>Upload and manage transportation-specific documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MC/NSC Authority */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">MC/NSC Authority</h3>
                  {company.mc_authority_doc && (
                    <Badge className="bg-green-100 text-green-800">
                      <i className="fas fa-check-circle mr-1"></i>
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">Motor Carrier or National Safety Code Authority Document</p>
                {isAdmin && (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocumentUpload('mc_authority', e)}
                      className="hidden"
                      id="mc-authority-upload"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('mc-authority-upload').click()}>
                      <i className="fas fa-upload mr-2"></i>
                      Upload Document
                    </Button>
                  </div>
                )}
              </div>

              {/* Certificate of Insurance */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Certificate of Insurance</h3>
                  {company.insurance_certificate_doc && (
                    <Badge className="bg-green-100 text-green-800">
                      <i className="fas fa-check-circle mr-1"></i>
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">Current insurance certificate documentation</p>
                {isAdmin && (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocumentUpload('insurance_certificate', e)}
                      className="hidden"
                      id="insurance-upload"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('insurance-upload').click()}>
                      <i className="fas fa-upload mr-2"></i>
                      Upload Document
                    </Button>
                  </div>
                )}
              </div>

              {/* W-9 */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">W-9 Form</h3>
                  {company.w9_doc && (
                    <Badge className="bg-green-100 text-green-800">
                      <i className="fas fa-check-circle mr-1"></i>
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">Request for Taxpayer Identification Number and Certification</p>
                {isAdmin && (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleDocumentUpload('w9', e)}
                      className="hidden"
                      id="w9-upload"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('w9-upload').click()}>
                      <i className="fas fa-upload mr-2"></i>
                      Upload Document
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Company Users</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                {isAdmin && (
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Add User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-users text-4xl mb-4"></i>
                  <p>No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        {isAdmin && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{user.full_name}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3 capitalize">{user.role?.replace('_', ' ')}</td>
                          <td className="px-4 py-3">
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Company Drivers</CardTitle>
                  <CardDescription>Manage driver accounts and credentials</CardDescription>
                </div>
                {isAdmin && (
                  <Button>
                    <i className="fas fa-plus mr-2"></i>
                    Add Driver
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {drivers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-id-card text-4xl mb-4"></i>
                  <p>No drivers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        {isAdmin && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {drivers.map((driver) => (
                        <tr key={driver.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{driver.name}</td>
                          <td className="px-4 py-3">{driver.email || 'N/A'}</td>
                          <td className="px-4 py-3">{driver.phone || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge className={driver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {driver.status || 'Active'}
                            </Badge>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            </td>
                          )}
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
    </div>
  );
};

export default CompanyProfile;
