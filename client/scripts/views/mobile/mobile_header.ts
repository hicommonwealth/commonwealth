import 'mobile/mobile_header.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, Icon, Icons } from 'construct-ui';

import app from 'state';

import NotificationsMenu from 'views/components/header/notifications_menu';
import { SearchBar } from 'views/components/search_bar';
import MobileSidebar from './mobile_sidebar';
import { CustomHamburgerIcon } from './mobile_icons';

const MobileHeader: m.Component<{}, { open: boolean }> = {
  view: (vnode) => {
    return m('.MobileHeader', {
      onclick: (e) => {
        e.preventDefault();
        // clicking anywhere outside the trigger should close the sidebar
        const onTrigger = $(e.target).hasClass('mobile-header-trigger')
          || $(e.target).closest('.mobile-header-trigger').length > 0;
        if (!onTrigger && vnode.state.open) vnode.state.open = false;
      },
    }, [
      m('img.mobile-logo', { src: 'https://commonwealth.im/static/img/logo.png' }),
      m(SearchBar),
      m('.mobile-header-right', [
        app.isLoggedIn() && m(NotificationsMenu, { small: false }),
        (app.chain || app.community)
        && m(PopoverMenu, {
          class: 'MobileHeaderPopoverMenu',
          transitionDuration: 0,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          // inline: true,
          trigger: m(Button, {
            class: 'mobile-header-trigger no-border',
            compact: true,
            label: m(CustomHamburgerIcon),
          }),
          content: m(MobileSidebar)
        }),
      ]),
    ]);
  }
};

export default MobileHeader;
