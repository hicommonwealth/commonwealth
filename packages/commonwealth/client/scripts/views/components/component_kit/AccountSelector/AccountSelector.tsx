import { ChainBase } from '@hicommonwealth/shared';
import type Substrate from 'controllers/chain/substrate/adapter';
import React from 'react';
import app from 'state';
import { addressSwapper } from 'utils';
import { User } from '../../user/user';
import { CWModalBody, CWModalHeader } from '../new_designs/CWModal';
import './AccountSelector.scss';

type LinkAccountItemProps = {
  account: { address: string; meta?: { name: string } };
  idx: number;
  onSelect: (idx: number) => void;
  walletChain: ChainBase;
  walletNetwork: string;
};

const LinkAccountItem = ({
  account,
  walletNetwork,
  walletChain,
  onSelect,
  idx,
}: LinkAccountItemProps) => {
  const address = app.chain
    ? addressSwapper({
        address: account.address,
        currentPrefix: parseInt(
          `${(app.chain as Substrate)?.meta.ss58_prefix || 0}`,
          10,
        ),
      })
    : account.address;

  const baseName = app.chain?.meta.base || walletChain;

  const capitalizedBaseName = `${baseName
    ?.charAt(0)
    ?.toUpperCase()}${baseName?.slice(1)}`;

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
            userCommunityId={app.chain?.id || walletNetwork}
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
              userCommunityId={app.chain?.id || walletNetwork}
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
    | readonly unknown[];
  onModalClose: () => void;
  onSelect: (idx: number) => void;
  walletChain: ChainBase;
  walletNetwork: string;
};

// eslint-disable-next-line react/no-multi-comp
export const AccountSelector = ({
  accounts,
  onModalClose,
  walletNetwork,
  walletChain,
  onSelect,
}: AccountSelectorProps) => {
  return (
    <div className="AccountSelector">
      <CWModalHeader
        label="Select account to join"
        onModalClose={onModalClose}
      />
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
