import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Edit, Trash2, Mail, Shield, Users } from 'lucide-react';
import { User } from '../../types';
import { USER_ROLES } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import Modal from '../UI/Modal';
import LoadingSpinner from '../UI/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserManagement: React.FC = () => {
  const { addToast } = useToast();
  const auth = useAuth();
  const loggedInUser = auth && auth.user;
  const [users, setUsers] = useState<User[]>([]);
  const [isUserFormOpen, setIsUserFormOpen] = useState(() => {
    return localStorage.getItem('userMgmtIsUserFormOpen') === 'true';
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('userMgmtSelectedUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin'
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
      else throw new Error(data.error || 'Failed to fetch users');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to fetch users.'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: 'user'
    });
    setErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setSelectedUser(null);
    setIsUserFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setFormData({
      email: user.email,
      password: '',
      role: user.role
    });
    setErrors({});
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };
  useEffect(() => {
    localStorage.setItem('userMgmtIsUserFormOpen', String(isUserFormOpen));
  }, [isUserFormOpen]);
  useEffect(() => {
    localStorage.setItem('userMgmtSelectedUser', selectedUser ? JSON.stringify(selectedUser) : '');
  }, [selectedUser]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Please enter a valid email address';
    } else if (users.some(u => u.email === formData.email && u.id !== selectedUser?.id)) {
      newErrors.email = 'Email already exists';
    }

    if (!selectedUser && !formData.password.trim()) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password.trim() && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      let res, data;
      if (selectedUser) {
        // Update user
        res = await fetch(`${API_URL}/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: formData.email,
            role: formData.role
          })
        });
      } else {
        // Create user (register endpoint)
        res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role
          })
        });
      }
      data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save user.');

      addToast({
        type: 'success',
        title: selectedUser ? 'User updated' : 'User created',
        message: selectedUser
          ? 'User has been successfully updated.'
          : 'New user has been created successfully.'
      });

      setIsUserFormOpen(false);
      resetForm();
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save user. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (user: User) => {
    setDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user.');

      addToast({
        type: 'success',
        title: 'User deleted',
        message: 'User has been successfully deleted.'
      });

      setDeleteConfirm(null);
      fetchUsers();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to delete user. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Separate logged-in user and other users
  const otherUsers = loggedInUser
    ? users.filter(u => u.email !== loggedInUser.email)
    : users;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage system users and their roles
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">System Users</h3>
            <span className="ml-2 text-sm text-gray-500">({users.length})</span>
          </div>
        </div>

        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Show logged-in user at the top */}
              {loggedInUser && (
                <tr key={loggedInUser.id} className="bg-blue-50 hover:bg-blue-100">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">1</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-700" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-blue-900">
                          {loggedInUser.email} <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-xs text-blue-700">(You)</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className={`w-4 h-4 mr-2 ${loggedInUser.role === 'admin' ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loggedInUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {loggedInUser.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(loggedInUser.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-xs text-gray-400">Your account</span>
                    </div>
                  </td>
                </tr>
              )}
              {/* Show other users */}
              {otherUsers.map((user, idx) => (
                <tr key={(user as any).id || (user as any)._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{(loggedInUser ? 2 : 1) + idx}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield className={`w-4 h-4 mr-2 ${
                        user.role === 'admin' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditForm(user)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={isUserFormOpen}
        onClose={() => {
          setIsUserFormOpen(false);
          resetForm();
          setSelectedUser(null);
        }}
        title={selectedUser ? 'Edit User' : 'Create New User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`block w-full px-3 py-2 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              placeholder="user@example.com"
              disabled={!!selectedUser}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {USER_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => {
                setIsUserFormOpen(false);
                resetForm();
                setSelectedUser(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {isLoading 
                ? (selectedUser ? 'Updating...' : 'Creating...') 
                : (selectedUser ? 'Update User' : 'Create User')
              }
            </button>
          </div>
        </form>
      </Modal>

      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete User"
          size="sm"
        >
          <div className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete the user "{deleteConfirm.email}"? This action cannot be undone and will also delete all tasks assigned to this user.
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;