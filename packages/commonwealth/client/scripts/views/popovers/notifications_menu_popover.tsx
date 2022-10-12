/* @jsx m */

import 'components/header/notifications_menu.scss';

import m from 'mithril';
import app from 'state';
import { NotificationsMenu } from '../menus/notifications_menu';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWPopover } from '../components/component_kit/cw_popover/cw_popover';

export class NotificationsMenuPopover implements m.ClassComponent {
  view() {
    const unreadNotifications = !!app.user.notifications.numUnread;
    return (
      <CWPopover
        trigger={
          <div>
            <CWIconButton iconButtonTheme="black" iconName="bell" />
            {unreadNotifications && <div class="unread-notifications-pip" />}
          </div>
        }
        content={<NotificationsMenu />}
      />
    );
  }
}
