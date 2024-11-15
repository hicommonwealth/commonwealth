import {
  currencyNameToSymbolMap,
  currencySymbolPlacements,
} from 'helpers/currency';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ReceiptDetailsProps } from '../types';
import './ReceiptDetails.scss';

const BuyReceipt = ({ trading }: ReceiptDetailsProps) => {
  const { invest, gain } = trading.amounts.buy;
  const baseCurrencyName = invest.baseCurrency.name;
  const baseCurrencySymbol = currencyNameToSymbolMap[baseCurrencyName];
  const isLeftSymbolCurrency =
    currencySymbolPlacements.onLeft.includes(baseCurrencyName);
  const isRightSymbolCurrency =
    currencySymbolPlacements.onRight.includes(baseCurrencyName);

  return (
    <div className="ReceiptDetails">
      <div className="entry">
        <CWText type="caption">{baseCurrencyName} to ETH rate</CWText>
        <CWText type="caption">
          {isLeftSymbolCurrency ? baseCurrencySymbol : ''}{' '}
          {invest.baseCurrency.unitEthExchangeRate}
          {isRightSymbolCurrency ? baseCurrencySymbol : ''} = 1 ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Amount invested ({baseCurrencyName})</CWText>
        <CWText type="caption">
          {isLeftSymbolCurrency ? baseCurrencySymbol : ''}{' '}
          {invest.baseCurrency.amount}
          {isRightSymbolCurrency ? baseCurrencySymbol : ''}
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">ETH bought from invested amount</CWText>
        <CWText type="caption">{invest.baseCurrency.toEth} ETH</CWText>
      </div>
      <div className="entry">
        <CWText type="caption">
          Common&apos;s Platform Fee ({invest.commonPlatformFee.percentage})
        </CWText>
        <CWText type="caption">{invest.commonPlatformFee.eth} ETH</CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Remaining ETH to tokens</CWText>
        <CWText type="caption">
          {invest.baseCurrency.toEth - invest.commonPlatformFee.eth} ETH ={' '}
          {gain.token} {trading.token.symbol}
        </CWText>
      </div>
    </div>
  );
};

export default BuyReceipt;
