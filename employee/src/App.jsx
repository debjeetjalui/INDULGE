import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FabricsManager from './pages/FabricsManager';
import OrdersManager from './pages/OrdersManager';
import BookingsManager from './pages/BookingsManager';
import UsersManager from './pages/UsersManager';
import MeasurementsManager from './pages/MeasurementsManager';
import PaymentsManager from './pages/PaymentsManager';
import ModelsManager from './pages/ModelsManager';
import EmployeesManager from './pages/EmployeesManager';
import CouponsManager from './pages/CouponsManager';
import CancellationsManager from './pages/CancellationsManager';
import ReviewsManager from './pages/ReviewsManager';
import Layout from './components/Layout';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false, allowDeliveryBoy = false }) => {
  const { employee, loading, isDeliveryBoy } = useAuth();
  
  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }
  
  if (!employee) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && employee.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Delivery boys can only access pages that explicitly allow them
  if (isDeliveryBoy && !allowDeliveryBoy) {
    return <Navigate to="/orders" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/fabrics" element={
        <ProtectedRoute>
          <Layout><FabricsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute allowDeliveryBoy>
          <Layout><OrdersManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/bookings" element={
        <ProtectedRoute>
          <Layout><BookingsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <Layout><UsersManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/measurements" element={
        <ProtectedRoute>
          <Layout><MeasurementsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/payments" element={
        <ProtectedRoute>
          <Layout><PaymentsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/models" element={
        <ProtectedRoute>
          <Layout><ModelsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/coupons" element={
        <ProtectedRoute>
          <Layout><CouponsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/cancellations" element={
        <ProtectedRoute>
          <Layout><CancellationsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/reviews" element={
        <ProtectedRoute>
          <Layout><ReviewsManager /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/employees" element={
        <ProtectedRoute adminOnly>
          <Layout><EmployeesManager /></Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
