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
  userTokenBalance: string;
  contestAddress: string;
  contestTokenBalance: string;
  tokenAmount: string;
  handleChangeTokenAmount: (e) => void;
  amountError: string;
  tokenAmountInUsd: string;
  newContestTokenBalance: string;
  newContestBalanceInUsd: string;
  handleTransferFunds: () => void;
  fundingTokenTicker: string;
}

const FundContestForm = ({
  onClose,
  selectedAddress,
  addressOptions,
  onSetSelectedAddress,
  userTokenBalance,
  contestAddress,
  contestTokenBalance,
  tokenAmount,
  handleChangeTokenAmount,
  amountError,
  tokenAmountInUsd,
  newContestTokenBalance,
  newContestBalanceInUsd,
  handleTransferFunds,
  fundingTokenTicker,
}: FundContestFormProps) => {
  const tokenAmountValue = tokenAmount ? Number(tokenAmount) : '';

  return (
    <div className="FundContestForm">
      <div>
        <CWText type="h3">Fund your contest</CWText>
        <CWText className="description">
          You can add funds directly to your contest using the form below. 10%
          of the funds will be deducted as fees. You can deposit additional
          funds at any time using the contract address.
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
            {displayAmount(userTokenBalance)} {fundingTokenTicker}
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
            {displayAmount(contestTokenBalance)} {fundingTokenTicker}
          </CWText>
        </div>

        <CWTextInput
          placeholder="0.00"
          value={tokenAmountValue}
          onInput={handleChangeTokenAmount}
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
            {displayAmount(tokenAmountInUsd)} USD
          </CWText>
        </div>

        <div className="summary-balance-row">
          <div className="first-row">
            <CWText type="caption">New Contest Balance:</CWText>
            <CWText type="caption" fontWeight="medium">
              {displayAmount(newContestTokenBalance)} {fundingTokenTicker}
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
            disabled={!!amountError || !selectedAddress?.value}
          />
        </div>
      </div>
    </div>
  );
};

export default FundContestForm;
