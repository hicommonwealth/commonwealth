/* @jsx m */

import $ from 'jquery';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import * as Cui from 'construct-ui';

import 'components/header/login_selector.scss';

import app from 'state';
import { navigateToSubpage, initAppState } from 'app';
import { ChainBase } from 'types';
import { AddressInfo, ITokenAdapter } from 'models';
import { isSameAccount, pluralize } from 'helpers';
import { notifySuccess } from 'controllers/app/notifications';
import {
  linkExistingAddressToChainOrCommunity,
  setActiveAccount,
} from 'controllers/app/login';

import User, { UserBlock } from 'views/components/widgets/user';
import EditProfileModal from 'views/modals/edit_profile_modal';
import { LoginModal } from 'views/modals/login_modal';
import FeedbackModal from 'views/modals/feedback_modal';
import SelectAddressModal from 'views/modals/select_address_modal';
import AddressSwapper from 'views/components/addresses/address_swapper';
import * as CustomIcons from 'views/mobile/mobile_icons';

const CHAINBASE_SHORT = {
  [ChainBase.CosmosSDK]: 'Cosmos',
  [ChainBase.Ethereum]: 'ETH',
  [ChainBase.NEAR]: 'NEAR',
  [ChainBase.Substrate]: 'Substrate',
  [ChainBase.Solana]: 'Solana',
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
      <Cui.Menu class="LoginSelectorMenu">
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
              showRole: true,
              compact: true,
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
                {mobile && m(CustomIcons.CustomEyeIcon)}
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
                {mobile && m(CustomIcons.CustomPencilIcon)}
                <span>Edit profile</span>
              </div>
            }
          />
        )}
        <Cui.MenuItem
          onclick={() =>
            app.modals.create({
              modal: SelectAddressModal,
            })
          }
          label={
            <div class="label-wrap">
              {mobile && m(CustomIcons.CustomWalletIcon)}
              <span>
                {nAccountsWithoutRole > 0
                  ? `${pluralize(nAccountsWithoutRole, 'other address')}...`
                  : activeAddressesWithRole.length > 0
                  ? 'Manage addresses'
                  : 'Connect a new address'}
              </span>
            </div>
          }
        />
      </Cui.Menu>
    );
  }
}

type LoginSelectorMenuRightAttrs = { mobile?: boolean };

export class LoginSelectorMenuRight
  implements m.Component<LoginSelectorMenuRightAttrs>
{
  view(vnode) {
    const { mobile } = vnode.attrs;

    return (
      <Cui.Menu class="LoginSelectorMenu">
        <Cui.MenuItem
          onclick={() =>
            app.activeChainId()
              ? navigateToSubpage('/notification-settings')
              : m.route.set('/notification-settings')
          }
          label={
            <div class="label-wrap">
              {mobile && m(CustomIcons.CustomBellIcon)}
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
              {mobile && m(CustomIcons.CustomUserIcon)}
              <span>Account settings</span>
            </div>
          }
        />
        <Cui.MenuDivider />
        <Cui.MenuItem
          onclick={() => app.modals.create({ modal: FeedbackModal })}
          label={
            <div class="label-wrap">
              {mobile && m(CustomIcons.CustomCommentIcon)}
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
            mixpanel.reset();
          }}
          label={
            <div class="label-wrap">
              {mobile && m(CustomIcons.CustomLogoutIcon)}
              <span>Logout</span>
            </div>
          }
        />
      </Cui.Menu>
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
              onclick={() => app.modals.create({ modal: LoginModal })}
            />
          </div>
        </div>
      );

    const activeAddressesWithRole = app.user.activeAccounts.filter(
      (account) => {
        return app.user.getRoleInCommunity({
          account,
          chain: app.activeChainId(),
        });
      }
    );

    const activeAccountsByRole = app.user.getActiveAccountsByRole();

    const nAccountsWithoutRole = activeAccountsByRole.filter(
      ([role]) => !role
    ).length;

    if (!this.profileLoadComplete && app.profiles.allLoaded()) {
      this.profileLoadComplete = true;
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

    return (
      <Cui.ButtonGroup class="LoginSelector">
        {app.chain &&
          !app.chainPreloading &&
          this.profileLoadComplete &&
          !app.user.activeAccount && (
            <Cui.Button
              onclick={async () => {
                if (samebaseAddresses.length === 1 && !hasTermsOfService) {
                  const originAddressInfo = samebaseAddresses[0];

                  if (originAddressInfo) {
                    try {
                      const targetChain =
                        joiningChain || originAddressInfo.chain;

                      const address = originAddressInfo.address;

                      const res = await linkExistingAddressToChainOrCommunity(
                        address,
                        targetChain,
                        originAddressInfo.chain
                      );

                      if (res && res.result) {
                        const {
                          verification_token,
                          addresses,
                          encodedAddress,
                        } = res.result;
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
                            a.address === encodedAddress &&
                            a.chain === targetChain
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
              }}
              label={
                <span class="hidden-sm">
                  {samebaseAddresses.length === 0
                    ? `No ${
                        CHAINBASE_SHORT[app.chain?.meta?.chain.base] || ''
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
            <Cui.Popover
              hasArrow={false}
              class="login-selector-popover"
              closeOnContentClick={true}
              transitionDuration={0}
              hoverCloseDelay={0}
              position="top-end"
              inline={true}
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
        <Cui.Popover
          hasArrow={false}
          class="login-selector-popover"
          closeOnContentClick={true}
          transitionDuration={0}
          hoverCloseDelay={0}
          position="top-end"
          trigger={
            <Cui.Button
              class="login-selector-right"
              intent="none"
              fluid={true}
              compact={true}
              size={small ? 'sm' : 'default'}
              label={<Cui.Icon name={Cui.Icons.USER} />}
            />
          }
          content={<LoginSelectorMenuRight />}
        />
      </Cui.ButtonGroup>
    );
  }
}
