import React, { useState, useEffect } from 'react';
import { Ruler, Save, Edit3, X, Check, Info } from 'lucide-react';
import { measurementsAPI } from '../services/api';

const measurementFields = [
    { key: 'neck_circumference', label: 'Neck', unit: 'cm' },
    { key: 'chest_circumference', label: 'Chest', unit: 'cm' },
    { key: 'waist_circumference', label: 'Waist', unit: 'cm' },
    { key: 'hip_circumference', label: 'Hip', unit: 'cm' },
    { key: 'shoulder_width', label: 'Shoulder Width', unit: 'cm' },
    { key: 'sleeve_length', label: 'Sleeve Length', unit: 'cm' },
    { key: 'armhole_depth', label: 'Armhole Depth', unit: 'cm' },
    { key: 'torso_length', label: 'Torso Length', unit: 'cm' },
    { key: 'inseam_length', label: 'Inseam', unit: 'cm' },
    { key: 'thigh_circumference', label: 'Thigh', unit: 'cm' },
    { key: 'knee_circumference', label: 'Knee', unit: 'cm' },
    { key: 'ankle_circumference', label: 'Ankle', unit: 'cm' },
];

const MyMeasurements = ({ showNotification }) => {
    const [measurements, setMeasurements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchMeasurements();
    }, []);

    const fetchMeasurements = async () => {
        try {
            const response = await measurementsAPI.get();
            if (response.data && response.data.length > 0) {
                const data = response.data[0];
                setMeasurements(data);
                setFormData(data);
                setNotes(data.notes || '');
            }
        } catch (error) {
            console.error('Error fetching measurements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value === '' ? null : parseFloat(value)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await measurementsAPI.save({ ...formData, notes });
            setMeasurements({ ...formData, notes });
            setEditing(false);
            showNotification?.('Measurements saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving measurements:', error);
            showNotification?.('Failed to save measurements', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(measurements || {});
        setNotes(measurements?.notes || '');
        setEditing(false);
    };

    const hasMeasurements = measurements && Object.keys(measurements).some(
        key => measurementFields.some(f => f.key === key) && measurements[key]
    );

    if (loading) {
        return (
            <div className="measurements-section">
                <div className="measurements-loading">
                    <div className="spinner"></div>
                    <p>Loading measurements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="measurements-section">
            <div className="measurements-header">
                <h2><Ruler size={24} /> My Measurements</h2>
                {!editing ? (
                    <button
                        className="measurements-edit-btn"
                        onClick={() => setEditing(true)}
                    >
                        <Edit3 size={16} />
                        {hasMeasurements ? 'Edit' : 'Add Measurements'}
                    </button>
                ) : (
                    <div className="measurements-actions">
                        <button
                            className="measurements-save-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            className="measurements-cancel-btn"
                            onClick={handleCancel}
                        >
                            <X size={16} />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {!hasMeasurements && !editing ? (
                <div className="measurements-empty">
                    <Ruler size={48} />
                    <h3>No measurements yet</h3>
                    <p>Add your body measurements for perfect fitting garments</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setEditing(true)}
                    >
                        <Ruler size={18} />
                        Add Measurements
                    </button>
                </div>
            ) : (
                <>
                    <div className="measurements-info">
                        <Info size={16} />
                        <span>All measurements are in centimeters (cm)</span>
                    </div>

                    <div className="measurements-grid">
                        {measurementFields.map(field => (
                            <div key={field.key} className="measurement-item">
                                <label>
                                    <span className="measurement-icon">{field.icon}</span>
                                    {field.label}
                                </label>
                                {editing ? (
                                    <div className="measurement-input-wrapper">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="300"
                                            value={formData[field.key] || ''}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            placeholder="0.0"
                                        />
                                        <span className="measurement-unit">{field.unit}</span>
                                    </div>
                                ) : (
                                    <div className="measurement-value">
                                        {measurements?.[field.key] ? (
                                            <>
                                                <span className="value">{measurements[field.key]}</span>
                                                <span className="unit">{field.unit}</span>
                                                <Check size={14} className="check-icon" />
                                            </>
                                        ) : (
                                            <span className="not-set">Not set</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="measurements-notes">
                        <label>Notes</label>
                        {editing ? (
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any special fitting preferences or notes..."
                                rows={3}
                            />
                        ) : (
                            <p className="notes-display">
                                {measurements?.notes || 'No notes added'}
                            </p>
                        )}
                    </div>

                    {measurements?.updated_at && (
                        <p className="measurements-updated">
                            Last updated: {new Date(measurements.updated_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default MyMeasurements;
