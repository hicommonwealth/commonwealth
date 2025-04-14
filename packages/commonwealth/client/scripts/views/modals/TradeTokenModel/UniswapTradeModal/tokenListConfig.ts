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
    },
  },
};
