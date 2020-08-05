import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { Button, ButtonGroup, Icon, Icons, List, Menu, MenuItem, MenuDivider,
  Popover } from 'construct-ui';

import app from 'state';
import { ChainInfo, CommunityInfo } from 'models';
import { isSameAccount } from 'helpers';
import { initAppState } from 'app';
import { notifySuccess } from 'controllers/app/notifications';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import User, { UserBlock } from 'views/components/widgets/user';
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

const LoginSelector : m.Component<{}, { showAddressSelectionHint: boolean }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return m('.LoginSelector', [
      m('.login-selector-user', [
        m(Button, {
          iconLeft: Icons.USER,
          fluid: true,
          label: 'Log in',
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

    // wrap the popover in another popover, to display address selection hint
    // only show the onboarding hint if 1) we are in a community, 2) the user has a compatible address, and
    // 3) no address is currently active
    const shouldShowHint = vnode.state.showAddressSelectionHint === undefined
      && (app.chain || app.community)
      && app.user.activeAccount === null
      && app.user.activeAccounts.length !== 0;
    if (shouldShowHint) {
      vnode.state.showAddressSelectionHint = true;
    }
    const wrapHint = (component) => m(Popover, {
      class: 'login-selector-hint-popover',
      closeOnContentClick: true,
      closeOnOutsideClick: false,
      transitionDuration: 0,
      hoverCloseDelay: 0,
      position: 'top-end',
      onInteraction: () => {
        vnode.state.showAddressSelectionHint = false;
      },
      isOpen: vnode.state.showAddressSelectionHint,
      content: 'Select an address to start posting or commenting',
      inline: true,
      trigger: component
    });

    return m('.LoginSelector', [
      wrapHint(m(Popover, {
        class: 'login-selector-popover',
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        position: 'top-end',
        inline: true,
        trigger: m(Button, {
          intent: 'none',
          fluid: true,
          compact: true,
          onclick: (e) => {
            vnode.state.showAddressSelectionHint = false;
          },
          label: [
            (!app.chain && !app.community) ? 'Logged in'
              : (app.user.activeAccount !== null) ? m(User, { user: app.user.activeAccount, showRole: true })
                : 'Select an address',
          ],
          iconRight: Icons.CHEVRON_DOWN,
        }),
        content: m(Menu, { class: 'LoginSelectorMenu' }, [
          // address list
          (app.chain || app.community) && [
            activeAddressesWithRole.map((account) => m(MenuItem, {
              class: 'switch-user',
              align: 'left',
              basic: true,
              onclick: (e) => {
                const currentActive = app.user.activeAccount;
                setActiveAccount(account).then(() => {
                  if (!isSameAccount(currentActive, app.user.activeAccount)) {
                    m.redraw();
                  }
                });
              },
              label: m(UserBlock, {
                user: account,
                selected: isSameAccount(account, app.user.activeAccount),
                compact: true
              }),
            })),
            !isPrivateCommunity && m(MenuItem, {
              style: 'margin-top: 4px',
              onclick: () => app.modals.create({
                modal: SelectAddressModal,
              }),
              label: [ 'Add ', app.chain ? `a ${app.chain.meta.chain.symbol}` : 'an', ' address', ],
            }),
            m(MenuDivider),
          ],
          m(MenuItem, {
            onclick: () => app.activeChainId()
              ? m.route.set(`/${app.activeChainId()}/settings`)
              : m.route.set('/settings'),
            label: 'Settings'
          }),
          m(MenuItem, {
            onclick: () => app.modals.create({ modal: FeedbackModal }),
            label: 'Send feedback',
          }),
          m(MenuItem, {
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
            label: 'Logout'
          }),
        ]),
      })),
    ]);
  }
};

export default LoginSelector;
