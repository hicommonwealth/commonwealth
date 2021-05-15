import 'mobile/mobile_header.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, Icon, Icons } from 'construct-ui';

import app, { LoginState } from 'state';

import NotificationsMenu from 'views/components/header/notifications_menu';
import { SearchBar } from 'views/components/search_bar';
import MobileSidebar from './mobile_sidebar';
import { CustomHamburgerIcon } from './mobile_icons';

const MobileHeader: m.Component<{}, { sidebarOpen: boolean }> = {
  view: (vnode) => {
    const { sidebarOpen } = vnode.state;
    // Because onClick never happens when logging out we must set manually
    return m('.MobileHeader', [
      m('img.mobile-logo', {
        src: 'https://commonwealth.im/static/img/logo.png',
        onclick: (e) => { m.route.set('/'); }
      }),
      m(SearchBar),
      m('.mobile-header-right', [
        app.isLoggedIn() && m(NotificationsMenu, { small: false }),
        m(PopoverMenu, {
          class: 'MobileHeaderPopoverMenu',
          transitionDuration: 0,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          trigger: m(Button, {
            class: 'mobile-header-trigger no-border',
            compact: true,
            label: sidebarOpen ? m(Icon, { name: Icons.X }) : m(CustomHamburgerIcon),
            onclick: (e) => { vnode.state.sidebarOpen = !sidebarOpen; }
          }),
          content: m(MobileSidebar)
        }),
      ]),
    ]);
  }
};

export default MobileHeader;
