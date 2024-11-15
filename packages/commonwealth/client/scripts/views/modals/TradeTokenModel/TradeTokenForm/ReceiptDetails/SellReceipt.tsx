import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { ReceiptDetailsProps } from '../types';
import './ReceiptDetails.scss';

const SellReceipt = ({ trading }: ReceiptDetailsProps) => {
  const baseTokenSymbol = trading.token.symbol;
  const { invest, gain } = trading.amounts.sell;

  return (
    <div className="ReceiptDetails">
      <div className="entry">
        <CWText type="caption">{baseTokenSymbol} to ETH rate</CWText>
        <CWText type="caption">
          {invest.baseToken.unitEthExchangeRate} {baseTokenSymbol} = 1 ETH
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Amount invested ({baseTokenSymbol})</CWText>
        <CWText type="caption">
          {invest.baseToken.amount} {baseTokenSymbol}
        </CWText>
      </div>
      <div className="entry">
        <CWText type="caption">ETH bought from invested amount</CWText>
        <CWText type="caption">{invest.baseToken.toEth} ETH</CWText>
      </div>
      <div className="entry">
        <CWText type="caption">
          Common&apos;s Platform Fee ({invest.commonPlatformFee.percentage})
        </CWText>
        <CWText type="caption">{invest.commonPlatformFee.eth} ETH</CWText>
      </div>
      <div className="entry">
        <CWText type="caption">Gain ETH amount</CWText>
        <CWText type="caption">{gain.eth} ETH</CWText>
      </div>
    </div>
  );
};

export default SellReceipt;
