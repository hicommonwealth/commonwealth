import { ValidChains } from '@hicommonwealth/evm-protocols';

/* eslint-disable */
export const uniswapTokenListConfig = {
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
      [ValidChains.Base]: {
        list: [
          {
            name: 'Tether USD',
            address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
            symbol: 'USDT',
            decimals: 6,
            chainId: ValidChains.Base,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
          },
          {
            name: 'USD Coin',
            address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            symbol: 'USDC',
            decimals: 6,
            chainId: ValidChains.Base,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
          },
          {
            name: 'Wrapped Ether',
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            decimals: 18,
            chainId: ValidChains.Base,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4200000000000000000000000000000000000006/logo.png',
          },
        ],
      },
      [ValidChains.Soneium]: {
        // Soneium token list
        // Token addresses sourced from Soneium documentation: https://docs.soneium.org/docs/builders/contracts
        list: [
          {
            name: 'Wrapped Ether',
            address: '0x4200000000000000000000000000000000000006',
            symbol: 'WETH',
            decimals: 18,
            chainId: ValidChains.Soneium,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
          {
            name: 'Tether USD',
            address: '0x3A337a6adA9d885b6Ad95ec48F9b75f197b5AE35',
            symbol: 'USDT',
            decimals: 6,
            chainId: ValidChains.Soneium,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
          },
          {
            name: 'Bridged USD Coin',
            address: '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
            symbol: 'USDC.e',
            decimals: 6,
            chainId: ValidChains.Soneium,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
          },
          {
            name: 'Astar',
            address: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441',
            symbol: 'ASTR',
            decimals: 18,
            chainId: ValidChains.Soneium,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/astar/assets/0xAaAebbBE8Bc970F84bC5fE5c581926bE0B5F0B2d/logo.png',
          },
          {
            name: 'Wrapped Staked Ether',
            address: '0xaA9BD8c957D803466FA92504BDd728cC140f8941',
            symbol: 'wstETH',
            decimals: 18,
            chainId: ValidChains.Soneium,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0/logo.png',
          },
          {
            name: 'Staked Ether',
            address: '0x0Ce031AEd457C870D74914eCAA7971dd3176cDAF',
            symbol: 'stETH',
            decimals: 18,
            chainId: ValidChains.Soneium,
            logoURI:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
          },
        ],
      },
    },
  },
};
