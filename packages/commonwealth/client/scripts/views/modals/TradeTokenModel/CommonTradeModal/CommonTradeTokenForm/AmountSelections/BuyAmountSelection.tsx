import clsx from 'clsx';
import { getAmountWithCurrencySymbol } from 'helpers/currency';
import React, { useEffect, useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import FormattedDisplayNumber from '../../../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
import TokenIcon from '../../../TokenIcon';
import { BuyAmountSelectionProps } from '../types';
import './AmountSelections.scss';

const BuyAmountSelection = ({ trading }: BuyAmountSelectionProps) => {
  const baseCurrencyName = trading.amounts.buy.invest.baseCurrency.name;
  const inputValue = trading.amounts.buy.invest.baseCurrency.amount || '0';

  const [inputLength, setInputLength] = useState(inputValue.length);

  useEffect(() => {
    setInputLength((inputValue || '0').length);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputLength(e.target.value.length);
    trading.amounts.buy.invest.baseCurrency.onAmountChange(e);
  };

  const getFontSizeClass = (length: number): string => {
    if (length > 8) return 'font-size-xsmall';
    if (length > 6) return 'font-size-small';
    if (length > 4) return 'font-size-medium';
    return 'font-size-normal';
  };

  const fontSizeClass = getFontSizeClass(inputLength);

  return (
    <div className="AmountSelections">
      <div className="amount-input-with-currency-symbol">
        <CWText className="amount-symbol">
          <CWIcon iconName="ethereum" iconSize="medium" /> {baseCurrencyName}
        </CWText>
        <CWTextInput
          containerClassName="amount-input"
          placeholder="0"
          value={inputValue}
          inputClassName={clsx(fontSizeClass)}
          onInput={handleInputChange}
        />
      </div>

      <CWText type="caption" className="invest-to-gain-amounts">
        = {trading.token.icon_url && <TokenIcon url={trading.token.icon_url} />}
        <FormattedDisplayNumber
          value={trading.amounts.buy.gain.token}
          options={{ decimals: 4 }}
        />{' '}
        {trading.token.symbol}
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
