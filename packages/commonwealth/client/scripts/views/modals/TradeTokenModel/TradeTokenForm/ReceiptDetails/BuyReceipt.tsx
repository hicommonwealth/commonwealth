import {
  currencyNameToSymbolMap,
  currencySymbolPlacements,
} from 'helpers/currency';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ReceiptDetailsProps } from '../types';
import './ReceiptDetails.scss';

const BuyReceipt = ({ trading }: ReceiptDetailsProps) => {
  const baseCurrencyName = trading.amounts.buy.baseCurrency.name;
  const baseCurrencySymbol = currencyNameToSymbolMap[baseCurrencyName];
  const isLeftSymbolCurrency =
    currencySymbolPlacements.onLeft.includes(baseCurrencyName);
  const isRightSymbolCurrency =
    currencySymbolPlacements.onRight.includes(baseCurrencyName);

  return (
    <div className="ReceiptDetails">
      <div className="entry">
        <CWText type="caption">ETH to {baseCurrencyName} rate</CWText>
        <CWText type="caption">
          1 ETH = {isLeftSymbolCurrency ? baseCurrencySymbol : ''}{' '}
          {trading.unitEthToBaseCurrencyRate}
          {isRightSymbolCurrency ? baseCurrencySymbol : ''}
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Amount invested ({baseCurrencyName})</CWText>
        <CWText type="caption">
          {isLeftSymbolCurrency ? baseCurrencySymbol : ''}{' '}
          {trading.amounts.buy.baseCurrency.amount}
          {isRightSymbolCurrency ? baseCurrencySymbol : ''}
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">ETH bought from invested amount</CWText>
        <CWText type="caption">{trading.amounts.buy.eth} ETH</CWText>
      </div>
      <div className="entry">
        <CWText type="caption">
          Common&apos;s Platform Fee (
          {trading.amounts.buy.commonPlatformFee.percentage})
        </CWText>
        <CWText type="caption">
          {trading.amounts.buy.commonPlatformFee.eth} ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Remaining ETH to tokens</CWText>
        <CWText type="caption">
          {trading.amounts.buy.eth - trading.amounts.buy.commonPlatformFee.eth}{' '}
          ETH = {trading.amounts.buy.token} {trading.token.symbol}
        </CWText>
      </div>
    </div>
  );
};

export default BuyReceipt;
