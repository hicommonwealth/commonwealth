import '@knocklabs/react-notification-feed/dist/index.css';
import React from 'react';
import './SidebarNotificationIcon.scss';

type SideBarNotificationIconProps = {
  unreadCount: number;
};

export const SideBarNotificationIcon = ({
  unreadCount,
}: SideBarNotificationIconProps) => (
  <div className="sidebar-notification-icon">
    <div className="notification-icon-container">
      <div className="notification-icon">
        <i className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  </div>
);
