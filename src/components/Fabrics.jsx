import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { fabricsAPI } from '../services/api';

const Fabrics = ({ showNotification }) => {
  const [fabrics, setFabrics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fabricsResponse, categoriesResponse] = await Promise.all([
          fabricsAPI.getAll(),
          fabricsAPI.getCategories()
        ]);

        setFabrics(fabricsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Error fetching fabrics:', error);
        showNotification('Failed to load fabrics', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showNotification]);

  const filteredFabrics = activeFilter === 'all'
    ? fabrics
    : fabrics.filter(fabric => {
      const category = fabric.category_name || fabric.category || fabric.name.toLowerCase();
      return category.toLowerCase().includes(activeFilter.toLowerCase());
    });

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
  };

  const handleViewDetails = (fabricId) => {
    window.open(`/#product/${fabricId}`, '_blank');
  };

  if (loading) {
    return <div className="loading">Loading fabrics...</div>;
  }

  return (
    <section className="fabrics-section" id="fabrics">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Premium Collection</span>
          <h2 className="section-title">Explore Our Fabrics & Customization</h2>
          <div className="customization-steps">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">Select Fabric</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">Customize</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">Order</span>
            </div>
          </div>
        </div>

        <div className="fabric-filters">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            All Fabrics
          </button>
          {categories.map(category => (
            <button
              key={category.category_id}
              className={`filter-btn ${activeFilter === category.name ? 'active' : ''}`}
              onClick={() => handleFilterClick(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="fabrics-grid">
          {filteredFabrics.map(fabric => (
            <div 
              className="fabric-card" 
              key={fabric.fabric_id} 
              onClick={() => handleViewDetails(fabric.fabric_id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="fabric-image">
                {fabric.category_name && <div className="fabric-badge">{fabric.category_name}</div>}
                <div className="fabric-placeholder" style={{ background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' }}>
                  {fabric.image_url ? (
                    <img
                      src={`http://localhost:5001${fabric.image_url}`}
                      alt={fabric.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Sparkles size={60} />
                  )}
                </div>
              </div>
              <div className="fabric-info">
                <h3>{fabric.name}</h3>
                <p className="fabric-composition">{fabric.composition}</p>
                <div className="fabric-details">
                  <span className="fabric-weight">{fabric.weight}</span>
                  <span className="fabric-price">₹{fabric.price}/m</span>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleViewDetails(fabric.fabric_id)}
                >
                  <span>View Details</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Fabrics;