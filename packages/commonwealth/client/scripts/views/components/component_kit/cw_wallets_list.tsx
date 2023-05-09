import type { ChainNetwork } from 'common-common/src/types';
import { ChainBase } from 'common-common/src/types';
import 'components/component_kit/cw_wallets_list.scss';
import type Substrate from 'controllers/chain/substrate/adapter';
import type { IWebWallet } from 'models';
import { AddressInfo } from 'models';
import React from 'react';
import app from 'state';
import { addressSwapper } from 'utils';
import { User } from '../user/user';
import { CWIconButton } from './cw_icon_button';
import { Modal } from './cw_modal';
import { CWTooltip } from './cw_popover/cw_tooltip';
import { CWText } from './cw_text';
import {
  CWWalletMissingOptionRow,
  CWWalletOptionRow,
} from './cw_wallet_option_row';
import { getClasses } from './helpers';

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
  const {
    accounts,
    onModalClose,
    walletNetwork,
    walletChain,
    onSelect,
  } = props;

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
            key={`${account.address}-${idx}`}
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
  onConnectAnotherWay?: () => void;
  darkMode?: boolean;
  canResetWalletConnect: boolean;
  hasNoWalletsLink?: boolean;
  wallets: Array<IWebWallet<any>>;
  onResetWalletConnect: () => void;
  onWalletSelect: (wallet: IWebWallet<any>) => Promise<void>;
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
    onResetWalletConnect,
    onWalletSelect,
    onWalletAddressSelect,
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
              <CWWalletOptionRow
                walletName={wallet.name}
                walletLabel={wallet.label}
                darkMode={darkMode}
                onClick={async () => {
                  await onWalletSelect(wallet);
                  if (wallet.chain === 'substrate') {
                    setIsModalOpen(true);
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
                      setIsModalOpen(false);
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
            <CWWalletMissingOptionRow darkMode={darkMode} />
          )}
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
      <CWText
        type="b2"
        className={getClasses<{ darkMode?: boolean }>(
          { darkMode },
          'connect-another-way-link'
        )}
      >
        <a onClick={onConnectAnotherWay}>Connect Another Way</a>
      </CWText>
    </div>
  );
};
