import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmployee = localStorage.getItem('employee');
    const token = localStorage.getItem('employeeToken');
    
    if (storedEmployee && token) {
      try {
        setEmployee(JSON.parse(storedEmployee));
      } catch (error) {
        localStorage.removeItem('employee');
        localStorage.removeItem('employeeToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/employee/login', { email, password });
      const { token, employee: employeeData } = response.data;
      
      localStorage.setItem('employeeToken', token);
      localStorage.setItem('employee', JSON.stringify(employeeData));
      setEmployee(employeeData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employee');
    setEmployee(null);
  };

  const value = {
    employee,
    loading,
    login,
    logout,
    isAdmin: employee?.role === 'admin',
    isManager: employee?.role === 'manager' || employee?.role === 'admin',
    isDeliveryBoy: employee?.role === 'delivery_boy',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
