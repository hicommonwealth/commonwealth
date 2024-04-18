import React, { useState } from 'react';

import app from 'state';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWDrawer, {
  CWDrawerTopBar,
} from 'views/components/component_kit/new_designs/CWDrawer';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import { capDecimals } from 'views/modals/ManageCommunityStakeModal/utils';

import CopyAddressInput from '../CopyAddressInput';

import './FundContestDrawer.scss';

interface FundContestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contestAddress: string;
}

const FundContestDrawer = ({
  isOpen,
  onClose,
  contestAddress,
}: FundContestDrawerProps) => {
  const addressOptions = app.user.activeAccounts.map((account) => ({
    value: String(account.address),
    label: account.address,
  }));

  const activeAccountOption = {
    value: String(app.user.activeAccount.address),
    label: app.user.activeAccount.address,
  };

  const [selectedAddress, setSelectedAddress] = useState(activeAccountOption);
  const [amountEth, setAmountEth] = useState('0');

  const userEthBalance = '113.456';
  const contestEthBalance = '56.102';
  const amountEthInUsd = '1.23';
  const amountError =
    (parseFloat(userEthBalance) < parseFloat(amountEth) &&
      'Not enough funds in wallet') ||
    (amountEth === '' && 'Please enter an amount') ||
    (parseFloat(amountEth) < 0 && 'Please enter non negative amount');
  const newContestBalanceInEth = '56.102';
  const newContestBalanceInUsd = '1.12';
  const transferFeesInEth = '1.12';
  const transferFeesInUsd = '56.102';

  const handleChangeEthAmount = (e) => {
    setAmountEth(e.target.value);
  };

  const handleTransferFunds = () => {
    console.log('transfer funds');
  };

  return (
    <div className="FundContestDrawer">
      <CWDrawer open={isOpen} onClose={onClose}>
        <CWDrawerTopBar onClose={onClose} />

        <div className="fund-contest-drawer-container">
          <div>
            <CWText type="h3">Fund your contest</CWText>
            <CWText className="description">
              You can add funds directly to your contest using the form below.
              You can deposit additional funds at any time using the contract
              address.
            </CWText>

            <CWSelectList
              label="From address"
              placeholder="Select address"
              isClearable={false}
              isSearchable={false}
              value={selectedAddress}
              defaultValue={addressOptions[0]}
              options={addressOptions}
              onChange={setSelectedAddress}
            />

            <div className="current-balance-row">
              <CWText type="caption" fontWeight="medium">
                Current Balance
              </CWText>
              <CWText type="caption" fontWeight="medium">
                {capDecimals(userEthBalance)} ETH
              </CWText>
            </div>

            <div className="to-address-row">
              <MessageRow label="To address" />
              <CopyAddressInput address={contestAddress} />
            </div>

            <div className="current-balance-row">
              <CWText type="caption" fontWeight="medium">
                Current Balance
              </CWText>
              <CWText type="caption" fontWeight="medium">
                {capDecimals(contestEthBalance)} ETH
              </CWText>
            </div>

            <CWTextInput
              placeholder="0.00"
              value={amountEth}
              onInput={handleChangeEthAmount}
              label="Amount"
              type="number"
              containerClassName="eth-amount"
              fullWidth
              min={0}
              step={0.0001}
            />

            <div className="amount-helper-row">
              {amountError && (
                <MessageRow
                  hasFeedback
                  validationStatus="failure"
                  statusMessage={amountError}
                />
              )}

              <CWText type="b2" fontWeight="medium">
                {amountEthInUsd} USD
              </CWText>
            </div>

            <div className="summary-balance-row">
              <div className="first-row">
                <CWText type="caption">New Contest Balance:</CWText>
                <CWText type="caption" fontWeight="medium">
                  {newContestBalanceInEth} ETH
                </CWText>
              </div>
              <CWText type="caption" fontWeight="medium">
                {newContestBalanceInUsd} USD
              </CWText>
            </div>

            <div className="summary-balance-row">
              <div className="first-row">
                <CWText type="caption">Transfer Fees:</CWText>
                <CWText type="caption" fontWeight="medium">
                  {transferFeesInEth} ETH
                </CWText>
              </div>
              <CWText type="caption" fontWeight="medium">
                {transferFeesInUsd} USD
              </CWText>
            </div>
          </div>

          <div className="footer">
            <CWDivider />
            <div className="buttons">
              <CWButton
                label="Cancel"
                buttonType="secondary"
                onClick={onClose}
              />
              <CWButton
                label="Transfer funds"
                buttonType="secondary"
                buttonAlt="green"
                onClick={handleTransferFunds}
              />
            </div>
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};

export default FundContestDrawer;
