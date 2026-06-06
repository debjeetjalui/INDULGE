import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employeeToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employee');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const dashboardAPI = {
  getStats: () => api.get('/employee/dashboard/stats'),
  getRevenueChart: (period = 'week') => api.get(`/employee/dashboard/revenue?period=${period}`),
  getOrdersChart: () => api.get('/employee/dashboard/orders-chart'),
  getRecentActivity: () => api.get('/employee/dashboard/activity'),
};

export const fabricsAPI = {
  getAll: () => api.get('/employee/fabrics'),
  getById: (id) => api.get(`/employee/fabrics/${id}`),
  create: (data) => api.post('/employee/fabrics', data),
  update: (id, data) => api.put(`/employee/fabrics/${id}`, data),
  delete: (id) => api.delete(`/employee/fabrics/${id}`),
  uploadImage: (formData) => api.post('/employee/fabrics/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const ordersAPI = {
  getAll: () => api.get('/employee/orders'),
  getById: (id) => api.get(`/employee/orders/${id}`),
  updateStatus: (id, status) => api.put(`/employee/orders/${id}/status`, { status }),
  addTracking: (id, trackingData) => api.post(`/employee/orders/${id}/tracking`, trackingData),
};

export const bookingsAPI = {
  getAll: () => api.get('/employee/bookings'),
  getById: (id) => api.get(`/employee/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/employee/bookings/${id}/status`, { status }),
  delete: (id) => api.delete(`/employee/bookings/${id}`),
  addNote: (id, note) => api.post(`/employee/bookings/${id}/notes`, { note }),
};

export const usersAPI = {
  getAll: () => api.get('/employee/users'),
  getById: (id) => api.get(`/employee/users/${id}`),
  update: (id, data) => api.put(`/employee/users/${id}`, data),
  toggleActive: (id) => api.put(`/employee/users/${id}/toggle-active`),
};

export const measurementsAPI = {
  getAll: () => api.get('/employee/measurements'),
  getByUserId: (userId) => api.get(`/employee/measurements/user/${userId}`),
  update: (id, data) => api.put(`/employee/measurements/${id}`, data),
};

export const paymentsAPI = {
  getAll: () => api.get('/employee/payments'),
  getById: (id) => api.get(`/employee/payments/${id}`),
  create: (data) => api.post('/employee/payments', data),
  updateStatus: (id, status) => api.put(`/employee/payments/${id}/status`, { status }),
};

export const modelsAPI = {
  getAll: () => api.get('/employee/models'),
  getById: (id) => api.get(`/employee/models/${id}`),
  create: (data) => api.post('/employee/models', data),
  update: (id, data) => api.put(`/employee/models/${id}`, data),
  delete: (id) => api.delete(`/employee/models/${id}`),
  uploadModel: (formData) => api.post('/employee/models/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const employeesAPI = {
  getAll: () => api.get('/employee/employees'),
  getById: (id) => api.get(`/employee/employees/${id}`),
  create: (data) => api.post('/employee/employees', data),
  update: (id, data) => api.put(`/employee/employees/${id}`, data),
  delete: (id) => api.delete(`/employee/employees/${id}`),
  toggleActive: (id) => api.put(`/employee/employees/${id}/toggle-active`),
};

export const couponsAPI = {
  getAll: () => api.get('/employee/coupons'),
  getById: (id) => api.get(`/employee/coupons/${id}`),
  create: (data) => api.post('/employee/coupons', data),
  update: (id, data) => api.put(`/employee/coupons/${id}`, data),
  delete: (id) => api.delete(`/employee/coupons/${id}`),
  toggleActive: (id) => api.put(`/employee/coupons/${id}/toggle-active`),
};

export const categoriesAPI = {
  getAll: () => api.get('/employee/categories'),
};

export const cancellationsAPI = {
  getAll: () => api.get('/employee/cancellations'),
  updateStatus: (id, refund_status, employee_notes) => api.put(`/employee/cancellations/${id}/status`, { refund_status, employee_notes }),
};

export const reviewsAPI = {
  getAll: () => api.get('/employee/reviews'),
  delete: (id) => api.delete(`/employee/reviews/${id}`),
};

export const deliveryAPI = {
  sendOtp: (orderId) => api.post('/employee/delivery/send-otp', { orderId }),
  verifyOtp: (orderId, otp) => api.post('/employee/delivery/verify-otp', { orderId, otp }),
};
