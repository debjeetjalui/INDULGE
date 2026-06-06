import React, { useState, useEffect } from 'react';
import { Search, Eye, Package, Save, Check, Loader2, X, Printer, CheckCircle2, Send, KeyRound, Truck } from 'lucide-react';
import { ordersAPI, deliveryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OrdersManager = () => {
  const { isDeliveryBoy } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(isDeliveryBoy ? 'delivery_all' : 'all');
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(null);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Delivery boy OTP state
  const [otpSending, setOtpSending] = useState(null);
  const [otpSentFor, setOtpSentFor] = useState({});
  const [otpValues, setOtpValues] = useState({});
  const [otpVerifying, setOtpVerifying] = useState(null);
  const [otpMaskedEmail, setOtpMaskedEmail] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    setPendingChanges(prev => ({
      ...prev,
      [orderId]: newStatus
    }));
  };

  const handleSaveStatus = async (orderId) => {
    const newStatus = pendingChanges[orderId];
    if (!newStatus) return;

    setSaving(orderId);
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      await fetchOrders();
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update order status';
      alert(errorMessage);
      if (error.response?.status === 400) {
        setPendingChanges(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      }
    } finally {
      setSaving(null);
    }
  };

  // Delivery boy: Send OTP to customer
  const handleSendOtp = async (orderId) => {
    setOtpSending(orderId);
    try {
      const response = await deliveryAPI.sendOtp(orderId);
      setOtpSentFor(prev => ({ ...prev, [orderId]: true }));
      setOtpMaskedEmail(prev => ({ ...prev, [orderId]: response.data.maskedEmail }));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setOtpSending(null);
    }
  };

  // Delivery boy: Verify OTP and deliver
  const handleVerifyOtp = async (orderId) => {
    const otp = otpValues[orderId];
    if (!otp || otp.length !== 6) {
      alert('Please enter the 6-digit OTP');
      return;
    }
    setOtpVerifying(orderId);
    try {
      await deliveryAPI.verifyOtp(orderId, otp);
      await fetchOrders();
      setOtpSentFor(prev => { const u = { ...prev }; delete u[orderId]; return u; });
      setOtpValues(prev => { const u = { ...prev }; delete u[orderId]; return u; });
      setOtpMaskedEmail(prev => { const u = { ...prev }; delete u[orderId]; return u; });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setOtpVerifying(null);
    }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    setShowModal(true);
    setLoadingDetails(true);
    
    try {
      const response = await ordersAPI.getById(order.order_id);
      setOrderDetails(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentStatus = (order) => {
    return pendingChanges[order.order_id] || order.status || 'pending';
  };

  const hasUnsavedChange = (orderId) => {
    return pendingChanges.hasOwnProperty(orderId);
  };

  const isDelivered = (order) => {
    return order.status === 'delivered';
  };

  const isCancelled = (order) => {
    return order.status === 'cancelled';
  };

  const isLocked = (order) => {
    return order.status === 'delivered' || order.status === 'cancelled';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesStatus;
    if (isDeliveryBoy) {
      if (statusFilter === 'delivery_all') matchesStatus = order.status === 'shipped' || order.status === 'delivered';
      else matchesStatus = order.status === statusFilter;
    } else {
      matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  const statusTabs = [
    { key: 'all', label: 'All Orders', color: '#D4AF37' },
    { key: 'pending', label: 'Pending', color: '#f59e0b' },
    { key: 'processing', label: 'Processing', color: '#a855f7' },
    { key: 'in_production', label: 'In Production', color: '#6366f1' },
    { key: 'shipped', label: 'Shipped', color: '#3b82f6' },
    { key: 'delivered', label: 'Delivered', color: '#22c55e' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];

  const getStatusCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const formatMeasurementLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderCustomizationDetails = (details) => {
    if (!details) return <p className="no-data">No customization details</p>;
    
    if (typeof details === 'object') {
      return (
        <div className="customization-grid">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="customization-item">
              <span className="customization-label">{formatMeasurementLabel(key)}:</span>
              <span className="customization-value">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    
    return <p>{String(details)}</p>;
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="orders-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">
            {isDeliveryBoy 
              ? (statusFilter === 'delivery_all' ? 'All My Orders' : statusFilter === 'shipped' ? 'Ready for Delivery' : 'Delivered')
              : (statusFilter === 'all' ? 'All Orders' : statusTabs.find(t => t.key === statusFilter)?.label)
            } ({filteredOrders.length})
          </h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {!isDeliveryBoy && (
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--color-border)',
            overflowX: 'auto',
            flexWrap: 'wrap'
          }}>
            {statusTabs.map(tab => {
              const count = getStatusCount(tab.key);
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isActive ? `2px solid ${tab.color}` : '1px solid var(--color-border)',
                    background: isActive ? `${tab.color}20` : 'transparent',
                    color: isActive ? tab.color : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                  <span style={{
                    background: isActive ? tab.color : 'var(--color-surface-hover)',
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isDeliveryBoy && (
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--color-border)',
            overflowX: 'auto',
            flexWrap: 'wrap'
          }}>
            {[
              { key: 'delivery_all', label: 'All My Orders', color: '#3b82f6' },
              { key: 'shipped', label: 'Ready for Delivery', color: '#f59e0b' },
              { key: 'delivered', label: 'Delivered', color: '#10b981' },
            ].map(tab => {
              const count = tab.key === 'delivery_all'
                ? orders.filter(o => o.status === 'shipped' || o.status === 'delivered').length
                : orders.filter(o => o.status === tab.key).length;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isActive ? `2px solid ${tab.color}` : '1px solid var(--color-border)',
                    background: isActive ? `${tab.color}20` : 'transparent',
                    color: isActive ? tab.color : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? '600' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                  <span style={{
                    background: isActive ? tab.color : 'var(--color-surface-hover)',
                    color: isActive ? '#fff' : 'var(--color-text-muted)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ width: isDeliveryBoy ? '260px' : '180px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.order_id}>
                <td data-label="Order ID">{order.order_number || `#${order.order_id}`}</td>
                <td data-label="Customer">{order.user_name || 'Guest'}</td>
                <td data-label="Amount">{formatCurrency(order.total_amount)}</td>
                <td data-label="Status">
                  {isDeliveryBoy ? (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: order.status === 'delivered'
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      boxShadow: order.status === 'delivered'
                        ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                        : '0 2px 8px rgba(59, 130, 246, 0.3)'
                    }}>
                      {order.status === 'delivered' ? <CheckCircle2 size={16} /> : <Truck size={16} />}
                      <span>{order.status === 'delivered' ? 'Delivered' : 'Shipped'}</span>
                    </div>
                  ) : isLocked(order) ? (
                    <div 
                      className={isDelivered(order) ? "delivered-badge" : "cancelled-badge"}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        background: isDelivered(order) 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '6px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        boxShadow: isDelivered(order)
                          ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                          : '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isDelivered(order) ? 'Delivered' : 'Cancelled'}</span>
                    </div>
                  ) : (
                    <select
                      value={getCurrentStatus(order)}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                      className="status-select"
                      style={{
                        padding: '8px 12px',
                        background: 'var(--color-background)',
                        border: hasUnsavedChange(order.order_id) ? '2px solid var(--color-warning)' : '1px solid var(--color-border)',
                        borderRadius: '6px',
                        color: 'var(--color-text-primary)',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="in_production">In Production</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                </td>
                <td data-label="Date">{formatDate(order.created_at)}</td>
                <td>
                  {isDeliveryBoy ? (
                    // Delivery boy actions
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {order.status === 'shipped' && (
                        !otpSentFor[order.order_id] ? (
                          <button
                            onClick={() => handleSendOtp(order.order_id)}
                            disabled={otpSending === order.order_id}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              border: 'none',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '600',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {otpSending === order.order_id ? (
                              <><Loader2 size={14} className="spinning" /> Sending...</>
                            ) : (
                              <><Send size={14} /> Send OTP</>
                            )}
                          </button>
                        ) : (
                          <>
                            <input
                              type="text"
                              placeholder="OTP"
                              value={otpValues[order.order_id] || ''}
                              onChange={(e) => setOtpValues(prev => ({ ...prev, [order.order_id]: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                              maxLength={6}
                              style={{
                                width: '80px',
                                padding: '7px 8px',
                                border: '2px solid #d4af37',
                                borderRadius: '8px',
                                background: 'var(--color-background)',
                                color: 'var(--color-text-primary)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                letterSpacing: '3px',
                                textAlign: 'center'
                              }}
                            />
                            <button
                              onClick={() => handleVerifyOtp(order.order_id)}
                              disabled={otpVerifying === order.order_id}
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                color: 'white',
                                padding: '7px 12px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {otpVerifying === order.order_id ? (
                                <Loader2 size={14} className="spinning" />
                              ) : (
                                <KeyRound size={14} />
                              )}
                              Verify
                            </button>
                            <button
                              onClick={() => handleSendOtp(order.order_id)}
                              disabled={otpSending === order.order_id}
                              title="Resend OTP"
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: '500',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {otpSending === order.order_id ? (
                                <Loader2 size={12} className="spinning" />
                              ) : (
                                <Send size={12} />
                              )}
                              Resend
                            </button>
                          </>
                        )
                      )}
                      <button 
                        onClick={() => handleViewDetails(order)}
                        style={{
                          background: 'var(--color-primary)',
                          border: 'none',
                          color: '#0f1117',
                          padding: '7px 12px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </div>
                  ) : (
                    // Normal admin/employee flow
                    <div className="action-btns" style={{ gap: '8px' }}>
                      {hasUnsavedChange(order.order_id) && !isLocked(order) && (
                        <button 
                          className="action-btn save-btn"
                          onClick={() => handleSaveStatus(order.order_id)}
                          disabled={saving === order.order_id}
                          style={{
                            background: 'var(--color-success)',
                            border: 'none',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            width: 'auto'
                          }}
                          title="Save Status"
                        >
                          {saving === order.order_id ? (
                            <Loader2 size={14} className="spinning" />
                          ) : (
                            <Save size={14} />
                          )}
                          <span>Save</span>
                        </button>
                      )}
                      
                      <button 
                        className="action-btn view-btn" 
                        title="View Details"
                        onClick={() => handleViewDetails(order)}
                        style={{
                          background: 'var(--color-primary)',
                          border: 'none',
                          color: '#0f1117',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          width: 'auto'
                        }}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <h3>No orders found</h3>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="order-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <div className="modal-header-actions">
                <button className="print-btn" onClick={handlePrint} title="Print Details">
                  <Printer size={18} />
                  <span>Print</span>
                </button>
                <button className="close-btn" onClick={handleCloseModal} title="Close">
                  <span>×</span>
                </button>
              </div>
            </div>

            <div className="modal-content">
              {loadingDetails ? (
                <div className="loading-details">
                  <Loader2 size={40} className="spinning" />
                  <p>Loading order details...</p>
                </div>
              ) : orderDetails ? (
                <div className="order-details-content print-area">
                  <div className="details-section">
                    <h3 className="section-title">Order Information</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Order ID</span>
                        <span className="detail-value">{orderDetails.order?.order_number || `#${orderDetails.order?.order_id}`}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span className={`detail-value status-${orderDetails.order?.status}`}>
                          {orderDetails.order?.status?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value">{formatCurrency(orderDetails.order?.total_amount)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Order Date</span>
                        <span className="detail-value">{formatDateTime(orderDetails.order?.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3 className="section-title">Customer Information</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name</span>
                        <span className="detail-value">{orderDetails.order?.user_name || 'Guest'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{orderDetails.order?.email || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{orderDetails.order?.phone || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3 className="section-title">Shipping Address</h3>
                    <p className="address-text">{orderDetails.order?.shipping_address || 'No shipping address provided'}</p>
                  </div>

                  <div className="details-section">
                    <h3 className="section-title">Order Items</h3>
                    {orderDetails.items && orderDetails.items.length > 0 ? (
                      orderDetails.items.map((item, index) => (
                        <div key={item.item_id || index} className="order-item-card">
                          <div className="item-header">
                            <h4>Item #{index + 1}: {item.product_type_name || 'Product'}</h4>
                            <span className="item-price">{formatCurrency(item.total_price)}</span>
                          </div>
                          <div className="item-details">
                            <div className="item-info">
                              <span className="info-label">Fabric:</span>
                              <span className="info-value">{item.fabric_name || '-'}</span>
                            </div>
                            {item.composition && (
                              <div className="item-info">
                                <span className="info-label">Composition:</span>
                                <span className="info-value">{item.composition}</span>
                              </div>
                            )}
                            {item.color_hex && (
                              <div className="item-info">
                                <span className="info-label">Color:</span>
                                <span className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span 
                                    className="color-swatch"
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      backgroundColor: item.color_hex,
                                      border: '1px solid rgba(255,255,255,0.2)'
                                    }}
                                  ></span>
                                  {item.color_hex}
                                </span>
                              </div>
                            )}
                            <div className="item-info">
                              <span className="info-label">Quantity:</span>
                              <span className="info-value">{item.quantity || 1}</span>
                            </div>
                            <div className="item-info">
                              <span className="info-label">Unit Price:</span>
                              <span className="info-value">{formatCurrency(item.unit_price)}</span>
                            </div>
                          </div>
                          
                          <div className="customization-section">
                            <h5>Customization Details</h5>
                            {renderCustomizationDetails(item.customization_details)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-data">No items in this order</p>
                    )}
                  </div>

                  <div className="details-section measurements-section">
                    <h3 className="section-title">Customer Measurements (for Tailor)</h3>
                    {orderDetails.measurements ? (
                      <div className="measurements-grid">
                        {orderDetails.measurements.neck_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Neck</span>
                            <span className="measurement-value">{orderDetails.measurements.neck_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.chest_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Chest</span>
                            <span className="measurement-value">{orderDetails.measurements.chest_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.waist_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Waist</span>
                            <span className="measurement-value">{orderDetails.measurements.waist_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.hip_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Hip</span>
                            <span className="measurement-value">{orderDetails.measurements.hip_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.shoulder_width && (
                          <div className="measurement-item">
                            <span className="measurement-label">Shoulder Width</span>
                            <span className="measurement-value">{orderDetails.measurements.shoulder_width} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.sleeve_length && (
                          <div className="measurement-item">
                            <span className="measurement-label">Sleeve Length</span>
                            <span className="measurement-value">{orderDetails.measurements.sleeve_length} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.armhole_depth && (
                          <div className="measurement-item">
                            <span className="measurement-label">Armhole Depth</span>
                            <span className="measurement-value">{orderDetails.measurements.armhole_depth} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.torso_length && (
                          <div className="measurement-item">
                            <span className="measurement-label">Torso Length</span>
                            <span className="measurement-value">{orderDetails.measurements.torso_length} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.inseam_length && (
                          <div className="measurement-item">
                            <span className="measurement-label">Inseam Length</span>
                            <span className="measurement-value">{orderDetails.measurements.inseam_length} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.thigh_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Thigh</span>
                            <span className="measurement-value">{orderDetails.measurements.thigh_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.knee_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Knee</span>
                            <span className="measurement-value">{orderDetails.measurements.knee_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.ankle_circumference && (
                          <div className="measurement-item">
                            <span className="measurement-label">Ankle</span>
                            <span className="measurement-value">{orderDetails.measurements.ankle_circumference} cm</span>
                          </div>
                        )}
                        {orderDetails.measurements.notes && (
                          <div className="measurement-notes">
                            <span className="measurement-label">Notes:</span>
                            <p>{orderDetails.measurements.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="no-data">No measurements recorded for this customer</p>
                    )}
                  </div>

                  {orderDetails.order?.notes && (
                    <div className="details-section">
                      <h3 className="section-title">Order Notes</h3>
                      <p className="notes-text">{orderDetails.order.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="error-state">
                  <p>Failed to load order details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .modal-overlay {
            position: absolute !important;
            background: white !important;
          }
          .order-details-modal {
            box-shadow: none !important;
            border: none !important;
          }
          .modal-header-actions, .close-btn, .print-btn {
            display: none !important;
          }
          .details-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .section-title {
            color: black !important;
            border-bottom: 2px solid black !important;
          }
          .detail-value, .measurement-value, .info-value {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrdersManager;
