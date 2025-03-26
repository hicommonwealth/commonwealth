import { Web3Provider } from '@ethersproject/providers';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import {
  ChainBase,
  UNISWAP_CONVENIENCE_FEE_PERCENT,
  UNISWAP_CONVENIENCE_FEE_RECIPIENT_ADDRESS,
} from '@hicommonwealth/shared';
import { Theme } from '@uniswap/widgets';
import {
  isMagicUser as checkIfMagicUser,
  getMagicForChain,
} from 'client/scripts/utils/magicNetworkUtils';
import WebWalletController from 'controllers/app/web_wallets';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import NodeInfo from 'models/NodeInfo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import {
  UniswapToken,
  UniswapWidgetConfig,
  UseUniswapTradeModalProps,
} from './types';

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

// Keep token list and router URLs config

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
  const [ethersProvider, setEthersProvider] = useState<
    Web3Provider | undefined
  >(undefined);
  const [uniswapTokensList, setUniswapTokensList] = useState<UniswapToken[]>();
  const [jsonRpcUrlMap, setJsonRpcUrlMap] = useState<{
    [chainId: number]: string[];
  }>({});
  const [isMagicConfigured, setIsMagicConfigured] = useState(false);

  // Use cached nodes - only fetch once
  const nodes = fetchCachedNodes();

  // Check if user is logged in with Magic
  const userIsMagicUser = useMemo(() => checkIfMagicUser(), []);

  // Process nodes to create RPC URL map
  useEffect(() => {
    if (nodes) {
      const rpcMap = nodes.reduce(
        (acc, node) => {
          if (node.ethChainId && node.url) {
            const urls = node.url.split(',').map((url) => url.trim());
            acc[node.ethChainId] = urls;
          }
          return acc;
        },
        {} as { [chainId: number]: string[] },
      );

      setJsonRpcUrlMap(rpcMap);
    }
  }, [nodes]);

  // Find base chain node
  const baseNode = useMemo(
    () =>
      nodes?.find((n) => n.ethChainId === commonProtocol.ValidChains.Base) as
        | NodeInfo
        | undefined,
    [nodes],
  );

  // Automatically configure Magic provider for Magic users
  useEffect(() => {
    if (userIsMagicUser && !isMagicConfigured && baseNode?.ethChainId) {
      const configureMagicProvider = async () => {
        try {
          // Use the utility function to get Magic instance for the Base chain
          if (!baseNode.ethChainId) return;
          const magic = getMagicForChain(baseNode.ethChainId);
          if (!magic) {
            return;
          }

          // Attempt to get user info to test authentication
          try {
            await magic.user.getInfo();
          } catch (userError) {
            try {
              // Try to show the Magic UI to prompt login
              await magic.wallet.showUI();
            } catch (uiError) {
              // Error showing UI, fail silently
            }
          }

          // Wrap the Magic provider in an ethers Web3Provider
          const ethersCompatibleProvider = new Web3Provider(magic.rpcProvider);

          setEthersProvider(ethersCompatibleProvider);
          setIsMagicConfigured(true);
        } catch (error) {
          // Error configuring provider, fail silently
        }
      };

      configureMagicProvider();
    }
  }, [userIsMagicUser, baseNode, isMagicConfigured]);

  // Initialize token list
  useRunOnceOnCondition({
    callback: () => {
      const handleTokensInit = async () => {
        setIsLoadingInitialState(true);

        if (!baseNode?.ethChainId) {
          return;
        }

        // Set tokens list with custom token
        const customLists =
          uniswapTokenListConfig.custom.chains?.[baseNode.ethChainId]?.list ||
          [];
        const tokensList = [
          ...customLists,
          {
            name: tradeConfig.token.name,
            address: tradeConfig.token.contract_address,
            symbol: tradeConfig.token.symbol,
            decimals: tradeConfig.token.decimals,
            chainId: baseNode.ethChainId,
            logoURI: tradeConfig.token.logo || '',
          },
        ];

        setUniswapTokensList(tokensList);
        setIsLoadingInitialState(false);
      };

      handleTokensInit().catch(() => {
        setIsLoadingInitialState(false);
      });
    },
    shouldRun: !!baseNode?.ethChainId,
  });

  // Connect wallet handler - manages Magic and regular wallet connections
  const connectWallet = useCallback(async (): Promise<boolean> => {
    console.log('[Network Debug] connectWallet called');

    // If Magic is already configured, just return success
    if (userIsMagicUser && isMagicConfigured && ethersProvider) {
      console.log('[Network Debug] Using configured Magic provider');
      return true;
    }

    if (!baseNode?.ethChainId) {
      console.log('[Network Debug] No baseNode.ethChainId available');
      return false;
    }

    const baseChainIdHex = `0x${baseNode.ethChainId.toString(16)}`;
    console.log(
      `[Network Debug] Target Base chain ID: ${baseNode.ethChainId} (hex: ${baseChainIdHex})`,
    );

    try {
      // If user is logged in with Magic but provider not configured yet
      if (userIsMagicUser) {
        console.log('[Network Debug] Using Magic authentication flow');
        // Use the utility function to get Magic instance for the Base chain
        const magic = getMagicForChain(baseNode.ethChainId);

        if (!magic) {
          return false;
        }

        // Ensure user is logged in for this network
        try {
          // Try to get user info first
          await magic.user.getInfo();

          // User is already logged in, set up provider
          const ethersCompatibleProvider = new Web3Provider(magic.rpcProvider);

          setEthersProvider(ethersCompatibleProvider);
          setIsMagicConfigured(true);
          return true;
        } catch (userError) {
          try {
            // Show the Magic UI to authenticate for this network
            await magic.wallet.showUI();

            // After UI is shown, create the provider
            const ethersCompatibleProvider = new Web3Provider(
              magic.rpcProvider,
            );

            setEthersProvider(ethersCompatibleProvider);
            setIsMagicConfigured(true);
            return true;
          } catch (uiError) {
            return false;
          }
        }
      } else {
        // Use regular wallet connection if not Magic
        console.log('[Network Debug] Using external wallet connection flow');
        const wallets = WebWalletController.Instance.availableWallets(
          ChainBase.Ethereum,
        );

        console.log(`[Network Debug] Available wallets: ${wallets.length}`);

        if (wallets.length > 0) {
          const selectedWallet = wallets[0];
          console.log(
            `[Network Debug] Selected wallet: ${selectedWallet.name}`,
          );

          // Check if MetaMask or other injected provider is available
          if (selectedWallet.api?.givenProvider?.request) {
            console.log('[Network Debug] Wallet has request method available');

            // Check if provider supports wallet_switchEthereumChain
            const provider = selectedWallet.api.givenProvider;
            console.log('[Network Debug] Provider:', provider);
            if (typeof provider.isMetaMask !== 'undefined') {
              console.log('[Network Debug] Detected MetaMask provider');
            }

            try {
              // Check current chainId
              const currentChainIdHex =
                await selectedWallet.api.givenProvider.request({
                  method: 'eth_chainId',
                });

              console.log(
                `[Network Debug] Current chain ID: ${currentChainIdHex}, Target: ${baseChainIdHex}`,
              );

              // If not on Base network, prompt to switch
              if (currentChainIdHex !== baseChainIdHex) {
                console.log(
                  "[Network Debug] Chain IDs don't match, attempting to switch",
                );

                // Try a direct approach first
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const windowWithEthereum = window as any;
                if (typeof windowWithEthereum.ethereum !== 'undefined') {
                  console.log(
                    '[Network Debug] Found window.ethereum, trying direct approach',
                  );
                  try {
                    console.log(
                      '[Network Debug] Direct call to window.ethereum.request',
                    );
                    await windowWithEthereum.ethereum.request({
                      method: 'wallet_switchEthereumChain',
                      params: [{ chainId: baseChainIdHex }],
                    });
                    console.log('[Network Debug] Direct switch successful');
                    // Refresh chain ID to verify the switch worked
                    const newChainId =
                      await selectedWallet.api.givenProvider.request({
                        method: 'eth_chainId',
                      });
                    console.log(
                      `[Network Debug] New chain ID after switch: ${newChainId}`,
                    );
                  } catch (directSwitchError: any) {
                    console.log(
                      `[Network Debug] Direct switch failed: ${directSwitchError.message}`,
                    );
                  }
                }

                // Try the normal approach using the wallet's provider
                try {
                  // Try to switch to Base network
                  console.log(
                    '[Network Debug] Calling wallet_switchEthereumChain',
                  );
                  await selectedWallet.api.givenProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: baseChainIdHex }],
                  });
                  console.log('[Network Debug] Successfully switched chain');
                } catch (switchError: any) {
                  console.log(
                    `[Network Debug] Switch chain error: ${switchError.message}, code: ${switchError.code}`,
                  );
                  // This error code indicates that the chain has not been added to MetaMask
                  if (switchError.code === 4902) {
                    console.log(
                      '[Network Debug] Chain not found, attempting to add Base network',
                    );
                    await selectedWallet.api.givenProvider.request({
                      method: 'wallet_addEthereumChain',
                      params: [
                        {
                          chainId: baseChainIdHex,
                          chainName: 'Base Mainnet',
                          nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18,
                          },
                          rpcUrls: jsonRpcUrlMap[baseNode.ethChainId] || [
                            'https://mainnet.base.org',
                          ],
                          blockExplorerUrls: ['https://basescan.org'],
                        },
                      ],
                    });
                    console.log(
                      '[Network Debug] Successfully added Base network',
                    );
                  } else {
                    console.log(
                      '[Network Debug] Unhandled switch error, rethrowing',
                    );
                    throw switchError;
                  }
                }
              } else {
                console.log('[Network Debug] Already on correct chain');
              }
            } catch (error: any) {
              // Handle network switch errors
              console.log(
                `[Network Debug] Network switch failed: ${error.message}`,
              );
              return false;
            }
          } else {
            console.log('[Network Debug] Wallet does not have request method');
          }

          try {
            console.log(
              `[Network Debug] Calling enable for chain ID: ${baseNode.ethChainId}`,
            );
            await selectedWallet.enable(`${baseNode.ethChainId}`);

            // Create an ethers provider from the wallet's provider
            const ethersCompatibleProvider = new Web3Provider(
              selectedWallet.api.givenProvider,
            );
            console.log('[Network Debug] Successfully created provider');
            setEthersProvider(ethersCompatibleProvider);
            return true;
          } catch (enableError: any) {
            console.log(
              `[Network Debug] Enable wallet error: ${enableError.message}`,
            );
            return false;
          }
        } else {
          console.log('[Network Debug] No wallets available');
          return false;
        }
      }
    } catch (error: any) {
      console.log(`[Network Debug] Unexpected error: ${error.message}`);
      return false;
    }
  }, [
    baseNode,
    userIsMagicUser,
    isMagicConfigured,
    ethersProvider,
    jsonRpcUrlMap,
  ]);

  // Create and return the widget config
  const widgetConfig: UniswapWidgetConfig = {
    isReady: !isLoadingInitialState && Object.keys(jsonRpcUrlMap).length > 0,
    provider: ethersProvider, // Now has the correct type
    theme: uniswapWidgetTheme,
    tokensList: uniswapTokensList,
    jsonRpcUrlMap,
    defaultTokenAddress: {
      input: 'NATIVE',
      output: tradeConfig.token.contract_address,
    },
    convenienceFee: {
      percentage: UNISWAP_CONVENIENCE_FEE_PERCENT,
      recipient: {
        [baseNode?.ethChainId || 0]: UNISWAP_CONVENIENCE_FEE_RECIPIENT_ADDRESS,
      },
    },
    routerURLs: uniswapRouterURLs,
    connectWallet,
  };

  return {
    uniswapWidget: widgetConfig,
    isMagicUser: userIsMagicUser,
    isMagicConfigured,
  };
};

export default useUniswapTradeModal;
