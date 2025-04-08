// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;
import TokenIcon from 'client/scripts/views/modals/TradeTokenModel/TokenIcon';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect } from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

import './JupiterTrade.scss';

// Jupiter-specific types
export type JupiterTradingConfig = {
  mode: 'Swap'; // Jupiter only supports swap mode
  token: {
    symbol: string;
    mintAddress: string; // Solana-specific term
    logo?: string;
  };
  network: 'solana-mainnet' | 'solana-devnet' | 'solana-testnet';
  rpcEndpoint?: string; // Optional custom RPC endpoint
  jupiterOptions?: {
    initialAmount?: string;
    swapMode?: 'ExactIn' | 'ExactOut';
    fixedAmount?: boolean;
    fixedInputMint?: boolean;
    initialOutputMint?: string;
    fixedOutputMint?: boolean;
  };
};

export type JupiterTradeTokenModalProps = {
  isOpen: boolean;
  onModalClose?: () => void;
  tradeConfig: JupiterTradingConfig;
};

const JupiterTrade = ({ tradeConfig }: JupiterTradeTokenModalProps) => {
  const jupiterConfig = {
    endpoint: tradeConfig.rpcEndpoint || 'https://api.mainnet-beta.solana.com',
    containerClassName: 'jupiter-widget-wrapper',
    formProps: {
      initialInputMint: tradeConfig.token.mintAddress,
      initialAmount: tradeConfig.jupiterOptions?.initialAmount || '1',
      swapMode: tradeConfig.jupiterOptions?.swapMode || 'ExactIn',
      fixedAmount: tradeConfig.jupiterOptions?.fixedAmount || false,
      fixedInputMint: tradeConfig.jupiterOptions?.fixedInputMint || false,
      initialOutputMint: tradeConfig.jupiterOptions?.initialOutputMint,
      fixedOutputMint: tradeConfig.jupiterOptions?.fixedOutputMint || false,
    },
  };

  useEffect(() => {
    const initializeJupiter = async () => {
      if (!window.Jupiter) {
        console.error('Jupiter Terminal not loaded');
        notifyError('Failed to load Jupiter Terminal');
        return;
      }

      try {
        await window.Jupiter.init({
          displayMode: 'integrated',
          endpoint: jupiterConfig.endpoint,
          containerClassName: jupiterConfig.containerClassName,
          formProps: jupiterConfig.formProps,
          strictTokenList: false,
          enableWalletPassthrough: false,
          onSuccess: () => {
            notifySuccess('Transaction successful!');
          },
          onError: (error) => {
            console.error(error);
            notifyError('Transaction failed. Please try again.');
          },
        });
      } catch (error) {
        console.error('Jupiter initialization failed:', error);
        notifyError('Failed to initialize Jupiter Terminal');
      }
    };

    initializeJupiter();

    // Cleanup
    return () => {
      if (window.Jupiter && window.Jupiter.resume) {
        window.Jupiter.resume();
      }
    };
  }, [jupiterConfig.endpoint]);

  return (
    <div className="JupiterTrade">
      <div className="token-info">
        <CWText type="h4">
          Swap Token - {tradeConfig.token.symbol}{' '}
          {tradeConfig.token.logo && (
            <TokenIcon size="large" url={tradeConfig.token.logo} />
          )}
        </CWText>

        {/* Info tooltip disclaimer */}
        <span className="disclaimer">
          {withTooltip(
            <CWIconButton
              iconName="infoEmpty"
              iconSize="small"
              className="cursor-pointer"
            />,
            'Swaps only supported on Solana network',
            true,
          )}
        </span>
      </div>

      <div className="Jupiter">
        <div className="jupiter-widget-wrapper">
          {/* Jupiter Terminal will render here via window.Jupiter.init */}
          {!window.Jupiter && <CWCircleMultiplySpinner />}
        </div>
      </div>
    </div>
  );
};

export default JupiterTrade;
