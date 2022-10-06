/* @jsx m */

import 'components/header/notifications_menu.scss';

import m from 'mithril';
import app from 'state';
import { PopoverMenu } from 'construct-ui';
import { NotificationsMenu } from '../menus/notifications_menu';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

const UnreadNotificationsPip = (
  <div
    style="
      border-radius: 100%;
      position: absolute;
      background: #EC79DE;
      content: '';
      height: 10px;
      width: 10px;
      top: 17px;
      right: 50px;
    "
  />
);

export class NotificationsMenuPopover implements m.ClassComponent {
  view() {
    const unreadNotifications = app.user.notifications.numUnread;
    return (
      <PopoverMenu
        overlayClass="NotificationsMenuPopover"
        closeOnContentClick={true}
        closeOnOutsideClick={true}
        hasArrow={false}
        hoverCloseDelay={0}
        position="bottom-end"
        transitionDuration={0}
        trigger={
          <div>
            <CWIcon iconName="bell" />
            {unreadNotifications && UnreadNotificationsPip}
          </div>
        }
        content={<NotificationsMenu />}
      />
    );
  }
}
