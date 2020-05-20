import 'components/community_switcher.scss';

import m from 'mithril';
import { Icons, Popover, Button, Tooltip } from 'construct-ui';

import app from 'state';

import { AddressInfo, CommunityInfo, NodeInfo } from 'models';
import User from 'views/components/widgets/user';
import ChainIcon from 'views/components/chain_icon';
import CommunityMenu from 'views/components/community_menu';
import { setActiveAccount } from 'controllers/app/login';

const avatarSize = 16;

const CommunitySwitcherChain: m.Component<{ chain: string, nodeList: NodeInfo[], address: AddressInfo }> = {
  view: (vnode) => {
    const { chain, nodeList, address } = vnode.attrs;
    const updatedThreads = app.login.unseenPosts[chain]?.activePosts || 0;

    const active = app.activeChainId() === chain
      && (!address || (address.chain === app.vm.activeAccount?.chain.id
                       && address.address === app.vm.activeAccount?.address));

    return m(Tooltip, {
      position: 'right',
      size: 'lg',
      content: m('.CommunitySwitcherTooltip', [
        m('.sidebar-tooltip-name', nodeList[0].chain.name),
      ]),
      hoverOpenDelay: 0,
      hoverCloseDelay: 0,
      transitionDuration: 0,
      trigger: m('a.CommunitySwitcherChain', {
        href: '#',
        class: `${active ? 'active' : ''} ${updatedThreads > 0 ? 'unread' : ''}`,
        onclick: (e) => {
          e.preventDefault();
          if (address) {
            localStorage.setItem('initAddress', address.address);
            localStorage.setItem('initChain', address.chain);
            if (app.vm.activeAccount && app.vm.activeAccount.address !== address.address) {
              const account = app.login.activeAddresses.find((addr) => addr.address === address.address);
              setActiveAccount(account);
            }
          }
          m.route.set(`/${chain}/`);
        }
      }, [
        m('.active-bar'),
        m('.icon-inner', [
          m(ChainIcon, { chain: nodeList[0].chain }),
          m(User, { user: [address.address, address.chain], avatarOnly: true, avatarSize }),
        ]),
      ])
    });
  }
};

const CommunitySwitcherCommunity: m.Component<{ community: CommunityInfo, address: AddressInfo }> = {
  view: (vnode) => {
    const { community, address } = vnode.attrs;
    const updatedThreads = app.login.unseenPosts[community.id]?.activePosts || 0;

    const active = app.activeCommunityId() === community.id
      && (!address || (address.chain === app.vm.activeAccount?.chain.id
                       && address.address === app.vm.activeAccount?.address));

    return m(Tooltip, {
      position: 'right',
      size: 'lg',
      content: m('.CommunitySwitcherTooltip', [
        m('.sidebar-tooltip-name', community.name),
      ]),
      hoverOpenDelay: 0,
      hoverCloseDelay: 0,
      transitionDuration: 0,
      trigger: m('a.CommunitySwitcherCommunity', {
        href: '#',
        class: `${active ? 'active' : ''} ${updatedThreads > 0 ? 'unread' : ''}`,
        onclick: (e) => {
          e.preventDefault();
          if (address) {
            localStorage.setItem('initAddress', address.address);
            localStorage.setItem('initChain', address.chain);
            if (app.vm.activeAccount.address !== address.address) {
              const account = app.login.activeAddresses.find((addr) => addr.address === address.address);
              setActiveAccount(account);
            }
          }
          m.route.set(`/${community.id}/`);
        }
      }, [
        m('.active-bar'),
        m('.icon-inner', [
          m('.name', community.name.slice(0, 2).toLowerCase()),
          m(User, { user: [address.address, address.chain], avatarOnly: true, avatarSize }),
        ]),
      ])
    });
  }
};

const CommunitySwitcher: m.Component<{}, { communityMenuVisible: boolean }> = {
  view: (vnode) => {
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
    const HomeButton = m('.home-button-wrap', [
      m(Button, {
        onclick: (e) => {
          if (m.route.get() !== '/') m.route.set('/');
        },
        class: '.sidebar-logo',
        iconLeft: Icons.HOME,
        size: 'xl'
      })
    ]);

    return m('.CommunitySwitcher', [
      app.isLoggedIn()
        ? m(Popover, {
          portalAttrs: { class: 'community-menu-portal' },
          class: 'community-menu-popover',
          hasBackdrop: true,
          content: m(CommunityMenu),
          hasArrow: false,
          closeOnEscapeKey: true,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          trigger: HomeButton
        })
        : HomeButton,
      m('.sidebar-content', [
        chainRoles.map((role) => {
          const address = app.login.addresses.find((a) => a.id === role.address_id);
          return m(CommunitySwitcherChain, { chain: role.chain_id, nodeList: chains[role.chain_id], address });
        }),
        communityRoles.map((role) => {
          const address = app.login.addresses.find((a) => a.id === role.address_id);
          const community = app.config.communities.getAll().find((c) => c.id === role.offchain_community_id);
          return m(CommunitySwitcherCommunity, { community, address });
        }),
        app.isLoggedIn() && m(Popover, {
          portalAttrs: { class: 'community-menu-portal' },
          class: 'community-menu-popover',
          hasBackdrop: true,
          content: m(CommunityMenu),
          hasArrow: false,
          closeOnEscapeKey: true,
          closeOnContentClick: true,
          closeOnOutsideClick: true,
          trigger: m('a.CommunitySwitcherCommunity', [
            m('.icon-inner', [
              m('.name', '...')
            ]),
          ])
        })
      ]),
    ]);
  }
};

export default CommunitySwitcher;
