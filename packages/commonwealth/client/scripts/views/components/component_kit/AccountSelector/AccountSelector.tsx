import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import type Substrate from 'controllers/chain/substrate/adapter';
import React, { useState } from 'react';
import app from 'state';
import { addressSwapper } from 'utils';
import { CWButton } from '../new_designs/CWButton';
import { CWModalBody, CWModalHeader } from '../new_designs/CWModal';
import { CWRadioButton } from '../new_designs/cw_radio_button';
import './AccountSelector.scss';

type LinkAccountItemProps = {
  account: { address: string; meta?: { name: string } };
  idx: number;
  walletChain: ChainBase;
  walletNetwork: string;
  isChecked: boolean;
  onToggle: (idx: number) => void;
};

const LinkAccountItem = ({
  account,
  walletChain,
  idx,
  isChecked,
  onToggle,
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

  const formattedAddress =
    address && `${address.slice(0, 8)}...${address.slice(-5)}`;

  return (
    <div className="account-item account-item-emphasized">
      <div className="account-item-left" onClick={() => onToggle(idx)}>
        <CWRadioButton
          groupName="account-selection"
          value={capitalizedBaseName}
          checked={isChecked}
          onChange={() => onToggle(idx)}
          label={null}
          hideLabels={true}
          className="margin-right-10"
        />
        <div>
          <div className="account-item-name">{capitalizedBaseName}</div>
          <div className="account-item-address">{formattedAddress}</div>
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
  const [selectedAccountIdx, setSelectedAccountIdx] = useState<number>(0);
  const handleToggle = (idx: number) => {
    setSelectedAccountIdx(idx);
  };
  const handleNext = () => {
    onSelect(selectedAccountIdx);
  };
  return (
    <div className="AccountSelector">
      <CWModalHeader
        label="Select Account to Join"
        onModalClose={onModalClose}
      />
      <CWModalBody className={clsx('CWModalBody', 'zero-gap')}>
        <>
          {accounts.map((account, idx) => {
            return (
              <LinkAccountItem
                key={`${account.address}-${idx}`}
                account={account}
                walletChain={walletChain}
                walletNetwork={walletNetwork}
                idx={idx}
                onToggle={() => handleToggle(idx)}
                isChecked={selectedAccountIdx === idx}
              />
            );
          })}
          <CWButton
            label="Next"
            type="submit"
            buttonHeight="med"
            buttonWidth="full"
            onClick={handleNext}
          />
        </>
      </CWModalBody>
    </div>
  );
};
