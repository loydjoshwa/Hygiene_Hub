import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ArrowLeft, Calendar, Phone, MapPin, CreditCard, Package, Truck, CheckCircle, User, Mail, Home, XCircle, AlertCircle } from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:3130/orders/${id}`);
      
      if (response.data) {
        setOrder(response.data);
      } else {
        setError('Order not found');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order. Please try again.');
      toast.error('Failed to load order');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      await axios.patch(`http://localhost:3130/orders/${id}`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
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

  const getStatusIcon = (status) => {
    const icons = {
      delivered: <CheckCircle className="w-5 h-5" />,
      confirmed: <Package className="w-5 h-5" />,
      processing: <Truck className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getCustomerName = () => {
    return order?.userName || order?.customerName || 'Unknown';
  };

  const getCustomerEmail = () => {
    return order?.userEmail || order?.customerEmail || 'N/A';
  };

  const getCustomerPhone = () => {
    return order?.userPhone || order?.customerPhone || 'N/A';
  };

  const getShippingAddress = () => {
    if (order?.shippingAddress) {
      return order.shippingAddress;
    }
    
    return {
      address: order?.address || order?.deliveryAddress || 'Not provided',
      city: order?.city || '',
      state: order?.state || '',
      pincode: order?.pincode || order?.zipCode || ''
    };
  };

  const getPaymentMethod = () => {
    return order?.paymentMethod || order?.paymentType || 'unknown';
  };

  const getPaymentDetails = () => {
    return order?.paymentDetails || {};
  };

  const getOrderId = () => {
    return order?.orderId || order?.id || id || 'N/A';
  };

  const getItems = () => {
    return order?.items || order?.products || [];
  };

  const getSubtotal = () => {
    return order?.subtotal || order?.itemsTotal || 0;
  };

  const getShippingCost = () => {
    return order?.shipping || order?.shippingCost || order?.deliveryCharge || 0;
  };

  const getTotal = () => {
    return order?.total || order?.totalAmount || order?.grandTotal || 0;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-[3px] border-[#00CAFF] border-t-[#4300FF]"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading order details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00CAFF]/10 to-[#00FFDE]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-8">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-6 py-3 bg-gradient-to-r from-[#4300FF] to-[#0065F8] text-white rounded-xl hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Orders
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const shippingAddress = getShippingAddress();
  const paymentMethod = getPaymentMethod();
  const paymentDetails = getPaymentDetails();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-2 text-[#0065F8] hover:text-[#4300FF] mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Orders
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#4300FF] to-[#00CAFF] bg-clip-text text-transparent">
                Order Details
              </h1>
              <p className="text-gray-600 mt-2">Order ID: <span className="font-mono font-semibold text-[#0065F8]">{getOrderId()}</span></p>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <select 
                value={order.status || 'processing'} 
                onChange={(e) => updateOrderStatus(e.target.value)}
                className="bg-transparent text-lg font-bold outline-none cursor-pointer appearance-none focus:ring-0 border-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                title="Change Order Status"
              >
                <option value="processing" className="text-gray-800 bg-white">Processing</option>
                <option value="confirmed" className="text-gray-800 bg-white">Confirmed</option>
                <option value="delivered" className="text-gray-800 bg-white">Delivered</option>
                <option value="cancelled" className="text-gray-800 bg-white">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Package className="w-7 h-7 text-[#0065F8]" />
                  Order Items
                </h2>
                <div className="text-sm text-gray-500">
                  {getItems().length} item{getItems().length !== 1 ? 's' : ''}
                </div>
              </div>
              
              {getItems().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items found in this order
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {getItems().map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 flex items-center justify-center">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{item.name || 'Unnamed Item'}</h3>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity || 1}</p>
                            <p className="text-sm text-gray-500">Price: ₹{item.price || 0} each</p>
                            {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                            {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                          </div>
                        </div>
                        <p className="font-bold text-xl text-gray-800">
                          ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-gray-200">
                    <div className="space-y-3 max-w-md ml-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₹{getSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">₹{getShippingCost().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-gray-200 mt-4">
                        <span>Total Amount</span>
                        <span className="bg-gradient-to-r from-[#00FFDE] to-[#00CAFF] bg-clip-text text-transparent text-2xl">
                          ₹{getTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-[#0065F8]" />
                Customer Information
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00CAFF] to-[#00FFDE] rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-bold text-gray-800">{getCustomerName()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4300FF]/10 to-[#0065F8]/10 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#0065F8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{getCustomerEmail()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00FFDE]/10 to-[#00CAFF]/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#00CAFF]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{getCustomerPhone()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-[#0065F8]" />
                Shipping Address
              </h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4300FF]/10 to-[#0065F8]/10 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-[#4300FF]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-800">{shippingAddress.address}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium text-gray-800">{shippingAddress.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium text-gray-800">{shippingAddress.state}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Pincode</p>
                    <p className="font-medium text-gray-800">{shippingAddress.pincode}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#0065F8]" />
                Order Info
              </h2>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00FFDE]/10 to-[#00CAFF]/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#00FFDE]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium text-gray-800">{formatDate(order.orderDate || order.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0065F8]/10 to-[#4300FF]/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-[#0065F8]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-800">{paymentMethod.toUpperCase()}</p>
                  </div>
                </div>
                
                {paymentMethod === 'upi' && paymentDetails.upiId && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">UPI ID</p>
                    <p className="font-medium text-gray-800">{paymentDetails.upiId}</p>
                  </div>
                )}
                
                {paymentMethod === 'card' && paymentDetails.cardLast4 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4">
                    <p className="text-sm text-gray-500 mb-1">Card</p>
                    <p className="font-medium text-gray-800">**** **** **** {paymentDetails.cardLast4}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetails;