import { ArrowsDownUp } from '@phosphor-icons/react';
import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import MagicWebWalletController from 'client/scripts/controllers/app/webWallets/MagicWebWallet';
import {
  applySlippage,
  fetchMarketIdFromChain,
  getPredictionMarketBalancesFromChain,
  mergeTokens,
  mintTokens,
  parseTokenAmount,
  redeemTokens,
  swapTokens,
  type TradeParams,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import { fetchNodes } from 'client/scripts/state/api/nodes';
import { useGetPredictionMarketPositionsQuery } from 'client/scripts/state/api/predictionMarket';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useCallback, useEffect, useState } from 'react';
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
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import './PredictionMarketTradeModal.scss';

const COLLATERAL_DECIMALS = 18;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%
const PROTOCOL_FEE_BPS = 10; // 0.1%

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
  [key: string]: unknown;
};

type PredictionMarketTradeModalProps = {
  market: Market;
  threadCommunityId: string;
  onClose: () => void;
  onSuccess?: () => void;
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
}: PredictionMarketTradeModalProps) => {
  const user = useUserStore();
  const activeAddress = user.activeAccount?.address ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('mint');
  const [mintAmount, setMintAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapBuyPass, setSwapBuyPass] = useState(true);
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [slippagePreset, setSlippagePreset] = useState<
    'auto' | '0.5%' | '1.0%' | 'custom'
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

  const handleMint = async () => {
    const amountWei = parseTokenAmount(mintAmount, COLLATERAL_DECIMALS);
    if (amountWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
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
    const amountInWei = parseTokenAmount(swapAmount, COLLATERAL_DECIMALS);
    if (amountInWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    const minAmountOutWei = applySlippage(amountInWei, slippageBps);
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
    const amountWei = parseTokenAmount(mergeAmount, COLLATERAL_DECIMALS);
    if (amountWei <= 0n || amountWei > minBalanceForMerge) {
      setErrorMessage(
        `Enter a valid amount (max ${minBalanceForMerge.toString()} wei or use balance).`,
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
    const amountWei = parseTokenAmount(redeemAmount, COLLATERAL_DECIMALS);
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
      const amountWei = parseTokenAmount(mintAmount, COLLATERAL_DECIMALS);
      const costDisplay = amountWei > 0n ? mintAmount || '0' : '0';
      const protocolFeeWei = (amountWei * BigInt(PROTOCOL_FEE_BPS)) / 10000n;
      const protocolFeeDisplay =
        protocolFeeWei > 0n ? (Number(protocolFeeWei) / 1e18).toFixed(3) : '0';
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <div className="input-label-row">
            <CWText type="b2" className="label">
              Collateral Amount
            </CWText>
            <CWText type="caption" className="available">
              Available: {availableEthDisplay} ETH
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
                if (ethBalance && ethBalance !== '0' && ethBalance !== '0.')
                  setMintAmount(ethBalance);
              }}
              disabled={
                !ethBalance || ethBalance === '0' || ethBalance === '0.'
              }
            />
            <CWText type="b2" className="unit">
              ETH
            </CWText>
          </div>
          <CWBanner
            type="info"
            body={
              <div>
                You will receive equal amounts of <strong>PASS</strong> and{' '}
                <strong>FAIL</strong> tokens.
              </div>
            }
          />
          <div className="cost-details">
            <div className="cost-row">
              <CWText type="caption">Cost</CWText>
              <CWText type="caption" fontWeight="medium">
                {costDisplay} ETH
              </CWText>
            </div>
            <div className="cost-row">
              <CWText type="caption">Protocol Fee (0.1%)</CWText>
              <CWText type="caption" fontWeight="medium">
                {protocolFeeDisplay} ETH
              </CWText>
            </div>
            <CWDivider className="summary-divider" />
            <div className="cost-row">
              <CWText type="caption" fontWeight="medium">
                Total
              </CWText>
              <CWText
                type="caption"
                fontWeight="medium"
                className="summary-value-highlight"
              >
                {amountWei > 0n
                  ? `${(Number(amountWei) / 1e18 + Number(protocolFeeWei) / 1e18).toFixed(4)} ETH`
                  : '0 ETH'}
              </CWText>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'swap') {
      const amountInWei = parseTokenAmount(swapAmount, COLLATERAL_DECIMALS);
      const minOutWei = applySlippage(amountInWei, slippageBps);
      const sellToken = swapBuyPass ? 'FAIL' : 'PASS';
      const buyToken = swapBuyPass ? 'PASS' : 'FAIL';
      const sellBalance = swapBuyPass ? fTokenBalance : pTokenBalance;
      const buyBalance = swapBuyPass ? pTokenBalance : fTokenBalance;

      const slippageOptions: Array<{
        label: string;
        preset: 'auto' | '0.5%' | '1.0%';
        bps: number;
      }> = [
        { label: 'Auto', preset: 'auto', bps: DEFAULT_SLIPPAGE_BPS },
        { label: '0.5%', preset: '0.5%', bps: 50 },
        { label: '1.0%', preset: '1.0%', bps: 100 },
      ];

      return (
        <div className="PredictionMarketTradeModal-tab-content">
          {/* Token panels */}
          <div className="swap-panels">
            <div className="token-panel">
              <div className="panel-header">
                <CWText type="caption" className="panel-side-label">
                  You Sell
                </CWText>
                <CWText type="caption" className="panel-balance">
                  Balance: {formatTokenDisplay(sellBalance)}
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
                      setSwapAmount(formatTokenDisplay(sellBalance))
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
                  Balance: {formatTokenDisplay(buyBalance)}
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
                    {minOutWei > 0n ? formatTokenDisplay(minOutWei) : '—'}
                  </CWText>
                  {minOutWei > 0n && (
                    <CWText type="caption" className="min-out-hint">
                      ~ {formatTokenDisplay(minOutWei)}
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
          </div>

          {/* Summary */}
          <div className="swap-summary">
            <div className="summary-row">
              <CWText type="caption">Available ETH</CWText>
              <CWText type="caption">{availableEthDisplay}</CWText>
            </div>
            <div className="summary-row">
              <CWText type="caption">Exchange Rate</CWText>
              <CWText type="caption">
                1 {sellToken} = — {buyToken}
              </CWText>
            </div>
            <div className="summary-row">
              <CWText type="caption">Network Fee</CWText>
              <CWText type="caption" className="network-fee">
                —
              </CWText>
            </div>
            <CWDivider className="summary-divider" />
            <div className="summary-row">
              <CWText type="caption">Min. Received</CWText>
              <CWText
                type="caption"
                fontWeight="medium"
                className="summary-value-highlight"
              >
                {minOutWei > 0n
                  ? `${formatTokenDisplay(minOutWei)} ${buyToken}`
                  : '—'}
              </CWText>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'merge') {
      const amountWei = parseTokenAmount(mergeAmount, COLLATERAL_DECIMALS);
      const validMerge = amountWei > 0n && amountWei <= minBalanceForMerge;
      const limitedByPass = pTokenBalance <= fTokenBalance;
      const mergeDisplay = validMerge ? mergeAmount || '0' : '0';
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <div className="input-label-row">
            <CWText type="b2" className="label">
              Amount to merge
            </CWText>
            <CWText type="caption" className="available">
              Available: {formatTokenDisplay(minBalanceForMerge)} (Limited by{' '}
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
                setMergeAmount(formatTokenDisplay(minBalanceForMerge))
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
              <CWText type="caption">Available ETH</CWText>
              <CWText type="caption" fontWeight="medium">
                {availableEthDisplay}
              </CWText>
            </div>
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
                {mergeDisplay} ETH
              </CWText>
            </div>
          </div>
        </div>
      );
    }
    // redeem
    const canRedeem = winner === 1 || winner === 2;
    const amountWei = parseTokenAmount(redeemAmount, COLLATERAL_DECIMALS);
    const maxRedeem = winner === 1 ? pTokenBalance : fTokenBalance;
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
            <CWText type="b2" className="label">
              Winning token amount ({winner === 1 ? 'PASS' : 'FAIL'}) — max:{' '}
              {maxRedeem.toString()}
            </CWText>
            <CWTextInput
              value={redeemAmount}
              onInput={(e) =>
                setRedeemAmount((e.target as HTMLInputElement).value)
              }
              placeholder="0"
              type="text"
              containerClassName="amount-input"
            />
            <div className="cost-details">
              <div className="cost-row">
                <CWText type="caption" fontWeight="medium">
                  Available ETH
                </CWText>
                <CWText type="caption" fontWeight="medium">
                  {availableEthDisplay}
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
                  className="summary-value-highlight"
                >
                  {redeemDisplay} ETH
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
      ? !mintAmount || parseTokenAmount(mintAmount, COLLATERAL_DECIMALS) <= 0n
      : activeTab === 'swap'
        ? !swapAmount || parseTokenAmount(swapAmount, COLLATERAL_DECIMALS) <= 0n
        : activeTab === 'merge'
          ? !mergeAmount ||
            parseTokenAmount(mergeAmount, COLLATERAL_DECIMALS) <= 0n ||
            parseTokenAmount(mergeAmount, COLLATERAL_DECIMALS) >
              minBalanceForMerge
          : (winner !== 1 && winner !== 2) ||
            !redeemAmount ||
            parseTokenAmount(redeemAmount, COLLATERAL_DECIMALS) <= 0n ||
            parseTokenAmount(redeemAmount, COLLATERAL_DECIMALS) >
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
        <div className="balances-section">
          <div className="balance-card pass">
            <div className="balance-card-header">
              <span className="balance-dot" />
              <CWText type="caption" className="balance-label">
                PASS BALANCE
              </CWText>
            </div>
            <div className="balance-card-value">
              <CWText type="b1" fontWeight="bold">
                {formatTokenDisplay(pTokenBalance)}
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
            </div>
            <div className="balance-card-value">
              <CWText type="b1" fontWeight="bold">
                {formatTokenDisplay(fTokenBalance)}
              </CWText>
              <CWText type="b2" fontWeight="regular">
                &nbsp;FAIL
              </CWText>
            </div>
          </div>
        </div>
        <CWTabsRow className="tabs-row">
          <CWTab
            label="Mint"
            isSelected={activeTab === 'mint'}
            onClick={() => setActiveTab('mint')}
          />
          <CWTab
            label="Swap"
            isSelected={activeTab === 'swap'}
            onClick={() => setActiveTab('swap')}
            isDisabled={swapDisabled}
          />
          <CWTab
            label="Merge"
            isSelected={activeTab === 'merge'}
            onClick={() => setActiveTab('merge')}
          />
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
