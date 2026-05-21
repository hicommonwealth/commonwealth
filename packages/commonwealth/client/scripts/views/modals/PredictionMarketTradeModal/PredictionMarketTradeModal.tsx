import { ChainBase, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { ArrowsDownUp, CaretDown, CaretUp } from '@phosphor-icons/react';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import { formatAddressShort } from 'client/scripts/helpers';
import {
  applySlippage,
  fetchMarketIdFromChain,
  getCollateralBalanceAndSymbol,
  getMarketCollateralBalanceFromLogs,
  getPredictionMarketBalancesFromChain,
  mergeTokens,
  mintTokens,
  parseTokenAmount,
  quoteSwapAmountOut,
  redeemTokens,
  swapTokens,
  type TradeParams,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import { getEthereumProviderForAddress } from 'client/scripts/helpers/getEthereumProviderForAddress';
import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import { useGetPredictionMarketPositionsQuery } from 'client/scripts/state/api/predictionMarket';
import useUserStore from 'client/scripts/state/ui/user';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import CWBanner from '../../components/component_kit/new_designs/CWBanner';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { CWTooltip } from '../../components/component_kit/new_designs/CWTooltip';
import FractionalValue from '../../components/FractionalValue';
import {
  PREDICTION_MARKET_LEDGER_DECIMALS,
  weiToDisplayNumber,
} from '../../pages/view_thread/predictionMarketUtils';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import { convertAddressToDropdownOption } from '../TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './PredictionMarketTradeModal.scss';

const COLLATERAL_DECIMALS = 18;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%

/** Format wei (bigint) to full token string (no forced rounding). */
function formatTokenDisplay(wei: bigint, decimals = 18): string {
  if (wei === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const fractionalRaw = (wei % divisor).toString().padStart(decimals, '0');
  const fractionalTrimmed = fractionalRaw.replace(/0+$/, '');
  return fractionalTrimmed ? `${whole}.${fractionalTrimmed}` : whole.toString();
}

function extractTxHash(input: string): string | null {
  const match = input.match(/0x[a-fA-F0-9]{64}/);
  return match ? match[0] : null;
}

function formatTxHashShort(hash: string): string {
  if (!hash.startsWith('0x') || hash.length < 14) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function parseErrorForDisplay(message: string): {
  userMessage: string;
  txHash: string | null;
} {
  const txHash = extractTxHash(message);
  if (!txHash) return { userMessage: message, txHash: null };
  const userMessage = message
    .replace(`Tx hash: ${txHash}`, '')
    .replace(txHash, '')
    .replace(/\s+/g, ' ')
    .trim();
  return { userMessage, txHash };
}

type Market = {
  id: number;
  thread_id: number;
  eth_chain_id?: number;
  vault_address?: string | null;
  router_address?: string | null;
  market_id?: string | null;
  p_token_address?: string | null;
  f_token_address?: string | null;
  collateral_address?: string;
  status: string;
  winner?: number | null;
  prompt?: string;
  /** Total collateral minted in market (wei string from DB). */
  total_collateral?: string;
  /** ISO date string when the market ends (dissolves). */
  end_time?: Date | string | null;
  strategy_address?: string | null;
  governor_address?: string | null;
  [key: string]: unknown;
};

type PredictionMarketTradeModalProps = {
  market: Market;
  threadCommunityId: string;
  onClose: () => void;
  onSuccess?: () => void;
  /** When opening from PM card, pass the card's selected address so the modal opens with it. */
  initialAddress?: string;
  /** When true, sync selectedAddress from initialAddress (e.g. when modal just opened). */
  open?: boolean;
};

type TabId = 'mint' | 'swap' | 'merge' | 'redeem';

function getTradeParams(
  market: Market,
  chainRpc: string,
  userAddress: string,
  provider?: unknown,
  /** Community chain node id when `market.eth_chain_id` is unset (wallet/network switch). */
  fallbackEthChainId?: number,
): TradeParams {
  return {
    vault_address: market.vault_address ?? '',
    router_address: market.router_address ?? '',
    collateral_address: market.collateral_address ?? '',
    p_token_address: market.p_token_address ?? '',
    f_token_address: market.f_token_address ?? '',
    market_id: market.market_id ?? '',
    chain_rpc: chainRpc,
    eth_chain_id: market.eth_chain_id ?? fallbackEthChainId ?? 0,
    user_address: userAddress,
    provider,
  };
}

export const PredictionMarketTradeModal = ({
  market,
  threadCommunityId,
  onClose,
  onSuccess,
  initialAddress,
  open: modalOpen,
}: PredictionMarketTradeModalProps) => {
  const user = useUserStore();
  const prevOpenRef = useRef(false);
  const uniqueAddresses =
    getUniqueUserAddresses({ forChain: ChainBase.Ethereum }) ?? [];
  const [selectedAddress, setSelectedAddress] = useState<string>(() => {
    const initial =
      initialAddress ??
      user.activeAccount?.address ??
      user.addressSelectorSelectedAddress ??
      uniqueAddresses[0];
    return initial ?? '';
  });
  useEffect(() => {
    if (modalOpen && !prevOpenRef.current && initialAddress) {
      setSelectedAddress(initialAddress);
    }
    prevOpenRef.current = !!modalOpen;
  }, [modalOpen, initialAddress]);
  const activeAddress = selectedAddress;
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    market.status === 'resolved' ? 'redeem' : 'mint',
  );
  const [mintAmount, setMintAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapBuyPass, setSwapBuyPass] = useState(true);
  const [mergeAmount, setMergeAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedMarketId, setFetchedMarketId] = useState<string | null>(null);
  const [isFetchingMarketId, setIsFetchingMarketId] = useState(false);
  const [onChainBalances, setOnChainBalances] = useState<{
    p: bigint;
    f: bigint;
  } | null>(null);
  const [collateralInfo, setCollateralInfo] = useState<{
    balanceWei: bigint;
    symbol: string;
    decimals: number;
  } | null>(null);
  const [marketCollateralOnChain, setMarketCollateralOnChain] = useState<
    bigint | null
  >(null);
  const [detailsCollapsed, setDetailsCollapsed] = useState(true);
  const [swapQuoteOutWei, setSwapQuoteOutWei] = useState<bigint | null>(null);
  const [swapQuoteError, setSwapQuoteError] = useState<string | null>(null);
  const [swapQuoteLoading, setSwapQuoteLoading] = useState(false);
  const swapQuoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const parsedError = errorMessage ? parseErrorForDisplay(errorMessage) : null;

  const { data: community } = useGetCommunityByIdQuery({
    id: threadCommunityId,
    includeNodeInfo: true,
    enabled: !!threadCommunityId,
  });
  const chainRpc =
    (community as { ChainNode?: { url?: string } } | undefined)?.ChainNode
      ?.url ?? '';
  const ethChainId =
    (community as { ChainNode?: { eth_chain_id?: number } } | undefined)
      ?.ChainNode?.eth_chain_id ?? 0;

  const { data: positions = [], refetch: refetchPositions } =
    useGetPredictionMarketPositionsQuery({
      prediction_market_id: market.id,
    });
  const userPosition = positions.find(
    (p: { user_address: string }) =>
      !!activeAddress &&
      p.user_address?.toLowerCase() === activeAddress.toLowerCase(),
  );
  const pTokenBalance = userPosition
    ? BigInt(
        (userPosition as { p_token_balance: string }).p_token_balance ?? '0',
      )
    : (onChainBalances?.p ?? 0n);
  const fTokenBalance = userPosition
    ? BigInt(
        (userPosition as { f_token_balance: string }).f_token_balance ?? '0',
      )
    : (onChainBalances?.f ?? 0n);
  const minBalanceForMerge =
    pTokenBalance < fTokenBalance ? pTokenBalance : fTokenBalance;

  const {
    data: ethBalance = '',
    isLoading: isEthBalanceLoading,
    refetch: refetchEthBalance,
  } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: activeAddress,
    ethChainId,
    apiEnabled: !!chainRpc && !!activeAddress && ethChainId > 0,
  });
  const availableEthDisplay = isEthBalanceLoading
    ? '—'
    : ethBalance === '0.'
      ? '0'
      : ethBalance;

  const effectiveMarketId = market.market_id ?? fetchedMarketId;
  const effectiveMarket = { ...market, market_id: effectiveMarketId };
  const hasAddresses = !!(
    effectiveMarket.vault_address &&
    effectiveMarket.router_address &&
    effectiveMarket.market_id &&
    effectiveMarket.p_token_address &&
    effectiveMarket.f_token_address
  );

  useEffect(() => {
    if (
      !market.market_id &&
      market.vault_address &&
      market.p_token_address &&
      market.f_token_address &&
      chainRpc
    ) {
      setIsFetchingMarketId(true);
      fetchMarketIdFromChain(
        market.vault_address,
        market.p_token_address,
        market.f_token_address,
        chainRpc,
      )
        .then((id) => id && setFetchedMarketId(id))
        .catch(() => {})
        .finally(() => setIsFetchingMarketId(false));
    }
  }, [
    market.market_id,
    market.vault_address,
    market.p_token_address,
    market.f_token_address,
    chainRpc,
  ]);

  // When API has no position for this user, fetch PASS/FAIL balances from chain so we still show them
  useEffect(() => {
    if (userPosition) {
      setOnChainBalances(null);
      return;
    }
    if (
      !chainRpc ||
      !activeAddress ||
      !market.p_token_address ||
      !market.f_token_address
    ) {
      return;
    }
    let cancelled = false;
    getPredictionMarketBalancesFromChain(
      chainRpc,
      activeAddress,
      market.p_token_address,
      market.f_token_address,
    )
      .then(({ pTokenBalanceWei, fTokenBalanceWei }) => {
        if (!cancelled)
          setOnChainBalances({ p: pTokenBalanceWei, f: fTokenBalanceWei });
      })
      .catch(() => {
        if (!cancelled) setOnChainBalances(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    chainRpc,
    activeAddress,
    market.p_token_address,
    market.f_token_address,
    userPosition,
  ]);

  // Fetch collateral token balance when market uses an ERC20 (e.g. WETH). Vault pulls this token, not native ETH.
  useEffect(() => {
    const addr = market.collateral_address;
    const isZero = !addr || addr.toLowerCase() === ZERO_ADDRESS.toLowerCase();
    if (isZero || !chainRpc || !activeAddress) {
      setCollateralInfo(null);
      return;
    }
    let cancelled = false;
    getCollateralBalanceAndSymbol(chainRpc, activeAddress, addr)
      .then((info) => {
        if (!cancelled) setCollateralInfo(info);
      })
      .catch(() => {
        if (!cancelled) setCollateralInfo(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chainRpc, activeAddress, market.collateral_address]);

  // Prefer on-chain market-specific collateral over DB total_collateral
  useEffect(() => {
    const vaultAddr = effectiveMarket.vault_address;
    const marketId = effectiveMarket.market_id;
    if (!chainRpc || !vaultAddr || !marketId) {
      setMarketCollateralOnChain(null);
      return;
    }
    let cancelled = false;
    getMarketCollateralBalanceFromLogs(chainRpc, vaultAddr, marketId)
      .then((balance) => {
        if (!cancelled) setMarketCollateralOnChain(balance);
      })
      .catch(() => {
        if (!cancelled) setMarketCollateralOnChain(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chainRpc, effectiveMarket.vault_address, effectiveMarket.market_id]);

  // Uniswap V3 quoter: expected output for swap UX (minOut on submit uses a fresh quote in handleSwap).
  useEffect(() => {
    if (activeTab !== 'swap') {
      setSwapQuoteOutWei(null);
      setSwapQuoteError(null);
      setSwapQuoteLoading(false);
      return;
    }
    const amountInWei = parseTokenAmount(
      swapAmount,
      PREDICTION_MARKET_LEDGER_DECIMALS,
    );
    const chainIdForQuote = effectiveMarket.eth_chain_id ?? ethChainId;
    if (
      amountInWei <= 0n ||
      !chainRpc ||
      !effectiveMarketId ||
      !effectiveMarket.router_address ||
      !effectiveMarket.p_token_address ||
      !effectiveMarket.f_token_address ||
      chainIdForQuote <= 0
    ) {
      setSwapQuoteOutWei(null);
      setSwapQuoteError(null);
      setSwapQuoteLoading(false);
      return;
    }

    if (swapQuoteDebounceRef.current) {
      clearTimeout(swapQuoteDebounceRef.current);
      swapQuoteDebounceRef.current = null;
    }

    let cancelled = false;
    swapQuoteDebounceRef.current = setTimeout(() => {
      swapQuoteDebounceRef.current = null;
      setSwapQuoteLoading(true);
      void quoteSwapAmountOut({
        chain_rpc: chainRpc,
        eth_chain_id: chainIdForQuote,
        router_address: effectiveMarket.router_address ?? '',
        market_id: effectiveMarketId,
        buy_pass: swapBuyPass,
        amount_in_wei: amountInWei,
        p_token_address: effectiveMarket.p_token_address ?? '',
        f_token_address: effectiveMarket.f_token_address ?? '',
      })
        .then((out) => {
          if (!cancelled) {
            setSwapQuoteOutWei(out);
            setSwapQuoteError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setSwapQuoteOutWei(null);
            setSwapQuoteError(
              err instanceof Error ? err.message : 'Quote failed',
            );
          }
        })
        .finally(() => {
          if (!cancelled) setSwapQuoteLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      if (swapQuoteDebounceRef.current) {
        clearTimeout(swapQuoteDebounceRef.current);
        swapQuoteDebounceRef.current = null;
      }
    };
  }, [
    activeTab,
    swapAmount,
    swapBuyPass,
    chainRpc,
    effectiveMarketId,
    effectiveMarket.router_address,
    effectiveMarket.p_token_address,
    effectiveMarket.f_token_address,
    effectiveMarket.eth_chain_id,
    ethChainId,
  ]);

  const isResolved = market.status === 'resolved';
  const swapDisabled = isResolved;
  const winner = market.winner ?? 0;

  const mintDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
  const totalMintedDisplay = weiToDisplayNumber(
    marketCollateralOnChain ?? BigInt(market.total_collateral ?? '0'),
    PREDICTION_MARKET_LEDGER_DECIMALS,
  );
  const pBalanceDisplay = weiToDisplayNumber(
    pTokenBalance,
    PREDICTION_MARKET_LEDGER_DECIMALS,
  );
  const fBalanceDisplay = weiToDisplayNumber(
    fTokenBalance,
    PREDICTION_MARKET_LEDGER_DECIMALS,
  );

  const handleMint = async () => {
    const amountWei = parseTokenAmount(mintAmount, mintDecimals);
    if (amountWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    if (collateralInfo && amountWei > collateralInfo.balanceWei) {
      const have = formatTokenDisplay(
        collateralInfo.balanceWei,
        collateralInfo.decimals,
      );
      setErrorMessage(
        `Insufficient ${collateralInfo.symbol}. You have ${have} ${collateralInfo.symbol}.`,
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getEthereumProviderForAddress(
        activeAddress,
        ethChainId,
      );
      if (activeAddress && !provider) {
        setErrorMessage(
          'Could not find the wallet for the selected address. Ensure the wallet is connected.',
        );
        notifyError('Wallet not found for this address.');
        return;
      }
      await mintTokens({
        ...getTradeParams(
          effectiveMarket,
          chainRpc,
          activeAddress,
          provider,
          ethChainId,
        ),
        collateral_amount_wei: amountWei,
      });
      notifySuccess('Mint successful.');
      await refetchPositions();
      await refetchEthBalance();
      if (market.collateral_address) {
        getCollateralBalanceAndSymbol(
          chainRpc,
          activeAddress,
          market.collateral_address,
        ).then((info) => setCollateralInfo(info));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mint failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!activeAddress?.trim()) {
      setErrorMessage('Connect a wallet to swap.');
      return;
    }
    const amountInWei = parseTokenAmount(
      swapAmount,
      PREDICTION_MARKET_LEDGER_DECIMALS,
    );
    if (amountInWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
    if (amountInWei > sellBalance) {
      const tokenName = swapBuyPass ? 'FAIL' : 'PASS';
      const bal = formatTokenDisplay(
        sellBalance,
        PREDICTION_MARKET_LEDGER_DECIMALS,
      );
      setErrorMessage(
        `Insufficient ${tokenName} tokens. You have ${bal} ${tokenName}.`,
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getEthereumProviderForAddress(
        activeAddress,
        ethChainId,
      );
      if (activeAddress && !provider) {
        setErrorMessage(
          'Could not find the wallet for the selected address. Ensure the wallet is connected.',
        );
        notifyError('Wallet not found for this address.');
        return;
      }
      const chainIdForQuote = effectiveMarket.eth_chain_id ?? ethChainId;
      let minAmountOutWei: bigint;
      try {
        const quotedOut = await quoteSwapAmountOut({
          chain_rpc: chainRpc,
          eth_chain_id: chainIdForQuote,
          router_address: effectiveMarket.router_address ?? '',
          market_id: effectiveMarketId ?? '',
          buy_pass: swapBuyPass,
          amount_in_wei: amountInWei,
          p_token_address: effectiveMarket.p_token_address ?? '',
          f_token_address: effectiveMarket.f_token_address ?? '',
        });
        minAmountOutWei = applySlippage(quotedOut, DEFAULT_SLIPPAGE_BPS);
      } catch (quoteErr) {
        const qMsg =
          quoteErr instanceof Error
            ? quoteErr.message
            : 'Could not estimate swap output.';
        setErrorMessage(
          `${qMsg} Check your network or RPC (Quoter must be configured for this chain).`,
        );
        notifyError(qMsg);
        return;
      }
      await swapTokens({
        ...getTradeParams(
          effectiveMarket,
          chainRpc,
          activeAddress,
          provider,
          ethChainId,
        ),
        buy_pass: swapBuyPass,
        amount_in_wei: amountInWei,
        min_amount_out_wei: minAmountOutWei,
      });
      notifySuccess('Swap successful.');
      await refetchPositions();
      if (!userPosition) {
        getPredictionMarketBalancesFromChain(
          chainRpc,
          activeAddress,
          effectiveMarket.p_token_address ?? '',
          effectiveMarket.f_token_address ?? '',
        ).then(({ pTokenBalanceWei, fTokenBalanceWei }) =>
          setOnChainBalances({ p: pTokenBalanceWei, f: fTokenBalanceWei }),
        );
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swap failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async () => {
    const amountWei = parseTokenAmount(
      mergeAmount,
      PREDICTION_MARKET_LEDGER_DECIMALS,
    );
    if (amountWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    if (amountWei > minBalanceForMerge) {
      const maxDisplay = formatTokenDisplay(
        minBalanceForMerge,
        PREDICTION_MARKET_LEDGER_DECIMALS,
      );
      setErrorMessage(
        `Insufficient balance. You can merge at most ${maxDisplay} (limited by your PASS/FAIL balance).`,
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getEthereumProviderForAddress(
        activeAddress,
        ethChainId,
      );
      if (activeAddress && !provider) {
        setErrorMessage(
          'Could not find the wallet for the selected address. Ensure the wallet is connected.',
        );
        notifyError('Wallet not found for this address.');
        return;
      }
      await mergeTokens({
        ...getTradeParams(
          effectiveMarket,
          chainRpc,
          activeAddress,
          provider,
          ethChainId,
        ),
        amount_wei: amountWei,
      });
      notifySuccess('Merge successful.');
      await refetchPositions();
      await refetchEthBalance();
      if (market.collateral_address) {
        getCollateralBalanceAndSymbol(
          chainRpc,
          activeAddress,
          market.collateral_address,
        ).then((info) => setCollateralInfo(info));
      }
      if (!userPosition) {
        getPredictionMarketBalancesFromChain(
          chainRpc,
          activeAddress,
          effectiveMarket.p_token_address ?? '',
          effectiveMarket.f_token_address ?? '',
        ).then(({ pTokenBalanceWei, fTokenBalanceWei }) =>
          setOnChainBalances({ p: pTokenBalanceWei, f: fTokenBalanceWei }),
        );
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Merge failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (winner !== 1 && winner !== 2) {
      setErrorMessage('Market has no winner yet.');
      return;
    }
    const amountWei = parseTokenAmount(
      redeemAmount,
      PREDICTION_MARKET_LEDGER_DECIMALS,
    );
    const maxRedeem = winner === 1 ? pTokenBalance : fTokenBalance;
    if (amountWei <= 0n || amountWei > maxRedeem) {
      setErrorMessage(
        `Enter a valid amount (max ${formatTokenDisplay(maxRedeem, PREDICTION_MARKET_LEDGER_DECIMALS)}).`,
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getEthereumProviderForAddress(
        activeAddress,
        ethChainId,
      );
      if (activeAddress && !provider) {
        setErrorMessage(
          'Could not find the wallet for the selected address. Ensure the wallet is connected.',
        );
        notifyError('Wallet not found for this address.');
        return;
      }
      await redeemTokens({
        ...getTradeParams(
          effectiveMarket,
          chainRpc,
          activeAddress,
          provider,
          ethChainId,
        ),
        amount_wei: amountWei,
        winner: winner as 1 | 2,
      });
      notifySuccess('Redeem successful.');
      await refetchPositions();
      await refetchEthBalance();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Redeem failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'mint') {
      const availableMintDisplay = collateralInfo
        ? formatTokenDisplay(collateralInfo.balanceWei, collateralInfo.decimals)
        : availableEthDisplay;
      const mintUnit = collateralInfo ? collateralInfo.symbol : 'ETH';
      const mintMaxDisabled = collateralInfo
        ? collateralInfo.balanceWei === 0n
        : !ethBalance || ethBalance === '0' || ethBalance === '0.';
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <div className="input-label-row">
            <CWText type="b2" className="label">
              Collateral Amount
            </CWText>
            <CWText type="caption" className="available">
              Available: {availableMintDisplay} {mintUnit}
            </CWText>
          </div>
          <div className="amount-input-with-actions">
            <CWTextInput
              value={mintAmount}
              onInput={(e) =>
                setMintAmount((e.target as HTMLInputElement).value)
              }
              placeholder="0"
              type="text"
              fullWidth
              containerClassName="amount-input-wrap"
            />
            <CWButton
              label="MAX"
              buttonType="secondary"
              buttonHeight="sm"
              buttonWidth="narrow"
              onClick={() => {
                if (!mintMaxDisabled) setMintAmount(availableMintDisplay);
              }}
              disabled={mintMaxDisabled}
            />
          </div>
          <CWBanner
            type="info"
            body={
              <div>
                You will receive equal amounts of <strong>PASS</strong>{' '}
                and&nbsp;
                <strong>FAIL</strong> tokens. You must hold&nbsp;
                <strong>{mintUnit}</strong> to mint
                {mintUnit !== 'ETH' ? ' (e.g. wrap ETH first)' : ''}.
              </div>
            }
          />
        </div>
      );
    }
    if (activeTab === 'swap') {
      const amountInWei = parseTokenAmount(
        swapAmount,
        PREDICTION_MARKET_LEDGER_DECIMALS,
      );
      const minOutAfterSlippageWei =
        swapQuoteOutWei === null
          ? 0n
          : applySlippage(swapQuoteOutWei, DEFAULT_SLIPPAGE_BPS);
      const sellToken = swapBuyPass ? 'FAIL' : 'PASS';
      const buyToken = swapBuyPass ? 'PASS' : 'FAIL';
      const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
      const buyBalance = swapBuyPass ? pTokenBalance : fTokenBalance;

      const sellBalanceZero = sellBalance === 0n;

      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <CWBanner
            type="info"
            body={
              sellBalanceZero ? (
                <div>
                  You&apos;re selling <strong>{sellToken}</strong> but your
                  balance is 0. Use the <strong>Mint</strong> tab first (you get
                  equal PASS and FAIL), then return here to swap.
                </div>
              ) : (
                <>
                  Mint in the&nbsp;<strong>Mint</strong>&nbsp;tab to get PASS
                  and&nbsp;FAIL, then swap between them here.
                </>
              )
            }
            className="swap-hint-banner"
          />
          {/* Token panels */}
          <div className="swap-panels">
            <div className="token-panel">
              <div className="panel-header">
                <CWText type="caption" className="panel-side-label">
                  You Sell
                </CWText>
                <CWText type="caption" className="panel-balance">
                  Balance:{' '}
                  {formatTokenDisplay(
                    sellBalance,
                    PREDICTION_MARKET_LEDGER_DECIMALS,
                  )}
                </CWText>
              </div>
              <div className="panel-body">
                <div className={`token-badge ${sellToken.toLowerCase()}`}>
                  <span className="token-dot" />
                  <CWText type="b1" fontWeight="bold">
                    {sellToken}
                  </CWText>
                </div>
                <div className="panel-amount">
                  <input
                    className="swap-amount-input"
                    type="text"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="0"
                  />
                  <button
                    className="max-link"
                    onClick={() =>
                      setSwapAmount(
                        formatTokenDisplay(
                          sellBalance,
                          PREDICTION_MARKET_LEDGER_DECIMALS,
                        ),
                      )
                    }
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            <div
              className="swap-direction-toggle"
              onClick={() => setSwapBuyPass((prev) => !prev)}
            >
              <ArrowsDownUp size={16} weight="bold" />
            </div>

            <div className="token-panel">
              <div className="panel-header">
                <CWText type="caption" className="panel-side-label">
                  You Buy
                </CWText>
                <CWText type="caption" className="panel-balance">
                  Balance:{' '}
                  {formatTokenDisplay(
                    buyBalance,
                    PREDICTION_MARKET_LEDGER_DECIMALS,
                  )}
                </CWText>
              </div>
              <div className="panel-body">
                <div className={`token-badge ${buyToken.toLowerCase()}`}>
                  <span className="token-dot" />
                  <CWText type="b1" fontWeight="bold">
                    {buyToken}
                  </CWText>
                </div>
                <div className="panel-amount">
                  <CWText type="h4" fontWeight="bold" className="estimated-out">
                    {swapQuoteLoading
                      ? '…'
                      : swapQuoteError
                        ? '—'
                        : swapQuoteOutWei !== null && amountInWei > 0n
                          ? formatTokenDisplay(
                              swapQuoteOutWei,
                              PREDICTION_MARKET_LEDGER_DECIMALS,
                            )
                          : '—'}
                  </CWText>
                  {minOutAfterSlippageWei > 0n && swapQuoteOutWei !== null && (
                    <CWText type="caption" className="min-out-hint">
                      Min. received (≤{DEFAULT_SLIPPAGE_BPS / 100}% slippage):{' '}
                      {formatTokenDisplay(
                        minOutAfterSlippageWei,
                        PREDICTION_MARKET_LEDGER_DECIMALS,
                      )}
                    </CWText>
                  )}
                  {swapQuoteError && (
                    <CWText type="caption" className="min-out-hint">
                      {swapQuoteError}
                    </CWText>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CWText type="caption" className="swap-quote-caption">
            Estimates use a live Uniswap quote. Max slippage is fixed at{' '}
            {DEFAULT_SLIPPAGE_BPS / 100}%: the transaction reverts if the pool
            would give you less than that vs. the quote at send time.
          </CWText>
        </div>
      );
    }
    if (activeTab === 'merge') {
      const amountWei = parseTokenAmount(
        mergeAmount,
        PREDICTION_MARKET_LEDGER_DECIMALS,
      );
      const validMerge = amountWei > 0n && amountWei <= minBalanceForMerge;
      const limitedByPass = pTokenBalance <= fTokenBalance;
      const mergeDisplay = validMerge ? mergeAmount || '0' : '0';
      const mergeCollateralSymbol = collateralInfo?.symbol ?? 'ETH';
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <div className="input-label-row">
            <CWText type="b2" className="label">
              Amount to merge
            </CWText>
            <CWText type="caption" className="available">
              Available:{' '}
              {formatTokenDisplay(
                minBalanceForMerge,
                PREDICTION_MARKET_LEDGER_DECIMALS,
              )}{' '}
              (Limited by&nbsp;
              {limitedByPass ? 'PASS' : 'FAIL'})
            </CWText>
          </div>
          <div className="amount-input-with-actions">
            <CWTextInput
              value={mergeAmount}
              onInput={(e) =>
                setMergeAmount((e.target as HTMLInputElement).value)
              }
              placeholder="0"
              type="text"
              fullWidth
              containerClassName="amount-input-wrap"
            />
            <CWButton
              label="MAX"
              buttonType="secondary"
              buttonHeight="sm"
              buttonWidth="narrow"
              onClick={() =>
                setMergeAmount(
                  formatTokenDisplay(
                    minBalanceForMerge,
                    PREDICTION_MARKET_LEDGER_DECIMALS,
                  ),
                )
              }
            />
          </div>
          <CWBanner
            type="info"
            body={
              <div>
                Merge equal amounts of&nbsp;<strong>PASS</strong>&nbsp;and&nbsp;
                <strong>FAIL</strong>&nbsp;to get collateral back. Both tokens
                will be burned in the process.
              </div>
            }
          />
          <div className="cost-details merge-summary">
            <div className="cost-row">
              <CWText type="caption">Tokens to Burn</CWText>
              <CWText type="caption" fontWeight="medium">
                {mergeDisplay} PASS + {mergeDisplay} FAIL
              </CWText>
            </div>
            <div className="cost-row">
              <CWText type="caption">Exchange Rate</CWText>
              <CWText type="caption" fontWeight="medium">
                1:1 Collateral
              </CWText>
            </div>
            <CWDivider className="summary-divider" />
            <div className="cost-row">
              <CWText type="caption" fontWeight="medium">
                Collateral to be returned
              </CWText>
              <CWText
                type="caption"
                fontWeight="medium"
                className="collateral-return"
              >
                {mergeDisplay} {mergeCollateralSymbol}
              </CWText>
            </div>
          </div>
        </div>
      );
    }
    // redeem
    const canRedeem = winner === 1 || winner === 2;
    const redeemCollateralSymbol = collateralInfo?.symbol ?? 'ETH';
    const amountWei = parseTokenAmount(
      redeemAmount,
      PREDICTION_MARKET_LEDGER_DECIMALS,
    );
    const maxRedeem = winner === 1 ? pTokenBalance : fTokenBalance;
    const winningToken = winner === 1 ? 'PASS' : 'FAIL';
    const validRedeem = canRedeem && amountWei > 0n && amountWei <= maxRedeem;
    const redeemDisplay = validRedeem ? redeemAmount || '0' : '0';
    return (
      <div className="PredictionMarketTradeModal-tab-content">
        {!canRedeem && (
          <CWBanner
            type="info"
            body="Redeem is available only after the market is resolved. Then exchange winning tokens for collateral."
          />
        )}
        {canRedeem && (
          <>
            <div className="input-label-row">
              <CWText type="b2" className="label">
                Winning token amount ({winningToken})
              </CWText>
              <CWText type="caption" className="available">
                Available:{' '}
                {formatTokenDisplay(
                  maxRedeem,
                  PREDICTION_MARKET_LEDGER_DECIMALS,
                )}{' '}
                {winningToken}
              </CWText>
            </div>
            <div className="amount-input-with-actions">
              <CWTextInput
                value={redeemAmount}
                onInput={(e) =>
                  setRedeemAmount((e.target as HTMLInputElement).value)
                }
                placeholder="0"
                type="text"
                fullWidth
                containerClassName="amount-input-wrap"
              />
              <CWButton
                label="MAX"
                buttonType="secondary"
                buttonHeight="sm"
                buttonWidth="narrow"
                onClick={() =>
                  setRedeemAmount(
                    formatTokenDisplay(
                      maxRedeem,
                      PREDICTION_MARKET_LEDGER_DECIMALS,
                    ),
                  )
                }
              />
            </div>
            <CWBanner
              type="info"
              body={
                <div>
                  Exchange winning <strong>{winningToken}</strong> tokens for
                  collateral ({redeemCollateralSymbol}).
                </div>
              }
            />
            <div className="cost-details">
              <div className="cost-row">
                <CWText type="caption" fontWeight="medium">
                  Collateral to be returned
                </CWText>
                <CWText
                  type="caption"
                  fontWeight="medium"
                  className="collateral-return"
                >
                  {redeemDisplay} {redeemCollateralSymbol}
                </CWText>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!hasAddresses) {
    return (
      <div className="PredictionMarketTradeModal">
        <CWModalHeader label="Trade" onModalClose={onClose} />
        <CWModalBody>
          {isFetchingMarketId ? (
            <div className="loading-row">
              <CWCircleMultiplySpinner />
            </div>
          ) : (
            <>
              <CWText type="b2">
                Market not fully deployed (missing addresses).
              </CWText>
              <CWText type="caption" className="help">
                {market.status === 'draft'
                  ? 'Complete deployment first using the "Complete deployment" button.'
                  : 'Vault, router, market ID, or token addresses are missing. ' +
                    'If this market was deployed earlier, it may need to be re-deployed.'}
              </CWText>
            </>
          )}
        </CWModalBody>
      </div>
    );
  }

  const primaryButtonLabel =
    activeTab === 'mint'
      ? 'Deposit and Mint'
      : activeTab === 'swap'
        ? 'Swap'
        : activeTab === 'merge'
          ? 'Merge'
          : 'Redeem';
  const onPrimaryAction = () => {
    if (activeTab === 'mint') void handleMint();
    else if (activeTab === 'swap') void handleSwap();
    else if (activeTab === 'merge') void handleMerge();
    else void handleRedeem();
  };
  const primaryDisabled =
    activeTab === 'mint'
      ? !activeAddress ||
        !mintAmount ||
        parseTokenAmount(mintAmount, mintDecimals) <= 0n ||
        (!!collateralInfo &&
          parseTokenAmount(mintAmount, mintDecimals) >
            collateralInfo.balanceWei)
      : activeTab === 'swap'
        ? (() => {
            const amountWei = parseTokenAmount(
              swapAmount,
              PREDICTION_MARKET_LEDGER_DECIMALS,
            );
            const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
            const hasBalanceData =
              userPosition != null || onChainBalances != null;
            return (
              !activeAddress ||
              !swapAmount ||
              amountWei <= 0n ||
              (hasBalanceData && sellBalance > 0n && amountWei > sellBalance)
            );
          })()
        : activeTab === 'merge'
          ? !activeAddress ||
            !mergeAmount ||
            parseTokenAmount(mergeAmount, PREDICTION_MARKET_LEDGER_DECIMALS) <=
              0n ||
            parseTokenAmount(mergeAmount, PREDICTION_MARKET_LEDGER_DECIMALS) >
              minBalanceForMerge
          : !activeAddress ||
            (winner !== 1 && winner !== 2) ||
            !redeemAmount ||
            parseTokenAmount(redeemAmount, PREDICTION_MARKET_LEDGER_DECIMALS) <=
              0n ||
            parseTokenAmount(redeemAmount, PREDICTION_MARKET_LEDGER_DECIMALS) >
              (winner === 1 ? pTokenBalance : fTokenBalance);

  return (
    <div className="PredictionMarketTradeModal">
      <CWModalHeader
        label="Prediction market — Trade"
        subheader={market.prompt ?? ''}
        onModalClose={onClose}
      />
      <CWDivider />
      <CWModalBody>
        <div className="address-selector-row">
          <CWSelectList
            components={{
              Option: (originalProps) =>
                CustomAddressOption({
                  originalProps,
                  selectedAddressValue: activeAddress,
                }),
            }}
            noOptionsMessage={() => 'No available address'}
            value={convertAddressToDropdownOption(activeAddress)}
            formatOptionLabel={(option) => (
              <CustomAddressOptionElement
                value={option.value}
                label={option.label}
                selectedAddressValue={activeAddress}
              />
            )}
            isClearable={false}
            isSearchable={false}
            options={uniqueAddresses.map(convertAddressToDropdownOption)}
            onChange={(option) =>
              option?.value && setSelectedAddress(option.value)
            }
          />
        </div>
        <div className="collateral-row">
          <button
            type="button"
            className="collateral-row-header"
            onClick={() => setDetailsCollapsed((c) => !c)}
            aria-expanded={!detailsCollapsed}
          >
            <div className="collateral-row-summary">
              {(marketCollateralOnChain != null ||
                market.total_collateral != null) && (
                <div className="collateral-label total-minted">
                  <CWText type="caption">Total minted:&nbsp;</CWText>
                  <FractionalValue
                    type="caption"
                    value={totalMintedDisplay}
                    currencySymbol={` ${collateralInfo ? collateralInfo.symbol : 'ETH'}`}
                    symbolLast
                  />
                </div>
              )}
              {market.end_time && (
                <CWText type="caption" className="collateral-label market-ends">
                  Market ends:&nbsp;
                  {new Date(market.end_time).toLocaleString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </CWText>
              )}
            </div>
            {detailsCollapsed ? (
              <CaretDown
                size={16}
                weight="bold"
                className="collateral-chevron"
              />
            ) : (
              <CaretUp size={16} weight="bold" className="collateral-chevron" />
            )}
          </button>
          {!detailsCollapsed && (
            <div className="collateral-row-details">
              {effectiveMarket.vault_address && market.collateral_address && (
                <div className="copyable-address-row">
                  <CWText type="caption" className="collateral-label">
                    Vault
                  </CWText>
                  <button
                    type="button"
                    className="copyable-address"
                    onClick={() =>
                      saveToClipboard(
                        effectiveMarket.vault_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy vault address"
                  >
                    <span className="address-text">
                      {effectiveMarket.vault_address}
                    </span>
                    <CWIcon
                      iconName="copy"
                      iconSize="small"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
              {market.collateral_address && (
                <div className="copyable-address-row">
                  <CWText type="caption" className="collateral-label">
                    Collateral
                  </CWText>
                  <button
                    type="button"
                    className="copyable-address"
                    onClick={() =>
                      saveToClipboard(
                        market.collateral_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy collateral address"
                  >
                    <span className="address-text">
                      {market.collateral_address}
                    </span>
                    <CWIcon
                      iconName="copy"
                      iconSize="small"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
              {effectiveMarket.router_address && (
                <div className="copyable-address-row">
                  <CWText type="caption" className="collateral-label">
                    Router
                  </CWText>
                  <button
                    type="button"
                    className="copyable-address"
                    onClick={() =>
                      saveToClipboard(
                        effectiveMarket.router_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy router address"
                  >
                    <span className="address-text">
                      {effectiveMarket.router_address}
                    </span>
                    <CWIcon
                      iconName="copy"
                      iconSize="small"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
              {market.strategy_address && (
                <div className="copyable-address-row">
                  <CWText type="caption" className="collateral-label">
                    Strategy
                  </CWText>
                  <button
                    type="button"
                    className="copyable-address"
                    onClick={() =>
                      saveToClipboard(
                        market.strategy_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy strategy address"
                  >
                    <span className="address-text">
                      {market.strategy_address}
                    </span>
                    <CWIcon
                      iconName="copy"
                      iconSize="small"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
              {market.governor_address && (
                <div className="copyable-address-row">
                  <CWText type="caption" className="collateral-label">
                    Governor
                  </CWText>
                  <button
                    type="button"
                    className="copyable-address"
                    onClick={() =>
                      saveToClipboard(
                        market.governor_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy governor address"
                  >
                    <span className="address-text">
                      {market.governor_address}
                    </span>
                    <CWIcon
                      iconName="copy"
                      iconSize="small"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="balances-section">
          <div className="balance-card pass">
            <div className="balance-card-header">
              <span className="balance-dot" />
              <CWText type="caption" className="balance-label">
                PASS BALANCE
              </CWText>
              {effectiveMarket.p_token_address && (
                <div className="balance-address-copy">
                  <CWText type="caption" className="balance-address">
                    {formatAddressShort(effectiveMarket.p_token_address, 6, 4)}
                  </CWText>
                  <button
                    type="button"
                    className="balance-copy-btn"
                    onClick={() =>
                      saveToClipboard(
                        effectiveMarket.p_token_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy PASS token address"
                    aria-label="Copy PASS token address"
                  >
                    <CWIcon
                      iconName="copy"
                      iconSize="xs"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
            </div>
            <div className="balance-card-value">
              <FractionalValue
                type="b1"
                fontWeight="bold"
                value={pBalanceDisplay}
              />
              <CWText type="b2" fontWeight="regular">
                &nbsp;PASS
              </CWText>
            </div>
          </div>
          <div className="balance-card fail">
            <div className="balance-card-header">
              <span className="balance-dot" />
              <CWText type="caption" className="balance-label">
                FAIL BALANCE
              </CWText>
              {effectiveMarket.f_token_address && (
                <div className="balance-address-copy">
                  <CWText type="caption" className="balance-address">
                    {formatAddressShort(effectiveMarket.f_token_address, 6, 4)}
                  </CWText>
                  <button
                    type="button"
                    className="balance-copy-btn"
                    onClick={() =>
                      saveToClipboard(
                        effectiveMarket.f_token_address ?? '',
                        true,
                      ).catch(() => notifyError('Failed to copy'))
                    }
                    title="Copy FAIL token address"
                    aria-label="Copy FAIL token address"
                  >
                    <CWIcon
                      iconName="copy"
                      iconSize="xs"
                      className="copy-icon"
                    />
                  </button>
                </div>
              )}
            </div>
            <div className="balance-card-value">
              <FractionalValue
                type="b1"
                fontWeight="bold"
                value={fBalanceDisplay}
              />
              <CWText type="b2" fontWeight="regular">
                &nbsp;FAIL
              </CWText>
            </div>
          </div>
        </div>
        <CWTabsRow className="tabs-row">
          {isResolved ? (
            <CWTooltip
              placement="top"
              content="This action is not available for resolved markets."
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  style={{ flex: 1 }}
                >
                  <CWTab
                    label="Mint"
                    isSelected={false}
                    onClick={() => {}}
                    isDisabled
                  />
                </div>
              )}
            />
          ) : (
            <CWTab
              label="Mint"
              isSelected={activeTab === 'mint'}
              onClick={() => setActiveTab('mint')}
            />
          )}
          {isResolved ? (
            <CWTooltip
              placement="top"
              content="This action is not available for resolved markets."
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  style={{ flex: 1 }}
                >
                  <CWTab
                    label="Swap"
                    isSelected={false}
                    onClick={() => {}}
                    isDisabled
                  />
                </div>
              )}
            />
          ) : (
            <CWTab
              label="Swap"
              isSelected={activeTab === 'swap'}
              onClick={() => setActiveTab('swap')}
              isDisabled={swapDisabled}
            />
          )}
          {isResolved ? (
            <CWTooltip
              placement="top"
              content="This action is not available for resolved markets."
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  style={{ flex: 1 }}
                >
                  <CWTab
                    label="Merge"
                    isSelected={false}
                    onClick={() => {}}
                    isDisabled
                  />
                </div>
              )}
            />
          ) : (
            <CWTab
              label="Merge"
              isSelected={activeTab === 'merge'}
              onClick={() => setActiveTab('merge')}
            />
          )}
          <CWTab
            label="Redeem"
            isSelected={activeTab === 'redeem'}
            onClick={() => setActiveTab('redeem')}
          />
        </CWTabsRow>
        {errorMessage && (
          <div className="alert-error">
            <CWIcon
              iconName="warning"
              iconSize="small"
              className="alert-icon"
            />
            <div>
              <CWText type="b2">
                {parsedError?.userMessage ?? errorMessage}
              </CWText>
              {parsedError?.txHash && (
                <CWText type="caption">
                  Tx hash: {formatTxHashShort(parsedError.txHash)}{' '}
                  <button
                    type="button"
                    className="balance-copy-btn"
                    onClick={() =>
                      saveToClipboard(parsedError.txHash ?? '', true).catch(
                        () => notifyError('Failed to copy'),
                      )
                    }
                    title="Copy transaction hash"
                    aria-label="Copy transaction hash"
                  >
                    <CWIcon
                      iconName="copy"
                      iconSize="xs"
                      className="copy-icon"
                    />
                  </button>
                </CWText>
              )}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="loading-row">
            <CWCircleMultiplySpinner />
          </div>
        )}
        {!isLoading && renderTabContent()}
      </CWModalBody>
      <CWDivider />
      <CWModalFooter className="footer-actions">
        <CWButton
          label="Cancel"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
        <CWButton
          label={primaryButtonLabel}
          buttonType="primary"
          buttonHeight="sm"
          disabled={primaryDisabled || isLoading || !activeAddress}
          onClick={onPrimaryAction}
        />
      </CWModalFooter>
    </div>
  );
};
