import React, { useState, useEffect } from 'react';
import { Package, Ruler, Droplet, Star, ShoppingBag, ShoppingCart, Heart, Share2, Loader2, AlertCircle, Sparkles, Check, Plus, Minus, X, Trash2, ZoomIn, ZoomOut, MessageSquare, Send, User } from 'lucide-react';
import { fabricsAPI, cartAPI, reviewsAPI } from '../services/api';

const ProductDetails = ({ fabricId, showNotification, onStartVisualization }) => {
  const [fabric, setFabric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchFabricDetails = async () => {
      if (!fabricId) {
        setError('No fabric ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fabricsAPI.getById(fabricId);
        setFabric(response.data);
      } catch (err) {
        console.error('Error fetching fabric details:', err);
        setError('Failed to load fabric details');
        if (showNotification) {
          showNotification('Failed to load fabric details', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFabricDetails();
    fetchReviews();
  }, [fabricId, showNotification]);

  const fetchReviews = async () => {
    if (!fabricId) return;
    try {
      const response = await reviewsAPI.getByFabric(fabricId);
      setReviews(response.data.reviews || []);
      setAvgRating(response.data.avgRating || 0);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (showNotification) showNotification('Please login to leave a review', 'warning');
      return;
    }
    if (reviewRating === 0) {
      if (showNotification) showNotification('Please select a star rating', 'warning');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewsAPI.submit({ fabric_id: fabricId, rating: reviewRating, review_text: reviewText });
      if (showNotification) showNotification('Review submitted!', 'success');
      setReviewRating(0);
      setReviewText('');
      await fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      if (showNotification) showNotification('Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsAPI.delete(reviewId);
      if (showNotification) showNotification('Review deleted', 'success');
      await fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
    }
  };

  const fetchCartItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoadingCart(true);
      const response = await cartAPI.get();
      setCartItems(response.data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoadingCart(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: fabric?.name || 'INDULGE Fabric',
        text: `Check out this premium fabric: ${fabric?.name}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      if (showNotification) {
        showNotification('Link copied to clipboard!', 'success');
      }
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      if (showNotification) {
        showNotification('Please login to add items to cart', 'warning');
      }
      return;
    }

    try {
      setAddingToCart(true);
      
      const response = await cartAPI.add({
        fabric_id: fabric.fabric_id,
        quantity: quantity
      });
      
      setAddedToCart(true);
      await fetchCartItems();
      localStorage.setItem('cartUpdated', Date.now().toString());
      if (showNotification) {
        showNotification(`${quantity}m of ${fabric.name} added to cart!`, 'success');
      }
    } catch (err) {
      console.error('[CART DEBUG] Error:', err);
      console.error('[CART DEBUG] Error response:', err.response?.data);
      console.error('[CART DEBUG] Error status:', err.response?.status);
      if (showNotification) {
        showNotification('Failed to add to cart', 'error');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleRemoveFromCart = async (cartId) => {
    try {
      await cartAPI.remove(cartId);
      await fetchCartItems();
      if (showNotification) {
        showNotification('Item removed from cart', 'success');
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const handleOpenCart = async () => {
    await fetchCartItems();
    setShowCartDrawer(true);
  };

  const handleCustomize = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    window.open(`${baseUrl}#customization/${fabric?.fabric_id}`, '_blank', 'noopener,noreferrer');
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + ((item.fabric_price || 0) * (item.quantity || 1));
    }, 0);
  };

  if (loading) {
    return (
      <div className="product-details-page">
        <div className="product-loading">
          <Loader2 size={48} className="spinning" />
          <p>Loading fabric details...</p>
        </div>
      </div>
    );
  }

  if (error || !fabric) {
    return (
      <div className="product-details-page">
        <div className="product-error">
          <AlertCircle size={48} />
          <h2>Fabric Not Found</h2>
          <p>{error || 'The requested fabric could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <header className="product-header">
        <div className="container">
          <div className="product-header-brand">
            <h1 className="brand-logo">INDULGE</h1>
            <span className="brand-tagline">Bespoke Tailoring</span>
          </div>
          <div className="product-header-actions">
            <button className="btn-icon" onClick={handleShare} title="Share">
              <Share2 size={20} />
            </button>
            <button 
              className={`btn-icon btn-cart-header ${cartItems.length > 0 ? 'has-items' : ''}`}
              onClick={handleOpenCart}
              title="View Cart"
            >
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {showCartDrawer && (
        <div className="cart-drawer-overlay" onClick={() => setShowCartDrawer(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h2><ShoppingCart size={24} /> Your Cart</h2>
              <button className="btn-close" onClick={() => setShowCartDrawer(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="cart-drawer-content">
              {loadingCart ? (
                <div className="cart-loading">
                  <Loader2 size={32} className="spinning" />
                  <p>Loading cart...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={48} />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div className="cart-item" key={item.cart_id}>
                      <div className="cart-item-image">
                        {item.image_url ? (
                          <img src={`http://localhost:5001${item.image_url}`} alt={item.fabric_name} />
                        ) : (
                          <div className="cart-item-placeholder"><Sparkles size={20} /></div>
                        )}
                      </div>
                      <div className="cart-item-details">
                        <h4>{item.fabric_name || 'Fabric'}</h4>
                        <p className="cart-item-qty">Qty: {item.quantity}m</p>
                        <p className="cart-item-price">₹{(item.fabric_price || 0) * (item.quantity || 1)}</p>
                      </div>
                      <button 
                        className="cart-item-remove" 
                        onClick={() => handleRemoveFromCart(item.cart_id)}
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="cart-total-amount">₹{getCartTotal()}</span>
                </div>
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => {
                    setShowCartDrawer(false);
                    window.location.hash = '#checkout';
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showImageZoom && fabric?.image_url && (
        <div className="image-zoom-overlay" onClick={() => { setShowImageZoom(false); setZoomLevel(1); }}>
          <div className="image-zoom-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="zoom-close-btn" 
              onClick={() => { setShowImageZoom(false); setZoomLevel(1); }}
            >
              <X size={24} />
            </button>
            <div className="zoom-controls">
              <button 
                className="zoom-btn" 
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut size={20} />
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button 
                className="zoom-btn" 
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn size={20} />
              </button>
            </div>
            <div className="zoom-image-container">
              <img
                src={`http://localhost:5001${fabric.image_url}`}
                alt={fabric.name}
                style={{ transform: `scale(${zoomLevel})` }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
      <main className="product-main">
        <div className="container">
          <div className="product-layout">
            <div className="product-gallery">
              <div className="product-main-image">
                {fabric.category_name && (
                  <div className="product-badge">{fabric.category_name}</div>
                )}
                <div className="product-image-wrapper" onClick={() => setShowImageZoom(true)}>
                  {fabric.image_url ? (
                    <img
                      src={`http://localhost:5001${fabric.image_url}`}
                      alt={fabric.name}
                    />
                  ) : (
                    <div className="product-placeholder">
                      <Sparkles size={80} />
                      <span>Premium Fabric</span>
                    </div>
                  )}
                  <div className="image-zoom-hint">
                    <ZoomIn size={18} />
                    <span>Click to zoom</span>
                  </div>
                </div>
              </div>
              
              <div className="product-gallery-actions">
                <div className="add-to-cart-row">
                  <button 
                    className={`btn btn-lg btn-add-cart ${addedToCart ? 'btn-added' : 'btn-outline'}`}
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <Loader2 size={20} className="spinning" />
                    ) : addedToCart ? (
                      <Check size={20} />
                    ) : (
                      <ShoppingCart size={20} />
                    )}
                    <span>{addedToCart ? 'Added' : 'Cart'}</span>
                  </button>
                  <div className="qty-inline">
                    <button 
                      className="qty-btn-inline" 
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-value-inline">{quantity}m</span>
                    <button 
                      className="qty-btn-inline" 
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 10}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleCustomize}>
                  <ShoppingBag size={20} />
                  <span>Customize Now</span>
                </button>
              </div>
            </div>

            <div className="product-info">
              <div className="product-title-section">
                <h1 className="product-name">{fabric.name}</h1>
                <div className="product-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={18} className={star <= Math.round(avgRating) ? 'star-filled' : 'star-empty'} style={{ fill: star <= Math.round(avgRating) ? '#D4AF37' : 'none', color: star <= Math.round(avgRating) ? '#D4AF37' : '#ccc' }} />
                  ))}
                  <span className="rating-text">{avgRating > 0 ? `${avgRating.toFixed(1)} (${totalReviews} review${totalReviews !== 1 ? 's' : ''})` : 'No reviews yet'}</span>
                </div>
              </div>

              <div className="product-price-section">
                <span className="product-price">₹{fabric.price}</span>
                <span className="price-unit">/meter</span>
              </div>

              {fabric.description && (
                <div className="product-description">
                  <p>{fabric.description}</p>
                </div>
              )}

              <div className="product-specs">
                <h3>Specifications</h3>
                <div className="specs-grid">
                  {fabric.composition && (
                    <div className="spec-item">
                      <div className="spec-icon">
                        <Package size={20} />
                      </div>
                      <div className="spec-content">
                        <span className="spec-label">Composition</span>
                        <span className="spec-value">{fabric.composition}</span>
                      </div>
                    </div>
                  )}
                  {fabric.weight && (
                    <div className="spec-item">
                      <div className="spec-icon">
                        <Ruler size={20} />
                      </div>
                      <div className="spec-content">
                        <span className="spec-label">Weight</span>
                        <span className="spec-value">{fabric.weight}</span>
                      </div>
                    </div>
                  )}
                  {fabric.width && (
                    <div className="spec-item">
                      <div className="spec-icon">
                        <Ruler size={20} />
                      </div>
                      <div className="spec-content">
                        <span className="spec-label">Width</span>
                        <span className="spec-value">{fabric.width}</span>
                      </div>
                    </div>
                  )}
                  {fabric.color && (
                    <div className="spec-item">
                      <div className="spec-icon">
                        <Droplet size={20} />
                      </div>
                      <div className="spec-content">
                        <span className="spec-label">Color</span>
                        <span className="spec-value">{fabric.color}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {fabric.care_instructions && (
                <div className="product-care">
                  <h3>Care Instructions</h3>
                  <p>{fabric.care_instructions}</p>
                </div>
              )}

              <div className="product-features">
                <div className="feature-tag">
                  <Star size={16} />
                  <span>Premium Quality</span>
                </div>
                <div className="feature-tag">
                  <Package size={16} />
                  <span>Free Shipping</span>
                </div>
                <div className="feature-tag">
                  <Ruler size={16} />
                  <span>Custom Tailoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '48px', padding: '32px',
          background: 'var(--color-surface, #fff)',
          borderRadius: '16px', border: '1px solid var(--color-border, #e0e0e0)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <MessageSquare size={24} color="var(--color-primary, #5d4037)" />
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-text, #2c2c2c)', margin: 0 }}>
              Customer Reviews
            </h3>
            {totalReviews > 0 && (
              <span style={{
                background: 'var(--color-accent-light, #f5e6d3)', color: 'var(--color-primary, #5d4037)',
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600'
              }}>{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
            )}
          </div>

          {totalReviews > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px',
              padding: '16px 20px', background: 'var(--color-bg-secondary, #f5f5f5)', borderRadius: '12px'
            }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary, #5d4037)' }}>
                {avgRating.toFixed(1)}
              </span>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={20} style={{ fill: s <= Math.round(avgRating) ? '#D4AF37' : 'none', color: s <= Math.round(avgRating) ? '#D4AF37' : '#ccc' }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #6b6b6b)' }}>
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          <div style={{
            padding: '20px', marginBottom: '24px',
            border: '1px solid var(--color-border, #e0e0e0)', borderRadius: '12px',
            background: 'var(--color-bg, #fafafa)'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text, #2c2c2c)' }}>
              Write a Review
            </h4>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s} size={28}
                  style={{
                    cursor: 'pointer',
                    fill: s <= (hoverRating || reviewRating) ? '#D4AF37' : 'none',
                    color: s <= (hoverRating || reviewRating) ? '#D4AF37' : '#ccc',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => setReviewRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
              {reviewRating > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                </span>
              )}
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your experience with this fabric... (optional)"
              rows={3}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: '1px solid var(--color-border, #e0e0e0)',
                fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit',
                background: 'var(--color-surface, #fff)', color: 'var(--color-text, #2c2c2c)',
                outline: 'none', marginBottom: '12px', boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview || reviewRating === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: reviewRating > 0 ? 'var(--color-primary, #5d4037)' : '#ccc',
                color: '#fff', fontSize: '0.9rem', fontWeight: '600',
                cursor: reviewRating > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              {submittingReview ? <Loader2 size={18} className="spinning" /> : <Send size={18} />}
              Submit Review
            </button>
          </div>

          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-light, #9e9e9e)', padding: '20px 0' }}>
              No reviews yet. Be the first to review this fabric!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map(review => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const isOwn = currentUser.id === review.user_id || currentUser.user_id === review.user_id;
                return (
                  <div key={review.review_id} style={{
                    padding: '16px 20px', borderRadius: '12px',
                    border: '1px solid var(--color-border, #e0e0e0)',
                    background: isOwn ? 'rgba(212,175,55,0.04)' : 'var(--color-surface, #fff)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'var(--color-accent-light, #f5e6d3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <User size={18} color="var(--color-primary, #5d4037)" />
                        </div>
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text, #2c2c2c)' }}>
                            {review.first_name ? `${review.first_name} ${review.last_name || ''}`.trim() : review.username}
                            {isOwn && <span style={{ color: 'var(--color-gold, #c9a961)', marginLeft: '6px', fontSize: '0.75rem' }}>(You)</span>}
                          </span>
                          <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={14} style={{ fill: s <= review.rating ? '#D4AF37' : 'none', color: s <= review.rating ? '#D4AF37' : '#ddd' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light, #9e9e9e)' }}>
                          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteReview(review.review_id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#f44336', padding: '4px', borderRadius: '4px'
                            }}
                            title="Delete your review"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    {review.review_text && (
                      <p style={{ margin: '8px 0 0 46px', fontSize: '0.88rem', lineHeight: '1.55', color: 'var(--color-text-secondary, #6b6b6b)' }}>
                        {review.review_text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="product-footer">
        <div className="container">
          <p>&copy; 2026 INDULGE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetails;
