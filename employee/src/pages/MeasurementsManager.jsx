import React, { useState, useEffect } from 'react';
import { Search, Ruler, Eye, X } from 'lucide-react';
import { measurementsAPI } from '../services/api';

const measurementFields = [
  { key: 'neck_circumference', label: 'Neck' },
  { key: 'chest_circumference', label: 'Chest' },
  { key: 'waist_circumference', label: 'Waist' },
  { key: 'hip_circumference', label: 'Hip' },
  { key: 'shoulder_width', label: 'Shoulder Width' },
  { key: 'sleeve_length', label: 'Sleeve Length' },
  { key: 'armhole_depth', label: 'Armhole Depth' },
  { key: 'torso_length', label: 'Torso Length' },
  { key: 'inseam_length', label: 'Inseam' },
  { key: 'thigh_circumference', label: 'Thigh' },
  { key: 'knee_circumference', label: 'Knee' },
  { key: 'ankle_circumference', label: 'Ankle' },
];

const MeasurementsManager = () => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    try {
      const response = await measurementsAPI.getAll();
      setMeasurements(response.data || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const formatMeasurement = (value) => {
    if (!value || value === 0) return '-';
    return `${parseFloat(value).toFixed(2)}`;
  };

  const filteredMeasurements = measurements.filter(m =>
    m.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="measurements-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">User Measurements ({measurements.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Neck</th>
              <th>Chest</th>
              <th>Waist</th>
              <th>Hip</th>
              <th>Shoulder</th>
              <th>Sleeve</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeasurements.map(m => (
              <tr key={m.measurement_id}>
                <td>
                  <div>
                    <div>{m.user_name || (m.first_name ? `${m.first_name} ${m.last_name || ''}`.trim() : `User #${m.user_id}`)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{m.email}</div>
                  </div>
                </td>
                <td>{formatMeasurement(m.neck_circumference)}</td>
                <td>{formatMeasurement(m.chest_circumference)}</td>
                <td>{formatMeasurement(m.waist_circumference)}</td>
                <td>{formatMeasurement(m.hip_circumference)}</td>
                <td>{formatMeasurement(m.shoulder_width)}</td>
                <td>{formatMeasurement(m.sleeve_length)}</td>
                <td>{formatDate(m.updated_at)}</td>
                <td>
                  <button 
                    onClick={() => setSelectedMeasurement(m)}
                    title="View All Measurements"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMeasurements.length === 0 && (
          <div className="empty-state">
            <Ruler size={48} />
            <h3>No measurements found</h3>
          </div>
        )}
      </div>

      {selectedMeasurement && (
        <div className="modal-overlay" onClick={() => setSelectedMeasurement(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                Measurements - {selectedMeasurement.user_name || 
                  `${selectedMeasurement.first_name || ''} ${selectedMeasurement.last_name || ''}`.trim() || 
                  `User #${selectedMeasurement.user_id}`}
              </h3>
              <button 
                onClick={() => setSelectedMeasurement(null)} 
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
                <X size={18} color="#ef4444" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '16px',
                padding: '8px 0'
              }}>
                {measurementFields.map(field => (
                  <div key={field.key} style={{
                    background: 'var(--color-background)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                      {selectedMeasurement[field.key] ? `${parseFloat(selectedMeasurement[field.key]).toFixed(2)} cm` : '-'}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'var(--color-background)', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)'
              }}>
                <strong>Unit:</strong> cm | 
                <strong> Updated:</strong> {formatDate(selectedMeasurement.updated_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementsManager;
