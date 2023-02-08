import React from 'react';

import { redraw} from

 'mithrilInterop';
import app from 'state';
import $ from 'jquery';
import { ChainBase } from 'common-common/src/types';
import type { ChainNetwork } from 'common-common/src/types';

import 'components/component_kit/cw_wallets_list.scss';
import { createUserWithAddress } from 'controllers/app/login';
import { notifyInfo } from 'controllers/app/notifications';
import TerraWalletConnectWebWalletController from 'controllers/app/webWallets/terra_walletconnect_web_wallet';
import { User } from '../user/user';
import { CWIconButton } from './cw_icon_button';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { CWText } from './cw_text';
import type { Account, IWebWallet } from 'models';
import { AddressInfo } from 'models';
import {
  CWWalletMissingOptionRow,
  CWWalletOptionRow,
} from './cw_wallet_option_row';
import { getClasses } from './helpers';
import WalletConnectWebWalletController from 'controllers/app/webWallets/walletconnect_web_wallet';
import type Near from 'controllers/chain/near/adapter';
import type Substrate from 'controllers/chain/substrate/adapter';
import { addressSwapper } from 'utils';
import { Modal } from './cw_modal';

const LinkAccountItem = (props: {
  account: { address: string; meta?: { name: string } };
  idx: number;
  onSelect: (idx: number) => void;
  walletChain: ChainBase;
  walletNetwork: ChainNetwork;
}) => {
  const { account, walletNetwork, walletChain, onSelect, idx } = props;

  const address = app.chain
    ? addressSwapper({
        address: account.address,
        currentPrefix: parseInt((app.chain as Substrate)?.meta.ss58Prefix, 10),
      })
    : account.address;

  const baseName = app.chain?.meta.base || walletChain;

  const capitalizedBaseName = `${baseName
    .charAt(0)
    .toUpperCase()}${baseName.slice(1)}`;

  const name =
    account.meta?.name ||
    `${capitalizedBaseName} address ${account.address.slice(0, 6)}...`;

  return (
    <div
      className="account-item account-item-emphasized"
      onClick={() => onSelect(idx)}
    >
      <div className="account-item-avatar">
        <div className="account-user">
          <User
            user={
              new AddressInfo(null, address, app.chain?.id || walletNetwork)
            }
            avatarOnly
            avatarSize={40}
          />
        </div>
      </div>
      <div className="account-item-left">
        <div className="account-item-name">{name}</div>
        <div className="account-item-address">
          <div className="account-user">
            <User
              user={
                new AddressInfo(null, address, app.chain?.id || walletNetwork)
              }
              hideAvatar
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type AccountSelectorProps = {
  accounts:
    | Array<{ address: string; meta?: { name: string } }>
    | readonly any[];
  onModalClose: () => void;
  onSelect: (idx: number) => void;
  walletChain: ChainBase;
  walletNetwork: ChainNetwork;
};

export const AccountSelector = (props: AccountSelectorProps) => {
  const { accounts, onModalClose, walletNetwork, walletChain, onSelect } =
    props;

  return (
    <div className="AccountSelector">
      <div className="close-button-wrapper">
        <CWIconButton
          iconButtonTheme="primary"
          iconName="close"
          iconSize="small"
          className="close-icon"
          onClick={() => onModalClose()}
        />
      </div>

      {accounts.map((account, idx) => {
        return (
          <LinkAccountItem
            account={account}
            walletChain={walletChain}
            walletNetwork={walletNetwork}
            onSelect={onSelect}
            idx={idx}
          />
        );
      })}
    </div>
  );
};

type WalletsListProps = {
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
};

export const CWWalletsList = (props: WalletsListProps) => {
  const {
    connectAnotherWayOnclick,
    darkMode,
    showResetWalletConnect,
    hasNoWalletsLink = true,
    wallets,
    setSelectedWallet,
    accountVerifiedCallback,
    linking,
  } = props;

  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

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
      const sessionPublicAddress = await app.sessions.getOrCreateAddress(
        wallet.chain,
        wallet.getChainId()
      );
      const chainIdentifier = app.chain?.id || wallet.defaultNetwork;
      const validationBlockInfo =
        wallet.getRecentBlock && (await wallet.getRecentBlock(chainIdentifier));
      const { account: signerAccount, newlyCreated } =
        await createUserWithAddress(
          address,
          wallet.name,
          chainIdentifier,
          sessionPublicAddress,
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

    redraw();
  };

  return (
    <div className="WalletsList">
      <div className="wallets-and-link-container">
        <div
          className={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'wallets'
          )}
        >
          {wallets.map((wallet: IWebWallet<any>) => (
            <>
              <CWWalletOptionRow
                walletName={wallet.name}
                walletLabel={wallet.label}
                darkMode={darkMode}
                onClick={async () => {
                  await wallet.enable();
                  setSelectedWallet(wallet);

                  if (wallet.chain === 'substrate') {
                    setIsModalOpen(true);
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

                      await handleNormalWalletLogin(wallet, address);
                    }
                  }
                }}
              />
              <Modal
                content={
                  <AccountSelector
                    accounts={wallet.accounts}
                    walletNetwork={wallet.defaultNetwork}
                    walletChain={wallet.chain}
                    onSelect={async (accountIndex) => {
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
                      await handleNormalWalletLogin(wallet, address);
                      setIsModalOpen(false);
                    }}
                    onModalClose={() => setIsModalOpen(false)}
                  />
                }
                onClose={() => setIsModalOpen(false)}
                open={isModalOpen}
              />
            </>
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
                onClick={resetWalletConnectOnclick.bind(this, wallets)}
              >
                Reset WalletConnect
              </a>
            </CWText>
          )}
          {hasNoWalletsLink && (
            <CWTooltip
              content={
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
              renderTrigger={(handleInteraction) => (
                <CWText
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  type="caption"
                  className={getClasses<{ darkMode?: boolean }>(
                    { darkMode },
                    'no-wallet-link'
                  )}
                >
                  Don't see your wallet?
                </CWText>
              )}
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
        <a onClick={connectAnotherWayOnclick}>Connect Another Way</a>
      </CWText>
    </div>
  );
};
