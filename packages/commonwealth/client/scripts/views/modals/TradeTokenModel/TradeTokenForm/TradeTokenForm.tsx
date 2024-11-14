import React, { ReactNode, useState } from 'react';
import { Skeleton } from 'views/components/Skeleton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../../ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import BuyAmountSelection from './AmountSelections/BuyAmountSelection';
import BuyReceipt from './ReceiptDetails/BuyReceipt';
import './TradeTokenForm.scss';
import { convertAddressToDropdownOption } from './helpers';
import { TradeTokenFormProps, TradingMode } from './types';

const TradeTokenForm = ({
  trading,
  addresses,
  onCTAClick,
  isActionPending,
}: TradeTokenFormProps) => {
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);

  const getCTADisabledTooltipText = () => {
    if (isActionPending) return 'Processing trade...';

    // only use these in buy mode
    if (trading.mode.value === TradingMode.Buy) {
      if (trading.amounts.buy.baseCurrency.amount === 0)
        return 'Please add trading amount to continue';
      if (trading.amounts.buy.insufficientFunds)
        return `You don't have sufficient funds to buy token`;
    }
  };

  const withOptionalTooltip = (children: ReactNode) => {
    const tooltipText = getCTADisabledTooltipText();
    if (!tooltipText) return children;

    return (
      <CWTooltip
        placement="top"
        content={tooltipText}
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
    <section className="TradeTokenForm">
      <CWTabsRow>
        {Object.keys(TradingMode).map((mode) => (
          <CWTab
            key={mode}
            label={mode}
            onClick={() => trading.mode.onChange(TradingMode[mode])}
            isSelected={trading.mode.value === TradingMode[mode]}
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
          <CWText type="caption">
            <CWIcon iconName="ethereum" iconSize="small" />
            {addresses.selected.balances.eth.isLoading ? (
              <Skeleton width={80} />
            ) : (
              addresses.selected.balances.eth.value
            )}
            &nbsp;ETH
          </CWText>
        </div>
      </div>

      <div className="amount-selection-container">
        <CWText className="uppercase text-light" type="b2">
          You&apos;re {trading.mode.value}ing
        </CWText>

        {trading.mode.value === TradingMode.Buy ? (
          <BuyAmountSelection trading={trading} />
        ) : (
          <>{/* TODO: sell mode components here */}</>
        )}
      </div>

      <div className="receipt-and-fees">
        <div className="header">
          <CWText type="caption" className="dropdown">
            {withOptionalTooltip(
              <CWIconButton
                iconName={isReceiptDetailOpen ? 'caretUp' : 'caretDown'}
                weight="fill"
                onClick={() => setIsReceiptDetailOpen((o) => !o)}
                disabled={!!getCTADisabledTooltipText()}
              />,
            )}
            Subtotal + fees
          </CWText>
        </div>
        {isReceiptDetailOpen ? (
          isActionPending ? (
            <CWCircleMultiplySpinner />
          ) : (
            <>
              {trading.mode.value === TradingMode.Buy ? (
                <BuyReceipt trading={trading} />
              ) : (
                <>{/* TODO: sell mode components here */}</>
              )}
            </>
          )
        ) : (
          <></>
        )}
      </div>

      {withOptionalTooltip(
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
      )}
    </section>
  );
};

export default TradeTokenForm;
