/* @jsx m */

import app from 'state';
import m from 'mithril';
import { MenuItemAttrs } from '../../menus/types';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

export class CWMobileMenuItem implements m.ClassComponent<MenuItemAttrs> {
  view(vnode: m.VnodeDOM<any, this>) {
    const {
      type,
      label,
      iconName,
      onclick,
      disabled,
      isSecondary,
      mobileCaret,
      unreadNotifications,
    } = vnode.attrs;

    if (type === 'header') {
      return (
        <CWText className="menu-section-header-text" type="caption">
          {label}
        </CWText>
      );
    } else if (type === 'divider') {
      return <div class="menu-section-divider" />;
    } else {
      return (
        <div
          class={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'MobileMenuItem'
          )}
          onclick={(e) => {
            // Graham TODO 22.10.06: Temporary solution as we transition Notifications
            app.mobileMenu = null;
            onclick();
          }}
        >
          <div class="mobile-menu-item-left">
            {iconName && (
              <CWIcon className="menu-item-icon" iconName={iconName} />
            )}
            {unreadNotifications && <div class="unread-notifications-pip" />}
            <CWText type="b2" className="menu-item-text">
              {label}
            </CWText>
          </div>
          <div class="mobile-menu-item-right">
            {mobileCaret && <CWIcon iconName="chevronRight" iconSize="small" />}
          </div>
        </div>
      );
    }
  }
}
