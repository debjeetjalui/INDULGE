import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, X, Loader2 } from 'lucide-react';
import { fabricsAPI, categoriesAPI } from '../services/api';

const FabricsManager = () => {
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFabric, setEditingFabric] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    composition: '',
    weight: '',
    price: '',
    stock_quantity: '',
    image_url: '',
    texture_url: '',
    color_hex: '#ffffff',
    is_available: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fabricsRes, categoriesRes] = await Promise.all([
        fabricsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      setFabrics(fabricsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (fabric = null) => {
    if (fabric) {
      setEditingFabric(fabric);
      setFormData({
        name: fabric.name || '',
        description: fabric.description || '',
        category_id: fabric.category_id || '',
        composition: fabric.composition || '',
        weight: fabric.weight || '',
        price: fabric.price || '',
        stock_quantity: fabric.stock_quantity || '',
        image_url: fabric.image_url || '',
        texture_url: fabric.texture_url || '',
        color_hex: fabric.color_hex || '#ffffff',
        is_available: fabric.is_available ?? true,
      });
    } else {
      setEditingFabric(null);
      setFormData({
        name: '',
        description: '',
        category_id: '',
        composition: '',
        weight: '',
        price: '',
        stock_quantity: '',
        image_url: '',
        texture_url: '',
        color_hex: '#ffffff',
        is_available: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFabric(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingFabric) {
        await fabricsAPI.update(editingFabric.fabric_id, formData);
      } else {
        await fabricsAPI.create(formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving fabric:', error);
      alert('Failed to save fabric');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fabricId) => {
    if (!window.confirm('Are you sure you want to delete this fabric?')) return;
    
    try {
      await fabricsAPI.delete(fabricId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting fabric:', error);
      alert('Failed to delete fabric');
    }
  };

  const handleToggleStatus = async (fabric) => {
    try {
      await fabricsAPI.update(fabric.fabric_id, {
        ...fabric,
        is_available: !fabric.is_available
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const filteredFabrics = fabrics.filter(fabric =>
    fabric.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.category_id === categoryId);
    return category?.name || 'Unknown';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="fabrics-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">All Fabrics ({fabrics.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search fabrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <Plus size={16} />
              Add Fabric
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFabrics.map(fabric => (
              <tr key={fabric.fabric_id}>
                <td>#{fabric.fabric_id}</td>
                <td>{fabric.name}</td>
                <td>{getCategoryName(fabric.category_id)}</td>
                <td>{formatCurrency(fabric.price)}</td>
                <td>{fabric.stock_quantity || 0}</td>
                <td>
                  <button 
                    onClick={() => handleToggleStatus(fabric)}
                    className={`status-badge ${fabric.is_available ? 'completed' : 'cancelled'}`}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontWeight: '600',
                      fontSize: '0.75rem'
                    }}
                    title="Click to toggle availability"
                  >
                    {fabric.is_available ? '✓ Available' : '✗ Unavailable'}
                  </button>
                </td>
                <td>
                  <button 
                    onClick={() => handleDelete(fabric.fabric_id)}
                    title="Delete"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFabrics.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <h3>No fabrics found</h3>
            <p>Add your first fabric to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingFabric ? 'Edit Fabric' : 'Add New Fabric'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Composition</label>
                    <input
                      type="text"
                      value={formData.composition}
                      onChange={(e) => setFormData({...formData, composition: e.target.value})}
                      placeholder="e.g., 100% Cotton"
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="e.g., 120 GSM"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Fabric description..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Image URL (Preview)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="fabric-image"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const fileUrl = `/Photos/${file.name}`;
                            setFormData({...formData, image_url: fileUrl});
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('fabric-image').click()}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--color-primary)',
                          color: '#0f1117',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.8rem'
                        }}
                      >
                        Browse
                      </button>
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        placeholder="/Photos/image.png"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Texture URL (3D Model)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="fabric-texture"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const fileUrl = `/Photos/${file.name}`;
                            setFormData({...formData, texture_url: fileUrl});
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('fabric-texture').click()}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--color-primary)',
                          color: '#0f1117',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.8rem'
                        }}
                      >
                        Browse
                      </button>
                      <input
                        type="text"
                        value={formData.texture_url}
                        onChange={(e) => setFormData({...formData, texture_url: e.target.value})}
                        placeholder="/Photos/texture.png"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({...formData, color_hex: e.target.value})}
                      style={{ height: '42px', width: '100%' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.is_available ? 'available' : 'unavailable'}
                      onChange={(e) => setFormData({...formData, is_available: e.target.value === 'available'})}
                      style={{
                        background: formData.is_available ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        borderColor: formData.is_available ? '#22c55e' : '#ef4444',
                        color: formData.is_available ? '#22c55e' : '#ef4444'
                      }}
                    >
                      <option value="available">✓ Available</option>
                      <option value="unavailable">✗ Not Available</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ 
                position: 'sticky', 
                bottom: 0, 
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                padding: '16px 24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #D4AF37, #B8942F)',
                    color: '#0f1117',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  {saving ? <><Loader2 size={16} className="spinner" /> Saving...</> : '💾 Save Fabric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FabricsManager;
