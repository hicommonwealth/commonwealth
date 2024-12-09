import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { ChainBase } from '@hicommonwealth/shared';
import { Theme } from '@uniswap/widgets';
import WebWalletController from 'controllers/app/web_wallets';
import { ethers } from 'ethers';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { UseUniswapTradeModalProps } from './types';

// Maintainance Notes:
// - Anywhere a `UNISWAP_WIDGET_HACK` label is applied, its a workaround to get the uniswap widget
// to work with our stack

// UNISWAP_WIDGET_HACK: Pricing calculation calls fail when adding a token to swap in the uniswap widget. This hack
// method definition hack fixes a bug with a dependent pkg of the uniswap widget package.
// See: https://github.com/Uniswap/widgets/issues/627#issuecomment-1930627298 for more context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tempWindow = window as any;
tempWindow.Browser = {
  T: () => {},
};

const uniswapTokenListURLs = {
  // UNISWAP_WIDGET_HACK: By default the widget uses https://gateway.ipfs.io/ipns/tokens.uniswap.org for tokens
  // list, but it doesn't work (DNS_PROBE_FINISHED_NXDOMAIN) for me (@malik). The original
  // url resolved to https://ipfs.io/ipns/tokens.uniswap.org, i am passing this as a param to
  // the uniswap widget. See: https://github.com/Uniswap/widgets/issues/580#issuecomment-2086094025
  // for more context.
  default: 'https://ipfs.io/ipns/tokens.uniswap.org',
};

const uniswapRouterURLs = {
  // UNISWAP_WIDGET_HACK: the widget doesn't call any pricing endpoints if this router url isn't enforced
  // see: https://github.com/Uniswap/widgets/issues/637#issuecomment-2253135676 for more context
  default: 'https://api.uniswap.org/v1/',
};

// custom theme to make the widget match common's style
const uniswapWidgetTheme: Theme = {
  primary: '#282729',
  secondary: '#666666',
  accent: '#514e52',
  interactive: '#3d3a3e',
  container: '#ffffff',
  dialog: '#ffffff',
  fontFamily: 'Silka',
  outline: '#e0dfe1',
  module: '#e7e7e7',
};

const useUniswapTradeModal = ({ tradeConfig }: UseUniswapTradeModalProps) => {
  const [uniswapProvider, setUniswapProvider] =
    useState<ethers.providers.Web3Provider>();

  // base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.Base,
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
    uniswapWidget: {
      provider: uniswapProvider,
      theme: uniswapWidgetTheme,
      tokenListURLs: uniswapTokenListURLs,
      routerURLs: uniswapRouterURLs,
    },
    // TODO: only export what's needed
    tradeConfig,
  };
};

export default useUniswapTradeModal;
