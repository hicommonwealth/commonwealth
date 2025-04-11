import { WalletId } from '@hicommonwealth/shared';
import React, { useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import useAuthentication from 'views/modals/AuthModal/useAuthentication';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import { convertAddressToDropdownOption } from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './WalletModals.scss';

export type WalletModalMode = 'deposit' | 'withdraw';

type WalletModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: WalletModalMode;
  onModeChange: () => void;
  currentEthBalance: string;
  addresses: string[];
  selectedAddress: string;
  onAddressChange: (address: string) => void;
  onAction: (amount: string, mode: WalletModalMode) => Promise<void>;
  userWallets: { address: string; walletId?: WalletId }[]; // Needed for Magic check
};

export const WalletModal = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  currentEthBalance,
  addresses,
  selectedAddress,
  onAddressChange,
  onAction,
  userWallets,
}: WalletModalProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { openMagicWallet } = useAuthentication({});

  const isDepositMode = mode === 'deposit';
  const isSelectedAddressMagic =
    userWallets.find((a) => a.address === selectedAddress)?.walletId ===
    WalletId.Magic;

  const handleAction = async () => {
    try {
      setIsLoading(true);
      await onAction(amount, mode);
      setAmount(''); // Reset amount after action
      onClose();
    } catch (error) {
      console.error(
        `${isDepositMode ? 'Deposit' : 'Withdrawal'} failed:`,
        error,
      );
      // TODO: Add user-facing error handling
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset: string | number) => {
    if (preset === 'MAX' && !isDepositMode) {
      setAmount(currentEthBalance);
    } else if (typeof preset === 'number') {
      setAmount(preset.toString());
    }
  };

  const isActionDisabled =
    !amount ||
    isLoading ||
    Number(amount) <= 0 ||
    (!isDepositMode && Number(amount) > Number(currentEthBalance));

  const presetAmounts = isDepositMode ? [0.01, 0.1, 0.5] : [0.01, 0.1, 'MAX'];

  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="small"
      content={
        <div className="WalletModal">
          <div className="wallet-modal-header">
            <CWText type="h3" fontWeight="bold">
              {isDepositMode ? 'Deposit' : 'Withdraw'}
            </CWText>
            <CWIcon
              iconName="arrowsLeftRight"
              onClick={onModeChange}
              className="swap-icon"
              iconSize="medium"
            />
            <CWIcon
              iconName="close"
              onClick={onClose}
              className="close-icon"
              iconSize="medium"
            />
          </div>

          <CWModalBody>
            <CWSelectList
              label="Select address"
              placeholder="Select address"
              components={{
                Option: (originalProps) =>
                  CustomAddressOption({
                    originalProps,
                    selectedAddressValue: selectedAddress || '',
                  }),
              }}
              value={convertAddressToDropdownOption(selectedAddress || '')}
              defaultValue={convertAddressToDropdownOption(
                selectedAddress || '',
              )}
              formatOptionLabel={(option) => (
                <CustomAddressOptionElement
                  value={option.value}
                  label={option.label}
                  selectedAddressValue={selectedAddress || ''}
                />
              )}
              isClearable={false}
              isSearchable={false}
              options={(addresses || []).map(convertAddressToDropdownOption)}
              onChange={(option) =>
                option?.value && onAddressChange(option.value)
              }
            />

            <div className="current-balance-row">
              <CWText type="caption">Current balance</CWText>
              <CWText type="caption" fontWeight="medium">
                <CWIcon iconName="ethereum" iconSize="small" />{' '}
                {currentEthBalance} ETH
              </CWText>
            </div>

            <div className="amount-input-section">
              <div className="amount-input-with-currency">
                <CWTextInput
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onInput={(e) => setAmount(e.target.value)}
                  inputClassName="amount-input-field"
                />
                <CWText className="currency-label" type="h3" fontWeight="bold">
                  ETH
                </CWText>
              </div>

              <div className="preset-amounts">
                {presetAmounts.map((preset) => (
                  <CWTag
                    key={preset}
                    type="filter"
                    label={preset === 'MAX' ? 'MAX' : `${preset} ETH`}
                    onClick={() => handlePresetClick(preset)}
                    classNames="preset-tag"
                  />
                ))}
              </div>
            </div>

            <div className="actions">
              <CWButton
                label={isDepositMode ? 'Deposit' : 'Withdraw'}
                buttonWidth="full"
                disabled={isActionDisabled}
                onClick={handleAction}
              />
              {isDepositMode && isSelectedAddressMagic && (
                <CWButton
                  label="Add funds with Magic"
                  buttonWidth="full"
                  buttonHeight="sm"
                  onClick={() => openMagicWallet()}
                />
              )}
            </div>
          </CWModalBody>
        </div>
      }
    />
  );
};
