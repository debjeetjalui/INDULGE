import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartItems([]);
      setCartCount(0);
      return;
    }
    
    try {
      const response = await cartAPI.get();
      const items = response.data || [];
      setCartItems(items);
      setCartCount(items.length);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const handleFocus = () => {
      fetchCart();
    };
    
    window.addEventListener('focus', handleFocus);
    
    const handleStorage = (e) => {
      if (e.key === 'cartUpdated') {
        fetchCart();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchCart]);

  const updateCartCount = (count) => {
    setCartCount(count);
  };

  const refreshCart = () => {
    localStorage.setItem('cartUpdated', Date.now().toString());
    fetchCart();
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const openCartModal = () => {
    fetchCart();
    setIsCartModalOpen(true);
  };

  const closeCartModal = () => {
    setIsCartModalOpen(false);
  };

  const value = {
    cartCount,
    cartItems,
    updateCartCount,
    fetchCart,
    refreshCart,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    isCartModalOpen,
    openCartModal,
    closeCartModal
  };

  return React.createElement(AppContext.Provider, { value: value }, children);
};