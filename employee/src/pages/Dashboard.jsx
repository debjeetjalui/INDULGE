import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Users,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { dashboardAPI, ordersAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalBookings: 0,
    totalUsers: 0,
    revenueChange: 0,
    ordersChange: 0,
    bookingsChange: 0,
    usersChange: 0,
  });
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await dashboardAPI.getStats();
      setStats(statsResponse.data);

      const ordersResponse = await ordersAPI.getAll();
      const orders = ordersResponse.data || [];
      
      const statusCounts = orders.reduce((acc, order) => {
        const status = order.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusColors = {
        pending: '#f59e0b',
        processing: '#a855f7',
        in_production: '#6366f1',
        shipped: '#3b82f6',
        delivered: '#22c55e',
        cancelled: '#ef4444'
      };

      const chartData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: statusColors[name] || '#6b7280'
      }));

      setOrdersData(chartData.length > 0 ? chartData : [{ name: 'No Orders', value: 1, color: '#6b7280' }]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({ icon: Icon, iconClass, title, value, change, prefix = '' }) => (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{title}</h3>
        <div className="stat-value">{prefix}{value}</div>
        <div className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(change)}% from last week
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard
          icon={DollarSign}
          iconClass="revenue"
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange || 0}
        />
        <StatCard
          icon={Package}
          iconClass="orders"
          title="Total Orders"
          value={stats.totalOrders}
          change={stats.ordersChange || 0}
        />
        <StatCard
          icon={Calendar}
          iconClass="bookings"
          title="Bookings"
          value={stats.totalBookings}
          change={stats.bookingsChange || 0}
        />
        <StatCard
          icon={Users}
          iconClass="users"
          title="Total Users"
          value={stats.totalUsers}
          change={stats.usersChange || 0}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card" style={{ gridColumn: 'span 2' }}>
          <h3><PieChartIcon size={20} /> Orders Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ordersData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {ordersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1d26',
                  border: '1px solid #2d313c',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#a0a5b2' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
