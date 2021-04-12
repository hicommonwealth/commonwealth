import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import { Button, ButtonGroup, Icon, Icons, Menu, MenuItem, MenuDivider,
  Popover } from 'construct-ui';

import app from 'state';
import { Account, AddressInfo, ChainBase, ChainInfo, CommunityInfo, RoleInfo, RolePermission } from 'models';
import { isSameAccount, pluralize } from 'helpers';
import { initAppState } from 'app';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { SignerPayloadRaw } from '@polkadot/types/types/extrinsic';
import { stringToHex } from '@polkadot/util';
import Substrate from 'controllers/chain/substrate/main';
import Ethereum from 'controllers/chain/ethereum/main';
import { SigningCosmosClient } from '@cosmjs/launchpad';
import { validationTokenToSignDoc } from 'adapters/chain/cosmos/keys';

import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';
import ChainStatusIndicator from 'views/components/chain_status_indicator';
import User, { UserBlock } from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import LoginModal from 'views/modals/login_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import { linkExistingAddressToChainOrCommunity, setActiveAccount } from 'controllers/app/login';
import { networkToBase } from 'models/types';

export const CHAINBASE_SHORT = {
  [ChainBase.CosmosSDK]: 'Cosmos',
  [ChainBase.Ethereum]: 'ETH',
  [ChainBase.NEAR]: 'NEAR',
  [ChainBase.Substrate]: 'Substrate',
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
            community.privacyEnabled && m(Icon, { name: Icons.LOCK, size: 'xs' }),
            !community.privacyEnabled && m(Icon, { name: Icons.GLOBE, size: 'xs' }),
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

const LoginSelector: m.Component<{
  small?: boolean
}, {
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
    const joiningChain = app.activeChainId();
    const joiningCommunity = app.activeCommunityId();
    const samebaseAddresses = app.user.addresses.filter((addr) => joiningChain ? networkToBase(addr.chain) === networkToBase(joiningChain) : true);

    const samebaseAddressesFiltered = samebaseAddresses.reduce((arr, current) => {
      if (!arr.find((item) => item.address === current.address && networkToBase(item.chain) === networkToBase(current.chain))) {
        return [...arr, current];
      }
      return arr;
    }, []);

    return m(ButtonGroup, { class: 'LoginSelector' }, [
      (app.chain || app.community) && !app.chainPreloading && vnode.state.profileLoadComplete && !app.user.activeAccount && m(Button, {
        class: 'login-selector-left',
        onclick: async (e) => {
          if (samebaseAddressesFiltered.length === 1) {
            const originAddressInfo = samebaseAddressesFiltered[0];

            if (originAddressInfo) {
              try {
                const address = originAddressInfo.address;

                const targetChain = joiningChain || originAddressInfo.chain;
                const res = await linkExistingAddressToChainOrCommunity(address, targetChain, originAddressInfo.chain, joiningCommunity);

                if (res && res.result) {
                  const { verification_token, addressId, addresses } = res.result;
                  app.user.setAddresses(addresses.map((a) => new AddressInfo(a.id, a.address, a.chain, a.keytype, a.is_magic)));
                  const addressInfo = app.user.addresses.find((a) => a.address === address && a.chain === targetChain);

                  const account = app.chain ? app.chain.accounts.get(address, addressInfo.keytype) : app.community.accounts.get(address, addressInfo.chain);
                  if (app.chain) {
                    account.setValidationToken(verification_token);
                  }

                  if (joiningChain && !app.user.getRoleInCommunity({ account, chain: joiningChain })) {
                    await app.user.createRole({ address: addressInfo, chain: joiningChain });
                  } else if (joiningCommunity && !app.user.getRoleInCommunity({ account, community: joiningCommunity })) {
                    await app.user.createRole({ address: addressInfo, community: joiningCommunity });
                  }

                  await setActiveAccount(account);
                  if (app.user.activeAccounts.filter((a) => isSameAccount(a, account)).length === 0) {
                    app.user.setActiveAccounts(app.user.activeAccounts.concat([account]));
                  }
                } else {
                  // Todo: handle error
                }

                m.redraw();
              } catch (e) {
                console.error(e);
              }
            }
          } else {
            app.modals.create({
              modal: SelectAddressModal,
            });
          }
        },
        label: [
          m('span.hidden-sm', [
            samebaseAddressesFiltered.length === 0
              ? `No ${CHAINBASE_SHORT[app.chain?.meta?.chain.base] || ''} address`
              : 'Join'
          ]),
        ],
      }),
      (app.chain || app.community) && !app.chainPreloading && vnode.state.profileLoadComplete && app.user.activeAccount && m(Popover, {
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
            m(User, {
              user: app.user.activeAccount,
              hideIdentityIcon: true,
            })
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
              label: [
                m(UserBlock, {
                  user: account,
                  selected: isSameAccount(account, app.user.activeAccount),
                  showRole: true,
                  compact: true
                }),
                // !account.profile?.name && m('.edit-profile-callout', [
                //   'Set a display name'
                // ]),
              ],
            })),
            activeAddressesWithRole.length > 0 && m(MenuDivider),
            activeAddressesWithRole.length > 0 && app.activeId() && m(MenuItem, {
              onclick: () => {
                const pf = app.user.activeAccount.profile;
                if (pf) {
                  m.route.set(`/${app.activeId()}/account/${pf.address}?base=${pf.chain}`);
                } else {
                  const a = app.user.activeAccount;
                  m.route.set(`/${app.activeId()}/account/${a.address}?base=${a.chain}`);
                }
              },
              label: 'View profile',
            }),
            activeAddressesWithRole.length > 0 && app.activeId() && m(MenuItem, {
              onclick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: EditProfileModal,
                  data: {
                    account: app.user.activeAccount,
                    refreshCallback: () => m.redraw(),
                  },
                });
              },
              label: 'Edit profile',
            }),
            !isPrivateCommunity && m(MenuItem, {
              onclick: () => app.modals.create({
                modal: SelectAddressModal,
              }),
              label: nAccountsWithoutRole > 0 ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
                : activeAddressesWithRole.length > 0 ? 'Manage addresses' : 'Connect a new address',
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
            label: 'Account settings'
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
