/* eslint-disable @typescript-eslint/ban-types */
import 'components/header/login_selector.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'underscore';
import mixpanel from 'mixpanel-browser';

import {
  Button,
  ButtonGroup,
  Icon,
  Icons,
  Menu,
  MenuItem,
  MenuDivider,
  Popover,
} from 'construct-ui';

import app from 'state';
import { navigateToSubpage, initAppState } from 'app';
import { ChainBase } from 'types';
import { AddressInfo, ITokenAdapter } from 'models';
import { isSameAccount, pluralize } from 'helpers';

import { notifySuccess } from 'controllers/app/notifications';

import User, { UserBlock } from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import { LoginModal } from 'views/modals/login_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import AddressSwapper from 'views/components/addresses/address_swapper';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import {
  CustomPencilIcon,
  CustomCommentIcon,
  CustomLogoutIcon,
  CustomBellIcon,
  CustomUserIcon,
  CustomEyeIcon,
  CustomWalletIcon,
} from 'views/mobile/mobile_icons';

export const CHAINBASE_SHORT = {
  [ChainBase.CosmosSDK]: 'Cosmos',
  [ChainBase.Ethereum]: 'ETH',
  [ChainBase.NEAR]: 'NEAR',
  [ChainBase.Substrate]: 'Substrate',
  [ChainBase.Solana]: 'Solana',
};

export const LoginSelectorMenuLeft: m.Component<{
  activeAddressesWithRole: any;
  nAccountsWithoutRole: number;
  mobile?: boolean;
}> = {
  view: (vnode) => {
    const { activeAddressesWithRole, nAccountsWithoutRole, mobile } =
      vnode.attrs;
    return m(Menu, { class: 'LoginSelectorMenu' }, [
      // address list
      app.chain && [
        activeAddressesWithRole.map((account) =>
          m(MenuItem, {
            class: 'switch-user',
            align: 'left',
            basic: true,
            onclick: async (e) => {
              await setActiveAccount(account);
              m.redraw();
            },
            label: [
              m(UserBlock, {
                user: account,
                selected: isSameAccount(account, app.user.activeAccount),
                showRole: true,
                compact: true,
              }),
              // !account.profile?.name && m('.edit-profile-callout', [
              //   'Set a display name'
              // ]),
            ],
          })
        ),
        activeAddressesWithRole.length > 0 && m(MenuDivider),
        activeAddressesWithRole.length > 0 &&
          app.activeChainId() &&
          m(MenuItem, {
            onclick: () => {
              const pf = app.user.activeAccount.profile;
              if (app.chain) {
                navigateToSubpage(`/account/${pf.address}`);
              }
            },
            label: m('.label-wrap', [
              mobile && m(CustomEyeIcon),
              m('span', 'View profile'),
            ]),
          }),
        activeAddressesWithRole.length > 0 &&
          app.activeChainId() &&
          m(MenuItem, {
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
            label: m('.label-wrap', [
              mobile && m(CustomPencilIcon),
              m('span', 'Edit profile'),
            ]),
          }),
        m(MenuItem, {
          onclick: () =>
            app.modals.create({
              modal: SelectAddressModal,
            }),
          label: m('.label-wrap', [
            mobile && m(CustomWalletIcon),
            m(
              'span',
              nAccountsWithoutRole > 0
                ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
                : activeAddressesWithRole.length > 0
                ? 'Manage addresses'
                : 'Connect a new address'
            ),
          ]),
        }),
      ],
    ]);
  },
};

export const LoginSelectorMenuRight: m.Component<{ mobile?: boolean }, {}> = {
  view: (vnode) => {
    const { mobile } = vnode.attrs;
    return m(Menu, { class: 'LoginSelectorMenu' }, [
      m(MenuItem, {
        onclick: () =>
          app.activeChainId()
            ? navigateToSubpage('/notification-settings')
            : m.route.set('/notification-settings'),
        label: m('.label-wrap', [
          mobile && m(CustomBellIcon),
          m('span', 'Notification settings'),
        ]),
      }),
      m(MenuItem, {
        onclick: () =>
          app.activeChainId()
            ? navigateToSubpage('/settings')
            : m.route.set('/settings'),
        label: m('.label-wrap', [
          mobile && m(CustomUserIcon),
          m('span', 'Account settings'),
        ]),
      }),
      m(MenuDivider),
      m(MenuItem, {
        onclick: () => app.modals.create({ modal: FeedbackModal }),
        label: m('.label-wrap', [
          mobile && m(CustomCommentIcon),
          m('span', 'Send feedback'),
        ]),
      }),
      m(MenuItem, {
        onclick: () => {
          $.get(`${app.serverUrl()}/logout`)
            .then(async () => {
              await initAppState();
              notifySuccess('Logged out');
              m.redraw();
            })
            .catch((err) => {
              // eslint-disable-next-line no-restricted-globals
              location.reload();
            });
          mixpanel.reset();
        },
        label: m('.label-wrap', [
          mobile && m(CustomLogoutIcon),
          m('span', 'Logout'),
        ]),
      }),
    ]);
  },
};

const LoginSelector: m.Component<
  {
    small?: boolean;
  },
  {
    profileLoadComplete: boolean;
  }
