import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { ChainBase } from '@hicommonwealth/shared';
import { Theme } from '@uniswap/widgets';
import WebWalletController from 'controllers/app/web_wallets';
import { ethers } from 'ethers';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { UniswapToken, UseUniswapTradeModalProps } from './types';

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

const uniswapTokenListConfig = {
  default: {
    // UNISWAP_WIDGET_HACK: By default the widget uses https://gateway.ipfs.io/ipns/tokens.uniswap.org for tokens
    // list, but it doesn't work (DNS_PROBE_FINISHED_NXDOMAIN) for me (@malik). The original
    // url resolved to https://ipfs.io/ipns/tokens.uniswap.org, i am passing this as a param to
    // the uniswap widget. See: https://github.com/Uniswap/widgets/issues/580#issuecomment-2086094025
    // for more context.
    chains: { 1: { url: 'https://ipfs.io/ipns/tokens.uniswap.org' } },
  },
  custom: {
    chains: {
      8453: {
        list: [
          {
            name: 'Tether USD',
            address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
            symbol: 'USDT',
            decimals: 6,
            chainId: 8453,
            logoURI:
              // eslint-disable-next-line max-len
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
          },
          {
            name: 'USD Coin',
            address: '0xec267c53f53807c2337c257f8ac3fc3cc07cc0ed',
            symbol: 'USDC',
            decimals: 6,
            chainId: 8453,
            logoURI:
              // eslint-disable-next-line max-len
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
          },
          {
            name: 'Wrapped Ether',
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            decimals: 18,
            chainId: 8453,
            logoURI:
              // eslint-disable-next-line max-len
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4200000000000000000000000000000000000006/logo.png',
          },
        ],
      },
    },
  },
};

const uniswapRouterURLs = {
  // UNISWAP_WIDGET_HACK: the widget doesn't call any pricing endpoints if this router url isn't enforced
  // see: https://github.com/Uniswap/widgets/issues/637#issuecomment-2253135676 for more context
  default: 'https://api.uniswap.org/v1/',
};

// custom theme to make the widget match common's style
const uniswapWidgetTheme: Theme = {
  container: '#ffffff',
  dialog: '#ffffff',
  module: '#e7e7e7',
  outline: '#e0dfe1',
  fontFamily: 'Silka',
  accent: '#514e52', // primary actions color
  accentSoft: '#514e52', // primary actions color with soft tone
  interactive: '#3d3a3e', // secondary actions color
  primary: '#282729', // primary text color
  secondary: '#666666', // secondary text color
};

const useUniswapTradeModal = ({ tradeConfig }: UseUniswapTradeModalProps) => {
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);
  const [uniswapProvider, setUniswapProvider] =
    useState<ethers.providers.Web3Provider>();
  const [uniswapTokensList, setUniswapTokensList] = useState<UniswapToken[]>();

  // base chain node info
  const nodes = fetchCachedNodes();
  const baseNode = nodes?.find(
    (n) => n.ethChainId === commonProtocol.ValidChains.Base,
  ) as NodeInfo; // this is expected to exist

  useRunOnceOnCondition({
    callback: () => {
      const handleAsync = async () => {
        setIsLoadingInitialState(true);

        // adding this to avoid ts issues
        if (!baseNode?.ethChainId) return;

        // set tokens list with add our custom token
        setUniswapTokensList([
          ...(uniswapTokenListConfig.custom.chains?.[baseNode.ethChainId]
            ?.list || []),
          {
            name: tradeConfig.token.name,
            address: tradeConfig.token.contract_address,
            symbol: tradeConfig.token.symbol,
            decimals: tradeConfig.token.decimals,
            chainId: baseNode.ethChainId,
            logoURI: tradeConfig.token.logo || '',
          },
        ]);

        // switch chain network on wallet
        {
          const wallet = WebWalletController.Instance.availableWallets(
            ChainBase.Ethereum,
          );
          const selectedWallet = wallet[0];
          await selectedWallet.enable(`${baseNode.ethChainId}`);
          const tempProvider = new ethers.providers.Web3Provider(
            selectedWallet.api.givenProvider,
          );
          setUniswapProvider(tempProvider);
        }
      };
      handleAsync()
        .catch(console.error)
        .finally(() => setIsLoadingInitialState(false));
    },
    shouldRun: !!baseNode.ethChainId,
  });

  return {
    uniswapWidget: {
      isReady: !isLoadingInitialState,
      provider: uniswapProvider,
      theme: uniswapWidgetTheme,
      tokensList: uniswapTokensList,
      defaultTokenAddress: {
        input: 'NATIVE', // special address for native token of default chain
        output: tradeConfig.token.contract_address,
      },
      routerURLs: uniswapRouterURLs,
    },
  };
};

export default useUniswapTradeModal;
