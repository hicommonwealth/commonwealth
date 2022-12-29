/* @jsx jsx */

import $ from 'jquery';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import _ from 'lodash';

import 'components/header/login_selector.scss';

import app from 'state';
import { navigateToSubpage, initAppState } from 'app';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { Account, AddressInfo, ITokenAdapter } from 'models';
import { isSameAccount, pluralize } from 'helpers';
import { notifySuccess } from 'controllers/app/notifications';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';
import { addressSwapper } from 'commonwealth/shared/utils';
import User, { UserBlock } from 'views/components/widgets/user';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import { NewLoginModal } from 'views/modals/login_modal';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/cw_button';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { AccountSelector } from '../component_kit/cw_wallets_list';
import { SelectAddressModal } from '../../modals/select_address_modal';
import { CWToggle } from '../component_kit/cw_toggle';
import { CWDivider } from '../component_kit/cw_divider';
import { CWPopover } from '../component_kit/cw_popover/cw_popover';

const CHAINBASE_SHORT = {
  [ChainBase.CosmosSDK]: 'Cosmos',
  [ChainBase.Ethereum]: 'ETH',
  [ChainBase.NEAR]: 'NEAR',
  [ChainBase.Substrate]: 'Substrate',
  [ChainBase.Solana]: 'Solana',
};

const CHAINNETWORK_SHORT = {
  [ChainNetwork.AxieInfinity]: 'Ronin',
  [ChainNetwork.Terra]: 'Terra',
};

type LoginSelectorMenuLeftAttrs = {
  activeAddressesWithRole: Array<Account>;
  nAccountsWithoutRole: number;
};

export class LoginSelectorMenuLeft extends ClassComponent<LoginSelectorMenuLeftAttrs> {
  view(vnode: ResultNode<LoginSelectorMenuLeftAttrs>) {
    const { activeAddressesWithRole, nAccountsWithoutRole } = vnode.attrs;

    return (
      <div className="LoginSelectorMenu">
        {activeAddressesWithRole.map((account) => (
          <div
            className="login-menu-item"
            onClick={async () => {
              await setActiveAccount(account);
              redraw();
            }}
          >
            {render(UserBlock, {
              user: account,
              selected: isSameAccount(account, app.user.activeAccount),
              showRole: false,
              compact: true,
              avatarSize: 16,
            })}
          </div>
        ))}
        {activeAddressesWithRole.length > 0 && <CWDivider />}
        {activeAddressesWithRole.length > 0 && app.activeChainId() && (
          <div
            className="login-menu-item"
            onClick={() => {
              const pf = app.user.activeAccount.profile;
              if (app.chain) {
                navigateToSubpage(`/account/${pf.address}`);
              }
            }}
          >
            <CWText type="caption">View profile</CWText>
          </div>
        )}
        {activeAddressesWithRole.length > 0 && app.activeChainId() && (
          <div
            className="login-menu-item"
            onClick={(e) => {
              e.preventDefault();
              app.modals.create({
                modal: EditProfileModal,
                data: {
                  account: app.user.activeAccount,
                  refreshCallback: () => redraw(),
                },
              });
            }}
          >
            <CWText type="caption">Edit profile</CWText>
          </div>
        )}
        <div
          className="login-menu-item"
          onClick={() => {
            if (nAccountsWithoutRole > 0) {
              app.modals.create({
                modal: SelectAddressModal,
              });
            } else {
              app.modals.create({
                modal: NewLoginModal,
                data: {
                  modalType: isWindowMediumSmallInclusive(window.innerWidth)
                    ? 'fullScreen'
                    : 'centered',
                  breakpointFn: isWindowMediumSmallInclusive,
                },
              });
            }
          }}
        >
          <CWText type="caption">
            {nAccountsWithoutRole > 0
              ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
              : 'Connect a new address'}
          </CWText>
        </div>
      </div>
    );
  }
}

