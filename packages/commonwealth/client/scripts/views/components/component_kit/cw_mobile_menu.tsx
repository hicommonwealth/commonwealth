/* @jsx m */

import m from 'mithril';
import { CWMobileMenuItem } from './cw_mobile_menu_item';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

export type MobileMenuAttrs = {
  className: string;
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
            <CWText>{menuHeader.label}</CWText>
          </div>
        )}
        {menuItems.map((attrs) => (
          <CWMobileMenuItem {...attrs} />
        ))}
      </div>
    );
  }
}
