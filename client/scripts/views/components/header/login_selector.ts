import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { Button, ButtonGroup, Icon, Icons, List, Menu, MenuItem, MenuDivider,
  Popover } from 'construct-ui';

import app from 'state';
import { ChainInfo, CommunityInfo } from 'models';
import { isSameAccount, pluralize } from 'helpers';
import { initAppState } from 'app';
import { notifySuccess } from 'controllers/app/notifications';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import User, { UserBlock } from 'views/components/widgets/user';
import CreateInviteModal from 'views/modals/create_invite_modal';
import LoginModal from 'views/modals/login_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import { setActiveAccount } from 'controllers/app/login';

const CommunityLabel: m.Component<{
  chain?: ChainInfo,
  community?: CommunityInfo,
  showStatus?: boolean,
  link?: boolean,
}> = {
  view: (vnode) => {
    const { chain, community, showStatus, link } = vnode.attrs;
    const size = 22;

    if (chain) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(ChainIcon, {
          chain,
          size,
          onclick: link ? (() => m.route.set(`/${chain.id}`)) : null,
        }),
      ]),
      m('.community-label-right', [
        m('.community-name-row', [
          m('span.community-name', chain.name),
          showStatus === true && m(ChainStatusIndicator, { hideLabel: true }),
        ]),
      ]),
    ]);

    if (community) return m('.CommunityLabel', [
      m('.community-label-left', [
        m(CommunityIcon, {
          community,
          size,
          onclick: link ? (() => m.route.set(`/${community.id}`)) : null
        }),
      ]),
      m('.community-label-right', [
        m('.community-name-row', [
          m('span.community-name', community.name),
          showStatus === true && [
            community.privacyEnabled && m('span.icon-lock'),
            !community.privacyEnabled && m('span.icon-globe'),
          ],
        ]),
      ]),
    ]);

    return m('.CommunityLabel', [
      m('.site-brand', 'Commonwealth'),
    ]);
  }
};

export const CurrentCommunityLabel: m.Component<{}> = {
  view: (vnode) => {
    const nodes = app.config.nodes.getAll();
    const activeNode = app.chain?.meta;
    const selectedNodes = nodes.filter((n) => activeNode && n.url === activeNode.url
                                       && n.chain && activeNode.chain && n.chain.id === activeNode.chain.id);
    const selectedNode = selectedNodes.length > 0 && selectedNodes[0];
    const selectedCommunity = app.community;

    if (selectedNode) {
      return m(CommunityLabel, { chain: selectedNode.chain, showStatus: true, link: true });
    } else if (selectedCommunity) {
      return m(CommunityLabel, { community: selectedCommunity.meta, showStatus: true, link: true });
    } else {
      return m(CommunityLabel, { showStatus: true, link: true });
    }
  }
};

const LoginSelector: m.Component<{ small?: boolean }, {
  profileLoadComplete: boolean
}> = {
  view: (vnode) => {
    const { small } = vnode.attrs;

    if (!app.isLoggedIn()) return m('.LoginSelector', [
      m('.login-selector-user', [
        m(Button, {
          iconLeft: Icons.USER,
          fluid: true,
          label: 'Log in',
          compact: true,
          size: small ? 'sm' : 'default',
          onclick: () => app.modals.create({ modal: LoginModal }),
        }),
      ]),
    ]);

    const activeAddressesWithRole = app.user.activeAccounts.filter((account) => {
      return app.user.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      });
    });
    const isPrivateCommunity = app.community?.meta.privacyEnabled;
    const isAdmin = app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    });

    const activeAccountsByRole = app.user.getActiveAccountsByRole();
    const nAccountsWithoutRole = activeAccountsByRole.filter(([account, role], index) => !role).length;

    if (!vnode.state.profileLoadComplete && app.profiles.allLoaded()) {
      vnode.state.profileLoadComplete = true;
    }

    return m(ButtonGroup, { class: 'LoginSelector' }, [
      (app.chain || app.community) && !app.chainPreloading && vnode.state.profileLoadComplete && m(Popover, {
        hasArrow: false,
        class: 'login-selector-popover',
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        position: 'top-end',
        inline: true,
        trigger: m(Button, {
          class: 'login-selector-left',
          label: [
            app.user.activeAccount ? m(User, {
              user: app.user.activeAccount,
              hideIdentityIcon: true,
            }) : [
              m('span.hidden-sm', [
                app.user.activeAccounts.length === 0 ? 'Connect an address' : 'Select an address'
              ]),
            ],
          ],
        }),
        content: m(Menu, { class: 'LoginSelectorMenu' }, [
          // address list
          (app.chain || app.community) && [
            activeAddressesWithRole.map((account) => m(MenuItem, {
              class: 'switch-user',
              align: 'left',
              basic: true,
              onclick: async (e) => {
                const currentActive = app.user.activeAccount;
                await setActiveAccount(account);
                m.redraw();
              },
              label: m(UserBlock, {
                user: account,
                selected: isSameAccount(account, app.user.activeAccount),
                showRole: true,
                compact: true
              }),
            })),
            activeAddressesWithRole.length > 0 && m(MenuDivider),
            !isPrivateCommunity && m(MenuItem, {
              onclick: () => app.modals.create({
                modal: SelectAddressModal,
              }),
              label: nAccountsWithoutRole > 0 ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
                : activeAddressesWithRole.length > 0 ? 'Manage addresses' : 'Connect a new address',
            }),
            (app.community?.meta.invitesEnabled || isAdmin) && m(MenuItem, {
              class: 'invite-user',
              align: 'left',
              basic: true,
              onclick: (e) => {
                e.preventDefault();
                const data = app.activeCommunityId()
                  ? { communityInfo: app.community.meta } : { chainInfo: app.chain.meta.chain }
                app.modals.create({
                  modal: CreateInviteModal,
                  data,
                });
              },
              label: 'Invite members',
            }),
          ],
        ]),
      }),
      m(Popover, {
        hasArrow: false,
        class: 'login-selector-popover',
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        position: 'top-end',
        inline: true,
        trigger: m(Button, {
          class: 'login-selector-right',
          intent: 'none',
          fluid: true,
          compact: true,
          size: small ? 'sm' : 'default',
          label: [
            m(Icon, { name: Icons.USER })
          ],
        }),
        content: m(Menu, { class: 'LoginSelectorMenu' }, [
          m(MenuItem, {
            onclick: () => (app.activeChainId() || app.activeCommunityId())
              ? m.route.set(`/${app.activeChainId() || app.activeCommunityId()}/notifications`)
              : m.route.set('/notifications'),
            label: 'Notification settings'
          }),
          m(MenuItem, {
            onclick: () => app.activeChainId()
              ? m.route.set(`/${app.activeChainId()}/settings`)
              : m.route.set('/settings'),
            label: 'Login & address settings'
          }),
          m(MenuDivider),
          m(MenuItem, {
            onclick: () => app.modals.create({ modal: FeedbackModal }),
            label: 'Send feedback',
          }),
          m(MenuItem, {
            onclick: () => {
              $.get(`${app.serverUrl()}/logout`).then(async () => {
                await initAppState();
                notifySuccess('Logged out');
                m.redraw();
              }).catch((err) => {
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              });
              mixpanel.reset();
            },
            label: 'Logout'
          }),
        ]),
      }),
    ]);
  }
};

export default LoginSelector;
