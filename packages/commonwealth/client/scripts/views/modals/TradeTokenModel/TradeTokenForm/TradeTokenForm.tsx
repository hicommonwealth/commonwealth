import {
  currencyNameToSymbolMap,
  currencySymbolPlacements,
  getAmountWithCurrencySymbol,
} from 'helpers/currency';
import React, { ReactNode, useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../../ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import './TradeTokenForm.scss';
import { convertAddressToDropdownOption } from './helpers';
import { TradeTokenFormProps, TradingMode } from './types';

const TradeTokenForm = ({
  trading,
  addresses,
  tradingMode,
  onTradingAmountChange,
  tradingAmount,
  onTradingModeChange,
  onCTAClick,
  isActionPending,
}: TradeTokenFormProps) => {
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);

  const amountCurrenySymbol = (
    <CWText className="amount-symbol">
      {currencyNameToSymbolMap[trading.currency]}
    </CWText>
  );

  const withOptionalTooltip = (
    children: ReactNode,
    content: string,
    shouldDisplay,
  ) => {
    if (!shouldDisplay) return children;

    return (
      <CWTooltip
        placement="top"
        content={content}
        renderTrigger={(handleInteraction) => (
          <span
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          >
            {children}
          </span>
        )}
      />
    );
  };

  return (
    <section className="TokenTradeForm">
      <CWTabsRow>
        {Object.keys(TradingMode).map((mode) => (
          <CWTab
            key={mode}
            label={mode}
            onClick={() => onTradingModeChange(TradingMode[mode])}
            isSelected={tradingMode === TradingMode[mode]}
          />
        ))}
      </CWTabsRow>

      <div className="addresses-with-balance">
        <CWSelectList
          components={{
            Option: (originalProps) =>
              CustomAddressOption({
                originalProps,
                selectedAddressValue: addresses.selected || '',
              }),
          }}
          noOptionsMessage={() => 'No available Metamask address'}
          value={convertAddressToDropdownOption(addresses.selected || '')}
          formatOptionLabel={(option) => (
            <CustomAddressOptionElement
              value={option.value}
              label={option.label}
              selectedAddressValue={addresses.selected || ''}
            />
          )}
          label="Select address"
          isClearable={false}
          isSearchable={false}
          options={(addresses.available || [])?.map(
            convertAddressToDropdownOption,
          )}
          onChange={(option) =>
            option?.value && addresses.onChange(option.value)
          }
        />

        <div className="balance-row">
          <CWText type="caption">Current balance</CWText>
          <CWText type="caption">
            <CWIcon iconName="ethereum" iconSize="small" />
            0.005 ETH
          </CWText>
        </div>
      </div>

      <div className="amount-selection">
        <CWText className="uppercase text-light" type="b2">
          You&apos;re {tradingMode}ing
        </CWText>

        <div className="amount-input-with-currency-symbol">
          {currencySymbolPlacements.onLeft.includes(trading.currency) &&
            amountCurrenySymbol}
          <CWTextInput
            containerClassName="amount-input"
            placeholder={getAmountWithCurrencySymbol(0, trading.currency)}
            value={tradingAmount}
            onInput={(e) => onTradingAmountChange(e)}
          />
          {currencySymbolPlacements.onRight.includes(trading.currency) &&
            amountCurrenySymbol}
        </div>

        <CWText type="caption" className="amount-to-crypto">
          <CWIcon iconName="ethereum" iconSize="small" />
          0.005 ETH
        </CWText>

        {trading.presetAmounts && (
          <div className="preset-amounts">
            {trading.presetAmounts?.map((presetAmount) => (
              <CWTag
                key={presetAmount}
                type="amount"
                label={getAmountWithCurrencySymbol(
                  presetAmount,
                  trading.currency,
                )}
                onClick={() => onTradingAmountChange(presetAmount)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="receipt-and-fees">
        <div className="header">
          <CWText type="caption" className="dropdown">
            <CWIconButton
              iconName={isReceiptDetailOpen ? 'caretUp' : 'caretDown'}
              weight="fill"
              onClick={() => setIsReceiptDetailOpen((o) => !o)}
            />
            Subtotal + fees
          </CWText>
          <CWText type="caption">
            <CWIcon iconName="ethereum" iconSize="small" />
            0.053 ETH
          </CWText>
        </div>
        {/* TODO: add receipt details here */}
      </div>

      {withOptionalTooltip(
        <CWButton
          label={tradingMode}
          containerClassName="action-btn"
          buttonWidth="full"
          buttonType="secondary"
          className="capitalize"
          buttonAlt={tradingMode === TradingMode.Buy ? 'green' : 'rorange'}
          disabled={isActionPending || tradingAmount === 0}
          onClick={onCTAClick}
        />,
        'Please add trading amount to continue',
        tradingAmount === 0,
      )}
    </section>
  );
};

export default TradeTokenForm;
