import 'components/sidebar.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Icon, Icons, PopoverMenu, MenuItem, Button, Tooltip } from 'construct-ui';

import app from 'state';
import { initAppState } from 'app';
import { link } from 'helpers';

import User from 'views/components/widgets/user';
import { notifySuccess } from 'controllers/app/notifications';
import ChainIcon from 'views/components/chain_icon';
import { isMember } from 'views/components/membership_button';
import FeedbackModal from 'views/modals/feedback_modal';
import JoinCommunitiesModal from 'views/modals/join_communities_modal';

const SidebarChain = {
  view: (vnode) => {
    const { chain, nodeList } = vnode.attrs;

    const linkClass = 'a.SidebarChain' + (app.activeChainId() === chain ? '.active' : '');
    return m(Tooltip, {
      hoverOpenDelay: 0,
      hoverCloseDelay: 0,
      position: 'right',
      size: 'lg',
      content: m('.SidebarTooltip', nodeList[0].chain.name),
      trigger: link(linkClass, `/${chain}/`, [
        m(ChainIcon, { chain: nodeList[0].chain }),
        app.vm.activeAccount && m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 16 }),
      ])
    });
  }
};

const SidebarCommunity = {
  view: (vnode) => {
    const { community } = vnode.attrs;

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
        app.vm.activeAccount && m(User, { user: app.vm.activeAccount, avatarOnly: true, avatarSize: 16 }),
      ])
    });
  }
};

const SidebarManage = {
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

const SidebarSettingsMenu = {
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

const Sidebar = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;

    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      chains[n.chain.network] ? chains[n.chain.network].push(n) : chains[n.chain.network] = [n];
    });

    const myChains = Object.entries(chains).filter(([c, nodeList]) => isMember(c, null));
    const myCommunities = app.config.communities.getAll().filter((c) => isMember(null, c.id));

    return m('.Sidebar', [
      myChains.map(([chain, nodeList] : [string, any]) => m(SidebarChain, { chain, nodeList })),
      myCommunities.map((community) => m(SidebarCommunity, { community })),
      m(SidebarManage),
      m(SidebarSettingsMenu),
    ]);
  }
};

export default Sidebar;
