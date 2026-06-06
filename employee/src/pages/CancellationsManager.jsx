import React, { useState, useEffect } from 'react';
import { cancellationsAPI } from '../services/api';
import { Search, Eye, X, RefreshCw, AlertTriangle, CreditCard, Building2, Loader2 } from 'lucide-react';

const CancellationsManager = () => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCancellation, setSelectedCancellation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editRefundStatus, setEditRefundStatus] = useState('');

  useEffect(() => {
    fetchCancellations();
  }, []);

  const fetchCancellations = async () => {
    setLoading(true);
    try {
      const response = await cancellationsAPI.getAll();
      setCancellations(response.data);
    } catch (error) {
      console.error('Error fetching cancellations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cancellation) => {
    setSelectedCancellation(cancellation);
    setEditNotes(cancellation.employee_notes || '');
    setEditRefundStatus(cancellation.refund_status);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedCancellation) return;
    setUpdatingStatus(true);
    try {
      await cancellationsAPI.updateStatus(
        selectedCancellation.cancellation_id,
        editRefundStatus,
        editNotes
      );
      setCancellations(prev => prev.map(c =>
        c.cancellation_id === selectedCancellation.cancellation_id
          ? { ...c, refund_status: editRefundStatus, employee_notes: editNotes }
          : c
      ));
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating cancellation:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const getStatusClass = (status) => {
    const map = {
      not_applicable: 'cancelled',
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      rejected: 'cancelled',
    };
    return map[status] || 'pending';
  };

  const getStatusLabel = (status) => {
    const map = {
      not_applicable: 'N/A',
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      rejected: 'Rejected',
    };
    return map[status] || status;
  };

  const filtered = cancellations.filter(c => {
    const matchesSearch = !searchTerm ||
      (c.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.user_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || c.refund_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="cancellations-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">Cancellations ({cancellations.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search by order # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="not_applicable">N/A (COD)</option>
            </select>
            <button className="add-btn" onClick={fetchCancellations}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <table className="data-table" style={{ tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Refund Method</th>
              <th>Amount</th>
              <th>Refund Status</th>
              <th>Date</th>
              <th style={{ width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.cancellation_id}>
                <td>{c.order_number || `#${c.order_id}`}</td>
                <td>{c.user_name || '—'}</td>
                <td>
                  <span className={`status-badge ${(!c.payment_method || c.payment_method === 'cod') ? 'pending' : 'completed'}`}>
                    {(!c.payment_method || c.payment_method === 'cod') ? 'COD' : c.payment_method.toUpperCase()}
                  </span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>
                  {c.refund_method === 'none' ? '—' : (c.refund_method || '—').replace('_', ' ')}
                </td>
                <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {formatCurrency(c.refund_amount)}
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(c.refund_status)}`}>
                    {getStatusLabel(c.refund_status)}
                  </span>
                </td>
                <td>{formatDate(c.cancelled_at)}</td>
                <td>
                  <div className="action-btns">
                    <button 
                      onClick={() => handleViewDetails(c)} 
                      title="View Details"
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.15)', 
                        border: '1px solid #3b82f6', 
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Eye size={16} color="#3b82f6" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <h3>No cancellations found</h3>
          </div>
        )}
      </div>

      {showDetailModal && selectedCancellation && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Cancellation Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Order Number</label>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {selectedCancellation.order_number || `#${selectedCancellation.order_id}`}
                  </div>
                </div>
                <div className="form-group">
                  <label>Customer</label>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {selectedCancellation.user_name || '—'}
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{selectedCancellation.email || '—'}</div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{selectedCancellation.phone || '—'}</div>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <div>
                    <span className={`status-badge ${(!selectedCancellation.payment_method || selectedCancellation.payment_method === 'cod') ? 'pending' : 'completed'}`}>
                      {(!selectedCancellation.payment_method || selectedCancellation.payment_method === 'cod') ? 'COD' : selectedCancellation.payment_method.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Refund Amount</label>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.1rem' }}>
                    {formatCurrency(selectedCancellation.refund_amount)}
                  </div>
                </div>
                <div className="form-group">
                  <label>Cancelled At</label>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{formatDate(selectedCancellation.cancelled_at)}</div>
                </div>
                <div className="form-group">
                  <label>Processed At</label>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{formatDate(selectedCancellation.processed_at)}</div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Cancellation Reason</label>
                <div style={{
                  padding: '12px',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.5
                }}>
                  {selectedCancellation.reason || 'No reason provided'}
                </div>
              </div>

              {selectedCancellation.payment_method && selectedCancellation.payment_method !== 'cod' && (
                <div style={{
                  marginBottom: '16px',
                  padding: '14px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-info)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedCancellation.refund_method === 'upi' ? <CreditCard size={16} /> : <Building2 size={16} />}
                    Refund Details ({selectedCancellation.refund_method === 'upi' ? 'UPI' : 'Bank Transfer'})
                  </div>
                  {selectedCancellation.refund_method === 'upi' ? (
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      <span>UPI ID: </span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedCancellation.upi_id || '—'}</span>
                    </div>
                  ) : (
                    <div className="form-grid">
                      <div style={{ color: 'var(--color-text-secondary)' }}>Bank: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedCancellation.bank_name || '—'}</span></div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>Holder: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedCancellation.account_holder_name || '—'}</span></div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>Account: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedCancellation.account_number || '—'}</span></div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>IFSC: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedCancellation.ifsc_code || '—'}</span></div>
                    </div>
                  )}
                </div>
              )}

              {selectedCancellation.refund_status !== 'not_applicable' && (
                <div style={{
                  padding: '16px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '12px' }}>
                    Update Refund Status
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <select
                      value={editRefundStatus}
                      onChange={(e) => setEditRefundStatus(e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add employee notes..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {selectedCancellation.refund_status !== 'not_applicable' && (
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancellationsManager;
