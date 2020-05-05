import 'components/community_switcher.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';
import { Icon, Icons, Popover, PopoverMenu, MenuItem, Button, Tooltip } from 'construct-ui';

import app from 'state';
import { initAppState } from 'app';
import { link } from 'helpers';

import { AddressInfo, CommunityInfo, NodeInfo } from 'models';
import { isMember } from 'views/components/membership_button';
import User from 'views/components/widgets/user';
import { notifySuccess } from 'controllers/app/notifications';
import ChainIcon from 'views/components/chain_icon';
import FeedbackModal from 'views/modals/feedback_modal';
import CommunityMenu from 'views/components/community_menu';

const avatarSize = 16;

const CommunitySwitcherChain: m.Component<{ chain: string, nodeList: NodeInfo[], address: AddressInfo }> = {
  view: (vnode) => {
    const { chain, nodeList, address } = vnode.attrs;

    const active = app.activeChainId() === chain
      && (!address || (address.chain === app.vm.activeAccount?.chain.id
                       && address.address === app.vm.activeAccount?.address));

    return m(Tooltip, {
      position: 'right',
      size: 'lg',
      content: m('.CommunitySwitcherTooltip', [
        m('.sidebar-tooltip-name', nodeList[0].chain.name),
      ]),
      trigger: m('a.CommunitySwitcherChain', {
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
          m(User, { user: [address.address, address.chain], avatarOnly: true, avatarSize }),
        ]),
      ])
    });
  }
};

const CommunitySwitcherCommunity: m.Component<{ community: CommunityInfo, address: AddressInfo }> = {
  view: (vnode) => {
    const { community, address } = vnode.attrs;

    const active = app.activeCommunityId() === community.id
      && (!address || (address.chain === app.vm.activeAccount?.chain.id
                       && address.address === app.vm.activeAccount?.address));

    return m(Tooltip, {
      position: 'right',
      size: 'lg',
      content: m('.CommunitySwitcherTooltip', [
        m('.sidebar-tooltip-name', community.name),
      ]),
      trigger: m('a.CommunitySwitcherCommunity', {
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
          m(User, { user: [address.address, address.chain], avatarOnly: true, avatarSize }),
        ]),
      ])
    });
  }
};

const CommunitySwitcher: m.Component<{}, { communityMenuVisible: boolean }> = {
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
      m(Popover, {
        portalAttrs: { class: 'community-menu-portal' },
        class: 'community-menu-popover',
        isOpen: vnode.state.communityMenuVisible,
        hasBackdrop: true,
        content: m(CommunityMenu),
        onClose: () => {
          vnode.state.communityMenuVisible = false;
        },
        hasArrow: false,
        closeOnEscapeKey: true,
        closeOnContentClick: true,
        trigger: m('.sidebar-logo', '🤔'),
      }),
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
      ]),
    ]);
  }
};

export default CommunitySwitcher;
