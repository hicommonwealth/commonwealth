import 'components/sidebar/mobile.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, PopoverMenu, Icon, Icons } from 'construct-ui';

import app from 'state';

import { MobileNewProposalButton } from 'views/components/new_proposal_button';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import SubscriptionButton from 'views/components/subscription_button';

import {
  OffchainNavigationModule,
  OnchainNavigationModule,
  ExternalLinksModule,
  ChainStatusModule
} from 'views/components/sidebar';
import { SearchBar } from 'views/components/search_bar';
import MobileSidebar from './mobile_sidebar';

const MobileHeader: m.Component<{}, { open: boolean }> = {
  view: (vnode) => {
    return m('.MobileHeader', {
      onclick: (e) => {
        e.preventDefault();
        // clicking anywhere outside the trigger should close the sidebar
        const onTrigger = $(e.target).hasClass('mobile-sidebar-trigger')
          || $(e.target).closest('.mobile-sidebar-trigger').length > 0;
        if (!onTrigger && vnode.state.open) vnode.state.open = false;
      },
    }, [
      m('.mobile-sidebar-left', [
        m(PopoverMenu, {
          class: 'MobileHeaderPopoverMenu',
          transitionDuration: 0,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          inline: true,
          trigger: m(Button, {
            class: 'mobile-sidebar-trigger',
            compact: true,
            label: m(Icon, { name: Icons.MENU }),
            disabled: !app.chain && !app.community,
          }),
          content: m(MobileSidebar),
        }),
        app.isLoggedIn() && m(MobileNewProposalButton),
      ]),
      m(SearchBar),
      // m('.mobile-sidebar-center', {
      //   class: `${app.isLoggedIn() ? 'logged-in' : ''} `
      //     + `${((app.chain || app.community) && !app.chainPreloading) ? '' : 'no-community'}`,
      // }, [
      //   m('.community-label', m(CommunitySelector, { showTextLabel: true })),
      // ]),
      m('.mobile-sidebar-right', [
        app.isLoggedIn() && m(NotificationsMenu, { small: false }),
        m(LoginSelector, { small: false }),
      ]),
    ]);
  }
};

export default MobileHeader;
