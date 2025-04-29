import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import FormattedDisplayNumber from '../../../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
import { SellAmountSelectionProps } from '../types';
import './AmountSelections.scss';

const SellAmountSelection = ({ trading }: SellAmountSelectionProps) => {
  const ethGain = trading.amounts.sell.gain.eth || 0;
  const decimalOptions = ethGain >= 1 ? { decimals: 4 } : { decimals: 6 };
  const inputValue = trading.amounts.sell.invest.baseToken.amount || '0';

  const [inputLength, setInputLength] = useState(inputValue.length);

  useEffect(() => {
    setInputLength((inputValue || '0').length);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputLength(e.target.value.length);
    trading.amounts.sell.invest.baseToken.onAmountChange(e);
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
        <CWTextInput
          containerClassName="amount-input"
          placeholder="0"
          value={inputValue}
          inputClassName={clsx(fontSizeClass)}
          onInput={handleInputChange}
        />
        <CWText className="amount-symbol">{trading.token.symbol}</CWText>
      </div>

      <CWText type="caption" className="invest-to-gain-amounts">
        =
        <CWIcon iconName="ethereum" iconSize="small" />{' '}
        <FormattedDisplayNumber value={ethGain} options={decimalOptions} /> ETH
      </CWText>

      {trading.amounts.sell.invest.baseToken.presetAmounts && (
        <div className="preset-amounts">
          {trading.amounts.sell.invest.baseToken.presetAmounts?.map(
            (presetAmount) => (
              <CWTag
                key={presetAmount}
                type="amount"
                label={`${presetAmount}`}
                onClick={() =>
                  trading.amounts.sell.invest.baseToken.onAmountChange(
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

export default SellAmountSelection;
