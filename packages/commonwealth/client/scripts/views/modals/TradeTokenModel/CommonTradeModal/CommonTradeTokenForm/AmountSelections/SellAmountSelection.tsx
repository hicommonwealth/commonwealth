import React from 'react';
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

  return (
    <div className="AmountSelections">
      <div className="amount-input-with-currency-symbol">
        <CWTextInput
          containerClassName="amount-input"
          placeholder="0"
          value={trading.amounts.sell.invest.baseToken.amount}
          onInput={(e) =>
            trading.amounts.sell.invest.baseToken.onAmountChange(e)
          }
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
