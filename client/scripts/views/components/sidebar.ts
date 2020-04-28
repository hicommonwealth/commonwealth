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

const avatarSize = 14;

const SidebarChain: m.Component<{ chain: string, nodeList: NodeInfo[], address: AddressInfo }> = {
  view: (vnode) => {
    const { chain, nodeList, address } = vnode.attrs;

    const active = app.activeChainId() === chain
      && (!address || (address.chain === app.vm.activeAccount?.chain.id
                       && address.address === app.vm.activeAccount?.address));

    return m('a.SidebarChain', {
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
    ]);
  }
};

const SidebarCommunity: m.Component<{ community: CommunityInfo, address: AddressInfo }> = {
  view: (vnode) => {
    const { community, address } = vnode.attrs;

    const active = app.activeCommunityId() === community.id
      && (!address || (address.chain === app.vm.activeAccount?.chain.id
                       && address.address === app.vm.activeAccount?.address));

    return m('a.SidebarCommunity', {
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
    ]);
  }
};

const Sidebar: m.Component<{}> = {
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

    return m('.Sidebar', [
      m('.sidebar-content', [
        chainRoles.map((role) => {
          const address = app.login.addresses.find((a) => a.id === role.address_id);
          return m(SidebarChain, { chain: role.chain_id, nodeList: chains[role.chain_id], address });
        }),
        communityRoles.map((role) => {
          const address = app.login.addresses.find((a) => a.id === role.address_id);
          const community = app.config.communities.getAll().find((c) => c.id === role.offchain_community_id);
          return m(SidebarCommunity, { community, address });
        }),
      ]),
    ]);
  }
};

export default Sidebar;
