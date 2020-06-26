import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { Button, ButtonGroup, Icon, Icons, List, Menu, MenuItem, MenuDivider,
  Popover, PopoverMenu } from 'construct-ui';

import app from 'state';
import { ChainInfo, CommunityInfo } from 'models';
import { isSameAccount } from 'helpers';
import { initAppState } from 'app';
import { notifySuccess } from 'controllers/app/notifications';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import User, { UserBlock } from 'views/components/widgets/user';
import LinkNewAddressModal from 'views/modals/link_new_address_modal';
import LoginModal from 'views/modals/login_modal';
import EditIdentityModal from 'views/modals/edit_identity_modal';
import EditProfileModal from 'views/modals/edit_profile_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import { setActiveAccount } from 'controllers/app/login';

export const getSelectableCommunities = () => {
  return (app.config.communities.getAll() as (CommunityInfo | ChainInfo)[])
    .concat(app.config.chains.getAll())
    .sort((a, b) => a.name.localeCompare(b.name))
    .sort((a, b) => {
      // sort starred communities at top
      if (a instanceof ChainInfo && app.communities.isStarred(a.id, null)) return -1;
      if (a instanceof CommunityInfo && app.communities.isStarred(null, a.id)) return -1;
      return 0;
    })
    .filter((item) => {
      // only show chains with nodes
      return (item instanceof ChainInfo)
        ? app.config.nodes.getByChain(item.id)?.length
        : true;
    });
};

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

const LoginSelector : m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return m('.LoginSelector', [
      m('.login-selector-user', [
        m(Button, {
          intent: 'primary',
          iconLeft: Icons.USER,
          size: 'sm',
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

    return m('.LoginSelector', [
      m(ButtonGroup, { fluid: true }, [
        m(Popover, {
          class: 'login-selector-popover',
          closeOnContentClick: true,
          transitionDuration: 0,
          hoverCloseDelay: 0,
          position: 'top-end',
          trigger: m(Button, {
            intent: 'none',
            size: 'sm',
            fluid: true,
            compact: true,
            label: [
              (!app.chain && !app.community) ? 'Select a community'
                : (app.user.activeAccount !== null) ? m(User, { user: app.user.activeAccount })
                  : app.user.activeAccounts.length === 0 ? 'No address'
                    : 'Select an address',
              app.isLoggedIn() && m('.unseen-count', [
                m('.pip', (getSelectableCommunities() as any).map((item) => {
                  return app.user.unseenPosts[item.id]?.activePosts || 0;
                }).reduce((a, b) => { return a + b; }, 0)),
              ]),
            ],
            iconRight: Icons.CHEVRON_DOWN,
          }),
          content: m(Menu, { class: 'LoginSelectorMenu' }, [
            // address selector - only shown in communities
            (app.chain || app.community) && [
              activeAddressesWithRole.map((account) => m(MenuItem, {
                align: 'left',
                basic: true,
                onclick: (e) => {
                  setActiveAccount(account);
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
                label: 'Manage addresses',
              }),
              m(MenuDivider),
            ],
            // communities list
            (getSelectableCommunities() as any).concat(['home']).map((item) => {
              const getUnseenCount = (id) => {
                const isNew = app.isLoggedIn() && !app.user.unseenPosts[id];
                const unseenCount = app.user.unseenPosts[id]?.activePosts || 0;

                return m('.unseen-count', [
                  isNew && m('.pip', 'New'),
                  unseenCount > 0 && m('.pip', unseenCount),
                ]);
              };

              if (item instanceof ChainInfo) return m(MenuItem, {
                onclick: (e) => m.route.set(`/${item.id}`),
                class: app.communities.isStarred(item.id, null) ? 'starred' : '',
                label: [
                  m(CommunityLabel, { chain: item }),
                  getUnseenCount(item.id),
                ],
                selected: app.activeChainId() === item.id,
                contentRight: app.isLoggedIn() && app.user.isMember({
                  account: app.user.activeAccount,
                  chain: item.id
                }) && m('.community-star-toggle', {
                  onclick: (e) => {
                    app.communities.setStarred(item.id, null, !app.communities.isStarred(item.id, null));
                  }
                }, [
                  m(Icon, { name: Icons.STAR }),
                ]),
              });

              if (item instanceof CommunityInfo) return m(MenuItem, {
                onclick: (e) => m.route.set(`/${item.id}`),
                class: app.communities.isStarred(null, item.id) ? 'starred' : '',
                label: [
                  m(CommunityLabel, { community: item }),
                  getUnseenCount(item.id),
                ],
                selected: app.activeCommunityId() === item.id,
                contentRight: app.isLoggedIn() && app.user.isMember({
                  account: app.user.activeAccount,
                  community: item.id
                }) && m('.community-star-toggle', {
                  onclick: (e) => {
                    app.communities.setStarred(null, item.id, !app.communities.isStarred(null, item.id));
                  },
                }, [
                  m(Icon, { name: Icons.STAR }),
                ]),
              });

              return m(MenuItem, {
                onclick: (e) => m.route.set(`/`),
                label: 'More communities',
              });
            }),
            m(MenuDivider),
            // always shown
            m(MenuItem, {
              onclick: () => m.route.set('/settings'),
              // iconLeft: Icons.SETTINGS,
              label: 'Settings'
            }),
            m(MenuItem, {
              onclick: () => app.modals.create({ modal: FeedbackModal }),
              // iconLeft: Icons.SEND,
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
              // iconLeft: Icons.X_SQUARE,
              label: 'Logout'
            }),
          ]),
        }),
      ]),
    ]);
  }
};

export default LoginSelector;
