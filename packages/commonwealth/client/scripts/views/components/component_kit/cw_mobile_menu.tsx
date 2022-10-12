/* @jsx m */

import m from 'mithril';

import app from 'state';
import { getClasses } from './helpers';
import { CWText } from './cw_text';
import { CWIcon } from './cw_icons/cw_icon';
import { MobileMenuName } from '../../app_mobile_menus';
import { MenuItem } from '../../menus/types';

class CWMobileMenuItem implements m.ClassComponent<MenuItem> {
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
          onclick={() => {
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

type MobileMenuAttrs = {
  className: MobileMenuName;
  menuHeader?: { label; onclick: (e) => void };
  menuItems: CWMobileMenuItem[];
};

export class CWMobileMenu implements m.ClassComponent<MobileMenuAttrs> {
  view(vnode: m.VnodeDOM<MobileMenuAttrs, this>) {
    const { className, menuHeader, menuItems } = vnode.attrs;
    return (
      <div
        class={getClasses<{ className: string }>({ className }, 'MobileMenu')}
      >
        {menuHeader && (
          <div class="mobile-menu-header" onclick={menuHeader.onclick}>
            <CWIcon iconName="chevronLeft" />
            <CWText type="h5" fontWeight="medium">
              {menuHeader.label}
            </CWText>
          </div>
        )}
        {menuItems.map((attrs) => (
          <CWMobileMenuItem {...attrs} />
        ))}
      </div>
    );
  }
}