export class LoginSelectorMenuRight extends ClassComponent {
  view() {
    const isDarkModeOn = localStorage.getItem('dark-mode-state') === 'on';

    return (
      <div className="LoginSelectorMenu">
        <div
          className="login-menu-item"
          onClick={() => setRoute('/notification-settings')}
        >
          <CWText type="caption">Notification settings</CWText>
        </div>
        <div
          className="login-menu-item"
          onClick={() =>
            app.activeChainId()
              ? navigateToSubpage('/settings')
              : setRoute('/settings')
          }
        >
          <CWText type="caption">Account settings</CWText>
        </div>
        <div className="login-menu-item">
          <CWToggle
            checked={isDarkModeOn}
            onchange={(e) => {
              if (isDarkModeOn) {
                localStorage.setItem('dark-mode-state', 'off');
                document
                  .getElementsByTagName('html')[0]
                  .classList.remove('invert');
              } else {
                document
                  .getElementsByTagName('html')[0]
                  .classList.add('invert');
                localStorage.setItem('dark-mode-state', 'on');
              }
              e.stopPropagation();
              redraw();
            }}
          />
          <CWText type="caption">Dark mode</CWText>
        </div>
        <CWDivider />
        <div
          className="login-menu-item"
          onClick={() => app.modals.create({ modal: FeedbackModal })}
        >
          <CWText type="caption">Send feedback</CWText>
        </div>
        <div
          className="login-menu-item"
          onClick={() => {
            $.get(`${app.serverUrl()}/logout`)
              .then(async () => {
                await initAppState();
                notifySuccess('Logged out');
                redraw();
              })
              .catch(() => {
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              });
          }}
        >
          <CWText type="caption">Logout</CWText>
        </div>
      </div>
    );
  }
}

type TOSModalAttrs = {
  onAccept: () => void;
};

// TODO: Replace this with a proper TOS Compoment when we have one
class TOSModal extends ClassComponent<TOSModalAttrs> {
  view(vnode: ResultNode<TOSModalAttrs>) {
    return (
      <div className="TOSModal">
        <div className="close-button-wrapper">
          <CWIconButton
            iconButtonTheme="primary"
            iconName="close"
            iconSize="small"
            className="close-icon"
            onClick={() => $('.TOSModal').trigger('modalexit')}
          />
        </div>
        <div className="content-wrapper">
          <CWText>
            By clicking accept you agree to the community's Terms of Service
          </CWText>
          <CWButton onClick={vnode.attrs.onAccept} label="Accept" />
        </div>
      </div>
    );
  }
}

export class LoginSelector extends ClassComponent {
  private profileLoadComplete: boolean;

