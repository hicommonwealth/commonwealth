/* @jsx m */

import 'components/mobile_menu.scss';

import m from 'mithril';
import app from 'state';
import { mobileMenuLookup } from './mobile_menu_lookup';

export class MobileMenu implements m.ClassComponent {
  view(vnode: m.VnodeDOM<{}, this>) {
    if (!app.mobileMenu) return;
    const ActiveMenu = mobileMenuLookup[app.mobileMenu];
    if (!ActiveMenu) return;
    return <ActiveMenu class="MobileMenu" />;
  }
}
