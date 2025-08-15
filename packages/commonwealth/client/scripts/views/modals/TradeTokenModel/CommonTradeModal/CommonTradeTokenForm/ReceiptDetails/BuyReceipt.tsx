import {
  currencyNameToSymbolMap,
  currencySymbolPlacements,
} from 'helpers/currency';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import FormattedDisplayNumber from '../../../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
import { ReceiptDetailsProps } from '../types';
import './ReceiptDetails.scss';

const BuyReceipt = ({ trading }: ReceiptDetailsProps) => {
  const { invest, gain } = trading.amounts.buy;
  const baseCurrencyName = invest.baseCurrency.name;
  const baseCurrencySymbol = currencyNameToSymbolMap[baseCurrencyName];
  const buyCurrency = trading.amounts.buy.invest.buyCurrency;
  const isLeftSymbolCurrency =
    currencySymbolPlacements.onLeft.includes(buyCurrency);
  const isRightSymbolCurrency =
    currencySymbolPlacements.onRight.includes(buyCurrency);

  const ethUsed = invest.baseCurrency.toEth - invest.commonPlatformFee.eth;
  const ethFee = invest.commonPlatformFee.eth;

  return (
    <div className="ReceiptDetails">
      <div className="entry">
        <CWText type="caption">Exchange Rate ({buyCurrency}/ETH)</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={invest.baseCurrency.unitEthExchangeRate}
            options={{
              decimals: 6,
              currencySymbol: '$',
            }}
          />
          {isRightSymbolCurrency ? baseCurrencySymbol : ''} &nbsp;=&nbsp; 1 ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Amount Invested</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={invest.baseCurrency.amount}
            options={{
              decimals: 4,
              currencySymbol: isLeftSymbolCurrency ? baseCurrencySymbol : '',
            }}
          />
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">
          Trading Fee ({invest.commonPlatformFee.percentage})
        </CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={ethFee}
            options={{
              decimals: ethFee >= 1 ? 4 : 6,
            }}
          />
          &nbsp;ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">ETH Used for Purchase</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={ethUsed}
            options={{
              decimals: ethUsed >= 1 ? 4 : 6,
            }}
          />
          &nbsp;ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Tokens Received</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={gain.token}
            options={{ decimals: 6 }}
          />
          &nbsp;{trading.token.symbol}
        </CWText>
      </div>
    </div>
  );
};

export default BuyReceipt;
