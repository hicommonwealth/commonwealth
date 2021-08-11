import 'mobile/mobile_header.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, Icon, Icons } from 'construct-ui';

import app, { LoginState } from 'state';

import NotificationsMenu from 'views/components/header/notifications_menu';
import { SearchBar } from 'views/components/search_bar';
import CreateCommunityModal from 'views/modals/create_community_modal';
import MobileSidebar from './mobile_sidebar';
import { CustomHamburgerIcon } from './mobile_icons';

const MobileHeader: m.Component<{showCreateCommunityButton?: boolean}, { sidebarOpen: boolean }> = {
  view: (vnode) => {
    const { sidebarOpen } = vnode.state;
    const { showCreateCommunityButton } = vnode.attrs;
    // Because onClick never happens when logging out we must set manually
    return m('.MobileHeader', [
      m('img.mobile-logo', {
        src: 'https://commonwealth.im/static/img/logo.png',
        onclick: (e) => { m.route.set('/'); }
      }),
      m(SearchBar),
      m('.mobile-header-right', [
        app.isLoggedIn() && m(NotificationsMenu, { small: false }),
        app.isLoggedIn() && showCreateCommunityButton ? m(Button, {
          class: 'create-community',
          label: m(Icon, { name: Icons.PLUS }),
          compact: true,
          onclick: (e) => {
            app.modals.create({ modal: CreateCommunityModal });
          },
        }) : '',
        m(PopoverMenu, {
          class: 'MobileHeaderPopoverMenu',
          transitionDuration: 0,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          onClosed: () => { vnode.state.sidebarOpen = false; m.redraw(); },
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
