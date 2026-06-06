import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Box, X, Loader2 } from 'lucide-react';
import { modelsAPI } from '../services/api';

const ModelsManager = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'shirt',
    description: '',
    model_url: '',
    thumbnail_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await modelsAPI.getAll();
      setModels(response.data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (model = null) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name || '',
        type: model.type || 'shirt',
        description: model.description || '',
        model_url: model.model_url || '',
        thumbnail_url: model.thumbnail_url || '',
        is_active: model.is_active ?? true,
      });
    } else {
      setEditingModel(null);
      setFormData({
        name: '',
        type: 'shirt',
        description: '',
        model_url: '',
        thumbnail_url: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingModel) {
        await modelsAPI.update(editingModel.id, formData);
      } else {
        await modelsAPI.create(formData);
      }
      await fetchModels();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Failed to save model');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (modelId) => {
    if (!window.confirm('Are you sure you want to delete this model?')) return;
    try {
      await modelsAPI.delete(modelId);
      await fetchModels();
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model');
    }
  };

  const filteredModels = models.filter(model =>
    model.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="models-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">3D Models ({models.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <Plus size={16} />
              Add Model
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Model URL</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.map(model => (
              <tr key={model.id}>
                <td>#{model.id}</td>
                <td>{model.name}</td>
                <td style={{ textTransform: 'capitalize' }}>{model.type}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{model.model_url}</td>
                <td>
                  <span className={`status-badge ${model.is_active !== false ? 'completed' : 'cancelled'}`}>
                    {model.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleOpenModal(model)}
                      title="Edit"
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
                      <Edit size={16} color="#3b82f6" />
                    </button>
                    <button 
                      onClick={() => handleDelete(model.id)}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredModels.length === 0 && (
          <div className="empty-state">
            <Box size={48} />
            <h3>No models found</h3>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingModel ? 'Edit Model' : 'Add New Model'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="shirt">Shirt</option>
                      <option value="suit">Suit</option>
                      <option value="tshirt">T-Shirt</option>
                      <option value="jacket">Jacket</option>
                      <option value="trousers">Trousers</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label>Model URL (GLB file) *</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept=".glb,.gltf"
                        id="model-file"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const fileUrl = `/models/${formData.type || 'shirt'}/${file.name}`;
                            setFormData({...formData, model_url: fileUrl});
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById('model-file').click()}
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
                        required 
                        value={formData.model_url} 
                        onChange={(e) => setFormData({...formData, model_url: e.target.value})} 
                        placeholder="/models/type/filename.glb"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spinner" /> Saving...</> : 'Save Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsManager;
