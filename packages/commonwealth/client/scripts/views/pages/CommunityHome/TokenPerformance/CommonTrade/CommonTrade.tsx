import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import CommonTradeTokenForm, {
  useCommonTradeTokenForm,
} from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm';
import { CommonTradeTokenModalProps } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import TokenIcon from 'client/scripts/views/modals/TradeTokenModel/TokenIcon';
import { SupportedCurrencies } from 'helpers/currency';
import useBeforeUnload from 'hooks/useBeforeUnload';
import React from 'react';

import './CommonTrade.scss';

const TRADING_CURRENCY = SupportedCurrencies.USD;

export type CommonTradeProps = Omit<
  CommonTradeTokenModalProps,
  'isOpen' | 'onModalClose'
>;

const CommonTrade = ({ tradeConfig }: CommonTradeProps) => {
  const { trading, addresses, isActionPending, onCTAClick } =
    useCommonTradeTokenForm({
      tradeConfig: {
        ...tradeConfig,
        ethBuyCurrency: TRADING_CURRENCY,
        buyTokenPresetAmounts: [100, 300, 1000],
        sellTokenPresetAmounts: ['Max'],
      },
      addressType: tradeConfig.addressType,
      onTradeComplete: () => {},
    });

  useBeforeUnload(isActionPending);

  return (
    <div className="CommonTrade">
      <CWText type="h4" className="token-info">
        Trade Token - {tradeConfig.token.symbol}{' '}
        {trading.token.icon_url && (
          <TokenIcon size="large" url={trading.token.icon_url} />
        )}
      </CWText>
      <CommonTradeTokenForm
        trading={trading}
        addresses={addresses}
        onCTAClick={onCTAClick}
        isActionPending={isActionPending}
      />
    </div>
  );
};

export default CommonTrade;
