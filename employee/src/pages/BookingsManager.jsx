import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, Trash2, Save } from 'lucide-react';
import { bookingsAPI } from '../services/api';

const BookingsManager = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStatus, setEditingStatus] = useState({});

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAll();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusEdit = (bookingId, newStatus) => {
    setEditingStatus(prev => ({
      ...prev,
      [bookingId]: newStatus
    }));
  };

  const handleSaveStatus = async (bookingId) => {
    const newStatus = editingStatus[bookingId];
    if (!newStatus) return;

    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);
      setEditingStatus(prev => {
        const updated = {...prev};
        delete updated[bookingId];
        return updated;
      });
      await fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update booking status');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await bookingsAPI.delete(bookingId);
      await fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const getStatusBadgeStyle = (status) => {
    const styles = {
      pending: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b' },
      confirmed: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid #3b82f6' },
      completed: { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid #22c55e' },
      cancelled: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444' }
    };
    return styles[status] || styles.pending;
  };

  const filteredBookings = bookings.filter(booking =>
    booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="bookings-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">All Bookings ({bookings.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => {
              const isCancelled = booking.status === 'cancelled';
              const currentStatus = editingStatus[booking.booking_id] || booking.status || 'pending';
              const hasChanges = editingStatus[booking.booking_id] && editingStatus[booking.booking_id] !== booking.status;

              return (
                <tr key={booking.booking_id}>
                  <td>#{booking.booking_id}</td>
                  <td>
                    <div>
                      <div>{booking.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{booking.customer_email}</div>
                    </div>
                  </td>
                  <td>{booking.customer_phone}</td>
                  <td>{formatDate(booking.booking_date)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{booking.booking_time}</td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      display: 'inline-block',
                      ...(booking.booking_type === 'paid' 
                        ? { background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid #8b5cf6' }
                        : { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid #22c55e' }
                      )
                    }}>
                      {booking.booking_type === 'paid' ? '₹ Paid' : '🎁 Free'}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const ps = booking.payment_status || 'not_required';
                      const paymentStyles = {
                        not_required: { background: 'rgba(156,163,175,0.15)', color: '#6b7280', border: '1px solid #9ca3af' },
                        pending: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid #f59e0b' },
                        completed: { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid #22c55e' },
                        failed: { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }
                      };
                      const labels = { not_required: 'N/A', pending: 'Pending', completed: '✓ Paid', failed: '✗ Failed' };
                      return (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                          display: 'inline-block',
                          ...(paymentStyles[ps] || paymentStyles.not_required)
                        }}>
                          {labels[ps] || 'N/A'}
                          {booking.amount_paid > 0 && ` (₹${booking.amount_paid})`}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {isCancelled ? (
                      <span 
                        style={{
                          ...getStatusBadgeStyle('cancelled'),
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                          display: 'inline-block'
                        }}
                      >
                        ✗ Cancelled
                      </span>
                    ) : booking.status === 'completed' ? (
                      <span 
                        style={{
                          ...getStatusBadgeStyle('completed'),
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontWeight: '600',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ✓ Completed
                      </span>
                    ) : (
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusEdit(booking.booking_id, e.target.value)}
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
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {!isCancelled && booking.status !== 'completed' && hasChanges && (
                        <button 
                          onClick={() => handleSaveStatus(booking.booking_id)} 
                          title="Save Status"
                          style={{ 
                            background: 'rgba(34, 197, 94, 0.15)', 
                            border: '1px solid #22c55e', 
                            borderRadius: '6px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Save size={16} color="#22c55e" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(booking.booking_id)} 
                        title="Delete Booking"
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.15)', 
                          border: '1px solid #ef4444', 
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBookings.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No bookings found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsManager;
