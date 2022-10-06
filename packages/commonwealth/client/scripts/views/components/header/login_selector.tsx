/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import * as Cui from 'construct-ui';
import _ from 'lodash';

import 'components/header/login_selector.scss';

import app from 'state';
import { navigateToSubpage, initAppState } from 'app';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import { AddressInfo, ITokenAdapter } from 'models';
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
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { isWindowMediumSmallInclusive } from '../component_kit/helpers';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/cw_button';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { AccountSelector } from '../component_kit/cw_wallets_list';
import SelectAddressModal from '../../modals/select_address_modal';
import { CWToggle } from '../component_kit/cw_toggle';

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
  activeAddressesWithRole: any;
  mobile?: boolean;
  nAccountsWithoutRole: number;
};

export class LoginSelectorMenuLeft
  implements m.ClassComponent<LoginSelectorMenuLeftAttrs>
{
  view(vnode) {
    const { activeAddressesWithRole, nAccountsWithoutRole, mobile } =
      vnode.attrs;

    return (
      <>
        {activeAddressesWithRole.map((account) => (
          <Cui.MenuItem
            align="left"
            basic={true}
            onclick={async () => {
              await setActiveAccount(account);
              m.redraw();
            }}
            label={m(UserBlock, {
              user: account,
              selected: isSameAccount(account, app.user.activeAccount),
              showRole: false,
              compact: true,
              avatarSize: 16,
            })}
          />
        ))}
        {activeAddressesWithRole.length > 0 && <Cui.MenuDivider />}
        {activeAddressesWithRole.length > 0 && app.activeChainId() && (
          <Cui.MenuItem
            onclick={() => {
              const pf = app.user.activeAccount.profile;
              if (app.chain) {
                navigateToSubpage(`/account/${pf.address}`);
              }
            }}
            label={
              <div class="label-wrap">
                {mobile && <CWIcon iconName="views" />}
                <span>View profile</span>
              </div>
            }
          />
        )}
        {activeAddressesWithRole.length > 0 && app.activeChainId() && (
          <Cui.MenuItem
            onclick={(e) => {
              e.preventDefault();
              app.modals.create({
                modal: EditProfileModal,
                data: {
                  account: app.user.activeAccount,
                  refreshCallback: () => m.redraw(),
                },
              });
            }}
            label={
              <div class="label-wrap">
                {mobile && <CWIcon iconName="edit" />}
                <span>Edit profile</span>
              </div>
            }
          />
        )}
        <Cui.MenuItem
          onclick={() => {
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
          label={
            <div class="label-wrap">
              {mobile && <CWIcon iconName="wallet" />}
              <span>
                {nAccountsWithoutRole > 0
                  ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
                  : 'Connect a new address'}
              </span>
            </div>
          }
        />
      </>
    );
  }
}

type LoginSelectorMenuRightAttrs = { mobile?: boolean };

export class LoginSelectorMenuRight
  implements m.Component<LoginSelectorMenuRightAttrs>
{
  view(vnode) {
    const { mobile } = vnode.attrs;
    const isDarkModeOn = localStorage.getItem('dark-mode-state') === 'on';
    return (
      <>
        <Cui.MenuItem
          onclick={() => m.route.set('/notification-settings')}
          label={
            <div class="label-wrap">
              {mobile && <CWIcon iconName="bell" />}
              <span>Notification settings</span>
            </div>
          }
        />
        <Cui.MenuItem
          onclick={() =>
            app.activeChainId()
              ? navigateToSubpage('/settings')
              : m.route.set('/settings')
          }
          label={
            <div class="label-wrap">
              {mobile && <CWIcon iconName="person" />}
              <span>Account settings</span>
            </div>
          }
        />
        <Cui.MenuItem
          class="dark-mode-toggle"
          onclick={(e) => {
            if (isDarkModeOn) {
              localStorage.setItem('dark-mode-state', 'off');
              document
                .getElementsByTagName('html')[0]
                .classList.remove('invert');
            } else {
              document.getElementsByTagName('html')[0].classList.add('invert');
              localStorage.setItem('dark-mode-state', 'on');
            }
            e.stopPropagation();
            m.redraw();
          }}
          label={
            <div class="label-wrap">
              <CWToggle checked={isDarkModeOn} onchange={(e) => {}} />
              <span>Dark mode</span>
            </div>
          }
        />
        <Cui.MenuDivider />
        <Cui.MenuItem
          onclick={() => app.modals.create({ modal: FeedbackModal })}
          label={
            <div class="label-wrap">
              {mobile && <CWIcon iconName="feedback" />}
              <span>Send feedback</span>
            </div>
          }
        />
        <Cui.MenuItem
          onclick={() => {
            $.get(`${app.serverUrl()}/logout`)
              .then(async () => {
                await initAppState();
                notifySuccess('Logged out');
                m.redraw();
              })
              .catch(() => {
                // eslint-disable-next-line no-restricted-globals
                location.reload();
              });
          }}
          label={
            <div class="label-wrap">
              {mobile && <CWIcon iconName="logout" />}
              <span>Logout</span>
            </div>
          }
        />
      </>
    );
  }
}

type TOSModalAttrs = {
  onAccept: () => void;
};

// TODO: Replace this with a proper TOS Compoment when we have one
class TOSModal implements m.ClassComponent<TOSModalAttrs> {
  view(vnode) {
    return (
      <div class="TOSModal">
        <div class="close-button-wrapper">
          <CWIconButton
            iconButtonTheme="primary"
            iconName="close"
            iconSize="small"
            className="close-icon"
            onclick={() => $('.TOSModal').trigger('modalexit')}
          />
        </div>
        <div class="content-wrapper">
          <CWText>
            By clicking accept you agree to the community's Terms of Service
          </CWText>
          <CWButton onclick={vnode.attrs.onAccept} label="Accept"></CWButton>{' '}
        </div>
      </div>
    );
  }
}

type LoginSelectorAttrs = { small?: boolean };

export class LoginSelector implements m.ClassComponent<LoginSelectorAttrs> {
  private profileLoadComplete: boolean;

  view(vnode) {
    const { small } = vnode.attrs;

    if (!app.isLoggedIn())
      return (
        <div class="LoginSelector">
          <div class="login-selector-user">
            <Cui.Button
              iconLeft={Cui.Icons.USER}
              fluid={true}
              label="Log in"
              compact={true}
              size={small ? 'sm' : 'default'}
              onclick={() => {
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
        </div>
      );

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
      ([account, role], index) => !role
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
          m.redraw();
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
      <Cui.ButtonGroup class="LoginSelector">
        {app.chain &&
          !app.chainPreloading &&
          this.profileLoadComplete &&
          !app.user.activeAccount && (
            <Cui.Button
              onclick={async () => {
                if (hasTermsOfService) {
                  // TODO: Replace this with a much prettier TOS
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
                <span class="hidden-sm">
                  {sameBaseAddressesRemoveDuplicates.length === 0
                    ? `No ${
                        CHAINNETWORK_SHORT[app.chain?.meta?.network] ||
                        CHAINBASE_SHORT[app.chain?.meta?.base] ||
                        ''
                      } address`
                    : 'Join'}
                </span>
              }
            />
          )}
        {app.chain &&
          !app.chainPreloading &&
          this.profileLoadComplete &&
          app.user.activeAccount && (
            <Cui.PopoverMenu
              hasArrow={false}
              closeOnContentClick={true}
              transitionDuration={0}
              hoverCloseDelay={0}
              position="top-end"
              trigger={
                <Cui.Button
                  label={m(User, {
                    user: app.user.activeAccount,
                    hideIdentityIcon: true,
                  })}
                />
              }
              content={
                <LoginSelectorMenuLeft
                  activeAddressesWithRole={activeAddressesWithRole}
                  nAccountsWithoutRole={nAccountsWithoutRole}
                />
              }
            />
          )}
        <Cui.PopoverMenu
          hasArrow={false}
          closeOnContentClick={true}
          transitionDuration={0}
          hoverCloseDelay={0}
          position="top-end"
          overlayClass="LoginSelectorMenuRight"
          trigger={
            <Cui.Button
              class="login-selector-right-button"
              intent="none"
              fluid={true}
              compact={true}
              size={small ? 'sm' : 'default'}
              label={<CWIcon iconName="person" iconSize="small" />}
            />
          }
          content={<LoginSelectorMenuRight />}
        />
      </Cui.ButtonGroup>
    );
  }
}
