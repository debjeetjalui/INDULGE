import React, { useState } from 'react';
import { Search, Check, Scissors, Package, Truck, Home } from 'lucide-react';

const Tracking = ({ showNotification }) => {
  const [orderId, setOrderId] = useState('');

  const handleTrackOrder = () => {
    if (orderId.trim()) {
      showNotification(`Tracking order: ${orderId}`, 'info');
    } else {
      showNotification('Please enter an order ID', 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTrackOrder();
    }
  };

  const timelineItems = [
    {
      id: 1,
      status: 'completed',
      icon: <Check size={24} />,
      title: 'Order Placed',
      description: 'Your order has been confirmed',
      date: 'Dec 10, 2025'
    },
    {
      id: 2,
      status: 'completed',
      icon: <Check size={24} />,
      title: 'Measurements Recorded',
      description: 'Your measurements have been saved',
      date: 'Dec 11, 2025'
    },
    {
      id: 3,
      status: 'active',
      icon: <Scissors size={24} />,
      title: 'In Production',
      description: 'Your garment is being crafted',
      date: 'In Progress'
    },
    {
      id: 4,
      status: '',
      icon: <Package size={24} />,
      title: 'Quality Check',
      description: 'Final inspection and packaging',
      date: 'Pending'
    },
    {
      id: 5,
      status: '',
      icon: <Truck size={24} />,
      title: 'Out for Delivery',
      description: 'Your order is on its way',
      date: 'Pending'
    },
    {
      id: 6,
      status: '',
      icon: <Home size={24} />,
      title: 'Delivered',
      description: 'Order successfully delivered',
      date: 'Pending'
    }
  ];

  return (
    <section className="tracking-section" id="tracking">
      <div className="container">
        <div className="section-header">
          <span className="section-label">Track Your Order</span>
          <h2 className="section-title">Order Status</h2>
          <p className="section-description">Monitor every stage of your garment's creation</p>
        </div>

        <div className="tracking-container">
          <div className="tracking-search">
            <input 
              type="text" 
              placeholder="Enter your order ID" 
              className="tracking-input"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="btn btn-primary" onClick={handleTrackOrder}>
              <Search size={20} />
              <span>Track Order</span>
            </button>
          </div>

          <div className="tracking-timeline">
            {timelineItems.map(item => (
              <div className={`timeline-item ${item.status}`} key={item.id}>
                <div className="timeline-icon">
                  {item.icon}
                </div>
                <div className="timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="timeline-date">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tracking;