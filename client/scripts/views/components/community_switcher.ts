import 'components/community_switcher.scss';

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

const avatarSize = 14;

const CommunitySwitcherChain: m.Component<{ chain: string, nodeList: NodeInfo[], address: AddressInfo }> = {
  view: (vnode) => {
    const { chain, nodeList, address } = vnode.attrs;

    const active = app.activeChainId() === chain
      && (!address
          || (address.chain === app.vm.activeAccount?.chain.id && address.address === app.vm.activeAccount?.address));

    return m('a.CommunitySwitcherChain', {
      href: '#',
      class: active ? 'active' : '',
      onclick: (e) => {
        e.preventDefault();
        if (address) {
          localStorage.setItem('initAddress', address.address);
          localStorage.setItem('initChain', address.chain);
        }
        m.route.set(`/${chain}/`);
      }
    }, [
      m('.icon-inner', [
        m(ChainIcon, { chain: nodeList[0].chain }),
        m(User, { user: [address.address, address.chain], avatarOnly: true, avatarSize: 16 }),
      ]),
      m('.content-inner', [
        m('.sidebar-name', nodeList[0].chain.name),
        m('.sidebar-user', [
          'Joined as ',
          m(User, { user: [address.address, address.chain], avatarSize, hideAvatar: true })
        ]),
      ]),
    ]);
  }
};

const CommunitySwitcherCommunity: m.Component<{ community: CommunityInfo, address: AddressInfo }> = {
  view: (vnode) => {
    const { community, address } = vnode.attrs;
    const active = app.activeCommunityId() === community.id
      && (!address
          || (address.chain === app.vm.activeAccount?.chain.id && address.address === app.vm.activeAccount?.address));

    return m('a.CommunitySwitcherCommunity', {
      href: '#',
      class: active ? 'active' : '',
      onclick: (e) => {
        e.preventDefault();
        if (address) {
          localStorage.setItem('initAddress', address.address);
          localStorage.setItem('initChain', address.chain);
        }
        m.route.set(`/${community.id}/`);
      },
    }, [
      m('.icon-inner', [
        m('.name', community.name.slice(0, 2).toLowerCase()),
        m(User, { user: [address.address, address.chain], avatarOnly: true, avatarSize: 16 }),
      ]),
      m('.content-inner', [
        m('.sidebar-name', community.name),
        m('.sidebar-user', [
          'Joined as ',
          m(User, { user: [address.address, address.chain], avatarSize, hideAvatar: true })
        ]),
      ]),
    ]);
  }
};

const CommunitySwitcherMenuOption: m.Component<{ onclick, icon, label }> = {
  view: (vnode) => {
    const { icon, label, onclick } = vnode.attrs;

    return m('a.CommunitySwitcherMenuOption', {
      onclick,
      href: '#',
    }, [
      icon && m(Icon, { name: icon }),
      m('.menu-option-label', label),
    ]);
  }
};

const CommunitySwitcher: m.Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;

    const chains = {};
    app.config.nodes.getAll().forEach((n) => {
      if (chains[n.chain.id]) {
        chains[n.chain.id].push(n);
      } else {
        chains[n.chain.id] = [n];
      }
    });

    const chainRoles = app.login.roles.filter((role) => !role.offchain_community_id);
    const communityRoles = app.login.roles.filter((role) => role.offchain_community_id);

    return m('.CommunitySwitcher', [
      chainRoles.length > 0 && m('h4', 'Chains'),
      chainRoles.map((role) => {
        const address = app.login.addresses.find((a) => a.id === role.address_id);
        return m(CommunitySwitcherChain, { chain: role.chain_id, nodeList: chains[role.chain_id], address });
      }),
      chainRoles.length > 0 && m('h4', 'Communities'),
      communityRoles.map((role) => {
        const address = app.login.addresses.find((a) => a.id === role.address_id);
        const community = app.config.communities.getAll().find((c) => c.id === role.offchain_community_id);
        return m(CommunitySwitcherCommunity, { community, address });
      }),
      app.login.roles.length > 0 && m('hr'),
      m(CommunitySwitcherMenuOption, {
        onclick: () => m.route.set('/'),
        icon: Icons.HOME,
        label: 'Home'
      }),
      m(CommunitySwitcherMenuOption, {
        onclick: () => m.route.set('/settings'),
        icon: Icons.SETTINGS,
        label: 'Settings'
      }),
      app.login?.isSiteAdmin && app.activeChainId() && m(CommunitySwitcherMenuOption, {
        onclick: () => m.route.set(`/${app.activeChainId()}/admin`),
        icon: Icons.USER,
        label: 'Admin'
      }),
      m(CommunitySwitcherMenuOption, {
        onclick: () => app.modals.create({ modal: FeedbackModal }),
        icon: Icons.SEND,
        label: 'Send feedback',
      }),
      app.isLoggedIn() && m(CommunitySwitcherMenuOption, {
        onclick: () => {
          $.get(`${app.serverUrl()}/logout`).then(async () => {
            await initAppState();
            notifySuccess('Logged out');
            m.route.set('/');
            m.redraw();
          }).catch((err) => {
            // eslint-disable-next-line no-restricted-globals
            location.reload();
          });
          mixpanel.reset();
        },
        icon: Icons.X_SQUARE,
        label: 'Logout'
      }),
    ]);
  }
};

export default CommunitySwitcher;
