import 'components/sidebar.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Icon, Icons, PopoverMenu, MenuItem, Button, Tooltip } from 'construct-ui';

import app from 'state';
import { initAppState } from 'app';
import { link } from 'helpers';

import { AddressInfo, CommunityInfo, NodeInfo } from 'models';
import { isMember } from 'views/components/membership_button';
import User from 'views/components/widgets/user';
import { notifySuccess } from 'controllers/app/notifications';
import ChainIcon from 'views/components/chain_icon';
import FeedbackModal from 'views/modals/feedback_modal';
import JoinCommunitiesModal from 'views/modals/join_communities_modal';

const SidebarChain: m.Component<{ chain: string, nodeList: NodeInfo[], address: AddressInfo }> = {
  view: (vnode) => {
    const { chain, nodeList, address } = vnode.attrs;

    const linkClass = 'a.SidebarChain' + (app.activeChainId() === chain ? '.active' : '');
    return m(Tooltip, {
      hoverOpenDelay: 0,
      hoverCloseDelay: 0,
      position: 'right',
      size: 'lg',
      content: m('.SidebarTooltip', nodeList[0].chain.name),
      trigger: link(linkClass, `/${chain}/`, [
        m(ChainIcon, { chain: nodeList[0].chain }),
        m(User, { user: [address.chain, address.address], avatarOnly: true, avatarSize: 16 }),
      ])
    });
  }
};

const SidebarCommunity: m.Component<{ community: CommunityInfo, address: AddressInfo }> = {
  view: (vnode) => {
    const { community, address } = vnode.attrs;

    const linkClass = 'a.SidebarCommunity' + (app.activeCommunityId() === community.id ? '.active' : '');
    return m(Tooltip, {
      hoverOpenDelay: 0,
      hoverCloseDelay: 0,
      position: 'right',
      size: 'lg',
      content: m('.SidebarTooltip', community.name),
      trigger: link(linkClass, `/${community.id}/`, [
        m('.icon-inner', [
          m('.name', community.name.slice(0, 2).toLowerCase()),
        ]),
        m(User, { user: [address.chain, address.address], avatarOnly: true, avatarSize: 16 }),
      ])
    });
  }
};

const SidebarManage: m.Component<{}> = {
  view: (vnode) => {
    return m(Tooltip, {
      hoverOpenDelay: 0,
      hoverCloseDelay: 0,
      position: 'right',
      size: 'lg',
      content: m('.SidebarTooltip', 'Manage Communities'),
      trigger: m('.SidebarManage', {
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: JoinCommunitiesModal
          });
        }
      }, [
        m('.icon-inner', [
          m(Icon, {
            name: Icons.GRID,
            style: 'color: white;'
          }),
        ]),
      ])
    });
  }
};

const SidebarSettingsMenu: m.Component<{}> = {
  view: (vnode) => {

    return m(PopoverMenu, {
      transitionDuration: 50,
      hoverCloseDelay: 0,
      trigger: m(Button, {
        iconLeft: Icons.SETTINGS,
        size: 'default',
        class: 'SidebarSettingsMenu',
      }),
      position: 'right-end',
      closeOnContentClick: true,
      menuAttrs: {
        align: 'left',
      },
      content: [
        // settings
        m(MenuItem, {
          onclick: () => {
            m.route.set('/');
          },
          contentLeft: m(Icon, { name: Icons.HOME }),
          label: 'Home'
        }),
        // settings
        m(MenuItem, {
          onclick: () => {
            m.route.set('/settings');
          },
          contentLeft: m(Icon, { name: Icons.SETTINGS }),
          label: 'Settings'
        }),
        // admin
        app.login?.isSiteAdmin && app.activeChainId() && m(MenuItem, {
          onclick: () => {
            m.route.set(`/${app.activeChainId()}/admin`);
          },
          contentLeft: m(Icon, { name: Icons.USER }),
          label: 'Admin'
        }),
        //
        m(MenuItem, {
          label: 'Privacy',
          onclick: () => { m.route.set('/privacy'); }
        }),
        m(MenuItem, {
          label: 'Terms',
          onclick: () => { m.route.set('/terms'); }
        }),
        m(MenuItem, {
          label: 'Send feedback',
          onclick: () => {
            app.modals.create({ modal: FeedbackModal });
          }
        }),
        // logout
        app.isLoggedIn() && m(MenuItem, {
          onclick: () => {
            $.get(app.serverUrl() + '/logout').then(async () => {
              await initAppState();
              notifySuccess('Logged out');
              m.route.set('/');
              m.redraw();
            }).catch((err) => {
              location.reload();
            });
            mixpanel.reset();
          },
          contentLeft: m(Icon, { name: Icons.X_SQUARE }),
          label: 'Logout'
        }),
      ]
    });
  }
};

const Sidebar: m.Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;

    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      chains[n.chain.id] ? chains[n.chain.id].push(n) : chains[n.chain.id] = [n];
    });

    return m('.Sidebar', [
      app.login.roles.map((role) => {
        const address = app.login.addresses.find((address) => address.id === role.address_id);
        if (role.offchain_community_id) {
          const community = app.config.communities.getAll().find((community) => community.id === role.offchain_community_id);
          return m(SidebarCommunity, { community, address });
        } else {
          return m(SidebarChain, { chain: role.chain_id, nodeList: chains[role.chain_id], address });
        }
      }),
      m(SidebarManage),
      m(SidebarSettingsMenu),
    ]);
  }
};

export default Sidebar;
