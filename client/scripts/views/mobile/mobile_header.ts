import 'mobile/mobile_header.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, Icon, Icons } from 'construct-ui';

import app from 'state';

import NotificationsMenu from 'views/components/header/notifications_menu';
import { SearchBar } from 'views/components/search_bar';
import MobileSidebar from './mobile_sidebar';
import MobileUserDropdown from './mobile_user_dropdown';
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
      m('.mobile-header-left', [
        (app.chain || app.community)
        && m(PopoverMenu, {
          class: 'MobileHeaderPopoverMenu',
          transitionDuration: 0,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          // TODO: Update trigger hamburger icon to CW logo
          trigger: m(Button, {
            class: 'mobile-header-trigger',
            compact: true,
            label: m(Icon, { name: Icons.MENU }),
          }),
          content: m(MobileSidebar),
        }),
      ]),
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
          content: m(MobileUserDropdown)
        }),
      ]),
    ]);
  }
};

export default MobileHeader;
