/* @jsx m */

import m from 'mithril';
import app from 'state';
import $ from 'jquery';
import { Spinner } from 'construct-ui';
import { ChainBase, ChainNetwork } from 'common-common/src/types';

import 'components/component_kit/cw_wallets_list.scss';

import { Account, AddressInfo, IWebWallet } from 'models';
import { notifyInfo } from 'controllers/app/notifications';
import { createUserWithAddress } from 'controllers/app/login';
import Near from 'controllers/chain/near/main';
import Substrate from 'controllers/chain/substrate/main';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import { addressSwapper } from 'commonwealth/shared/utils';
import { CWText } from './cw_text';
import { CWWalletOptionRow } from './cw_wallet_option_row';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { getClasses, isWindowMediumSmallInclusive } from './helpers';
import User from '../widgets/user';
import { CWIconButton } from './cw_icon_button';

// Copied over from the old wallet selector with modifications
// TODO: This should eventually be replaced with a component native to the new flow
const LinkAccountItem: m.Component<
  {
    account: { address: string; meta?: { name: string } };
    walletNetwork: ChainNetwork;
    walletChain: ChainBase;
    onSelect: (idx: number) => void;
    idx: number;
  },
  { linking: boolean }
> = {
  view: (vnode) => {
    const { account, walletNetwork, walletChain, onSelect, idx } = vnode.attrs;
    const address = app.chain
      ? addressSwapper({
          address: account.address,
          currentPrefix: parseInt(
            (app.chain as Substrate)?.meta.ss58Prefix,
            10
          ),
        })
      : account.address;
    const baseName = app.chain?.meta.base || walletChain;
    const capitalizedBaseName = `${baseName
      .charAt(0)
      .toUpperCase()}${baseName.slice(1)}`;
    const name =
      account.meta?.name ||
      `${capitalizedBaseName} address ${account.address.slice(0, 6)}...`;
    return m(
      '.account-item',
      {
        class: `account-item-emphasized`,
        onclick: () => onSelect(idx),
      },
      [
        m('.account-item-avatar', [
          m(
            '.account-user',
            m(User, {
              user: new AddressInfo(
                null,
                address,
                app.chain?.id || walletNetwork
              ),
              avatarOnly: true,
              avatarSize: 40,
            })
          ),
        ]),
        m('.account-item-left', [
          m('.account-item-name', `${name}`),
          m('.account-item-address', [
            m(
              '.account-user',
              m(User, {
                user: new AddressInfo(
                  null,
                  address,
                  app.chain?.id || walletNetwork
                ),
                hideAvatar: true,
              })
            ),
          ]),
          vnode.state.linking &&
            m('p.small-text', 'Check your wallet for a confirmation prompt.'),
        ]),
        m('.account-item-right', [
          vnode.state.linking &&
            m('.account-waiting', [
              // TODO: show a (?) icon with a tooltip explaining to check your wallet
              m(Spinner, { size: 'xs', active: true }),
            ]),
        ]),
      ]
    );
  },
};

export class AccountSelector
  implements
    m.ClassComponent<{
      accounts: Array<{ address: string; meta?: { name: string } }>;
      walletNetwork: ChainNetwork;
      walletChain: ChainBase;
      onSelect: (idx: number) => void;
    }>
{
  view(vnode) {
    const { accounts, walletNetwork, walletChain, onSelect } = vnode.attrs;
    return (
      <div class="AccountSelector">
        <div class="close-button-wrapper">
          <CWIconButton
            iconButtonTheme="primary"
            iconName="close"
            iconSize="small"
            className="close-icon"
            onclick={() => $('.AccountSelector').trigger('modalexit')}
          />
        </div>

        {accounts.map((account, idx) => {
          return m(LinkAccountItem, {
            account,
            walletChain,
            walletNetwork,
            onSelect,
            idx,
          });
        })}
      </div>
    );
  }
}

type WalletsListAttrs = {
  connectAnotherWayOnclick: () => void;
  darkMode?: boolean;
  showResetWalletConnect: boolean;
  hasNoWalletsLink?: boolean;
  wallets: Array<IWebWallet<any>>;
  setBodyType: (bodyType: string) => void;
  accountVerifiedCallback: (account: Account) => void;
  setSelectedWallet: (wallet: IWebWallet<any>) => void;
  linking: boolean;
};

