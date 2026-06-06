import React from 'react';
import Notification from './Notification';

const NotificationsContainer = ({ notifications, onRemove }) => {
  return (
    <div>
      {notifications.map(notification => (
        <Notification 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove} 
        />
      ))}
    </div>
  );
};

export default NotificationsContainer;