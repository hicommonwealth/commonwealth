import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../../../ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import { TradingMode } from '../../types';
import AddressBalance from './AddressBalance';
import BuyAmountSelection from './AmountSelections/BuyAmountSelection';
import SellAmountSelection from './AmountSelections/SellAmountSelection';
import './CommonTradeTokenForm.scss';
import BuyReceipt from './ReceiptDetails/BuyReceipt';
import SellReceipt from './ReceiptDetails/SellReceipt';
import { convertAddressToDropdownOption } from './helpers';
import { CommonTradeTokenFormProps } from './types';

const CommonTradeTokenForm = ({
  trading,
  addresses,
  onCTAClick,
  isActionPending,
}: CommonTradeTokenFormProps) => {
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);

  const getCTADisabledTooltipText = () => {
    const labels = {
      processingTrade: 'Processing trade...',
      tradingAmountRequired: 'Please add trading amount to continue',
      insufficientFunds: `You don't have sufficient funds to continue`,
    };

    if (isActionPending) return labels.processingTrade;

    // only use these in buy mode
    if (trading.mode.value === TradingMode.Buy) {
      if (
        (parseFloat(trading.amounts.buy.invest.baseCurrency.amount) || 0) === 0
      )
        return labels.tradingAmountRequired;
      if (trading.amounts.buy.invest.insufficientFunds)
        return labels.insufficientFunds;
    }

    // only use these in sell mode
    if (trading.mode.value === TradingMode.Sell) {
      if ((parseFloat(trading.amounts.sell.invest.baseToken.amount) || 0) === 0)
        return labels.tradingAmountRequired;
      if (trading.amounts.sell.invest.insufficientFunds)
        return labels.insufficientFunds;
    }
  };
  const tooltipText = getCTADisabledTooltipText();

  return (
    <section className="CommonTradeTokenForm">
      <CWTabsRow>
        {[TradingMode.Buy, TradingMode.Sell].map((mode) => (
          <CWTab
            key={mode}
            label={mode}
            onClick={() => trading.mode.onChange(mode)}
            isSelected={trading.mode.value === mode}
          />
        ))}
      </CWTabsRow>

      <div className="addresses-with-balance">
        <CWSelectList
          components={{
            Option: (originalProps) =>
              CustomAddressOption({
                originalProps,
                selectedAddressValue: addresses.selected.value || '',
              }),
          }}
          noOptionsMessage={() => 'No available Metamask address'}
          value={convertAddressToDropdownOption(addresses.selected.value || '')}
          defaultValue={convertAddressToDropdownOption(addresses.default || '')}
          formatOptionLabel={(option) => (
            <CustomAddressOptionElement
              value={option.value}
              label={option.label}
              selectedAddressValue={addresses.selected.value || ''}
            />
          )}
          label="Select address"
          isClearable={false}
          isSearchable={false}
          options={(addresses.available || [])?.map(
            convertAddressToDropdownOption,
          )}
          onChange={(option) =>
            option?.value && addresses.selected.onChange(option.value)
          }
        />

        <div className="balance-row">
          <CWText type="caption">Current balance</CWText>
          <AddressBalance trading={trading} addresses={addresses} />
        </div>
      </div>

      <div className="amount-selection-container">
        <CWText className="uppercase text-light" type="b2">
          You&apos;re {trading.mode.value}ing
        </CWText>

        {trading.mode.value === TradingMode.Buy ? (
          <BuyAmountSelection trading={trading} />
        ) : (
          <SellAmountSelection trading={trading} />
        )}
      </div>

      <div className="receipt-and-fees">
        <div className="header">
          <CWText type="caption" className="dropdown">
            {withTooltip(
              <CWIconButton
                iconName={isReceiptDetailOpen ? 'caretUp' : 'caretDown'}
                weight="fill"
                onClick={() => setIsReceiptDetailOpen((o) => !o)}
                disabled={!!getCTADisabledTooltipText()}
              />,
              tooltipText || '',
              !!tooltipText,
            )}
            Subtotal + fees
          </CWText>
        </div>
        {isReceiptDetailOpen && (
          <>
            {trading.mode.value === TradingMode.Buy ? (
              <BuyReceipt trading={trading} />
            ) : (
              <SellReceipt trading={trading} />
            )}
          </>
        )}
      </div>

      {withTooltip(
        <CWButton
          label={trading.mode.value}
          containerClassName="action-btn"
          buttonWidth="full"
          buttonType="secondary"
          className="capitalize"
          buttonAlt={
            trading.mode.value === TradingMode.Buy ? 'green' : 'rorange'
          }
          disabled={!!getCTADisabledTooltipText()}
          onClick={onCTAClick}
        />,
        tooltipText || '',
        !!tooltipText,
      )}
    </section>
  );
};

export default CommonTradeTokenForm;
