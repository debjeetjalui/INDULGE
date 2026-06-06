import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Plus, X } from 'lucide-react';
import { paymentsAPI } from '../services/api';

const PaymentsManager = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    amount: '',
    payment_method: 'card',
    transaction_id: '',
    status: 'completed',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await paymentsAPI.getAll();
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId, newStatus) => {
    try {
      await paymentsAPI.updateStatus(paymentId, newStatus);
      await fetchPayments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update payment status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await paymentsAPI.create(formData);
      await fetchPayments();
      setShowModal(false);
      setFormData({
        order_id: '',
        amount: '',
        payment_method: 'card',
        transaction_id: '',
        status: 'completed',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment');
    }
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
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const filteredPayments = payments.filter(payment =>
    payment.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="payments-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">All Payments ({payments.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="add-btn" onClick={() => setShowModal(true)}>
              <Plus size={16} />
              Add Payment
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => (
              <tr key={payment.payment_id}>
                <td>#{payment.payment_id}</td>
                <td>{payment.order_number || `#${payment.order_id}`}</td>
                <td>{payment.user_name || 'Guest'}</td>
                <td>{formatCurrency(payment.amount)}</td>
                <td style={{ textTransform: 'uppercase' }}>{payment.payment_method}</td>
                <td>{payment.transaction_id || '-'}</td>
                <td>
                  <select
                    value={payment.status || 'pending'}
                    onChange={(e) => handleStatusChange(payment.payment_id, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td>{formatDate(payment.payment_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div className="empty-state">
            <CreditCard size={48} />
            <h3>No payments found</h3>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Payment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Order ID *</label>
                    <input type="number" required value={formData.order_id} onChange={(e) => setFormData({...formData, order_id: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="cod">COD</option>
                      <option value="wallet">Wallet</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Transaction ID</label>
                    <input type="text" value={formData.transaction_id} onChange={(e) => setFormData({...formData, transaction_id: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsManager;
