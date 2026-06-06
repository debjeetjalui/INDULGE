import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tags, X, Loader2 } from 'lucide-react';
import { couponsAPI } from '../services/api';

const CouponsManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await couponsAPI.getAll();
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value || '',
        min_order_amount: coupon.min_order_amount || '',
        max_discount_amount: coupon.max_discount_amount || '',
        usage_limit: coupon.usage_limit || '',
        start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
        end_date: coupon.end_date ? coupon.end_date.split('T')[0] : '',
        is_active: coupon.is_active ?? true,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        start_date: '',
        end_date: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCoupon) {
        await couponsAPI.update(editingCoupon.coupon_id, formData);
      } else {
        await couponsAPI.create(formData);
      }
      await fetchCoupons();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await couponsAPI.delete(couponId);
      await fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const handleToggleActive = async (couponId) => {
    const coupon = coupons.find(c => c.coupon_id === couponId);
    if (!coupon) return;
    try {
      await couponsAPI.update(couponId, { ...coupon, is_active: !coupon.is_active });
      await fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
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

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="coupons-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">All Coupons ({coupons.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <Plus size={16} />
              Add Coupon
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.map(coupon => (
              <tr key={coupon.coupon_id}>
                <td><strong>{coupon.code}</strong></td>
                <td>
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}%` 
                    : formatCurrency(coupon.discount_value)
                  }
                </td>
                <td>{formatCurrency(coupon.min_order_amount)}</td>
                <td>{coupon.used_count || 0} / {coupon.usage_limit || '∞'}</td>
                <td>{formatDate(coupon.end_date)}</td>
                <td>
                  <span 
                    className={`status-badge ${coupon.is_active !== false ? 'completed' : 'cancelled'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleToggleActive(coupon.coupon_id)}
                  >
                    {coupon.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="action-btn edit" onClick={() => handleOpenModal(coupon)}>
                      <Edit size={14} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(coupon.coupon_id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCoupons.length === 0 && (
          <div className="empty-state">
            <Tags size={48} />
            <h3>No coupons found</h3>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Code *</label>
                    <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g., SAVE20" />
                  </div>
                  <div className="form-group">
                    <label>Discount Type</label>
                    <select value={formData.discount_type} onChange={(e) => setFormData({...formData, discount_type: e.target.value})}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Discount Value *</label>
                    <input type="number" required value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Min Order Amount (₹)</label>
                    <input type="number" value={formData.min_order_amount} onChange={(e) => setFormData({...formData, min_order_amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Max Discount (₹)</label>
                    <input type="number" value={formData.max_discount_amount} onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Usage Limit</label>
                    <input type="number" value={formData.usage_limit} onChange={(e) => setFormData({...formData, usage_limit: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spinner" /> Saving...</> : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsManager;
