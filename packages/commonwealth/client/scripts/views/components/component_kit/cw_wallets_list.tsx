import React from 'react';
import type { ChainNetwork, WalletSsoSource } from 'common-common/src/types';
import { ChainBase } from 'common-common/src/types';
import type Substrate from 'controllers/chain/substrate/adapter';
import app from 'state';
import { addressSwapper } from 'utils';
import IWebWallet from '../../../models/IWebWallet';
import { User } from '../user/user';
import { CWAuthButton, CWNoAuthMethodsAvailable } from './cw_auth_button';
import { CWDivider } from './cw_divider';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import { CWModal, CWModalBody, CWModalHeader } from './new_designs/CWModal';

import 'components/component_kit/cw_wallets_list.scss';

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
            userAddress={address}
            userChainId={app.chain?.id || walletNetwork}
            shouldShowAvatarOnly
            avatarSize={40}
          />
        </div>
      </div>
      <div className="account-item-left">
        <div className="account-item-name">{name}</div>
        <div className="account-item-address">
          <div className="account-user">
            <User
              userAddress={address}
              userChainId={app.chain?.id || walletNetwork}
              shouldHideAvatar
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
      <CWModalHeader onModalClose={onModalClose} />
      <CWModalBody>
        {accounts.map((account, idx) => {
          return (
            <LinkAccountItem
              key={`${account.address}-${idx}`}
              account={account}
              walletChain={walletChain}
              walletNetwork={walletNetwork}
              onSelect={onSelect}
              idx={idx}
            />
          );
        })}
      </CWModalBody>
    </div>
  );
};

type WalletsListProps = {
  onConnectAnotherWay?: () => void;
  darkMode?: boolean;
  canResetWalletConnect: boolean;
  hasNoWalletsLink?: boolean;
  wallets: Array<IWebWallet<any>>;
  useSessionKeyRevalidationFlow?: boolean;
  hideSocialLogins?: boolean;
  onResetWalletConnect: () => void;
  onWalletSelect: (wallet: IWebWallet<any>) => Promise<void>;
  onSocialLogin: (
    type: WalletSsoSource,
    useSessionKeyRevalidationFlow: boolean
  ) => Promise<void>;
  onWalletAddressSelect: (
    wallet: IWebWallet<any>,
    address: string
  ) => Promise<void>;
};

export const CWWalletsList = (props: WalletsListProps) => {
  const {
    onConnectAnotherWay,
    darkMode,
    canResetWalletConnect,
    hasNoWalletsLink = true,
    wallets,
    useSessionKeyRevalidationFlow,
    onResetWalletConnect,
    onWalletSelect,
    onWalletAddressSelect,
    onSocialLogin,
    hideSocialLogins,
  } = props;

  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <div className="WalletsList">
      <div className="wallets-and-link-container">
        <div
          className={getClasses<{ darkMode?: boolean }>(
            { darkMode },
            'wallets'
          )}
        >
          {wallets.map((wallet: IWebWallet<any>, index) => (
            <React.Fragment key={`${wallet.name}-${index}`}>
              <CWAuthButton
                type={wallet.name}
                label={wallet.label}
                darkMode={darkMode}
                onClick={async () => {
                  await onWalletSelect(wallet);
                  if (wallet.chain === 'substrate') {
                    // setIsModalOpen(true);
                  }
                }}
              />
              <CWModal
                content={
                  <AccountSelector
                    accounts={wallet.accounts}
                    walletNetwork={wallet.defaultNetwork}
                    walletChain={wallet.chain}
                    onSelect={async (accountIndex) => {
                      const selectedAddress = (() => {
                        if (app.chain) {
                          return addressSwapper({
                            address: wallet.accounts[accountIndex].address,
                            currentPrefix: (app.chain as Substrate).chain
                              .ss58Format,
                          });
                        }
                        return wallet.accounts[accountIndex].address;
                      })();

                      await onWalletAddressSelect(wallet, selectedAddress);
                      // setIsModalOpen(false);
                    }}
                    onModalClose={() => setIsModalOpen(false)}
                  />
                }
                onClose={() => setIsModalOpen(false)}
                open={isModalOpen}
              />
            </React.Fragment>
          ))}
          {wallets.length === 0 && (
            <CWNoAuthMethodsAvailable darkMode={darkMode} />
          )}

          {!hideSocialLogins && (
            <>
              <CWDivider className="wallets-divider" />

              <CWAuthButton
                type="google"
                label="Sign in with Google"
                darkMode={darkMode}
                onClick={async () =>
                  onSocialLogin(
                    WalletSsoSource.Google,
                    useSessionKeyRevalidationFlow
                  )
                }
              />

              <CWText
                type="b2"
                className={getClasses<{ darkMode?: boolean }>(
                  { darkMode },
                  'connect-another-way-link'
                )}
              >
                <a onClick={onConnectAnotherWay}>
                  Sign in with another email address
                </a>
              </CWText>
            </>
          )}

          <CWDivider className="wallets-divider" />
          {/* <CWAuthButton
            type="email"
            label="Email"
            darkMode={darkMode}
            onClick={onConnectAnotherWay}
            className="CustomIcon large email-auth-btn"
          /> */}
          <CWAuthButton
            type="discord"
            label="Discord"
            darkMode={darkMode}
            onClick={async () =>
              onSocialLogin(
                WalletSsoSource.Discord,
                useSessionKeyRevalidationFlow
              )
            }
            className="DiscordAuthButton"
          />
          <CWAuthButton
            type="github"
            label="Github"
            darkMode={darkMode}
            onClick={() =>
              onSocialLogin(
                WalletSsoSource.Github,
                useSessionKeyRevalidationFlow
              )
            }
          />
          <CWAuthButton
            type="twitter"
            label="Twitter"
            darkMode={darkMode}
            onClick={() =>
              onSocialLogin(
                WalletSsoSource.Twitter,
                useSessionKeyRevalidationFlow
              )
            }
          />
        </div>
        <div className="wallet-list-links">
          {canResetWalletConnect && (
            <CWText
              type="caption"
              className={getClasses<{ darkMode?: boolean }>(
                { darkMode },
                'reset-wc-link'
              )}
            >
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  await onResetWalletConnect();
                }}
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
    </div>
  );
};
