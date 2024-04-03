import ClickAwayListener from '@mui/base/ClickAwayListener';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'menus/notifications_menu.scss';

import clsx from 'clsx';
import { byDescendingCreationDate } from 'helpers';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  handleIconClick,
  handleMouseEnter,
  handleMouseLeave,
} from 'views/menus/utils';
import { CWDivider } from '../components/component_kit/cw_divider';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWText } from '../components/component_kit/cw_text';
import { isWindowSmallInclusive } from '../components/component_kit/helpers';
import { CWButton } from '../components/component_kit/new_designs/cw_button';
import { NotificationRow } from '../pages/notifications/notification_row';

export const NotificationsMenu = () => {
  const navigate = useCommonNavigate();
  const [allRead, setAllRead] = useState<boolean>(false);

  const discussionNotifications =
    app.user.notifications.discussionNotifications;
  const chainEventNotifications =
    app.user.notifications.chainEventNotifications;

  const mostRecentFirst = [
    ...discussionNotifications.concat(chainEventNotifications),
  ].sort(byDescendingCreationDate);

  return (
    <div className="NotificationsMenu">
      <div className="notification-list">
        {mostRecentFirst.length > 0 ? (
          <Virtuoso
            style={
              isWindowSmallInclusive(window.innerWidth)
                ? { height: '100%', width: '100%' }
                : { height: '480px', width: '294px' }
            }
            data={mostRecentFirst}
            itemContent={(i, data) => (
              <NotificationRow key={i} notification={data} allRead={allRead} />
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
          // buttonWidth="full"
          label="See all"
          buttonType="tertiary"
          onClick={() => {
            navigate('/notifications');
          }}
        />
        <CWDivider isVertical />
        <CWButton
          // buttonWidth="full"
          label="Mark all read"
          buttonType="tertiary"
          onClick={(e) => {
            e.preventDefault();

            if (mostRecentFirst.length < 1) return;

            app.user.notifications.markAsRead(mostRecentFirst);
            setAllRead(true);
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
        <CWTooltip
          content="Notifications"
          placement="bottom"
          renderTrigger={(handleInteraction, isTooltipOpen) => (
            <div
              className={clsx('notifications-container', {
                'unread-notifications': app.user.notifications.numUnread > 0,
              })}
            >
              <CWIconButton
                iconButtonTheme="black"
                iconName="bell"
                onClick={(e) =>
                  handleIconClick({
                    e,
                    isMenuOpen: popoverProps.open,
                    isTooltipOpen,
                    handleInteraction,
                    onClick: popoverProps.handleInteraction,
                  })
                }
                onMouseEnter={(e) =>
                  handleMouseEnter({
                    e,
                    isMenuOpen: popoverProps.open,
                    handleInteraction,
                  })
                }
                onMouseLeave={(e) =>
                  handleMouseLeave({ e, isTooltipOpen, handleInteraction })
                }
              />
            </div>
          )}
        />
        <CWPopover content={<NotificationsMenu />} {...popoverProps} />
      </div>
    </ClickAwayListener>
  );
};
