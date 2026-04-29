
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { TrendingUp, Users, Package, DollarSign, Clock, ArrowUpRight } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalProducts: 0,
    recentOrders: [],
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        axios.get('http://localhost:3130/orders'),
        axios.get('http://localhost:3130/users'),
        axios.get('http://localhost:3130/products')
      ]);

      const orders = ordersRes.data || [];
      const users = usersRes.data || [];
      const products = productsRes.data || [];

      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const recentOrders = orders.slice(-5).reverse();
      
      const activeUsers = users.filter(user => (user.status || 'active') === 'active').length;
      const blockedUsers = users.filter(user => user.status === 'blocked').length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: users.length,
        activeUsers,
        blockedUsers,
        totalProducts: products.length,
        recentOrders,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: <Package className="w-6 h-6" />,
      color: 'from-[#4300FF] to-[#0065F8]',
      bgColor: 'bg-gradient-to-br from-[#4300FF]/10 to-[#0065F8]/10',
      link: '/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-[#00CAFF] to-[#00FFDE]',
      bgColor: 'bg-gradient-to-br from-[#00CAFF]/10 to-[#00FFDE]/10',
      link: '/admin/orders'
    },
    {
      title: 'Active Users',
      value: `${stats.activeUsers} / ${stats.totalUsers}`,
      icon: <Users className="w-6 h-6" />,
      color: 'from-[#0065F8] to-[#00CAFF]',
      bgColor: 'bg-gradient-to-br from-[#0065F8]/10 to-[#00CAFF]/10',
      link: '/admin/users'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-[#00FFDE] to-[#00CAFF]',
      bgColor: 'bg-gradient-to-br from-[#00FFDE]/10 to-[#00CAFF]/10',
      link: '/admin/products'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      delivered: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
      confirmed: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200',
      processing: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200',
      cancelled: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (stats.loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-[3px] border-[#00CAFF] border-t-[#4300FF]"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4300FF] to-[#00CAFF] bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-2">Welcome to your admin dashboard</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, index) => (
            <Link 
              key={index} 
              to={stat.link}
              className="group relative overflow-hidden"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <div className={`bg-gradient-to-br ${stat.color} rounded-lg p-2 text-white`}>
                      {stat.icon}
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-[#0065F8] transition-colors" />
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                <p className="text-gray-600 text-sm mt-1">Latest 5 orders from your store</p>
              </div>
              <Link 
                to="/admin/orders" 
                className="px-4 py-2 bg-gradient-to-r from-[#4300FF] to-[#0065F8] text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gradient-to-r from-gray-50/50 to-transparent transition-colors">
                    <td className="px-6 py-4">
                      <Link 
                        to={`/admin/orders/${order.id}`}
                        className="text-[#0065F8] hover:text-[#4300FF] font-medium group flex items-center gap-2"
                      >
                        {order.orderId}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{order.userName}</p>
                        <p className="text-sm text-gray-500">{order.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {formatDate(order.orderDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-lg text-gray-800">₹{order.total}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;