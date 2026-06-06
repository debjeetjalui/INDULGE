import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCog, X, Loader2, Shield } from 'lucide-react';
import { employeesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EmployeesManager = () => {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'employee',
    phone: '',
    is_active: true,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchEmployees();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        username: employee.username || '',
        email: employee.email || '',
        password: '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        role: employee.role || 'employee',
        phone: employee.phone || '',
        is_active: employee.is_active ?? true,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'employee',
        phone: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingEmployee) {
        await employeesAPI.update(editingEmployee.employee_id, formData);
      } else {
        await employeesAPI.create(formData);
      }
      await fetchEmployees();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(error.response?.data?.error || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employeeId) => {
    const emp = employees.find(e => e.employee_id === employeeId);
    if (emp?.role === 'admin') {
      alert('Cannot delete admin account');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeesAPI.delete(employeeId);
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const filteredEmployees = employees.filter(emp =>
    emp.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'status-badge processing';
      case 'manager': return 'status-badge confirmed';
      case 'delivery_boy': return 'status-badge shipped';
      default: return 'status-badge pending';
    }
  };

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <Shield size={64} />
        <h3>Access Denied</h3>
        <p>Only administrators can access employee management.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="employees-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">All Employees ({employees.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <Plus size={16} />
              Add Employee
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.employee_id}>
                <td>#{emp.employee_id}</td>
                <td>{emp.first_name} {emp.last_name}</td>
                <td>{emp.email}</td>
                <td>
                  <span className={getRoleBadgeClass(emp.role)} style={{ textTransform: 'capitalize' }}>
                    {emp.role === 'delivery_boy' ? 'Delivery Boy' : emp.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${emp.is_active !== false ? 'completed' : 'cancelled'}`}>
                    {emp.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(emp.last_login)}</td>
                <td>
                  <div className="action-btns">
                    <button 
                      onClick={() => handleOpenModal(emp)}
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
                      <Edit size={14} color="#3b82f6" />
                    </button>
                    {emp.role !== 'admin' && (
                      <button 
                        onClick={() => handleDelete(emp.employee_id)}
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
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div className="empty-state">
            <UserCog size={48} />
            <h3>No employees found</h3>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>{editingEmployee ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <input type="password" required={!editingEmployee} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="employee">Employee</option>
                      <option value="delivery_boy">Delivery Boy</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spinner" /> Saving...</> : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManager;
