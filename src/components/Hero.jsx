import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, CheckCircle, Scissors } from 'lucide-react';

const Hero = ({ onCustomizeClick }) => {
  const [heroContent, setHeroContent] = useState({
    label: 'Premium Custom Tailoring',
    title: 'Crafted to Perfection,<br />Tailored for You',
    description: 'Experience the art of bespoke tailoring with our premium fabric collection, 3D garment visualization, and complimentary home measurement service.',
    ctaText: 'Explore Fabrics',
    secondaryCtaText: 'Book Free Measurement',
    features: [
      { icon: 'CheckCircle', text: 'Custom Tailoring' },
      { icon: 'CheckCircle', text: '3D Preview' },
      { icon: 'CheckCircle', text: 'Premium Fabrics' }
    ],
    mediaSrc: '/src/Photos/Logo 3.png',
    mediaAlt: 'Premium Tailoring'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleExploreClick = (e) => {
    e.preventDefault();
    const target = document.getElementById('fabrics');
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const handleBookClick = (e) => {
    e.preventDefault();
    const target = document.getElementById('booking');
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading hero section...</div>;
  }

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <div className="hero-text">
          <span className="hero-label">{heroContent.label}</span>
          <h1 className="hero-title" dangerouslySetInnerHTML={{__html: heroContent.title}}></h1>
          <p className="hero-description">{heroContent.description}</p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={handleExploreClick}>
              <span>{heroContent.ctaText}</span>
              <ArrowRight size={20} />
            </button>
            <button className="btn btn-secondary" onClick={handleBookClick}>
              <span>{heroContent.secondaryCtaText}</span>
              <Calendar size={20} />
            </button>
          </div>
          <div className="hero-features">
            {heroContent.features.map((feature, index) => (
              <div className="feature-item" key={index}>
                <CheckCircle size={20} />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-media">
          <div className="media-container">
            <img src={heroContent.mediaSrc} alt={heroContent.mediaAlt} className="hero-media-content" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;