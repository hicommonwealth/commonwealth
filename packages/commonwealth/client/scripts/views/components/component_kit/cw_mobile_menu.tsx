/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_mobile_menu.scss';
import m from 'mithril';

import app from 'state';
import { CWCustomIcon } from './cw_icons/cw_custom_icon';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import type { MenuItem } from './types';
import { ComponentType } from './types';

class CWMobileMenuItem extends ClassComponent<MenuItem> {
  view(vnode: m.Vnode<MenuItem>) {
    if (vnode.attrs.type === 'default') {
      const {
        disabled,
        iconLeft,
        iconRight,
        isSecondary,
        label,
        onclick,
      } = vnode.attrs;

      return (
        <div
          class={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'MobileMenuItem'
          )}
          onclick={(e) => {
            // Graham TODO 22.10.06: Temporary solution as we transition Notifications
            app.mobileMenu = null;
            onclick(e);
          }}
        >
          <div class="mobile-menu-item-left">
            {iconLeft && <CWIcon iconName={iconLeft} />}
            <CWText type="b2">{label}</CWText>
          </div>
          {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
        </div>
      );
    } else if (vnode.attrs.type === 'header') {
      return (
        <div class="MobileMenuItem">
          <CWText type="caption">{vnode.attrs.label}</CWText>
        </div>
      );
    } else if (vnode.attrs.type === 'notification') {
      const { hasUnreads, iconLeft, iconRight, label, onclick } = vnode.attrs;

      return (
        <div
          class="MobileMenuItem"
          onclick={(e) => {
            // Graham TODO 22.10.06: Temporary solution as we transition Notifications
            app.mobileMenu = null;
            onclick(e);
          }}
        >
          <div class="mobile-menu-item-left">
            {iconLeft &&
              (hasUnreads ? (
                <CWCustomIcon iconName="unreads" />
              ) : (
                <CWIcon iconName={iconLeft} />
              ))}
            <CWText type="b2">{label}</CWText>
          </div>
          {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
        </div>
      );
    }
  }
}

type MobileMenuAttrs = {
  className?: string;
  menuHeader?: { label: string; onclick: (e) => void };
  menuItems: Array<MenuItem>;
};

export class CWMobileMenu extends ClassComponent<MobileMenuAttrs> {
  view(vnode: m.Vnode<MobileMenuAttrs>) {
    const { className, menuHeader, menuItems } = vnode.attrs;

    return (
      <div
        class={getClasses<{ className: string }>(
          { className },
          ComponentType.MobileMenu
        )}
      >
        {menuHeader && (
          <div class="mobile-menu-header" onclick={menuHeader.onclick}>
            <CWIcon iconName="chevronLeft" />
            <CWText type="h5" fontWeight="medium">
              {menuHeader.label}
            </CWText>
          </div>
        )}
        {menuItems.map((item) => (
          <CWMobileMenuItem type={item.type || 'default'} {...item} />
        ))}
      </div>
    );
  }
}
