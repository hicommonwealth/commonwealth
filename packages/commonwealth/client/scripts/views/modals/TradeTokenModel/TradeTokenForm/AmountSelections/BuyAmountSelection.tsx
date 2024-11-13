import {
  currencyNameToSymbolMap,
  currencySymbolPlacements,
  getAmountWithCurrencySymbol,
} from 'helpers/currency';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { BuyAmountSelectionProps } from '../types';
import './AmountSelections.scss';

const BuyAmountSelection = ({ trading }: BuyAmountSelectionProps) => {
  const baseCurrencyName = trading.amounts.buy.baseCurrency.name;

  const buyAmountCurrenySymbol = (
    <CWText className="amount-symbol">
      {currencyNameToSymbolMap[baseCurrencyName]}
    </CWText>
  );

  return (
    <div className="AmountSelections">
      <div className="amount-input-with-currency-symbol">
        {currencySymbolPlacements.onLeft.includes(baseCurrencyName) &&
          buyAmountCurrenySymbol}
        <CWTextInput
          containerClassName="amount-input"
          placeholder={getAmountWithCurrencySymbol(0, baseCurrencyName)}
          value={trading.amounts.buy.baseCurrency.amount}
          onInput={(e) => trading.amounts.buy.baseCurrency.onAmountChange(e)}
        />
        {currencySymbolPlacements.onRight.includes(baseCurrencyName) &&
          buyAmountCurrenySymbol}
      </div>

      <CWText type="caption" className="amount-to-crypto">
        <CWIcon iconName="ethereum" iconSize="small" />
        {trading.amounts.buy.eth} ETH = {trading.amounts.buy.token}{' '}
        {trading.token.symbol}
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
                  baseCurrencyName,
                )}
                onClick={() =>
                  trading.amounts.buy.baseCurrency.onAmountChange(presetAmount)
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default BuyAmountSelection;
