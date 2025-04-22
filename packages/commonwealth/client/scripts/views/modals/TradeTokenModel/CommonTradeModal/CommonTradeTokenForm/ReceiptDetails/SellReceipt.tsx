import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import FormattedDisplayNumber from '../../../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
import { ReceiptDetailsProps } from '../types';
import './ReceiptDetails.scss';

const SellReceipt = ({ trading }: ReceiptDetailsProps) => {
  const baseTokenSymbol = trading.token.symbol;
  const { invest, gain } = trading.amounts.sell;
  const ethBeforeFee = invest.baseToken.toEth;
  const ethFee = invest.commonPlatformFee.eth;
  const ethGained = gain.eth;

  return (
    <div className="ReceiptDetails">
      <div className="entry">
        <CWText type="caption">Exchange Rate ({baseTokenSymbol}/ETH)</CWText>
        <CWText type="caption">
          1 {baseTokenSymbol} ={' '}
          <FormattedDisplayNumber
            type="caption"
            value={invest.baseToken.unitEthExchangeRate}
            options={{ decimals: 8 }}
          />
          &nbsp;ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Amount Sold</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={invest.baseToken.amount}
            options={{ decimals: 6 }}
          />
          &nbsp;{baseTokenSymbol}
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">ETH Value Before Fee</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={ethBeforeFee}
            options={ethBeforeFee >= 1 ? { decimals: 4 } : { decimals: 6 }}
          />
          &nbsp;ETH
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
            options={ethFee >= 1 ? { decimals: 4 } : { decimals: 6 }}
          />
          &nbsp;ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">ETH Received</CWText>
        <CWText type="caption">
          <FormattedDisplayNumber
            type="caption"
            value={ethGained}
            options={ethGained >= 1 ? { decimals: 4 } : { decimals: 6 }}
          />
          &nbsp;ETH
        </CWText>
      </div>
    </div>
  );
};

export default SellReceipt;
