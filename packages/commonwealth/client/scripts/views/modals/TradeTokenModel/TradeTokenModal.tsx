import { ChainBase } from '@hicommonwealth/shared';
import React from 'react';
import CommonTradeModal from './CommonTradeModal';
import JupiterTradeModal from './JupiterSwapModal/JupiterTradeModal';
import { TradeTokenModalProps, TradingMode } from './types';
import UniswapTradeModal from './UniswapTradeModal/UniswapTradeModal';

// Default USDC token config for testing
const DEFAULT_USDC_CONFIG = {
  mode: TradingMode.Swap,
  addressType: ChainBase.Ethereum,
  token: {
    name: 'USD Coin',
    symbol: 'USDC',
    contract_address: '0xec267c53f53807c2337c257f8ac3fc3cc07cc0ed',
    decimals: 6,
    chainId: 8453,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
};

const TradeTokenModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps & { tradeConfig?: any }) => {
  const config = DEFAULT_USDC_CONFIG;
  if (config.mode === TradingMode.Swap) {
    // Render Uniswap for EVM, Jupiter for Solana
    if (config.addressType === 'solana') {
      return (
        <JupiterTradeModal
          isOpen={isOpen}
          tradeConfig={config}
          onModalClose={onModalClose}
        />
      );
    }
    return (
      <UniswapTradeModal
        isOpen={isOpen}
        tradeConfig={config}
        onModalClose={onModalClose}
      />
    );
  }

  return (
    <CommonTradeModal
      isOpen={isOpen}
      tradeConfig={config}
      onModalClose={onModalClose}
    />
  );
};

export default TradeTokenModal;
