import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import 'components/header/notifications_menu.scss';

import app from 'state';
import { CWCustomIcon } from '../components/component_kit/cw_icons/cw_custom_icon';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWButton } from '../components/component_kit/cw_button';
import {
  Popover,
  usePopover,
} from '../components/component_kit/cw_popover/cw_popover';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWText } from '../components/component_kit/cw_text';
import { useCommonNavigate } from 'navigation/helpers';
import { NotificationRow } from '../pages/notifications/notification_row';

export const NotificationsMenu = () => {
  const navigate = useCommonNavigate();

  const discussionNotifications =
    app.user.notifications.discussionNotifications;
  const chainEventNotifications =
    app.user.notifications.chainEventNotifications;

  const allNotifications = discussionNotifications.concat(
    chainEventNotifications
  );

  return (
    <div className="NotificationsMenu">
      <div className="notification-list">
        {allNotifications.length > 0 ? (
          <Virtuoso
            style={{ height: '480px', width: '294px' }}
            data={allNotifications}
            itemContent={(i, data) => (
              <NotificationRow key={i} notification={data} />
            )}
          />
        ) : (
          <div className="no-notifications">
            <CWText>No Notifications</CWText>
          </div>
        )}
      </div>
      <div className="footer">
        <CWButton
          label="See all"
          buttonType="tertiary-black"
          onClick={() => {
            navigate('/notifications');
          }}
        />
        <CWDivider isVertical />
        <CWButton
          label="Mark all read"
          buttonType="tertiary-black"
          onClick={(e) => {
            e.preventDefault();

            if (allNotifications.length < 1) return;

            app.user.notifications.markAsRead(allNotifications);
          }}
        />
      </div>
    </div>
  );
};

export const NotificationsMenuPopover = () => {
  const popoverProps = usePopover();

  return (
    <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
      <div>
        {app.user.notifications.numUnread > 0 ? (
          <div className="unreads-icon">
            <CWCustomIcon
              iconName="unreads"
              onClick={popoverProps.handleInteraction}
            />
          </div>
        ) : (
          <CWIconButton
            iconButtonTheme="black"
            iconName="bell"
            onClick={popoverProps.handleInteraction}
          />
        )}
        <Popover content={<NotificationsMenu />} {...popoverProps} />
      </div>
    </ClickAwayListener>
  );
};
