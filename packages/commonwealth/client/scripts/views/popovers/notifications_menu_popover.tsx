/* @jsx m */

import 'components/header/notifications_menu.scss';

import m from 'mithril';
import { PopoverMenu } from 'construct-ui';
import { NotificationsMenu } from '../menus/notifications_menu';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

export class NotificationsMenuPopover implements m.ClassComponent {
  view() {
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
          </div>
        }
        content={<NotificationsMenu />}
      />
    );
  }
}
