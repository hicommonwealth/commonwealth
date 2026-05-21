import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import FormattedDisplayNumber from '../../../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
import { ReceiptDetailsProps } from '../types';
import './ReceiptDetails.scss';

const BuyReceipt = ({ trading }: ReceiptDetailsProps) => {
  const { invest, gain } = trading.amounts.buy;
  const ethFee = invest.commonPlatformFee.eth;

  return (
    <div className="ReceiptDetails">
      <div className="entry">
        <CWText type="caption">Exchange Rate (USD/ETH)</CWText>
        <CWText type="caption">
          1 ETH = {trading.amounts.buy.invest.baseCurrency.unitEthExchangeRate}{' '}
          USD
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
              currencySymbol: '',
            }}
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
            options={{
              decimals: ethFee >= 1 ? 4 : 6,
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
