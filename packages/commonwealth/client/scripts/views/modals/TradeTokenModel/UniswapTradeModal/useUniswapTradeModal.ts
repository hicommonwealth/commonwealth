import { Web3Provider } from '@ethersproject/providers';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
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

const useUniswapTradeModal = ({
  tradeConfig,
  ethChainId,
  rpcUrl,
  blockExplorerUrl,
}: UseUniswapTradeModalProps) => {
  const [isLoadingInitialState, setIsLoadingInitialState] = useState(true);
  const [ethersProvider, setEthersProvider] = useState<
    Web3Provider | undefined
  >(undefined);
  const [uniswapTokensList, setUniswapTokensList] = useState<UniswapToken[]>();
  const [isMagicConfigured, setIsMagicConfigured] = useState(false);

  // Check if user is logged in with Magic
  const userIsMagicUser = useMemo(() => checkIfMagicUser(), []);

  // Automatically configure Magic provider for Magic users
  useEffect(() => {
    if (userIsMagicUser && !isMagicConfigured && ethChainId) {
      const configureMagicProvider = () => {
        try {
          if (!ethChainId) return;
          const magic = getMagicForChain(ethChainId);
          if (!magic) return;

          const ethersCompatibleProvider = new Web3Provider(magic.rpcProvider);
          setEthersProvider(ethersCompatibleProvider);
          setIsMagicConfigured(true);
        } catch (error) {
          // Error configuring provider, fail silently
        }
      };

      void configureMagicProvider();
    }
  }, [userIsMagicUser, isMagicConfigured, ethChainId]);

  // Initialize token list
  useRunOnceOnCondition({
    callback: () => {
      const handleTokensInit = () => {
        setIsLoadingInitialState(true);

        if (!ethChainId) {
          return;
        }

        // Set tokens list with custom token
        const customLists =
          uniswapTokenListConfig.custom.chains?.[ethChainId]?.list || [];
        const tokensList = [
          ...customLists,
          {
            name: tradeConfig.token.name,
            address: tradeConfig.token.contract_address,
            symbol: tradeConfig.token.symbol,
            decimals: tradeConfig.token.decimals,
            chainId: ethChainId,
            logoURI: tradeConfig.token.logo || '',
          },
        ];

        setUniswapTokensList(tokensList);
        setIsLoadingInitialState(false);
      };

      handleTokensInit();
    },
    shouldRun: !!ethChainId,
  });

  // Connect wallet handler - manages Magic and regular wallet connections
  const connectWallet = useCallback(async (): Promise<boolean> => {
    console.log('[Network Debug] connectWallet called');

    // If Magic is already configured, just return success
    if (userIsMagicUser && isMagicConfigured && ethersProvider) {
      console.log('[Network Debug] Using configured Magic provider');
      return true;
    }

    if (!ethChainId) {
      console.log('[Network Debug] No ethChainId available');
      return false;
    }

    const baseChainIdHex = `0x${ethChainId.toString(16)}`;
    console.log(
      `[Network Debug] Target Base chain ID: ${ethChainId} (hex: ${baseChainIdHex})`,
    );

    try {
      // If user is logged in with Magic but provider not configured yet
      if (userIsMagicUser) {
        console.log('[Network Debug] Using Magic authentication flow');
        // Use the utility function to get Magic instance for the Base chain
        const magic = getMagicForChain(ethChainId);

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
                  } catch (directSwitchError: unknown) {
                    const errorMessage =
                      directSwitchError instanceof Error
                        ? directSwitchError.message
                        : 'Unknown error';
                    console.log(
                      `[Network Debug] Direct switch failed: ${errorMessage}`,
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
                } catch (switchError: unknown) {
                  const errorMessage =
                    switchError instanceof Error
                      ? switchError.message
                      : 'Unknown error';
                  const errorCode =
                    switchError instanceof Error && 'code' in switchError
                      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (switchError as any).code
                      : 'unknown';

                  console.log(
                    `[Network Debug] Switch chain error: ${errorMessage}, code: ${errorCode}`,
                  );
                  // This error code indicates that the chain has not been added to MetaMask
                  if (
                    switchError instanceof Error &&
                    'code' in switchError &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (switchError as any).code === 4902
                  ) {
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
                          rpcUrls: [rpcUrl],
                          blockExplorerUrls: [blockExplorerUrl],
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
            } catch (error: unknown) {
              // Handle network switch errors
              console.log(
                `[Network Debug] Network switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              );
              return false;
            }
          } else {
            console.log('[Network Debug] Wallet does not have request method');
          }

          try {
            console.log(
              `[Network Debug] Calling enable for chain ID: ${ethChainId}`,
            );
            await selectedWallet.enable(`${ethChainId}`);

            // Create an ethers provider from the wallet's provider
            const ethersCompatibleProvider = new Web3Provider(
              selectedWallet.api.givenProvider,
            );
            console.log('[Network Debug] Successfully created provider');
            setEthersProvider(ethersCompatibleProvider);
            return true;
          } catch (enableError: unknown) {
            const errorMessage =
              enableError instanceof Error
                ? enableError.message
                : 'Unknown error';
            console.log(`[Network Debug] Enable wallet error: ${errorMessage}`);
            return false;
          }
        } else {
          console.log('[Network Debug] No wallets available');
          return false;
        }
      }
    } catch (error: unknown) {
      console.log(
        `[Network Debug] Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }, [userIsMagicUser, isMagicConfigured, ethersProvider, ethChainId]);

  // Create and return the widget config
  const widgetConfig: UniswapWidgetConfig = {
    isReady: !isLoadingInitialState && !!rpcUrl,
    provider: ethersProvider, // Now has the correct type
    theme: uniswapWidgetTheme,
    tokensList: uniswapTokensList,
    defaultTokenAddress: {
      input: 'NATIVE',
      output: tradeConfig.token.contract_address,
    },
    convenienceFee: {
      percentage: UNISWAP_CONVENIENCE_FEE_PERCENT,
      recipient: {
        [ethChainId || 0]: UNISWAP_CONVENIENCE_FEE_RECIPIENT_ADDRESS,
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
