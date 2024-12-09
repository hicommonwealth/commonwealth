import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { ChainBase } from '@hicommonwealth/shared';
import WebWalletController from 'controllers/app/web_wallets';
import { ethers } from 'ethers';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { UseUniswapTradeModalProps } from './types';

const useUniswapTradeModal = ({ tradeConfig }: UseUniswapTradeModalProps) => {
  const [uniswapProvider, setUniswapProvider] =
    useState<ethers.providers.Web3Provider>();

  // base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.SepoliaBase,
  ) as NodeInfo; // this is expected to exist

  useRunOnceOnCondition({
    callback: () => {
      const handleAsync = async () => {
        // adding this to avoid ts issues
        if (!baseNode?.ethChainId) return;

        const wallet = WebWalletController.Instance.availableWallets(
          ChainBase.Ethereum,
        );
        const selectedWallet = wallet[0];
        await selectedWallet.enable(`${baseNode.ethChainId}`);
        const tempProvider = new ethers.providers.Web3Provider(
          selectedWallet.api.givenProvider,
        );
        setUniswapProvider(tempProvider);
      };
      handleAsync().catch(console.error);
    },
    shouldRun: !!baseNode.ethChainId,
  });

  return {
    uniswapProvider,
    // TODO: only export what's needed
    tradeConfig,
  };
};

export default useUniswapTradeModal;
