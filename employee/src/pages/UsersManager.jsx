import React, { useState, useEffect } from 'react';
import { Search, Users, Eye, Ban } from 'lucide-react';
import { usersAPI } from '../services/api';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await usersAPI.toggleActive(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="users-manager">
      <div className="data-table-container">
        <div className="table-header">
          <h2 className="table-title">All Users ({users.length})</h2>
          <div className="table-actions">
            <input
              type="text"
              className="search-input"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.user_id}>
                <td>#{user.user_id}</td>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span className={`status-badge ${user.is_active !== false ? 'completed' : 'cancelled'}`}>
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
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
                    <button 
                      onClick={() => handleToggleActive(user.user_id)}
                      title={user.is_active !== false ? 'Deactivate' : 'Activate'}
                      style={{ 
                        background: user.is_active !== false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', 
                        border: user.is_active !== false ? '1px solid #ef4444' : '1px solid #22c55e', 
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Ban size={16} color={user.is_active !== false ? '#ef4444' : '#22c55e'} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No users found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
