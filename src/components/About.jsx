import React, { useState, useEffect } from 'react';

const About = () => {
  const [stats, setStats] = useState([
    { value: '500+', label: 'Premium Fabrics' },
    { value: '10,000+', label: 'Happy Customers' },
    { value: '98%', label: 'Satisfaction Rate' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Loading about information...</div>;
  }

  return (
    <section className="about-section" id="about">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <span className="section-label">About INDULGE</span>
            <h2 className="section-title">Crafting Excellence Since Inception</h2>
            <p>INDULGE revolutionizes custom tailoring by combining traditional craftsmanship with cutting-edge 3D visualization technology, precise home measurements, and a curated selection of premium fabrics to provide perfectly-fitting, personalized clothing for every individual. You can learn more about INDULGE.</p>
            <div className="about-stats">
              {stats.map((stat, index) => (
                <div className="stat-item" key={index}>
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="about-image">
            <img src="/src/Photos/About.png" alt="About Image" className="about-img" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;