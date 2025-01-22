import { getAmountWithCurrencySymbol } from 'helpers/currency';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import TokenIcon from '../../../TokenIcon';
import { BuyAmountSelectionProps } from '../types';
import './AmountSelections.scss';

const BuyAmountSelection = ({ trading }: BuyAmountSelectionProps) => {
  const baseCurrencyName = trading.amounts.buy.invest.baseCurrency.name;

  return (
    <div className="AmountSelections">
      <div className="amount-input-with-currency-symbol">
        <CWText className="amount-symbol">
          <CWIcon iconName="ethereum" iconSize="medium" /> {baseCurrencyName}
        </CWText>
        <CWTextInput
          containerClassName="amount-input"
          placeholder="0"
          value={trading.amounts.buy.invest.baseCurrency.amount}
          onInput={(e) =>
            trading.amounts.buy.invest.baseCurrency.onAmountChange(e)
          }
        />
      </div>

      <CWText type="caption" className="invest-to-gain-amounts">
        = {trading.token.icon_url && <TokenIcon url={trading.token.icon_url} />}
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
                  presetAmount as number,
                  trading.amounts.buy.invest.ethBuyCurrency,
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