> = {
  view: (vnode) => {
    const { small } = vnode.attrs;
    if (!app.isLoggedIn())
      return m('.LoginSelector', [
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

    const activeAddressesWithRole = app.user.activeAccounts.filter(
      (account) => {
        return app.user.getRoleInCommunity({
          account,
          chain: app.activeChainId(),
        });
      }
    );
    const isAdmin = app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
    });

    const activeAccountsByRole = app.user.getActiveAccountsByRole();
    const nAccountsWithoutRole = activeAccountsByRole.filter(
      ([account, role], index) => !role
    ).length;

    if (!vnode.state.profileLoadComplete && app.profiles.allLoaded()) {
      vnode.state.profileLoadComplete = true;
    }

    const joiningChainInfo = app.chain?.meta.chain;
    const joiningChain = joiningChainInfo?.id;

    let samebaseAddresses: AddressInfo[];

    // add all addresses if joining a community
    const joiningBase = joiningChainInfo?.base;
    if (!joiningBase) {
      samebaseAddresses = app.user.addresses;
    } else {
      samebaseAddresses = [];
      for (const addressInfo of app.user.addresses) {
        // add all items on same base as joining chain
        const addressBase = app.config.chains.getById(addressInfo.chain)?.base;
        if (addressBase === joiningBase) {
          // ensure doesn't already exist
          const addressExists = !!samebaseAddresses.find((prev) =>
            joiningBase === ChainBase.Substrate
              ? AddressSwapper({
                  address: prev.address,
                  currentPrefix: 42,
                }) ===
                AddressSwapper({
                  address: addressInfo.address,
                  currentPrefix: 42,
                })
              : prev.address === addressInfo.address
          );
          if (!addressExists) {
            samebaseAddresses.push(addressInfo);
          }
        }
      }
    }

    const activeCommunityMeta = app.chain?.meta?.chain;
    const hasTermsOfService = !!activeCommunityMeta?.terms;

    return m(ButtonGroup, { class: 'LoginSelector' }, [
      app.chain &&
        !app.chainPreloading &&
        vnode.state.profileLoadComplete &&
        !app.user.activeAccount &&
        m(Button, {
          class: 'login-selector-left',
          onclick: async (e) => {
            if (samebaseAddresses.length === 1 && !hasTermsOfService) {
              const originAddressInfo = samebaseAddresses[0];

              if (originAddressInfo) {
                try {
                  const targetChain = joiningChain || originAddressInfo.chain;

                  const address = originAddressInfo.address;

                  const res = await linkExistingAddressToChainOrCommunity(
                    address,
                    targetChain,
                    originAddressInfo.chain
                  );

                  if (res && res.result) {
                    const { verification_token, addresses, encodedAddress } =
                      res.result;
                    app.user.setAddresses(
                      addresses.map((a) => {
                        return new AddressInfo(
                          a.id,
                          a.address,
                          a.chain,
                          a.keytype,
                          a.is_magic
                        );
                      })
                    );
                    const addressInfo = app.user.addresses.find(
                      (a) =>
                        a.address === encodedAddress && a.chain === targetChain
                    );

                    const account = app.chain.accounts.get(
                      encodedAddress,
                      addressInfo.keytype
                    );
                    if (app.chain) {
                      account.setValidationToken(verification_token);
                    }
                    if (
                      joiningChain &&
                      !app.user.getRoleInCommunity({
                        account,
                        chain: joiningChain,
                      })
                    ) {
                      await app.user.createRole({
                        address: addressInfo,
                        chain: joiningChain,
                      });
                    }

                    await setActiveAccount(account);
                    if (
                      app.user.activeAccounts.filter((a) =>
                        isSameAccount(a, account)
                      ).length === 0
                    ) {
                      app.user.setActiveAccounts(
                        app.user.activeAccounts.concat([account])
                      );
                    }
                  } else {
                    // Todo: handle error
                  }

                  // If token forum make sure has token and add to app.chain obj
                  if (app.chain && ITokenAdapter.instanceOf(app.chain)) {
                    await app.chain.activeAddressHasToken(
                      app.user.activeAccount.address
                    );
                  }
                  m.redraw();
                } catch (err) {
                  console.error(err);
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
              samebaseAddresses.length === 0
                ? `No ${
                    CHAINBASE_SHORT[app.chain?.meta?.chain.base] || ''
                  } address`
                : 'Join',
            ]),
          ],
        }),
      app.chain &&
        !app.chainPreloading &&
        vnode.state.profileLoadComplete &&
        app.user.activeAccount &&
        m(Popover, {
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
              }),
            ],
          }),
          content: m(LoginSelectorMenuLeft, {
            activeAddressesWithRole,
            nAccountsWithoutRole,
          }),
        }),
      m(Popover, {
        hasArrow: false,
        class: 'login-selector-popover',
        closeOnContentClick: true,
        transitionDuration: 0,
        hoverCloseDelay: 0,
        position: 'top-end',
        trigger: m(Button, {
          class: 'login-selector-right',
          intent: 'none',
          fluid: true,
          compact: true,
          size: small ? 'sm' : 'default',
          label: [m(Icon, { name: Icons.USER })],
        }),
        content: m(LoginSelectorMenuRight),
      }),
    ]);
  },
};

export default LoginSelector;
