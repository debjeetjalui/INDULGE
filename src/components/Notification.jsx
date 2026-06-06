import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Notification = ({ notification, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <AlertCircle size={24} />;
      case 'warning':
        return <AlertTriangle size={24} />;
      default:
        return <Info size={24} />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#2196f3';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const element = document.querySelector(`[data-notification-id="${notification.id}"]`);
      if (element) {
        element.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          onRemove(notification.id);
        }, 300);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  return (
    <div 
      className="notification"
      data-notification-id={notification.id}
      style={
        {
          position: 'fixed',
          top: '100px',
          right: '20px',
          background: getBackgroundColor(notification.type),
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          zIndex: '3000',
          animation: 'slideInRight 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '400px'
        }
      }
    >
      <div className="notification-content" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {getIcon(notification.type)}
        <span>{notification.message}</span>
      </div>

    </div>
  );
};

export default Notification;