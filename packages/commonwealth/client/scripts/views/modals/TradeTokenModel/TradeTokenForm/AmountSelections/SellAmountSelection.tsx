import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SellAmountSelectionProps } from '../types';
import './AmountSelections.scss';

const SellAmountSelection = ({ trading }: SellAmountSelectionProps) => {
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
        {trading.amounts.sell.gain.eth} ETH
      </CWText>
    </div>
  );
};

export default SellAmountSelection;
