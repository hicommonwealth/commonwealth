import 'components/sidebar/index.scss';

import m from 'mithril';
import $ from 'jquery';
import {
  Button, Popover, PopoverMenu, MenuItem, Icon, Icons, Tag, Spinner, Select
} from 'construct-ui';

import app from 'state';
import { link, removeUrlPrefix } from 'helpers';
// import { ChainClass, ChainBase, ChainNetwork, ChainInfo, CommunityInfo, AddressInfo, NodeInfo } from 'models';

import { MobileNewProposalButton } from 'views/components/new_proposal_button';
import NotificationsMenu from 'views/components/header/notifications_menu';
import LoginSelector from 'views/components/header/login_selector';
import CommunitySelector from 'views/components/sidebar/community_selector';

const MobileSidebar = {
  view: (vnode) => {
    return m('.MobileSidebarHeader', {
      onclick: (e) => {
        e.preventDefault();
        // clicking anywhere outside the trigger should close the sidebar
        const onTrigger = $(e.target).hasClass('mobile-sidebar-trigger')
          || $(e.target).closest('.mobile-sidebar-trigger').length > 0;
        if (!onTrigger && vnode.state.open) vnode.state.open = false;
      },
    }, [
      m('.mobile-sidebar-left', [
        m(Button, {
          class: 'mobile-sidebar-trigger',
          compact: true,
          onclick: (e) => {
            e.preventDefault();
            vnode.state.open = !vnode.state.open;
          },
          label: m(Icon, { name: Icons.MENU }),
        }),
        app.isLoggedIn() && m(MobileNewProposalButton),
      ]),
      m('.mobile-sidebar-center', {
        class: `${app.isLoggedIn() ? 'logged-in' : ''} `
          + `${((app.chain || app.community) && !app.chainPreloading) ? '' : 'no-community'}`,
      }, [
        m('.community-label', m(CommunitySelector)),
      ]),
      m('.mobile-sidebar-right', [
        app.isLoggedIn() && m(NotificationsMenu, { small: false }),
        m(LoginSelector, { small: false }),
      ]),
    ]);
  }
};

export default MobileSidebar;
