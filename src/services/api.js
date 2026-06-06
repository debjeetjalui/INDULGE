import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/register', userData),
  login: (credentials) => api.post('/login', credentials),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  sendOTP: (email, isNewUser = false) => api.post('/auth/send-otp', { email, isNewUser }),
  verifyOTP: (email, otp, userData = null) => api.post('/auth/verify-otp', { email, otp, ...userData }),
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile', profileData),
  uploadProfileImage: (formData) => api.post('/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getOrders: () => api.get('/profile/orders'),
};

export const fabricsAPI = {
  getAll: () => api.get('/fabrics'),
  getById: (id) => api.get(`/fabrics/${id}`),
  getCategories: () => api.get('/categories'),
  getByType: (type) => api.get(`/products/${type}`),
  getCustomizations: () => api.get('/customizations'),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  add: (itemData) => api.post('/cart', itemData),
  remove: (id) => api.delete(`/cart/${id}`),
};

export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  getTracking: (orderId) => api.get(`/orders/${orderId}/tracking`),
  cancelOrder: (orderId, data) => api.post(`/orders/${orderId}/cancel`, data),
};

export const bookingsAPI = {
  getMyBookings: () => api.get('/bookings'),
  create: (bookingData) => api.post('/bookings', bookingData),
  cancel: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
  checkFirstVisit: () => api.get('/bookings/check-first-visit'),
  createPaidOrder: () => api.post('/bookings/create-paid-order'),
  verifyPayment: (data) => api.post('/bookings/verify-payment', data),
};

export const measurementsAPI = {
  get: () => api.get('/measurements'),
  save: (measurementsData) => api.post('/measurements', measurementsData),
};

export const reviewsAPI = {
  getByFabric: (fabricId) => api.get(`/reviews/${fabricId}`),
  submit: (data) => api.post('/reviews', data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

export const paymentsAPI = {
  getRazorpayKey: () => api.get('/razorpay-key'),
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

export const paymentMethodsAPI = {
  getAll: () => api.get('/payment-methods'),
  save: (data) => api.post('/payment-methods', data),
  remove: (id) => api.delete(`/payment-methods/${id}`),
};

export default api;