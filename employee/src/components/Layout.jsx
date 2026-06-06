import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Calendar,
  Users,
  Ruler,
  CreditCard,
  Box,
  Tags,
  UserCog,
  LogOut,
  Settings,
  Ban,
  MessageSquare,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const { employee, logout, isAdmin, isDeliveryBoy } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/dashboard': 'Dashboard',
      '/fabrics': 'Fabrics Management',
      '/orders': 'Orders Management',
      '/bookings': 'Bookings Management',
      '/users': 'Users Management',
      '/measurements': 'Measurements',
      '/payments': 'Payments',
      '/models': '3D Models',
      '/coupons': 'Coupons',
      '/cancellations': 'Cancellations & Refunds',
      '/reviews': 'Product Reviews',
      '/employees': 'Employee Management',
    };
    return titles[path] || 'Dashboard';
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/fabrics', icon: ShoppingBag, label: 'Fabrics' },
    { path: '/orders', icon: Package, label: 'Orders' },
    { path: '/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/measurements', icon: Ruler, label: 'Measurements' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/models', icon: Box, label: '3D Models' },
    { path: '/coupons', icon: Tags, label: 'Coupons' },
    { path: '/cancellations', icon: Ban, label: 'Cancellations' },
    { path: '/reviews', icon: MessageSquare, label: 'Reviews' },
  ];

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">INDULGE</div>
          <div className="sidebar-tagline">{isDeliveryBoy ? 'Delivery Panel' : 'Admin Panel'}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            {(isDeliveryBoy ? navItems.filter(item => item.path === '/orders') : navItems).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <div className="nav-section">
              <div className="nav-section-title">Admin</div>
              <NavLink
                to="/employees"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <UserCog size={18} />
                <span>Employees</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="employee-info">
            <div className="employee-avatar">
              {getInitials(employee?.first_name, employee?.last_name)}
            </div>
            <div className="employee-details">
              <div className="employee-name">
                {employee?.first_name} {employee?.last_name}
              </div>
              <div className="employee-role">{employee?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="page-title">{getPageTitle()}</h1>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
