import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Search, User, Mail, Shield, CheckCircle, XCircle, Key } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3130/users');
      const usersWithStatus = response.data.map(user => ({
        ...user,
        status: user.status || 'active'
      }));
      setUsers(usersWithStatus || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    const action = currentStatus === 'active' ? 'block' : 'unblock';
    
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this user?`)) return;
    
    try {
      await axios.patch(`http://localhost:3130/users/${userId}`, {
        status: newStatus
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      toast.success(`User ${action}ed successfully!`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-[3px] border-[#00CAFF] border-t-[#4300FF]"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4300FF] to-[#00CAFF] bg-clip-text text-transparent">
                Manage Users
              </h1>
              <p className="text-gray-600 mt-2">
                Total Users: <span className="font-semibold text-[#0065F8]">{users.length}</span>
              </p>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CAFF]/30 focus:border-[#0065F8] outline-none transition-all"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00CAFF]/10 to-[#00FFDE]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#0065F8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.5a6 6 0 00-9-5.197" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">No users found</h3>
            
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gradient-to-r from-gray-50/50 to-transparent transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#00CAFF] to-[#00FFDE] rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{user.username}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Registered User
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                            {user.id}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                          user.status === 'active' 
                            ? 'bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 border border-green-200' 
                            : 'bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border border-red-200'
                        }`}>
                          {user.status === 'active' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {user.status === 'active' ? 'Active' : 'Blocked'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                            user.status === 'active' 
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg' 
                              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <Shield className="w-4 h-4" />
                              Block User
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Unblock User
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManageUsers;