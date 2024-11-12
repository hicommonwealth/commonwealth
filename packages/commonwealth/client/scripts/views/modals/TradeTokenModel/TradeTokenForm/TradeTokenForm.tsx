import {
  currencyNameToSymbolMap,
  currencySymbolPlacements,
  getAmountWithCurrencySymbol,
} from 'helpers/currency';
import React, { ReactNode, useState } from 'react';
import { Skeleton } from 'views/components/Skeleton';
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
  onCTAClick,
  isActionPending,
}: TradeTokenFormProps) => {
  const [isReceiptDetailOpen, setIsReceiptDetailOpen] = useState(false);

  const buyAmountCurrenySymbol = (
    <CWText className="amount-symbol">
      {currencyNameToSymbolMap[trading.amounts.buy.baseCurrency.name]}
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
            {addresses.selected.ethBalance.isLoading ? (
              <Skeleton width={80} />
            ) : (
              addresses.selected.ethBalance.value
            )}
            &nbsp;ETH
          </CWText>
        </div>
      </div>

      <div className="amount-selection">
        <CWText className="uppercase text-light" type="b2">
          You&apos;re {trading.mode.value}ing
        </CWText>

        {trading.mode.value === TradingMode.Buy && (
          <>
            <div className="amount-input-with-currency-symbol">
              {currencySymbolPlacements.onLeft.includes(
                trading.amounts.buy.baseCurrency.name,
              ) && buyAmountCurrenySymbol}
              <CWTextInput
                containerClassName="amount-input"
                placeholder={getAmountWithCurrencySymbol(
                  0,
                  trading.amounts.buy.baseCurrency.name,
                )}
                value={trading.amounts.buy.baseCurrency.amount}
                onInput={(e) =>
                  trading.amounts.buy.baseCurrency.onAmountChange(e)
                }
              />
              {currencySymbolPlacements.onRight.includes(
                trading.amounts.buy.baseCurrency.name,
              ) && buyAmountCurrenySymbol}
            </div>

            <CWText type="caption" className="amount-to-crypto">
              <CWIcon iconName="ethereum" iconSize="small" />
              {trading.amounts.buy.ethAmount} ETH
            </CWText>

            {trading.amounts.buy.baseCurrency.presetAmounts && (
              <div className="preset-amounts">
                {trading.amounts.buy.baseCurrency.presetAmounts?.map(
                  (presetAmount) => (
                    <CWTag
                      key={presetAmount}
                      type="amount"
                      label={getAmountWithCurrencySymbol(
                        presetAmount,
                        trading.amounts.buy.baseCurrency.name,
                      )}
                      onClick={() =>
                        trading.amounts.buy.baseCurrency.onAmountChange(
                          presetAmount,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </>
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
          label={trading.mode.value}
          containerClassName="action-btn"
          buttonWidth="full"
          buttonType="secondary"
          className="capitalize"
          buttonAlt={
            trading.mode.value === TradingMode.Buy ? 'green' : 'rorange'
          }
          disabled={
            isActionPending || trading.amounts.buy.baseCurrency.amount === 0
          }
          onClick={onCTAClick}
        />,
        'Please add trading amount to continue',
        trading.amounts.buy.baseCurrency.amount === 0,
      )}
    </section>
  );
};

export default TradeTokenForm;
