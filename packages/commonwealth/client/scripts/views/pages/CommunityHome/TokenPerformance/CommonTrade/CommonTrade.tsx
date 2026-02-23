import { SupportedCryptoCurrencies } from 'helpers/currency';
import React from 'react';
import useBeforeUnload from 'shared/hooks/useBeforeUnload';
import { CWText } from 'views/components/component_kit/cw_text';
import CommonTradeTokenForm, {
  useCommonTradeTokenForm,
} from 'views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm';
import { CommonTradeTokenModalProps } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import TokenIcon from 'views/modals/TradeTokenModel/TokenIcon';

import './CommonTrade.scss';

export type CommonTradeProps = Omit<
  CommonTradeTokenModalProps,
  'isOpen' | 'onModalClose'
>;

const CommonTrade = ({ tradeConfig }: CommonTradeProps) => {
  const { trading, addresses, isActionPending, onCTAClick } =
    useCommonTradeTokenForm({
      tradeConfig: {
        ...tradeConfig,
        buyCurrency: SupportedCryptoCurrencies.ETH,
        buyTokenPresetAmounts: [0.000555, 0.00555, 0.0555],
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
        {trading.token && trading.token.icon_url && (
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
