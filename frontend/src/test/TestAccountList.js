import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TestFilePreview from './TestFilePreview';
import WebsiteLogo from '../components/WebsiteLogo';
import SerialNumber from '../components/SerialNumber';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const TestAccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    website: '',
    name: '',
    username: '',
    email: '',
    password: '',
    note: '',
    attachedFile: null,
    fileName: '',
    logo: null
  });
  const { refreshToken } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');
  const [fileError, setFileError] = useState(null);

  const fetchAccounts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/test/accounts?page=${page}&limit=10${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            const newToken = localStorage.getItem('token');
            const retryResponse = await fetch(`/api/test/accounts?page=${page}&limit=10${searchQuery}`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              if (data.success) {
                setAccounts(data.accounts);
                setPagination(data.pagination);
                return;
              }
            }
          }
        }
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch accounts');
      }

      setAccounts(data.accounts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, refreshToken]);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAccounts(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchAccounts]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError(null);

    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        attachedFile: reader.result,
        fileName: file.name
      }));
    };
    reader.onerror = () => {
      setFileError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (logoData) => {
    setFormData(prev => ({
      ...prev,
      logo: logoData ? {
        data: logoData.data,
        fileName: logoData.fileName,
        contentType: logoData.contentType,
        isCustom: true
      } : null
    }));
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      website: account.website,
      name: account.name,
      username: account.username,
      email: account.email,
      password: account.password,
      note: account.note,
      attachedFile: account.attachedFile?.data || null,
      fileName: account.attachedFile?.fileName || '',
      logo: account.logo ? {
        data: account.logo.data,
        fileName: account.logo.fileName,
        contentType: account.logo.contentType
      } : null
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (fileError) {
        throw new Error(fileError);
      }

      setLoading(true);
      setError(null);
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare form data
      const formDataToSend = {
        ...formData,
        attachedFile: formData.attachedFile ? {
          data: formData.attachedFile,
          fileName: formData.fileName,
          contentType: formData.fileName.split('.').pop().toLowerCase() || 'application/octet-stream'
        } : null,
        // Only send logo if it's a custom logo
        logo: formData.logo?.isCustom ? formData.logo : null
      };

      // Only include changed data in size calculation
      const payloadToCheck = {
        ...formDataToSend,
        attachedFile: formData.attachedFile !== editingAccount?.attachedFile?.data ? formDataToSend.attachedFile : null,
        logo: formData.logo?.data !== editingAccount?.logo?.data ? formDataToSend.logo : null
      };

      const payloadSize = new Blob([JSON.stringify(payloadToCheck)]).size;
      if (payloadSize > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Total data size is too large. Please use smaller files.');
      }

      const url = editingAccount 
        ? `/api/test/account/${editingAccount._id}`
        : '/api/test/account';

      const response = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formDataToSend)
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('File size is too large. Please use smaller files.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingAccount ? 'update' : 'create'} account`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || `Failed to ${editingAccount ? 'update' : 'create'} account`);
      }

      // Reset form and refresh data
      setShowAddForm(false);
      setEditingAccount(null);
      setFormData({
        website: '',
        name: '',
        username: '',
        email: '',
        password: '',
        note: '',
        attachedFile: null,
        fileName: '',
        logo: null
      });
      
      // Fetch updated accounts list
      await fetchAccounts(pagination.currentPage);
      setSuccessMessage(`Account successfully ${editingAccount ? 'updated' : 'created'}!`);
    } catch (err) {
      setError(err.message);
      console.error(`Error ${editingAccount ? 'updating' : 'creating'} account:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/test/account/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete account');
      }

      fetchAccounts(pagination.currentPage);
      setSuccessMessage('Account successfully deleted!');
    } catch (err) {
      setError(err.message);
      console.error('Error deleting account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Test Accounts</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingAccount(null);
            setFormData({
              website: '',
              name: '',
              username: '',
              email: '',
              password: '',
              note: '',
              attachedFile: null,
              fileName: '',
              logo: null
            });
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Account
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-2 border rounded"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {loading && <div className="text-center">Loading...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account, index) => (
          <div key={account._id} className="border rounded p-4 bg-white shadow">
            <SerialNumber number={index + 1 + (pagination.currentPage - 1) * pagination.itemsPerPage} />
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <WebsiteLogo 
                  website={account.website}
                  isEditing={editingAccount?._id === account._id}
                  onLogoChange={handleLogoChange}
                  existingLogo={account.logo}
                />
                <h3 className="text-lg font-semibold">{account.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAccount(account._id)}
                  className="text-red-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p><strong>Website:</strong> {account.website}</p>
              <p><strong>Username:</strong> {account.username}</p>
              <p><strong>Email:</strong> {account.email}</p>
              {account.note && <p><strong>Note:</strong> {account.note}</p>}
              
              {account.attachedFile && (
                <div className="mt-2">
                  <strong>Attached File: </strong>
                  <TestFilePreview 
                    file={{
                      data: account.attachedFile.data,
                      fileName: account.attachedFile.fileName,
                      contentType: account.attachedFile.contentType
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {accounts.length > 0 && (
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={() => fetchAccounts(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className={`px-4 py-2 rounded ${
              pagination.hasPrevPage
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          <span className="py-2">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchAccounts(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className={`px-4 py-2 rounded ${
              pagination.hasNextPage
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <div className="mt-1 space-y-2">
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="block w-full rounded border-gray-300 shadow-sm"
                    required
                  />
                  <div className="flex items-center gap-3">
                    <WebsiteLogo 
                      website={formData.website}
                      isEditing={true}
                      onLogoChange={handleLogoChange}
                      existingLogo={formData.logo}
                    />
                    {formData.website && (
                      <span className="text-sm text-gray-500">
                        Preview logo for {formData.website}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="mt-1 block w-full"
                />
                {fileError && (
                  <p className="mt-1 text-sm text-red-500">{fileError}</p>
                )}
                {!fileError && (
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum file size: 5MB
                  </p>
                )}
                {formData.fileName && !fileError && (
                  <p className="mt-1 text-sm text-gray-500">
                    Selected file: {formData.fileName}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAccountList; 