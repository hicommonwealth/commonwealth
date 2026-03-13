import { ChainBase } from '@hicommonwealth/shared';
import { ArrowsDownUp, CaretDown, CaretUp } from '@phosphor-icons/react';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import MagicWebWalletController from 'client/scripts/controllers/app/webWallets/MagicWebWallet';
import { formatAddressShort } from 'client/scripts/helpers';
import {
  applySlippage,
  fetchMarketIdFromChain,
  getCollateralBalanceAndSymbol,
  getPredictionMarketBalancesFromChain,
  getVaultCollateralBalance,
  mergeTokens,
  mintTokens,
  parseTokenAmount,
  redeemTokens,
  swapTokens,
  type TradeParams,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import { fetchNodes } from 'client/scripts/state/api/nodes';
import { useGetPredictionMarketPositionsQuery } from 'client/scripts/state/api/predictionMarket';
import useUserStore from 'client/scripts/state/ui/user';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from '../ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import { convertAddressToDropdownOption } from '../TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import './PredictionMarketTradeModal.scss';

const COLLATERAL_DECIMALS = 18;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%

/** Format wei (bigint) to readable string with 2 decimals. */
function formatTokenDisplay(wei: bigint, decimals = 18): string {
  if (wei === 0n) return '0.00';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const frac = ((wei % divisor) * 100n) / divisor;
  return `${whole}.${frac.toString().padStart(2, '0').slice(0, 2)}`;
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
): TradeParams {
  return {
    vault_address: market.vault_address ?? '',
    router_address: market.router_address ?? '',
    collateral_address: market.collateral_address ?? '',
    p_token_address: market.p_token_address ?? '',
    f_token_address: market.f_token_address ?? '',
    market_id: market.market_id ?? '',
    chain_rpc: chainRpc,
    eth_chain_id: market.eth_chain_id ?? 0,
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
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [slippagePreset, setSlippagePreset] = useState<
    'auto' | '0.5%' | '1.0%' | '2.0%' | '5.0%' | 'no-min' | 'custom'
  >('auto');
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
  const [vaultBalanceOnChain, setVaultBalanceOnChain] = useState<{
    balanceWei: bigint;
    symbol: string;
    decimals: number;
  } | null>(null);
  const [detailsCollapsed, setDetailsCollapsed] = useState(true);

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
      p.user_address?.toLowerCase() === activeAddress?.toLowerCase(),
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
    const isZero =
      !addr ||
      addr.toLowerCase() === '0x0000000000000000000000000000000000000000';
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

  // Fetch vault's collateral balance on-chain so user can verify even if app DB is stale
  useEffect(() => {
    const vaultAddr = effectiveMarket.vault_address;
    const collateralAddr = market.collateral_address;
    const zeroAddr = '0x0000000000000000000000000000000000000000';
    if (
      !chainRpc ||
      !vaultAddr ||
      !collateralAddr ||
      collateralAddr.toLowerCase() === zeroAddr
    ) {
      setVaultBalanceOnChain(null);
      return;
    }
    let cancelled = false;
    getVaultCollateralBalance(chainRpc, vaultAddr, collateralAddr)
      .then((info) => {
        if (!cancelled) setVaultBalanceOnChain(info);
      })
      .catch(() => {
        if (!cancelled) setVaultBalanceOnChain(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chainRpc, effectiveMarket.vault_address, market.collateral_address]);

  const isResolved = market.status === 'resolved';
  const swapDisabled = isResolved;
  const winner = market.winner ?? 0;

  const getProvider = useCallback(async () => {
    const { userStore: store } = await import('client/scripts/state/ui/user');
    const addresses = store.getState().addresses ?? [];
    const isMagic = addresses.some(
      (addr: { address: string; walletId?: string }) =>
        addr.address?.toLowerCase() === activeAddress?.toLowerCase() &&
        addr.walletId?.toLowerCase()?.includes('magic'),
    );
    if (!isMagic) return undefined;
    await fetchNodes();
    const controller = new MagicWebWalletController();
    await controller.enable(String(ethChainId));
    return (controller as { provider?: unknown }).provider;
  }, [activeAddress, ethChainId]);

  const mintDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;

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
      const provider = await getProvider();
      await mintTokens({
        ...getTradeParams(effectiveMarket, chainRpc, activeAddress, provider),
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
    const swapDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
    const amountInWei = parseTokenAmount(swapAmount, swapDecimals);
    if (amountInWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
    if (amountInWei > sellBalance) {
      const tokenName = swapBuyPass ? 'FAIL' : 'PASS';
      setErrorMessage(
        `Insufficient ${tokenName} tokens. You have ${formatTokenDisplay(sellBalance, swapDecimals)} ${tokenName}.`,
      );
      return;
    }
    const minAmountOutWei =
      slippagePreset === 'no-min'
        ? 0n
        : applySlippage(amountInWei, slippageBps);
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await swapTokens({
        ...getTradeParams(effectiveMarket, chainRpc, activeAddress, provider),
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
    const mergeDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
    const amountWei = parseTokenAmount(mergeAmount, mergeDecimals);
    if (amountWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    if (amountWei > minBalanceForMerge) {
      const maxDisplay = formatTokenDisplay(minBalanceForMerge, mergeDecimals);
      setErrorMessage(
        `Insufficient balance. You can merge at most ${maxDisplay} (limited by your PASS/FAIL balance).`,
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await mergeTokens({
        ...getTradeParams(effectiveMarket, chainRpc, activeAddress, provider),
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
    const redeemDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
    const amountWei = parseTokenAmount(redeemAmount, redeemDecimals);
    const maxRedeem = winner === 1 ? pTokenBalance : fTokenBalance;
    if (amountWei <= 0n || amountWei > maxRedeem) {
      setErrorMessage(`Enter a valid amount (max ${maxRedeem.toString()}).`);
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await redeemTokens({
        ...getTradeParams(effectiveMarket, chainRpc, activeAddress, provider),
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
      const swapDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
      const amountInWei = parseTokenAmount(swapAmount, swapDecimals);
      const minOutWei =
        slippagePreset === 'no-min'
          ? 0n
          : applySlippage(amountInWei, slippageBps);
      const sellToken = swapBuyPass ? 'FAIL' : 'PASS';
      const buyToken = swapBuyPass ? 'PASS' : 'FAIL';
      const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
      const buyBalance = swapBuyPass ? pTokenBalance : fTokenBalance;

      const slippageOptions: Array<{
        label: string;
        preset: 'auto' | '0.5%' | '1.0%' | '2.0%' | '5.0%' | 'no-min';
        bps: number;
      }> = [
        { label: 'Auto', preset: 'auto', bps: DEFAULT_SLIPPAGE_BPS },
        { label: '0.5%', preset: '0.5%', bps: 50 },
        { label: '1.0%', preset: '1.0%', bps: 100 },
        { label: '2.0%', preset: '2.0%', bps: 200 },
        { label: '5.0%', preset: '5.0%', bps: 500 },
        { label: 'No min', preset: 'no-min', bps: 0 },
      ];

      const sellBalanceZero = sellBalance === 0n;

      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <CWBanner
            type="info"
            body={
              sellBalanceZero ? (
                <>
                  You&apos;re selling <strong>{sellToken}</strong> but your
                  balance is 0. Use the <strong>Mint</strong> tab first (you get
                  equal PASS and FAIL), then return here to swap.
                </>
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
                  Balance: {formatTokenDisplay(sellBalance, swapDecimals)}
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
                        formatTokenDisplay(sellBalance, swapDecimals),
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
                  Balance: {formatTokenDisplay(buyBalance, swapDecimals)}
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
                    {slippagePreset === 'no-min'
                      ? 'Any'
                      : minOutWei > 0n
                        ? formatTokenDisplay(minOutWei, swapDecimals)
                        : '—'}
                  </CWText>
                  {slippagePreset !== 'no-min' && minOutWei > 0n && (
                    <CWText type="caption" className="min-out-hint">
                      ~ {formatTokenDisplay(minOutWei, swapDecimals)}
                    </CWText>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Slippage */}
          <div className="slippage-row">
            <div className="slippage-label-group">
              <CWText type="b2">Max Slippage</CWText>
              <CWIcon
                iconName="infoEmpty"
                iconSize="small"
                className="slippage-info-icon"
              />
            </div>
            <div className="slippage-presets">
              {slippageOptions.map(({ label, preset, bps }) => (
                <button
                  key={preset}
                  className={`slippage-btn${slippagePreset === preset ? ' active' : ''}`}
                  onClick={() => {
                    setSlippagePreset(preset);
                    setSlippageBps(bps);
                  }}
                >
                  {label}
                </button>
              ))}
              <input
                className={`slippage-custom-input${slippagePreset === 'custom' ? ' active' : ''}`}
                type="text"
                placeholder="0.1"
                value={
                  slippagePreset === 'custom' ? String(slippageBps / 100) : ''
                }
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSlippagePreset('custom');
                  if (!Number.isNaN(v)) setSlippageBps(Math.round(v * 100));
                }}
              />
            </div>
            <CWText type="caption" className="slippage-hint">
              If you get &quot;Slippage exceeded&quot;, try 2% or 5%, or use
              &quot;No min&quot; to accept any amount (swap always succeeds).
            </CWText>
          </div>
        </div>
      );
    }
    if (activeTab === 'merge') {
      const mergeDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
      const amountWei = parseTokenAmount(mergeAmount, mergeDecimals);
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
              Available: {formatTokenDisplay(minBalanceForMerge, mergeDecimals)}{' '}
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
                  formatTokenDisplay(minBalanceForMerge, mergeDecimals),
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
    const redeemDecimals = collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
    const redeemCollateralSymbol = collateralInfo?.symbol ?? 'ETH';
    const amountWei = parseTokenAmount(redeemAmount, redeemDecimals);
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
                Available: {formatTokenDisplay(maxRedeem, redeemDecimals)}{' '}
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
                  setRedeemAmount(formatTokenDisplay(maxRedeem, redeemDecimals))
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
      ? !mintAmount ||
        parseTokenAmount(mintAmount, mintDecimals) <= 0n ||
        (!!collateralInfo &&
          parseTokenAmount(mintAmount, mintDecimals) >
            collateralInfo.balanceWei)
      : activeTab === 'swap'
        ? (() => {
            const swapDecimals =
              collateralInfo?.decimals ?? COLLATERAL_DECIMALS;
            const amountWei = parseTokenAmount(swapAmount, swapDecimals);
            const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
            const hasBalanceData =
              userPosition != null || onChainBalances != null;
            return (
              !swapAmount ||
              amountWei <= 0n ||
              (hasBalanceData && sellBalance > 0n && amountWei > sellBalance)
            );
          })()
        : activeTab === 'merge'
          ? !mergeAmount ||
            parseTokenAmount(
              mergeAmount,
              collateralInfo?.decimals ?? COLLATERAL_DECIMALS,
            ) <= 0n ||
            parseTokenAmount(
              mergeAmount,
              collateralInfo?.decimals ?? COLLATERAL_DECIMALS,
            ) > minBalanceForMerge
          : (winner !== 1 && winner !== 2) ||
            !redeemAmount ||
            parseTokenAmount(
              redeemAmount,
              collateralInfo?.decimals ?? COLLATERAL_DECIMALS,
            ) <= 0n ||
            parseTokenAmount(
              redeemAmount,
              collateralInfo?.decimals ?? COLLATERAL_DECIMALS,
            ) > (winner === 1 ? pTokenBalance : fTokenBalance);

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
              {(vaultBalanceOnChain ?? market.total_collateral != null) && (
                <CWText
                  type="caption"
                  className="collateral-label total-minted"
                >
                  Total minted:&nbsp;
                  {vaultBalanceOnChain != null
                    ? `${formatTokenDisplay(
                        vaultBalanceOnChain.balanceWei,
                        vaultBalanceOnChain.decimals,
                      )} ${vaultBalanceOnChain.symbol}`
                    : `${formatTokenDisplay(
                        BigInt(market.total_collateral ?? '0'),
                        collateralInfo?.decimals ?? 18,
                      )} ${collateralInfo ? collateralInfo.symbol : 'ETH'}`}
                </CWText>
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
              <CWText type="b1" fontWeight="bold">
                {formatTokenDisplay(pTokenBalance, mintDecimals)}
              </CWText>
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
              <CWText type="b1" fontWeight="bold">
                {formatTokenDisplay(fTokenBalance, mintDecimals)}
              </CWText>
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
            <CWText type="b2">{errorMessage}</CWText>
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
