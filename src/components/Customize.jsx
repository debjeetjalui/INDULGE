import React from 'react';
import { Paperclip, Scissors, Ruler, Eye, MousePointerClick, ShoppingBag, ArrowRight } from 'lucide-react';

const Customize = ({ onStartVisualization }) => {

  const handleNewTabCustomization = (e) => {
    e.preventDefault();
    window.open(window.location.href + '#visualization', '_blank', 'noopener,noreferrer');
  };

  const gold = (text) => (
    <span style={{ 
      background: 'linear-gradient(135deg, #D4AF37, #F5E6A3, #D4AF37)', 
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      fontWeight: '700'
    }}>{text}</span>
  );

  const accent = (text, color) => (
    <span style={{ color, fontWeight: '600' }}>{text}</span>
  );

  const steps = [
    {
      icon: Paperclip,
      number: '01',
      title: 'Choose Your Fabric',
      color: '#D4AF37',
      gradient: 'linear-gradient(135deg, #D4AF37, #c9a020)',
      description: <>Browse our {accent('premium collection', '#F5E6A3')} of fabrics — from {accent('Egyptian Cotton', '#c9a96e')} to {accent('Italian Linen', '#a8c4a0')}.</>
    },
    {
      icon: Scissors,
      number: '02',
      title: 'Select Your Style',
      color: '#60a5fa',
      gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      description: <>Pick your garment — {accent('shirts', '#93c5fd')}, {accent('trousers', '#c4b5fd')}, {accent('suits', '#fda4af')} or {accent('blazers', '#fdba74')}. Tailored to perfection.</>
    },
    {
      icon: Ruler,
      number: '03',
      title: 'Add Measurements',
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, #9333ea, #a855f7)',
      description: <>Enter measurements or book a {accent('free home visit', '#c4b5fd')}. We ensure a {accent('perfect fit', '#86efac')} every time.</>
    },
    {
      icon: MousePointerClick,
      number: '04',
      title: 'Customize Details',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      description: <>Choose {accent('collar', '#6ee7b7')}, {accent('cuffs', '#93c5fd')}, {accent('buttons', '#fde047')}, {accent('pockets', '#5eead4')} and more. {accent('Every detail', '#F5E6A3')} is yours.</>
    },
    {
      icon: Eye,
      number: '05',
      title: 'Preview in 3D',
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)',
      description: <>See your garment in our {accent('2D visualizer', '#fda4af')} with your chosen fabric {accent('before ordering', '#86efac')}.</>
    },
    {
      icon: ShoppingBag,
      number: '06',
      title: 'Place Your Order',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
      description: <>Review choices and {accent('place your order', '#fde047')}. Crafted with care and {accent('delivered to your door', '#86efac')}.</>
    }
  ];

  return (
    <section className="customize-section" id="customize">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Design Your Garment</span>
          <h2 className="section-title">How to Customize Your Shirt</h2>
          <p className="section-description">Follow these simple steps to create a garment that's uniquely yours</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '48px'
        }}>
          {steps.map((step) => {
            const IconComp = step.icon;
            return (
              <div key={step.number} style={{
                background: '#3e2723',
                borderRadius: '18px',
                padding: '0',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'default',
                boxShadow: `0 4px 25px ${step.color}15`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 12px 40px ${step.color}35`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 25px ${step.color}15`;
              }}
              >
                <div style={{
                  height: '4px',
                  background: step.gradient,
                  width: '100%'
                }} />

                <div style={{ padding: '24px 22px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{
                      fontSize: '42px',
                      fontWeight: '800',
                      background: step.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                      letterSpacing: '-2px',
                      filter: `drop-shadow(0 0 8px ${step.color}50)`
                    }}>{step.number}</span>

                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: `${step.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${step.color}30`
                    }}>
                      <IconComp size={24} color={step.color} />
                    </div>
                  </div>

                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    marginBottom: '10px',
                    color: '#ffffff',
                    letterSpacing: '0.3px'
                  }}>{step.title}</h4>

                  <p style={{
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    color: '#9ca3af',
                    margin: 0
                  }}>{step.description}</p>
                </div>

                <div style={{
                  position: 'absolute',
                  top: 0, right: 0,
                  width: '120px', height: '120px',
                  background: `radial-gradient(circle at top right, ${step.color}12, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'flex', gap: '40px', alignItems: 'center'
        }}>
          <div style={{
            flex: '0 0 45%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '24px'
          }}>
            <div style={{
              borderRadius: '18px', overflow: 'hidden',
              border: '2px solid rgba(212,175,55,0.25)',
              boxShadow: '0 12px 50px rgba(0,0,0,0.4), 0 0 40px rgba(212,175,55,0.08)',
              position: 'relative'
            }}>
              <img
                src="/src/Photos/Customization Builder.png"
                alt="Garment Visualizer"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(62,39,35,0.5) 0%, transparent 40%)',
                pointerEvents: 'none'
              }} />
            </div>
            <button
              className="btn btn-primary visualizer-btn"
              onClick={handleNewTabCustomization}
            >
              <span>Start Visualizing</span>
              <ArrowRight size={20} />
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <span style={{
              fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px',
              color: '#D4AF37', fontWeight: '600', marginBottom: '12px', display: 'block'
            }}>Our Visualizer</span>
            <h3 style={{
              fontSize: '1.75rem', fontWeight: '700',
              color: 'var(--color-text, #2c2c2c)', marginBottom: '16px', lineHeight: 1.3
            }}>See Your Design Come to Life</h3>
            <p style={{
              fontSize: '0.95rem', lineHeight: '1.7',
              color: 'var(--color-text-secondary, #6b6b6b)', marginBottom: '24px'
            }}>
              Our advanced visualizer lets you preview your garment with your chosen fabric in real time. 
              Experiment with different styles, fabrics, and customizations — all before placing your order. 
              No guesswork, no surprises.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Real-Time Fabric Preview', desc: 'See how fabrics drape and look on your garment instantly', color: '#D4AF37' },
                { label: 'Style Customization', desc: 'Collar, cuffs, buttons, pockets — customize every detail', color: '#60a5fa' },
                { label: 'Mix & Match', desc: 'Try different combinations until you find the perfect look', color: '#a855f7' },
                { label: 'Instant Results', desc: 'Changes appear immediately — no waiting or reloading', color: '#10b981' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: item.color, marginTop: '6px', flexShrink: 0
                  }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text, #2c2c2c)' }}>{item.label}</strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #6b6b6b)', margin: '2px 0 0' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Customize;