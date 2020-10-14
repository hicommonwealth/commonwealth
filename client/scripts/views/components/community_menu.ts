import 'components/community_menu.scss';

import m from 'mithril';
import $ from 'jquery';
import { Icon, Icons, PopoverMenu, MenuItem, Button, Tooltip } from 'construct-ui';

import app from 'state';
import { link } from 'helpers';

import { AddressInfo, CommunityInfo, NodeInfo } from 'models';
import User from 'views/components/widgets/user';
import { ChainIcon } from 'views/components/chain_icon';

const avatarSize = 14;

const CommunityMenuChain: m.Component<{ chain: string, nodeList: NodeInfo[], address: AddressInfo }> = {
  view: (vnode) => {
    const { chain, nodeList, address } = vnode.attrs;

    const active = app.activeChainId() === chain
      && (!address
          || (address.chain === app.user.activeAccount?.chain.id
              && address.address === app.user.activeAccount?.address));

    return m('a.CommunityMenuChain', {
      href: '#',
      class: active ? 'active' : '',
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${chain}/`);
      }
    }, [
      m('.icon-inner', [
        m(ChainIcon, { chain: nodeList[0].chain }),
        m(User, { user: address, avatarOnly: true, avatarSize: 16 }),
      ]),
      m('.content-inner', [
        m('.sidebar-name', nodeList[0].chain.name),
        m('.sidebar-user', [
          'Joined as ',
          m(User, { user: address, avatarSize, hideAvatar: true })
        ]),
      ]),
    ]);
  }
};

const CommunityMenuCommunity: m.Component<{ community: CommunityInfo, address: AddressInfo }> = {
  view: (vnode) => {
    const { community, address } = vnode.attrs;
    const active = app.activeCommunityId() === community.id
      && (!address
          || (address.chain === app.user.activeAccount?.chain.id
              && address.address === app.user.activeAccount?.address));

    return m('a.CommunityMenuCommunity', {
      href: '#',
      class: active ? 'active' : '',
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${community.id}/`);
      },
    }, [
      m('.icon-inner', [
        m('.name', community.name.slice(0, 2).toLowerCase()),
        m(User, { user: address, avatarOnly: true, avatarSize: 16 }),
      ]),
      m('.content-inner', [
        m('.sidebar-name', community.name),
        m('.sidebar-user', [
          'Joined as ',
          m(User, { user: address, avatarSize, hideAvatar: true })
        ]),
      ]),
    ]);
  }
};

const CommunityMenuLink: m.Component<{ onclick, icon, label }> = {
  view: (vnode) => {
    const { icon, label, onclick } = vnode.attrs;

    return m('a.CommunityMenuLink', {
      onclick,
      href: '#',
    }, [
      icon && m(Icon, { name: icon }),
      m('.menu-option-label', label),
    ]);
  }
};

const CommunityMenu: m.Component<{}> = {
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

    const chainRoles = app.user.getChainRoles();
    const communityRoles = app.user.getCommunityRoles();

    return m('.CommunityMenu', [
      chainRoles.length > 0 && m('h4', 'Chains'),
      chainRoles.map((role) => {
        const address = app.user.addresses.find((a) => a.id === role.address_id);
        return m(CommunityMenuChain, { chain: role.chain_id, nodeList: chains[role.chain_id], address });
      }),
      chainRoles.length > 0 && m('h4', 'Communities'),
      communityRoles.map((role) => {
        const address = app.user.addresses.find((a) => a.id === role.address_id);
        const community = app.config.communities.getAll().find((c) => c.id === role.offchain_community_id);
        return m(CommunityMenuCommunity, { community, address });
      }),
      app.user.roles.length > 0 && m('hr'),
      m(CommunityMenuLink, {
        onclick: (e) => {
          e.preventDefault();
          m.route.set('/notifications');
        },
        icon: Icons.BELL,
        label: 'Manage Notifications',
      }),
      m(CommunityMenuLink, {
        onclick: (e) => {
          e.preventDefault();
          m.route.set('/');
        },
        icon: Icons.HOME,
        label: 'Home'
      }),
    ]);
  }
};

export default CommunityMenu;
