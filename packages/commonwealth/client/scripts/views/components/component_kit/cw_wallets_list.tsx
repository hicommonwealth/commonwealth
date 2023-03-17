/* @jsx m */

import ClassComponent from 'class_component';
import type { ChainNetwork } from 'common-common/src/types';
import { ChainBase } from 'common-common/src/types';
import { addressSwapper } from 'commonwealth/shared/utils';

import 'components/component_kit/cw_wallets_list.scss';

import { Account, AddressInfo, IWebWallet } from 'models';
import { signSessionWithAccount } from 'controllers/server/sessions';
import { createUserWithAddress } from 'controllers/app/login';
import { notifyInfo } from 'controllers/app/notifications';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import type Near from 'controllers/chain/near/adapter';
import type Substrate from 'controllers/chain/substrate/adapter';
import $ from 'jquery';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';

import app from 'state';
import {
  CWWalletOptionRow,
  CWWalletMissingOptionRow,
} from './cw_wallet_option_row';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { getClasses, isWindowMediumSmallInclusive } from './helpers';
import User from '../widgets/user';
import { CWIconButton } from './cw_icon_button';
import { CWSpinner } from './cw_spinner';
import { CWText } from './cw_text';

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
              m(CWSpinner, { size: 'small' }),
            ]),
        ]),
      ]
    );
  },
};

type AccountSelectorAttrs = {
  accounts: Array<{ address: string; meta?: { name: string } }>;
  onSelect: (idx: number) => void;
  walletChain: ChainBase;
  walletNetwork: ChainNetwork;
};

export class AccountSelector extends ClassComponent<AccountSelectorAttrs> {
  view(vnode: m.Vnode<AccountSelectorAttrs>) {
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
  connectAnotherWayOnclick?: () => void;
  darkMode?: boolean;
  showResetWalletConnect: boolean;
  hasNoWalletsLink?: boolean;
  wallets: Array<IWebWallet<any>>;
  setBodyType?: (bodyType: string) => void;
  accountVerifiedCallback?: (
    account: Account,
    newlyCreated: boolean,
    linked: boolean
  ) => void;
  setSelectedWallet: (wallet: IWebWallet<any>) => void;
  linking?: boolean;
  useSessionKeyLoginFlow?: boolean;
  hideConnectAnotherWayLink?: boolean;
};

export class CWWalletsList extends ClassComponent<WalletsListAttrs> {
  view(vnode: m.Vnode<WalletsListAttrs>) {
    const {
      connectAnotherWayOnclick,
      darkMode,
      showResetWalletConnect,
      hasNoWalletsLink = true,
      wallets,
      setSelectedWallet,
      accountVerifiedCallback,
      linking,
      useSessionKeyLoginFlow,
      hideConnectAnotherWayLink,
    } = vnode.attrs;

    // We call handleNormalWalletLogin if we're using connecting a new wallet, and
    // handleSessionKeyRevalidation if we're regenerating a session key.
    async function handleSessionKeyRevalidation(
      wallet: IWebWallet<any>,
      address: string
    ) {
      const timestamp = +new Date();
      const sessionAddress = await app.sessions.getOrCreateAddress(
        wallet.chain,
        wallet.getChainId().toString()
      );
      const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
      const validationBlockInfo = await wallet.getRecentBlock(chainIdentifier);

      // Start the create-user flow, so validationBlockInfo gets saved to the backend
      // This creates a new `Account` object with fields set up to be validated by verifyAddress.
      const { account } = await createUserWithAddress(
        address,
        wallet.name,
        chainIdentifier,
        sessionAddress,
        validationBlockInfo
      );
      account.setValidationBlockInfo(
        validationBlockInfo ? JSON.stringify(validationBlockInfo) : null
      );

      const { chainId, sessionPayload, signature } =
        await signSessionWithAccount(wallet, account, timestamp);
      await account.validate(signature, timestamp, chainId);
      await app.sessions.authSession(
        wallet.chain,
        chainId,
        sessionPayload,
        signature
      );
      console.log('Started new session for', wallet.chain, chainId);

      const newlyCreated = false;
      const isLinking = false;
      accountVerifiedCallback(account, newlyCreated, isLinking);
    }
    async function handleNormalWalletLogin(
      wallet: IWebWallet<any>,
      address: string
    ) {
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
        const sessionAddress = await app.sessions.getOrCreateAddress(
          wallet.chain,
          wallet.getChainId().toString()
        );
        const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
        const validationBlockInfo =
          wallet.getRecentBlock &&
          (await wallet.getRecentBlock(chainIdentifier));
        const { account: signerAccount, newlyCreated } =
          await createUserWithAddress(
            address,
            wallet.name,
            chainIdentifier,
            sessionAddress,
            validationBlockInfo
          );
        accountVerifiedCallback(signerAccount, newlyCreated, linking);
      } catch (err) {
        console.log(err);
      }
    }

    const resetWalletConnectOnclick = async (
      webWallets: Array<IWebWallet<any>>
    ) => {
      const wallet = webWallets.find(
        (w) =>
          w instanceof WalletConnectWebWalletController ||
          w instanceof TerraWalletConnectWebWalletController
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
                walletLabel={wallet.label}
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
                              address: wallet.accounts[accountIndex].address,
                              currentPrefix: (app.chain as Substrate).chain
                                .ss58Format,
                            });
                          } else {
                            address = wallet.accounts[accountIndex].address;
                          }
                          $('.AccountSelector').trigger('modalexit');
                          if (useSessionKeyLoginFlow) {
                            await handleSessionKeyRevalidation(wallet, address);
                          } else {
                            await handleNormalWalletLogin(wallet, address);
                          }
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
                        console.log(result.error || 'Could not login');
                      }
                    } else {
                      // Normal Wallet Flow
                      let address;
                      if (
                        wallet.chain === 'ethereum' ||
                        wallet.chain === 'solana'
                      ) {
                        address = wallet.accounts[0];
                      } else if (wallet.defaultNetwork === 'terra') {
                        address = wallet.accounts[0].address;
                      } else if (wallet.chain === 'cosmos') {
                        if (wallet.defaultNetwork === 'injective') {
                          address = wallet.accounts[0];
                        } else {
                          address = wallet.accounts[0].address;
                        }
                      }

                      if (useSessionKeyLoginFlow) {
                        await handleSessionKeyRevalidation(wallet, address);
                      } else {
                        await handleNormalWalletLogin(wallet, address);
                      }
                    }
                  }
                }}
              />
            ))}
            {wallets.length === 0 && (
              <CWWalletMissingOptionRow darkMode={darkMode} />
            )}
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
                    <CWText type="caption" className="no-wallets-popover">
                      If you cannot see your wallet, please ensure that your
                      wallet Chrome extension is <b>installed</b> and{' '}
                      <b>activated</b>.
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
        {!hideConnectAnotherWayLink && (
          <CWText
            type="b2"
            className={getClasses<{ darkMode?: boolean }>(
              { darkMode },
              'connect-another-way-link'
            )}
          >
            <a onclick={connectAnotherWayOnclick}>Connect Another Way</a>
          </CWText>
        )}
      </div>
    );
  }
}
