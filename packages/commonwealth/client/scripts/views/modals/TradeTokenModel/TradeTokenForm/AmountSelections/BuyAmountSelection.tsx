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
import TokenIcon from '../../TokenIcon';
import { BuyAmountSelectionProps } from '../types';
import './AmountSelections.scss';

const BuyAmountSelection = ({ trading }: BuyAmountSelectionProps) => {
  const baseCurrencyName = trading.amounts.buy.invest.baseCurrency.name;

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
          placeholder="0"
          value={trading.amounts.buy.invest.baseCurrency.amount}
          onInput={(e) =>
            trading.amounts.buy.invest.baseCurrency.onAmountChange(e)
          }
        />
        {currencySymbolPlacements.onRight.includes(baseCurrencyName) &&
          buyAmountCurrenySymbol}
      </div>

      <CWText type="caption" className="invest-to-gain-amounts">
        <CWIcon iconName="ethereum" iconSize="small" />
        {trading.amounts.buy.invest.baseCurrency.toEth} ETH =
        {trading.token.icon_url && <TokenIcon url={trading.token.icon_url} />}
        {trading.amounts.buy.gain.token} {trading.token.symbol}
      </CWText>

      {trading.amounts.buy.invest.baseCurrency.presetAmounts && (
        <div className="preset-amounts">
          {trading.amounts.buy.invest.baseCurrency.presetAmounts?.map(
            (presetAmount) => (
              <CWTag
                key={presetAmount}
                type="amount"
                label={getAmountWithCurrencySymbol(
                  presetAmount,
                  baseCurrencyName,
                )}
                onClick={() =>
                  trading.amounts.buy.invest.baseCurrency.onAmountChange(
                    presetAmount,
                  )
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
