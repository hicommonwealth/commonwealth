/* @jsx m */

import m from 'mithril';
import 'components/header/notifications_menu.scss';

import app from 'state';
import { PopoverMenu } from 'construct-ui';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { NotificationsMenu } from '../menus/notifications_menu';

export class NotificationsMenuPopover implements m.ClassComponent {
  view() {
    const unreadNotificationsCount = app.user.notifications.numUnread;
    return (
      <PopoverMenu
        className="NotificationsMenuPopover"
        closeOnContentClick={true}
        closeOnOutsideClick={true}
        hasArrow={false}
        hoverCloseDelay={0}
        position="bottom-end"
        transitionDuration={0}
        trigger={
          unreadNotificationsCount === 0 ? (
            <CWIconButton
              iconName="bell"
              iconSize="medium"
              iconButtonTheme="black"
              style="display: flex;"
            />
          ) : (
            <span>
              {unreadNotificationsCount > 9 ? '∞' : unreadNotificationsCount}
            </span>
          )
        }
        menuItems={NotificationsMenu}
      />
    );
  }
}
