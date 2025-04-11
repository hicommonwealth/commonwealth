import React, { useState } from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import './WalletModals.scss';

type WithdrawModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
  onWithdraw: (amount: string) => Promise<void>;
};

export const WithdrawModal = ({
  isOpen,
  onClose,
  currentBalance,
  onWithdraw,
}: WithdrawModalProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdraw = async () => {
    try {
      setIsLoading(true);
      await onWithdraw(amount);
      onClose();
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="small"
      content={
        <div className="WalletModal">
          <CWModalHeader label="Withdraw funds" onModalClose={onClose} />
          <CWModalBody>
            <div className="current-balance-row">
              <CWText type="caption">Current balance</CWText>
              <div className="balance-and-magic">
                <CWText type="caption" fontWeight="medium">
                  <CWIcon iconName="ethereum" iconSize="small" />{' '}
                  {currentBalance} ETH
                </CWText>
              </div>
            </div>
            <CWDivider />

            <div className="amount-input-section">
              <CWText type="b1" fontWeight="medium">
                Amount to withdraw
              </CWText>
              <div className="amount-input-with-currency">
                <CWTextInput
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onInput={(e) => setAmount(e.target.value)}
                />
                <CWText className="currency-label">ETH</CWText>
              </div>
            </div>

            <div className="actions">
              <CWButton
                label="Withdraw"
                buttonWidth="full"
                disabled={
                  !amount ||
                  isLoading ||
                  Number(amount) > Number(currentBalance)
                }
                onClick={handleWithdraw}
              />
            </div>
          </CWModalBody>
        </div>
      }
    />
  );
};