export class CWWalletsList implements m.ClassComponent<WalletsListAttrs> {
  view(vnode) {
    const {
      connectAnotherWayOnclick,
      darkMode,
      showResetWalletConnect,
      hasNoWalletsLink = true,
      wallets,
      setSelectedWallet,
      accountVerifiedCallback,
      linking,
    } = vnode.attrs;

    async function handleNormalWalletLogin(wallet, address) {
      if (app.isLoggedIn()) {
        const { result } = await $.post(`${app.serverUrl()}/getAddressStatus`, {
          address:
            wallet.chain === ChainBase.Substrate
              ? addressSwapper({
                  address,
                  currentPrefix: parseInt(
                    (app.chain as Substrate)?.meta.ss58Prefix,
                    10
                  ),
                })
              : address,
          chain: app.activeChainId() ?? wallet.chain,
          jwt: app.user.jwt,
        });
        if (result.exists && result.belongsToUser) {
          notifyInfo('This address is already linked to your current account.');
          return;
        }
        if (result.exists) {
          notifyInfo(
            'This address is already linked to another account. Signing will transfer ownership to your account.'
          );
        }
      }

      try {
        const { account: signerAccount, newlyCreated } =
          await createUserWithAddress(
            address,
            wallet.name,
            app.chain?.id || wallet.defaultNetwork
          );
        accountVerifiedCallback(signerAccount, newlyCreated, linking);
      } catch (err) {
        console.log(err);
      }
    }

    const resetWalletConnectOnclick = async (webWallets) => {
      const wallet = webWallets.find(
        (w) => w instanceof WalletConnectWebWalletController
      );
      await wallet.reset();
      if (isWindowMediumSmallInclusive(window.innerWidth)) {
        $('.LoginMobile').trigger('modalexit');
      } else {
        $('.LoginDesktop').trigger('modalexit');
      }
      m.redraw();
    };

    return (
      <div class="WalletsList">
        <div class="wallets-and-link-container">
          <div
            class={getClasses<{ darkMode?: boolean }>({ darkMode }, 'wallets')}
          >
            {wallets.map((wallet: IWebWallet<any>) => (
              <CWWalletOptionRow
                walletName={wallet.name}
                darkMode={darkMode}
                onclick={async () => {
                  await wallet.enable();
                  setSelectedWallet(wallet);

                  if (wallet.chain === 'substrate') {
                    app.modals.create({
                      modal: AccountSelector,
                      data: {
                        accounts: wallet.accounts,
                        walletNetwork: wallet.defaultNetwork,
                        walletChain: wallet.chain,
                        onSelect: async (accountIndex) => {
                          let address;
                          if (app.chain) {
                            address = addressSwapper({
                              address: wallet.accounts[0].address,
                              currentPrefix: (app.chain as Substrate).chain
                                .ss58Format,
                            });
                          } else {
                            address = wallet.accounts[accountIndex].address;
                          }
                          $('.AccountSelector').trigger('modalexit');
                          await handleNormalWalletLogin(wallet, address);
                        },
                      },
                    });
                  } else {
                    if (wallet.chain === 'near') {
                      // Near Redirect Flow
                      const WalletAccount = (await import('near-api-js'))
                        .WalletAccount;
                      if (!app.chain.apiInitialized) {
                        await app.chain.initApi();
                      }
                      const nearWallet = new WalletAccount(
                        (app.chain as Near).chain.api,
                        'commonwealth_near'
                      );
                      if (nearWallet.isSignedIn()) {
                        nearWallet.signOut();
                      }
                      const redirectUrl = !app.isCustomDomain()
                        ? `${
                            window.location.origin
                          }/${app.activeChainId()}/finishNearLogin`
                        : `${window.location.origin}/finishNearLogin`;
                      nearWallet.requestSignIn({
                        contractId: (app.chain as Near).chain.isMainnet
                          ? 'commonwealth-login.near'
                          : 'commonwealth-login.testnet',
                        successUrl: redirectUrl,
                        failureUrl: redirectUrl,
                      });
                    } else if (wallet.defaultNetwork === 'axie-infinity') {
                      // Axie Redirect Flow
                      const result = await $.post(
                        `${app.serverUrl()}/auth/sso`,
                        {
                          issuer: 'AxieInfinity',
                        }
                      );
                      if (
                        result.status === 'Success' &&
                        result.result.stateId
                      ) {
                        const stateId = result.result.stateId;

                        // redirect to axie page for login
                        // eslint-disable-next-line max-len
                        window.location.href = `https://app.axieinfinity.com/login/?src=commonwealth&stateId=${stateId}`;
                      } else {
                        vnode.state.error(result.error || 'Could not login');
                      }
                    } else {
                      // Normal Wallet Flow
                      let address;
                      if (
                        wallet.chain === 'ethereum' ||
                        wallet.chain === 'solana'
                      ) {
                        address = wallet.accounts[0];
                      } else if (wallet.chain === 'cosmos') {
                        address = wallet.accounts[0].address;
                      } else if (wallet.defaultNetwork === 'terra') {
                        address = wallet.accounts[0].address;
                      }
                      await handleNormalWalletLogin(wallet, address);
                    }
                  }
                }}
              />
            ))}
          </div>
          <div className="wallet-list-links">
            {showResetWalletConnect && (
              <CWText
                type="caption"
                className={getClasses<{ darkMode?: boolean }>(
                  { darkMode },
                  'reset-wc-link'
                )}
              >
                <a
                  href="#"
                  onclick={resetWalletConnectOnclick.bind(this, wallets)}
                >
                  Reset WalletConnect
                </a>
              </CWText>
            )}
            {hasNoWalletsLink && (
              <CWTooltip
                interactionType="click"
                tooltipContent={
                  <>
                    <CWText type="caption">
                      If you don’t see your wallet then make sure:
                    </CWText>
                    <CWText type="caption">
                      • Your wallet chrome extension installed?
                    </CWText>
                    <CWText type="caption">
                      • Your wallet chrome extension active?
                    </CWText>
                  </>
                }
                tooltipType="solidArrow"
                trigger={
                  <CWText
                    type="caption"
                    className={getClasses<{ darkMode?: boolean }>(
                      { darkMode },
                      'no-wallet-link'
                    )}
                  >
                    Don't see your wallet?
                  </CWText>
                }
              />
            )}
          </div>
        </div>
        <CWText
          type="b2"
          className={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'connect-another-way-link'
          )}
        >
          <a onclick={connectAnotherWayOnclick}>Connect Another Way</a>
        </CWText>
      </div>
    );
  }
}
