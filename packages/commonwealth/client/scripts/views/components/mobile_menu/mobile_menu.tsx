/* @jsx m */

import 'components/component_kit/cw_mobile_menu.scss';

import m from 'mithril';
import app from 'state';
import { mobileMenuLookup } from './mobile_menu_lookup';

export class MobileMenu implements m.ClassComponent {
  view() {
    if (!app.mobileMenu) return;

    const ActiveMenu = mobileMenuLookup[app.mobileMenu];

    if (!ActiveMenu) return;

    return <ActiveMenu class="MobileMenu" />;
  }
}
