import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Edit, MessageSquare, ChevronDown, Plus, Trash2, X, Search, CheckCircle, AlertTriangle } from 'lucide-react';

const USER_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'declined', label: 'Declined', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-orange-100 text-orange-800' }
];

const PlatformUserManagement = ({ BACKEND_URL, fetchWithAuth }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // New user form
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    phone: '',
    mc_number: '',
    dot_number: '',
    company_name: '',
    company_website: '',
    role: 'company_admin',
    status: 'active'
  });
  
  // Edit user form
  const [editUser, setEditUser] = useState({
    full_name: '',
    phone: '',
    mc_number: '',
    dot_number: '',
    company_name: '',
    company_website: '',
    status: 'active',
    password: ''
  });

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filterStatus, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
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
        toast.error('Please fill in all required fields (Name, Email, Password)');
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
          phone: '',
          mc_number: '',
          dot_number: '',
          company_name: '',
          company_website: '',
          role: 'company_admin',
          status: 'active'
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
      if (editUser.phone) updateData.phone = editUser.phone;
      if (editUser.mc_number !== undefined) updateData.mc_number = editUser.mc_number;
      if (editUser.dot_number !== undefined) updateData.dot_number = editUser.dot_number;
      if (editUser.company_name !== undefined) updateData.company_name = editUser.company_name;
      if (editUser.company_website !== undefined) updateData.company_website = editUser.company_website;
      if (editUser.status) updateData.status = editUser.status;
      if (editUser.password) updateData.password = editUser.password;

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

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`User status updated to ${newStatus}`);
        fetchUsers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
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

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      full_name: user.full_name || '',
      phone: user.phone || '',
      mc_number: user.mc_number || '',
      dot_number: user.dot_number || '',
      company_name: user.company_name || '',
      company_website: user.company_website || '',
      status: user.status || 'active',
      password: ''
    });
    setShowEditModal(true);
  };

  const openCommentsModal = async (user) => {
    setSelectedUser(user);
    setShowCommentsModal(true);
    setLoadingComments(true);
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${user.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');
        toast.success('Comment added');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${selectedUser.id}/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (error) {
      toast.error('Failed to delete comment');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = USER_STATUSES.find(s => s.value === status) || USER_STATUSES[0];
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name, email, company, MC#, or DOT#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {USER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table - Spreadsheet Style */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">👥</div>
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">Phone#</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">MC#</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">DOT#</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">Company Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">Company Website</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">{user.full_name}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">{user.email}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">{user.phone || '-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">{user.mc_number || '-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">{user.dot_number || '-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">{user.company_name || '-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap">
                        {user.company_website ? (
                          <a href={user.company_website.startsWith('http') ? user.company_website : `https://${user.company_website}`} 
                             target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            {user.company_website}
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(user)}
                            className="h-8 px-2"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {/* Status Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 px-2 min-w-[100px]">
                                {getStatusBadge(user.status || 'active')}
                                <ChevronDown className="w-3 h-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {USER_STATUSES.map(status => (
                                <DropdownMenuItem 
                                  key={status.value}
                                  onClick={() => handleUpdateStatus(user.id, status.value)}
                                  className={user.status === status.value ? 'bg-gray-100' : ''}
                                >
                                  <Badge className={`${status.color} mr-2`}>{status.label}</Badge>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Comments Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCommentsModal(user)}
                            className="h-8 px-2"
                            title="View Comments"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {user.comments?.length > 0 && (
                              <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {user.comments.length}
                              </span>
                            )}
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
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-sm font-medium">Name *</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="Full Name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone#</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">MC#</Label>
              <Input
                value={newUser.mc_number}
                onChange={(e) => setNewUser({...newUser, mc_number: e.target.value})}
                placeholder="MC-123456"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">DOT#</Label>
              <Input
                value={newUser.dot_number}
                onChange={(e) => setNewUser({...newUser, dot_number: e.target.value})}
                placeholder="DOT-1234567"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                value={newUser.company_name}
                onChange={(e) => setNewUser({...newUser, company_name: e.target.value})}
                placeholder="Company LLC"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium">Company Website</Label>
              <Input
                value={newUser.company_website}
                onChange={(e) => setNewUser({...newUser, company_website: e.target.value})}
                placeholder="www.company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Password *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setNewUser({...newUser, password: generatePassword()})}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select 
                value={newUser.status} 
                onValueChange={(value) => setNewUser({...newUser, status: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User: {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={editUser.full_name}
                onChange={(e) => setEditUser({...editUser, full_name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Phone#</Label>
              <Input
                value={editUser.phone}
                onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">MC#</Label>
              <Input
                value={editUser.mc_number}
                onChange={(e) => setEditUser({...editUser, mc_number: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">DOT#</Label>
              <Input
                value={editUser.dot_number}
                onChange={(e) => setEditUser({...editUser, dot_number: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Name</Label>
              <Input
                value={editUser.company_name}
                onChange={(e) => setEditUser({...editUser, company_name: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Company Website</Label>
              <Input
                value={editUser.company_website}
                onChange={(e) => setEditUser({...editUser, company_website: e.target.value})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select 
                value={editUser.status} 
                onValueChange={(value) => setEditUser({...editUser, status: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">New Password (leave empty to keep)</Label>
              <Input
                type="text"
                value={editUser.password}
                onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditUser} className="bg-blue-600 hover:bg-blue-700">Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments for {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Add Comment */}
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment about this customer's history..."
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
              {loadingComments ? (
                <div className="p-4 text-center text-gray-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No comments yet</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.created_by_name} • {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlatformUserManagement;
