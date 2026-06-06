import React from 'react';

const Features = () => {
  const features = [
    {
      img: <img src="/src/Photos/Precise Measurements.png" alt="Precise Measurements" className="feature-img" width="390" height="290" />,
      title: 'Precise Measurements',
      description: '30+ body measurements taken by expert staff at your home. First visit completely free.'
    },
    {
      img: <img src="/src/Photos/Premium Fabrics.png" alt="Premium Fabrics" className="feature-img" width="390" height="290" />,
      title: 'Premium Fabrics',
      description: 'Curated collection of luxury fabrics from world-renowned mills. Choose from hundreds of options.'
    },
    {
      img: <img src="/src/Photos/3D Visualization.png" alt="3D Visualization" className="feature-img" width="390" height="290" />,
      title: '3D Visualization',
      description: 'See your garment in real-time 360° preview before production begins.'
    },
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Why Choose INDULGE</span>
          <h2 className="section-title">The Art of Bespoke Tailoring</h2>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-img-container">
                {feature.img}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;