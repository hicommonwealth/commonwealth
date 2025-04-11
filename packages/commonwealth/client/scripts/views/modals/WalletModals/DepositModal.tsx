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
import useAuthentication from 'views/modals/AuthModal/useAuthentication';
import './WalletModals.scss';

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
  onDeposit: (amount: string) => Promise<void>;
};

export const DepositModal = ({
  isOpen,
  onClose,
  currentBalance,
  onDeposit,
}: DepositModalProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { openMagicWallet } = useAuthentication({});

  const handleDeposit = async () => {
    try {
      setIsLoading(true);
      await onDeposit(amount);
      onClose();
    } catch (error) {
      console.error('Deposit failed:', error);
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
          <CWModalHeader
            label="Add funds to your wallet"
            onModalClose={onClose}
          />
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
                Amount to deposit
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
                label="Deposit"
                buttonWidth="full"
                disabled={!amount || isLoading}
                onClick={handleDeposit}
              />
              <CWButton
                label="Add funds with Magic"
                buttonWidth="full"
                buttonHeight="sm"
                onClick={() => openMagicWallet()}
              />
            </div>
          </CWModalBody>
        </div>
      }
    />
  );
};
