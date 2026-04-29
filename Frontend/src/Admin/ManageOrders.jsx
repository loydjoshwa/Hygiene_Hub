import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Search, Eye, User, Mail, Calendar } from 'lucide-react';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3130/orders');
      setOrders(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      delivered: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
      confirmed: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
      processing: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
      cancelled: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.orderId || order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userName || order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userEmail || order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getOrderId = (order) => {
    return order.orderId || order.id || 'N/A';
  };

  const getCustomerName = (order) => {
    return order.userName || order.customerName || 'Unknown';
  };

  const getCustomerEmail = (order) => {
    return order.userEmail || order.customerEmail || 'N/A';
  };

  const getTotalAmount = (order) => {
    return order.total || order.totalAmount || order.amount || 0;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-[3px] border-[#00CAFF] border-t-[#4300FF]"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading orders...</p>
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
                Manage Orders
              </h1>
              <p className="text-gray-600 mt-2">Total Orders: <span className="font-semibold text-[#0065F8]">{orders.length}</span></p>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, customer name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00CAFF]/30 focus:border-[#0065F8] outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00CAFF]/10 to-[#00FFDE]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#0065F8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">No orders found</h3>
            <p className="text-gray-600">Try adjusting your search</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id || order._id} className="hover:bg-gradient-to-r from-gray-50/50 to-transparent transition-colors">
                      <td className="px-6 py-4">
                        <Link 
                          to={`/admin/orders/${order.id || order._id}`}
                          className="text-[#0065F8] hover:text-[#4300FF] font-medium group flex items-center gap-2"
                        >
                          {getOrderId(order)}
                          <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#00CAFF]/10 to-[#00FFDE]/10 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-[#0065F8]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{getCustomerName(order)}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {getCustomerEmail(order)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.orderDate || order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-lg text-gray-800">₹{getTotalAmount(order)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-4 py-1.5 rounded-lg text-sm font-medium inline-block ${getStatusColor(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Processing'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/orders/${order.id || order._id}`}
                          className="px-4 py-2 bg-gradient-to-r from-[#00CAFF] to-[#00FFDE] text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                        >
                          View Details
                        </Link>
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

export default ManageOrders;