import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import CopyAddressInput from 'views/pages/CommunityManagement/Contests/CopyAddressInput';

import { displayAmount } from '../../utils';

import './FundContestForm.scss';

interface FundContestFormProps {
  onClose: () => void;
  selectedAddress: {
    value: string;
    label: string;
  };
  addressOptions: {
    value: string;
    label: string;
  }[];
  onSetSelectedAddress: ({
    value,
    label,
  }: {
    value: string;
    label: string;
  }) => void;
  userEthBalance: string;
  contestAddress: string;
  contestEthBalance: string;
  amountEth: string;
  handleChangeEthAmount: (e) => void;
  amountError: string;
  amountEthInUsd: string;
  newContestBalanceInEth: string;
  newContestBalanceInUsd: string;
  handleTransferFunds: () => Promise<void>;
}

const FundContestForm = ({
  onClose,
  selectedAddress,
  addressOptions,
  onSetSelectedAddress,
  userEthBalance,
  contestAddress,
  contestEthBalance,
  amountEth,
  handleChangeEthAmount,
  amountError,
  amountEthInUsd,
  newContestBalanceInEth,
  newContestBalanceInUsd,
  handleTransferFunds,
}: FundContestFormProps) => {
  const amountEthValue = amountEth ? Number(amountEth) : '';

  return (
    <div className="FundContestForm">
      <div>
        <CWText type="h3">Fund your contest</CWText>
        <CWText className="description">
          You can add funds directly to your contest using the form below. You
          can deposit additional funds at any time using the contract address.
        </CWText>

        <CWSelectList
          label="From address"
          placeholder="Select address"
          isClearable={false}
          isSearchable={false}
          value={selectedAddress}
          defaultValue={addressOptions[0]}
          options={addressOptions}
          onChange={onSetSelectedAddress}
        />

        <div className="current-balance-row">
          <CWText type="caption" fontWeight="medium">
            Current Balance
          </CWText>
          <CWText type="caption" fontWeight="medium">
            {displayAmount(userEthBalance)} ETH
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
            {displayAmount(contestEthBalance)} ETH
          </CWText>
        </div>

        <CWTextInput
          placeholder="0.00"
          value={amountEthValue}
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
            {displayAmount(amountEthInUsd)} USD
          </CWText>
        </div>

        <div className="summary-balance-row">
          <div className="first-row">
            <CWText type="caption">New Contest Balance:</CWText>
            <CWText type="caption" fontWeight="medium">
              {displayAmount(newContestBalanceInEth)} ETH
            </CWText>
          </div>
          <CWText type="caption" fontWeight="medium">
            {displayAmount(newContestBalanceInUsd)} USD
          </CWText>
        </div>
      </div>

      <div className="footer">
        <CWDivider />
        <div className="buttons">
          <CWButton label="Cancel" buttonType="secondary" onClick={onClose} />
          <CWButton
            label="Transfer funds"
            buttonType="secondary"
            buttonAlt="green"
            onClick={handleTransferFunds}
            disabled={!!amountError}
          />
        </div>
      </div>
    </div>
  );
};

export default FundContestForm;
