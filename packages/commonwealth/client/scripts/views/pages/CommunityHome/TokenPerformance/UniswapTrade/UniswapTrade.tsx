import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import TokenIcon from 'client/scripts/views/modals/TradeTokenModel/TokenIcon';
import {
  ExternalToken,
  UniswapTradeTokenModalProps,
} from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import useUniswapTradeModal from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/useUniswapTradeModal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useNetworkSwitching } from 'hooks/useNetworkSwitching';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { NetworkIndicator } from 'views/modals/TradeTokenModel/NetworkIndicator';

import { useGetCommunityByIdQuery } from 'state/api/communities';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import './UniswapTrade.scss';

interface UniswapTradeProps {
  tradeConfig: UniswapTradeTokenModalProps['tradeConfig'];
}

const UniswapTrade = ({ tradeConfig }: UniswapTradeProps) => {
  const { data: tokenCommunity } = useGetCommunityByIdQuery({
    id: tradeConfig.token.community_id,
    enabled: !!tradeConfig.token.community_id,
    includeNodeInfo: true,
  });

  const ethChainId = tokenCommunity?.ChainNode?.eth_chain_id;
  const rpcUrl = tokenCommunity?.ChainNode?.url;
  const blockExplorerUrl = tokenCommunity?.ChainNode?.block_explorer;

  const { uniswapWidget } = useUniswapTradeModal({
    tradeConfig,
    ethChainId,
    rpcUrl,
    blockExplorerUrl,
  });

  const { currentChain, isWrongNetwork, promptNetworkSwitch } =
    useNetworkSwitching({
      ethChainId: tokenCommunity?.ChainNode?.eth_chain_id,
      rpcUrl: tokenCommunity?.ChainNode?.url,
      provider: uniswapWidget.provider,
    });

  const logo =
    (tradeConfig.token as ExternalToken).logo ||
    (tradeConfig.token as LaunchpadToken).icon_url;
  return (
    <div className="UniswapTrade">
      <div className="token-info">
        <CWText type="h4">
          Swap Token - {tradeConfig.token.symbol}{' '}
          {logo && <TokenIcon size="large" url={logo} />}
        </CWText>

        {/* Info tooltip disclaimer */}
        <span className="disclaimer">
          {withTooltip(
            <CWIconButton
              iconName="infoEmpty"
              iconSize="small"
              className="cursor-pointer"
            />,
            'Swaps only supports token on base',
            true,
          )}
        </span>
      </div>

      {/* Network indicator */}
      <NetworkIndicator
        currentChain={currentChain}
        isWrongNetwork={isWrongNetwork}
        onSwitchNetwork={() => void promptNetworkSwitch()}
      />

      <div
        className="Uniswap"
        onClick={isWrongNetwork ? () => void promptNetworkSwitch() : undefined}
      >
        {!uniswapWidget.isReady ? (
          <CWCircleMultiplySpinner />
        ) : (
          <SwapWidget
            className={`uniswap-widget-wrapper ${isWrongNetwork ? 'disabled-overlay' : ''}`}
            tokenList={uniswapWidget.tokensList}
            routerUrl={uniswapWidget.routerURLs.default}
            jsonRpcUrlMap={{ [ethChainId!]: [rpcUrl!] }}
            theme={uniswapWidget.theme}
            defaultInputTokenAddress={uniswapWidget.defaultTokenAddress.input}
            defaultOutputTokenAddress={uniswapWidget.defaultTokenAddress.output}
            convenienceFee={uniswapWidget.convenienceFee.percentage}
            convenienceFeeRecipient={uniswapWidget.convenienceFee.recipient}
            hideConnectionUI={true}
            {...(uniswapWidget.provider && {
              provider: uniswapWidget.provider,
            })}
            onError={(error) => {
              console.error(error);
              notifyError(
                'There was an error with the swap widget. Please try again.',
              );
            }}
            onTxFail={(error) => {
              console.error(error);
              notifyError('Transaction failed. Please try again.');
            }}
            onTxSuccess={() => notifySuccess('Transaction successful!')}
          />
        )}
      </div>
    </div>
  );
};

export default UniswapTrade;
