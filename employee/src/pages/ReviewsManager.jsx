import React, { useState, useEffect } from 'react';
import { Star, Trash2, Search, Loader2, MessageSquare } from 'lucide-react';
import { reviewsAPI } from '../services/api';

const ReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getAll();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewsAPI.delete(reviewId);
      setReviews(prev => prev.filter(r => r.review_id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const filtered = reviews.filter(r => {
    const matchesSearch = searchQuery === '' ||
      (r.fabric_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.review_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = filterRating === 0 || r.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="reviews-manager">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Loader2 size={40} className="spinning" style={{ color: 'var(--color-primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-manager">
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-primary)' }}>
            <MessageSquare size={28} /> Product Reviews
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {reviews.length} total reviews • Average rating: {avgRating} ★
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by user, fabric, or review text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', fontSize: '0.9rem',
              background: 'var(--color-surface)', color: 'var(--color-text-primary)',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Filter:</span>
          {[0,5,4,3,2,1].map(r => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                background: filterRating === r ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filterRating === r ? '#000' : 'var(--color-text-secondary)',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500'
              }}
            >
              {r === 0 ? 'All' : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Fabric</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Rating</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Review</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No reviews found
                </td>
              </tr>
            ) : filtered.map(review => (
              <tr key={review.review_id}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                    {review.first_name ? `${review.first_name} ${review.last_name || ''}`.trim() : review.username}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{review.email}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{review.fabric_name}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1px' }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={15} style={{ fill: s <= review.rating ? '#D4AF37' : 'none', color: s <= review.rating ? '#D4AF37' : 'var(--color-border)' }} />
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', maxWidth: '300px' }}>
                  {review.review_text ? (
                    review.review_text.length > 100 ? review.review_text.substring(0, 100) + '...' : review.review_text
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No text</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleDelete(review.review_id)}
                    className="btn-action btn-delete"
                    title="Delete review"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewsManager;
