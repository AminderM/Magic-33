import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const USER_ROLES = [
  { value: 'platform_admin', label: 'Platform Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'driver', label: 'Driver' },
  { value: 'fleet_manager', label: 'Fleet Manager' }
];

const PlatformUserManagement = ({ BACKEND_URL, fetchWithAuth }) => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [filterRole, setFilterRole] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'manager',
    company_id: '',
    phone: '',
    is_active: true
  });
  
  // Edit user form
  const [editUser, setEditUser] = useState({
    full_name: '',
    role: '',
    company_id: '',
    phone: '',
    is_active: true,
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
    fetchStats();
  }, [filterRole, filterCompany, filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      if (filterCompany) params.append('company_id', filterCompany);
      if (filterStatus !== '') params.append('is_active', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/tenants`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/stats/overview`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.full_name || !newUser.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        setNewUser({
          email: '',
          full_name: '',
          password: '',
          role: 'manager',
          company_id: '',
          phone: '',
          is_active: true
        });
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
      console.error(error);
    }
  };

  const handleEditUser = async () => {
    try {
      const updateData = {};
      if (editUser.full_name) updateData.full_name = editUser.full_name;
      if (editUser.role) updateData.role = editUser.role;
      if (editUser.company_id) updateData.company_id = editUser.company_id;
      if (editUser.phone) updateData.phone = editUser.phone;
      if (editUser.password) updateData.password = editUser.password;
      updateData.is_active = editUser.is_active;

      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User deactivated successfully');
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to deactivate user');
      }
    } catch (error) {
      toast.error('Failed to deactivate user');
      console.error(error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/bulk-action`, {
        method: 'POST',
        body: JSON.stringify({
          user_ids: selectedUsers,
          action: action
        })
      });

      if (response.ok) {
        toast.success(`Users ${action}d successfully`);
        setSelectedUsers([]);
        fetchUsers();
        fetchStats();
      } else {
        toast.error(`Failed to ${action} users`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} users`);
      console.error(error);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      full_name: user.full_name,
      role: user.role,
      company_id: user.company_id || '',
      phone: user.phone || '',
      is_active: user.is_active,
      password: ''
    });
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      platform_admin: 'bg-purple-100 text-purple-800',
      company_admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      dispatcher: 'bg-yellow-100 text-yellow-800',
      accountant: 'bg-pink-100 text-pink-800',
      hr_manager: 'bg-indigo-100 text-indigo-800',
      sales_manager: 'bg-orange-100 text-orange-800',
      driver: 'bg-gray-100 text-gray-800',
      fleet_manager: 'bg-teal-100 text-teal-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total_users}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active_users}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.inactive_users}</div>
              <div className="text-sm text-gray-600">Inactive Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total_companies_with_users}</div>
              <div className="text-sm text-gray-600">Companies</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">User Management</CardTitle>
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-plus mr-2"></i>
              Create User
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  {USER_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {selectedUsers.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    className="flex-1"
                  >
                    Activate ({selectedUsers.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    className="flex-1"
                  >
                    Deactivate ({selectedUsers.length})
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-12">
              <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-users text-gray-400 text-5xl mb-4"></i>
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Name</th>
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Email</th>
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Role</th>
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Company</th>
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Phone</th>
                    <th className="px-4 py-2.5 text-left text-sm font-bold text-gray-900 border-r border-gray-300">Status</th>
                    <th className="px-4 py-2.5 text-center text-sm font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-300 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{user.full_name}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">{user.email}</td>
                      <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">
                        {user.company_name || 'N/A'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 border-r border-gray-300">
                        {user.phone || 'N/A'}
                      </td>
                      <td className="px-4 py-2.5 text-sm border-r border-gray-300">
                        <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-center">
                        <div className="flex gap-1.5 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(user)}
                            className="h-7 px-2 text-xs"
                          >
                            <i className="fas fa-edit mr-1 text-xs"></i>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <i className="fas fa-trash mr-1 text-xs"></i>
                            Delete
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Create New User</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company</Label>
                  <Select value={newUser.company_id} onValueChange={(value) => setNewUser({...newUser, company_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Company</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleCreateUser} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Create User
                </Button>
                <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Edit User: {selectedUser.full_name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={editUser.full_name}
                    onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editUser.phone}
                    onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={editUser.role} onValueChange={(value) => setEditUser({...editUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company</Label>
                  <Select value={editUser.company_id} onValueChange={(value) => setEditUser({...editUser, company_id: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Company</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>New Password (leave empty to keep current)</Label>
                  <Input
                    type="password"
                    value={editUser.password}
                    onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editUser.is_active}
                    onChange={(e) => setEditUser({...editUser, is_active: e.target.checked})}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleEditUser} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Update User
                </Button>
                <Button onClick={() => setShowEditModal(false)} variant="outline" className="flex-1">
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

export default PlatformUserManagement;