  view() {
    if (!app.isLoggedIn()) {
      return (
        <div className="LoginSelector">
          <CWButton
            buttonType="tertiary-black"
            iconLeft="person"
            label="Log in"
            onClick={() => {
              app.modals.create({
                modal: NewLoginModal,
                data: {
                  modalType: isWindowMediumSmallInclusive(window.innerWidth)
                    ? 'fullScreen'
                    : 'centered',
                  breakpointFn: isWindowMediumSmallInclusive,
                },
              });
            }}
          />
        </div>
      );
    }

    const activeAddressesWithRole = app.user.activeAccounts.filter(
      (account) => {
        return app.roles.getRoleInCommunity({
          account,
          chain: app.activeChainId(),
        });
      }
    );

    const activeAccountsByRole = app.roles.getActiveAccountsByRole();

    const nAccountsWithoutRole = activeAccountsByRole.filter(
      ([role]) => !role
    ).length;

    if (!this.profileLoadComplete && app.profiles.allLoaded()) {
      this.profileLoadComplete = true;
    }

    const activeChainInfo = app.chain?.meta;
    const activeChainId = activeChainInfo?.id;

    // add all addresses if joining a community
    const activeBase = activeChainInfo?.base;
    const NON_INTEROP_NETWORKS = [ChainNetwork.AxieInfinity];
    const samebaseAddresses = app.user.addresses.filter((a, idx) => {
      // if no active chain, add all addresses
      if (!activeBase) return true;

      // add all items on same base as active chain
      const addressChainInfo = app.config.chains.getById(a.chain.id);
      if (addressChainInfo?.base !== activeBase) return false;

      // // ensure doesn't already exist
      const addressExists = !!app.user.addresses.slice(idx + 1).find(
        (prev) =>
          activeBase === ChainBase.Substrate &&
          (app.config.chains.getById(prev.chain.id)?.base ===
          ChainBase.Substrate
            ? addressSwapper({
                address: prev.address,
                currentPrefix: 42,
              }) ===
              addressSwapper({
                address: a.address,
                currentPrefix: 42,
              })
            : prev.address === a.address)
      );
      if (addressExists) return false;

      // filter additionally by chain network if in list of non-interop, unless we are on that chain
      // TODO: make this related to wallet.specificChains
      if (
        NON_INTEROP_NETWORKS.includes(addressChainInfo?.network) &&
        activeChainInfo?.network !== addressChainInfo?.network
      ) {
        return false;
      }
      return true;
    });

    // Extract unique addresses
    const uniqueAddresses = [];
    const sameBaseAddressesRemoveDuplicates = samebaseAddresses.filter(
      (addressInfo) => {
        if (!uniqueAddresses.includes(addressInfo.address)) {
          uniqueAddresses.push(addressInfo.address);
          return true;
        }
        return false;
      }
    );

    const activeCommunityMeta = app.chain?.meta;
    const hasTermsOfService = !!activeCommunityMeta?.terms;

    // Handles linking the existing address to the community
    async function linkToCommunity(accountIndex: number) {
      const originAddressInfo = sameBaseAddressesRemoveDuplicates[accountIndex];

      if (originAddressInfo) {
        try {
          const targetChain = activeChainId || originAddressInfo.chain.id;

          const address = originAddressInfo.address;

          const res = await linkExistingAddressToChainOrCommunity(
            address,
            targetChain,
            originAddressInfo.chain.id
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
                  a.wallet_id
                );
              })
            );
            const addressInfo = app.user.addresses.find(
              (a) => a.address === encodedAddress && a.chain.id === targetChain
            );

            const account = app.chain.accounts.get(
              encodedAddress,
              addressInfo.keytype
            );
            if (app.chain) {
              account.setValidationToken(verification_token);
              console.log('setting validation token');
            }
            if (
              activeChainId &&
              !app.roles.getRoleInCommunity({
                account,
                chain: activeChainId,
              })
            ) {
              await app.roles.createRole({
                address: _.omit(addressInfo, 'chain'),
                chain: activeChainId,
              });
            }
            await setActiveAccount(account);
            if (
              app.user.activeAccounts.filter((a) => isSameAccount(a, account))
                .length === 0
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
          redraw();
        } catch (err) {
          console.error(err);
        }
      }
    }

    // Handles displaying the login modal or the account selector modal
    // TODO: Replace with pretty modal
    async function performJoinCommunityLinking() {
      if (
        sameBaseAddressesRemoveDuplicates.length > 1 &&
        app.activeChainId() !== 'axie-infinity'
      ) {
        app.modals.create({
          modal: AccountSelector,
          data: {
            accounts: sameBaseAddressesRemoveDuplicates.map((addressInfo) => ({
              address: addressInfo.address,
            })),
            walletNetwork: activeChainInfo?.network,
            walletChain: activeChainInfo?.base,
            onSelect: async (accountIndex) => {
              await linkToCommunity(accountIndex);
              $('.AccountSelector').trigger('modalexit');
            },
          },
        });
      } else if (
        sameBaseAddressesRemoveDuplicates.length === 1 &&
        app.activeChainId() !== 'axie-infinity'
      ) {
        await linkToCommunity(0);
      } else {
        app.modals.create({
          modal: NewLoginModal,
          data: {
            modalType: isWindowMediumSmallInclusive(window.innerWidth)
              ? 'fullScreen'
              : 'centered',
            breakpointFn: isWindowMediumSmallInclusive,
          },
        });
      }
    }

    return (
      <div className="LoginSelector">
        {app.chain &&
          !app.chainPreloading &&
          this.profileLoadComplete &&
          !app.user.activeAccount && (
            <div className="join-button-container">
              <CWButton
                buttonType="tertiary-black"
                onClick={async () => {
                  if (hasTermsOfService) {
                    app.modals.create({
                      modal: TOSModal,
                      data: {
                        onAccept: async () => {
                          $('.TOSModal').trigger('modalexit');
                          await performJoinCommunityLinking();
                        },
                      },
                    });
                  } else {
                    await performJoinCommunityLinking();
                  }
                }}
                label={
                  sameBaseAddressesRemoveDuplicates.length === 0
                    ? `No ${
                        CHAINNETWORK_SHORT[app.chain?.meta?.network] ||
                        CHAINBASE_SHORT[app.chain?.meta?.base] ||
                        ''
                      } address`
                    : 'Join'
                }
              />
            </div>
          )}
        {app.chain &&
          !app.chainPreloading &&
          this.profileLoadComplete &&
          app.user.activeAccount && (
            <CWPopover
              trigger={
                <div className="left-button">
                  {render(User, {
                    user: app.user.activeAccount,
                    hideIdentityIcon: true,
                  })}
                </div>
              }
              content={
                <LoginSelectorMenuLeft
                  activeAddressesWithRole={activeAddressesWithRole}
                  nAccountsWithoutRole={nAccountsWithoutRole}
                />
              }
            />
          )}
        <CWPopover
          trigger={
            <div className="right-button">
              <CWIconButton iconName="person" iconButtonTheme="black" />
            </div>
          }
          content={<LoginSelectorMenuRight />}
        />
      </div>
    );
  }
}
