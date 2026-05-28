import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import axiosInstance from '../utils/axiosInstance';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  ShoppingBag, 
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalProducts: 0
  });
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30days'); // '7days' | '30days' | 'alltime'
  
  // Interactive chart hovered states
  const [hoveredSalesPoint, setHoveredSalesPoint] = useState(null);
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Parallel requests for stats and all orders to calculate graphs
        const [statsResponse, ordersResponse] = await Promise.all([
          axiosInstance.get('/admin/stats'),
          axiosInstance.get('/admin/orders')
        ]);
        
        if (!ignore) {
          const statsData = statsResponse.data;
          setStats({
            totalOrders: statsData.total_orders || 0,
            totalRevenue: statsData.total_revenue || 0,
            totalUsers: statsData.total_users || 0,
            activeUsers: statsData.active_users || 0,
            blockedUsers: statsData.blocked_users || 0,
            totalProducts: statsData.total_products || 0
          });
          
          setOrders(ordersResponse.data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      ignore = true;
    };
  }, []);

  // Filtered orders based on selected time frame
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.orderDate) return true;
      const orderDate = new Date(order.orderDate);
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeFilter === '7days') return diffDays <= 7;
      if (timeFilter === '30days') return diffDays <= 30;
      return true; // 'alltime'
    });
  }, [orders, timeFilter]);

  // 1. Calculate Revenue and Order Trends for the Area Chart
  const salesTrendData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const groupedData = {};

    if (timeFilter === '7days' || timeFilter === '30days') {
      // Group daily
      const daysToGenerate = timeFilter === '7days' ? 7 : 30;
      for (let i = daysToGenerate - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        groupedData[dateKey] = 0;
      }

      filteredOrders.forEach(order => {
        if (!order.orderDate || order.status === 'cancelled') return;
        const dateKey = new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (groupedData[dateKey] !== undefined) {
          groupedData[dateKey] += order.total || 0;
        }
      });
    } else {
      // Group monthly for 'alltime'
      filteredOrders.forEach(order => {
        if (!order.orderDate || order.status === 'cancelled') return;
        const dateKey = new Date(order.orderDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        groupedData[dateKey] = (groupedData[dateKey] || 0) + (order.total || 0);
      });
    }

    return Object.entries(groupedData).map(([label, value]) => ({ label, value }));
  }, [filteredOrders, timeFilter]);

  // 2. Order Status Breakdown for Donut Chart
  const orderStatusData = useMemo(() => {
    const counts = {
      delivered: 0,
      processing: 0,
      confirmed: 0,
      cancelled: 0
    };
    
    filteredOrders.forEach(order => {
      const status = order.status?.toLowerCase();
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [filteredOrders]);

  // 3. Top Performing Products
  const topProducts = useMemo(() => {
    const productStats = {};
    
    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      
      const items = order.items || [];
      items.forEach(item => {
        if (!item.productId) return;
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.name || 'Unnamed Product',
            image: item.image,
            salesVolume: 0,
            revenue: 0
          };
        }
        productStats[item.productId].salesVolume += item.quantity || 1;
        productStats[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // Advanced calculated metrics
  const calculatedMetrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => order.status !== 'cancelled' ? sum + (order.total || 0) : sum, 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // Calculate peak sales day in filter
    let peakSales = 0;
    let peakDay = 'N/A';
    salesTrendData.forEach(pt => {
      if (pt.value > peakSales) {
        peakSales = pt.value;
        peakDay = pt.label;
      }
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      peakSales,
      peakDay
    };
  }, [filteredOrders, salesTrendData]);

  // Custom SVG Area Chart scaling helper
  const chartHeight = 220;
  const chartWidth = 550;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const svgSalesPoints = useMemo(() => {
    if (salesTrendData.length === 0) return [];
    
    const maxVal = Math.max(...salesTrendData.map(d => d.value), 1000); // minimum scale ceiling
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    
    return salesTrendData.map((d, index) => {
      const x = paddingLeft + (index / (salesTrendData.length - 1 || 1)) * usableWidth;
      const y = chartHeight - paddingBottom - (d.value / maxVal) * usableHeight;
      return { x, y, label: d.label, value: d.value };
    });
  }, [salesTrendData]);

  const salesPathData = useMemo(() => {
    if (svgSalesPoints.length === 0) return '';
    return svgSalesPoints.reduce((path, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      // Smooth bezier curves
      const prev = svgSalesPoints[idx - 1];
      const cpX1 = prev.x + (pt.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (pt.x - prev.x) / 2;
      const cpY2 = pt.y;
      return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
    }, '');
  }, [svgSalesPoints]);

  const salesAreaPathData = useMemo(() => {
    if (svgSalesPoints.length === 0) return '';
    const linePath = salesPathData;
    const first = svgSalesPoints[0];
    const last = svgSalesPoints[svgSalesPoints.length - 1];
    const bottomY = chartHeight - paddingBottom;
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [svgSalesPoints, salesPathData]);

  // Donut chart calculations
  const donutRadius = 55;
  const donutStrokeWidth = 14;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutCenter = 80;

  const donutSlices = useMemo(() => {
    let accumulatedPercentage = 0;
    const colors = {
      delivered: '#10B981',  // Emerald Green
      processing: '#F59E0B', // Amber Yellow
      confirmed: '#3B82F6',  // Modern Blue
      cancelled: '#EF4444'   // Rose Red
    };

    return orderStatusData.map(slice => {
      const strokeDashoffset = donutCircumference - (slice.percentage / 100) * donutCircumference;
      const rotationAngle = (accumulatedPercentage / 100) * 360;
      accumulatedPercentage += slice.percentage;

      return {
        ...slice,
        strokeDashoffset,
        rotationAngle,
        color: colors[slice.status] || '#6B7280'
      };
    });
  }, [orderStatusData, donutCircumference]);

  const getStatusColor = (status) => {
    const colors = {
      delivered: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 border border-emerald-500/20',
      confirmed: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 border border-blue-500/20',
      processing: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 border border-amber-500/20',
      cancelled: 'bg-gradient-to-r from-rose-500/10 to-red-500/10 text-rose-600 border border-rose-500/20'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[75vh] bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
          <div className="text-center bg-white/75 backdrop-blur-md border border-gray-100 p-10 rounded-2xl shadow-xl">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-[3px] border-cyan-400 border-t-indigo-600"></div>
            <p className="mt-6 text-gray-700 font-semibold tracking-wide">Assembling Rich Analytics Dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 min-h-screen bg-slate-50/50">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Dashboard Analytics
            </h1>
            <p className="text-slate-500 font-medium mt-1">Real-time analytical insights and storefront metrics.</p>
          </div>
          
          {/* Time range dynamic filter */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 self-start md:self-center">
            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'alltime', label: 'All Time' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  timeFilter === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Business KPI Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Card 1: Total Orders */}
          <Link to="/admin/orders" className="group relative overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white duration-300">
                  <Package className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">Total Orders</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{calculatedMetrics.totalOrders}</p>
                <p className="text-xs font-medium text-indigo-500 mt-2 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> Active in filter
                </p>
              </div>
              <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full w-4/5"></div>
              </div>
            </div>
          </Link>

          {/* Card 2: Total Revenue */}
          <Link to="/admin/orders" className="group relative overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white duration-300">
                  <DollarSign className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">Total Earned</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">₹{calculatedMetrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-2">
                  Excluding cancelled orders
                </p>
              </div>
              <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[88%]"></div>
              </div>
            </div>
          </Link>

          {/* Card 3: Average Order Value (AOV) */}
          <Link to="/admin/orders" className="group relative overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-cyan-50 text-cyan-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white duration-300">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">Avg Order Value</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">₹{calculatedMetrics.averageOrderValue.toLocaleString()}</p>
                <p className="text-xs font-medium text-cyan-600 mt-2">
                  Earned per checkout checkout
                </p>
              </div>
              <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full w-2/3"></div>
              </div>
            </div>
          </Link>

          {/* Card 4: Storefront Users */}
          <Link to="/admin/users" className="group relative overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-100 p-6 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white duration-300">
                  <Users className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-1">User Health</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{stats.activeUsers} <span className="text-sm font-semibold text-slate-400">/ {stats.totalUsers} Active</span></p>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Blocked: <span className="font-bold text-red-500">{stats.blockedUsers}</span> users
                </p>
              </div>
              <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-3/4"></div>
              </div>
            </div>
          </Link>
        </div>

        {/* Graphical Section: Sales Trend & Order status Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Sales Trend Interactive Area Chart (Custom Responsive SVG) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Earnings Trend Graph</h2>
                <p className="text-slate-400 text-xs mt-0.5">Interactive visual representation of total sales revenue</p>
              </div>
              
              {/* Graph Mini-Stats Summary */}
              {calculatedMetrics.peakSales > 0 && (
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-400 uppercase block">Peak Revenue</span>
                  <span className="text-sm font-extrabold text-indigo-600">₹{calculatedMetrics.peakSales.toLocaleString()} <span className="text-xs text-slate-500">({calculatedMetrics.peakDay})</span></span>
                </div>
              )}
            </div>

            {salesTrendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                <TrendingUp className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No sales data available for this timeframe</p>
              </div>
            ) : (
              <div className="relative w-full overflow-visible">
                
                {/* SVG Graph */}
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                  <defs>
                    <linearGradient id="sales-area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="sales-stroke-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
                    return (
                      <line 
                        key={idx} 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={chartWidth - paddingRight} 
                        y2={y} 
                        stroke="#F1F5F9" 
                        strokeWidth="1.5" 
                      />
                    );
                  })}

                  {/* Area gradient under curve */}
                  <path d={salesAreaPathData} fill="url(#sales-area-grad)" />

                  {/* Line path of curve */}
                  <path d={salesPathData} fill="none" stroke="url(#sales-stroke-grad)" strokeWidth="3" strokeLinecap="round" />

                  {/* Dynamic interactive markers */}
                  {svgSalesPoints.map((pt, idx) => (
                    <g 
                      key={idx}
                      onMouseEnter={() => setHoveredSalesPoint({ ...pt, idx })}
                      onMouseLeave={() => setHoveredSalesPoint(null)}
                      className="cursor-pointer"
                    >
                      {/* Interactive hover padding zone */}
                      <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                      
                      {/* Active highlighted marker dot */}
                      <circle 
                        cx={pt.x} 
                        cy={pt.y} 
                        r={hoveredSalesPoint?.idx === idx ? "7" : "4.5"} 
                        fill={hoveredSalesPoint?.idx === idx ? "#06B6D4" : "#4F46E5"} 
                        stroke="#FFFFFF" 
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />
                    </g>
                  ))}

                  {/* X-axis date labels */}
                  {svgSalesPoints.filter((_, i) => svgSalesPoints.length < 10 || i % Math.ceil(svgSalesPoints.length / 7) === 0).map((pt, idx) => (
                    <text
                      key={idx}
                      x={pt.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {pt.label}
                    </text>
                  ))}

                  {/* Y-axis values labels */}
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const ratio = idx / 3;
                    const maxVal = Math.max(...salesTrendData.map(d => d.value), 1000);
                    const labelVal = Math.round(maxVal * (1 - ratio));
                    const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
                    return (
                      <text
                        key={idx}
                        x={paddingLeft - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        fill="#94A3B8"
                        fontSize="9"
                        fontWeight="700"
                      >
                        ₹{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(1)}k` : labelVal}
                      </text>
                    );
                  })}
                </svg>

                {/* Floating interactive tooltip */}
                {hoveredSalesPoint && (
                  <div 
                    className="absolute bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-800 text-xs font-semibold z-10 pointer-events-none transition-all duration-75 flex flex-col gap-1 select-none"
                    style={{ 
                      left: `${(hoveredSalesPoint.x / chartWidth) * 100}%`, 
                      top: `${(hoveredSalesPoint.y / chartHeight) * 100 - 30}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <span className="text-slate-400 text-[10px]">{hoveredSalesPoint.label}</span>
                    <span className="text-cyan-400 text-sm font-bold">₹{hoveredSalesPoint.value.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Status Donut Chart (Custom Responsive SVG) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Order Delivery Status</h2>
              <p className="text-slate-400 text-xs mt-0.5">Proportion breakdown of order statuses</p>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-grow py-10 text-slate-400">
                <Clock className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No order metrics found</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-grow mt-6">
                
                {/* SVG Donut Circle */}
                <div className="relative w-40 h-40 flex-shrink-0 select-none">
                  <svg width="100%" height="100%" viewBox="0 0 160 160" className="transform -rotate-90">
                    <circle 
                      cx={donutCenter} 
                      cy={donutCenter} 
                      r={donutRadius} 
                      fill="transparent" 
                      stroke="#F8FAFC" 
                      strokeWidth={donutStrokeWidth} 
                    />
                    
                    {donutSlices.map((slice, idx) => (
                      <circle
                        key={idx}
                        cx={donutCenter}
                        cy={donutCenter}
                        r={donutRadius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={hoveredDonutSlice === idx ? donutStrokeWidth + 3 : donutStrokeWidth}
                        strokeDasharray={donutCircumference}
                        strokeDashoffset={slice.strokeDashoffset}
                        transform={`rotate(${slice.rotationAngle} ${donutCenter} ${donutCenter})`}
                        strokeLinecap="round"
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredDonutSlice(idx)}
                        onMouseLeave={() => setHoveredDonutSlice(null)}
                      />
                    ))}
                  </svg>
                  
                  {/* Center metrics overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    {hoveredDonutSlice !== null ? (
                      <>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {donutSlices[hoveredDonutSlice].status}
                        </span>
                        <span className="text-xl font-extrabold text-slate-800">
                          {donutSlices[hoveredDonutSlice].percentage}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          ({donutSlices[hoveredDonutSlice].count} orders)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                        <span className="text-2xl font-black text-slate-800">{filteredOrders.length}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Orders</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex flex-col gap-2.5 flex-grow">
                  {donutSlices.map((slice, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 p-1.5 rounded-xl border border-transparent transition-all duration-200 ${
                        hoveredDonutSlice === idx ? 'bg-slate-50 border-slate-100' : ''
                      }`}
                      onMouseEnter={() => setHoveredDonutSlice(idx)}
                      onMouseLeave={() => setHoveredDonutSlice(null)}
                    >
                      {/* Glowing dot representing status slice */}
                      <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-slate-700 capitalize truncate">{slice.status}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{slice.count} checkouts ({slice.percentage}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Dashboard Section: Top Products & Recent orders details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Top Selling Products Tracker */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Top Performing Products
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Most revenue generating items of all time</p>
            </div>

            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-grow py-8 text-slate-400">
                <Package className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-semibold">No product performance data</p>
              </div>
            ) : (
              <div className="space-y-5 flex-grow flex flex-col justify-center">
                {topProducts.map((prod, idx) => {
                  const maxRevenue = Math.max(...topProducts.map(p => p.revenue), 1);
                  const progressPct = Math.round((prod.revenue / maxRevenue) * 100);

                  return (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Image box */}
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{prod.name}</h4>
                            <p className="text-[10px] font-semibold text-slate-400">{prod.salesVolume} unit{prod.salesVolume !== 1 ? 's' : ''} sold</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800">₹{prod.revenue.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progressive scale indicator */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Orders List Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Latest order transactions from checkout</p>
                </div>
                <Link 
                  to="/admin/orders" 
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 text-xs rounded-xl transition-all flex items-center gap-1.5 group"
                >
                  View all orders
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-grow">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 h-full">
                  <Package className="w-12 h-12 stroke-1 mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No recent order transactions found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50/75 text-slate-600 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gradient-to-r from-slate-50/50 to-transparent transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            to={`/admin/orders/${order.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-sm group flex items-center gap-1"
                          >
                            {order.orderId || order.id?.substring(0, 8)}
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[150px]">
                            <p className="font-semibold text-xs text-slate-800 truncate">{order.userName}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{order.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-extrabold text-sm text-slate-800">₹{order.total}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;