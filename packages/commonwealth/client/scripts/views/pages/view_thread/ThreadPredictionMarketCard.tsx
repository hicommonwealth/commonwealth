import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import {
  getCollateralBalanceAndSymbol,
  getMarketCollateralBalanceFromLogs,
  getPredictionMarketBalancesFromChain,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import type Thread from 'client/scripts/models/Thread';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import {
  useCancelPredictionMarketMutation,
  useGetPredictionMarketPositionsQuery,
  useGetPredictionMarketsQuery,
  useGetPredictionMarketTradesQuery,
} from 'client/scripts/state/api/predictionMarket';
import { openConfirmation } from 'client/scripts/views/modals/confirmation_modal';
import {
  CustomAddressOption,
  CustomAddressOptionElement,
} from 'client/scripts/views/modals/ManageCommunityStakeModal/StakeExchangeForm/CustomAddressOption';
import { convertAddressToDropdownOption } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/CommonTradeTokenForm/helpers';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import useUserStore from 'state/ui/user';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { PopoverMenu } from '../../components/component_kit/CWPopoverMenu';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { DeployDraftPredictionMarketModal } from '../../modals/PredictionMarket/DeployDraftPredictionMarketModal';
import { PredictionMarketResolveModal } from '../../modals/PredictionMarket/PredictionMarketResolveModal';
import { PredictionMarketTradeModal } from '../../modals/PredictionMarketTradeModal';
import './poll_cards.scss';
import { formatCollateral } from './predictionMarketUtils';
import './ThreadPredictionMarketCard.scss';

function formatCollateralBalance(wei: bigint, decimals: number): string {
  if (wei === 0n) return '0.00';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const frac = ((wei % divisor) * 100n) / divisor;
  return `${whole}.${frac.toString().padStart(2, '0').slice(0, 2)}`;
}

export type PredictionMarketResult = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  total_collateral?: string;
  current_probability?: number;
  duration?: number;
  resolution_threshold?: number;
  collateral_address?: string;
  proposal_id?: string | null;
  governor_address?: string | null;
  end_time?: Date | string | null;
  vault_address?: string | null;
  router_address?: string | null;
  market_id?: string | null;
  p_token_address?: string | null;
  f_token_address?: string | null;
  eth_chain_id?: number;
  winner?: number | null;
  created_at?: string;
  [key: string]: unknown;
};

type ThreadPredictionMarketCardProps = {
  thread: Thread;
  market?: PredictionMarketResult;
  isAuthor?: boolean;
  canResolveMarket?: boolean;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case PredictionMarketStatus.Draft:
      return 'Draft';
    case PredictionMarketStatus.Active:
      return 'Active';
    case PredictionMarketStatus.Resolved:
      return 'Resolved';
    case PredictionMarketStatus.Cancelled:
      return 'Cancelled';
    default:
      return status;
  }
};

const getStatusTagType = (
  status: string,
): 'info' | 'active' | 'passed' | 'disabled' => {
  switch (status) {
    case PredictionMarketStatus.Draft:
      return 'info';
    case PredictionMarketStatus.Active:
      return 'active';
    case PredictionMarketStatus.Resolved:
      return 'passed';
    case PredictionMarketStatus.Cancelled:
      return 'disabled';
    default:
      return 'info';
  }
};

const getTimeRemaining = (m: PredictionMarketResult) => {
  if (!m?.end_time) return null;

  const endTime = moment(m.end_time);
  const now = moment();

  if (endTime.isBefore(now)) {
    return `Ended ${endTime.format('lll')}`;
  }

  const duration = moment.duration(endTime.diff(now));
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export const ThreadPredictionMarketCard = ({
  thread,
  market: marketProp,
  isAuthor: isAuthorProp,
  canResolveMarket,
}: ThreadPredictionMarketCardProps) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeRefreshNonce, setTradeRefreshNonce] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState<string | null>(null);
  const user = useUserStore();
  const uniqueAddresses =
    getUniqueUserAddresses({ forChain: ChainBase.Ethereum }) ?? [];
  const [selectedAddress, setSelectedAddress] = useState<string>(() => {
    const initial =
      user.activeAccount?.address ??
      user.addressSelectorSelectedAddress ??
      uniqueAddresses[0];
    return initial ?? '';
  });

  const { data: marketsData, isLoading } = useGetPredictionMarketsQuery({
    thread_id: thread.id!,
    apiCallEnabled: marketProp === undefined,
  });

  const { mutateAsync: cancelMarket } = useCancelPredictionMarketMutation({
    thread_id: thread.id!,
  });

  const market =
    marketProp ??
    (marketsData?.results?.[0] as PredictionMarketResult | undefined);

  const { data: positions = [], refetch: refetchPositions } =
    useGetPredictionMarketPositionsQuery({
      prediction_market_id: market?.id ?? 0,
    });
  const userPosition = Array.isArray(positions)
    ? positions.find(
        (p: { user_address: string }) =>
          p.user_address?.toLowerCase() === selectedAddress?.toLowerCase(),
      )
    : undefined;

  const { data: tradesData, refetch: refetchTrades } =
    useGetPredictionMarketTradesQuery({
      prediction_market_id: market?.id ?? 0,
    });
  const trades =
    (tradesData as { results?: { collateral_amount: string }[] })?.results ??
    [];
  const latestTradeFingerprint = JSON.stringify(tradesData ?? null);
  const marketVolume = trades.reduce(
    (sum, t) => sum + BigInt(t.collateral_amount || '0'),
    0n,
  );

  const [collateralDisplay, setCollateralDisplay] = useState<{
    symbol: string;
    balance: string;
    decimals: number;
  } | null>(null);
  const [onChainPassFail, setOnChainPassFail] = useState<{
    p: bigint;
    f: bigint;
  } | null>(null);
  const [marketCollateralOnChain, setMarketCollateralOnChain] = useState<
    bigint | null
  >(null);

  const activeAddress = selectedAddress;
  const { data: community } = useGetCommunityByIdQuery({
    id: thread?.communityId ?? '',
    includeNodeInfo: true,
    enabled: !!thread?.id,
  });
  const chainRpc =
    (community as { ChainNode?: { url?: string } } | undefined)?.ChainNode
      ?.url ?? '';
  const ethChainId =
    (community as { ChainNode?: { eth_chain_id?: number } } | undefined)
      ?.ChainNode?.eth_chain_id ?? 0;

  const isCollateralZero =
    !market?.collateral_address ||
    market?.collateral_address.toLowerCase() === ZERO_ADDR.toLowerCase();
  const { data: ethBalance = '' } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: activeAddress,
    ethChainId,
    apiEnabled:
      !!chainRpc && !!activeAddress && ethChainId > 0 && isCollateralZero,
  });

  useEffect(() => {
    if (!market) return;
    setTimeDisplay(getTimeRemaining(market));
  }, [market]);

  useEffect(() => {
    if (!market?.end_time) return;
    const endTime = moment(market.end_time);
    if (endTime.isBefore(moment())) return;

    const interval = setInterval(() => {
      setTimeDisplay(getTimeRemaining(market));
    }, 1000);
    return () => clearInterval(interval);
  }, [market?.end_time, market]);

  useEffect(() => {
    const addr = market?.collateral_address;
    const isZero = !addr || addr.toLowerCase() === ZERO_ADDR.toLowerCase();
    if (isZero) {
      const bal = ethBalance === '0.' ? '0' : ethBalance || '—';
      setCollateralDisplay({ symbol: 'ETH', balance: bal, decimals: 18 });
      return;
    }
    if (!chainRpc || !activeAddress) {
      setCollateralDisplay(null);
      return;
    }
    let cancelled = false;
    getCollateralBalanceAndSymbol(chainRpc, activeAddress, addr)
      .then(({ balanceWei, symbol, decimals }) => {
        if (!cancelled)
          setCollateralDisplay({
            symbol,
            balance: formatCollateralBalance(balanceWei, decimals),
            decimals,
          });
      })
      .catch(() => {
        if (!cancelled) setCollateralDisplay(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chainRpc, activeAddress, market?.collateral_address, ethBalance]);

  // Fetch PASS/FAIL balances from chain and prefer them for immediate UI freshness.
  useEffect(() => {
    if (
      !chainRpc ||
      !activeAddress ||
      !market?.p_token_address ||
      !market?.f_token_address
    ) {
      setOnChainPassFail(null);
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
          setOnChainPassFail({ p: pTokenBalanceWei, f: fTokenBalanceWei });
      })
      .catch(() => {
        if (!cancelled) setOnChainPassFail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    chainRpc,
    activeAddress,
    market?.p_token_address,
    market?.f_token_address,
    latestTradeFingerprint,
    tradeRefreshNonce,
  ]);

  // Prefer on-chain market-specific collateral over DB total_collateral
  useEffect(() => {
    const vaultAddr = market?.vault_address;
    const marketId = market?.market_id;
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
  }, [
    chainRpc,
    market?.vault_address,
    market?.market_id,
    latestTradeFingerprint,
    tradeRefreshNonce,
  ]);

  const refreshTradeData = async () => {
    await Promise.allSettled([refetchPositions(), refetchTrades()]);
    setTradeRefreshNonce((prev) => prev + 1);
  };

  const handleTradeModalSuccess = async () => {
    await refreshTradeData();
    setIsTradeModalOpen(false);
  };

  const handleTradeModalClose = async () => {
    setIsTradeModalOpen(false);
    await refreshTradeData();
  };

  const handleCancelMarket = () => {
    if (!market) return;

    openConfirmation({
      title: 'Cancel Prediction Market',
      description: 'Are you sure you want to cancel this prediction market?',
      buttons: [
        {
          label: 'Cancel Market',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await cancelMarket({
                thread_id: thread.id!,
                prediction_market_id: market.id,
              });
            } catch (err) {
              console.error('Failed to cancel prediction market', err);
            }
          },
        },
        {
          label: 'Dismiss',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const isThreadAuthor =
    user.activeAccount?.address === thread.author &&
    user.activeAccount?.community?.id === thread.communityId;

  const isAuthor = isAuthorProp ?? isThreadAuthor;

  const isDraft = market?.status === PredictionMarketStatus.Draft;
  const canCompleteDraft = isDraft && isAuthor;

  const canTrade =
    (market?.status === 'active' || market?.status === 'resolved') &&
    !!market?.vault_address &&
    !!market?.router_address;

  const canCancel =
    isAuthor && market && market.status === PredictionMarketStatus.Draft;

  const canResolve =
    isAuthor &&
    market &&
    market.status === PredictionMarketStatus.Active &&
    !!market.vault_address;

  const decimals = collateralDisplay?.decimals ?? 18;
  const symbol = collateralDisplay?.symbol ?? 'ETH';
  const pBalance =
    onChainPassFail != null
      ? formatCollateralBalance(onChainPassFail.p, decimals)
      : userPosition?.p_token_balance
        ? formatCollateralBalance(
            BigInt(String(userPosition.p_token_balance)),
            decimals,
          )
        : '0.00';
  const fBalance =
    onChainPassFail != null
      ? formatCollateralBalance(onChainPassFail.f, decimals)
      : userPosition?.f_token_balance
        ? formatCollateralBalance(
            BigInt(String(userPosition.f_token_balance)),
            decimals,
          )
        : '0.00';

  const passProbability = market?.current_probability ?? 0.5;
  const failProbability = 1 - passProbability;

  if (marketProp === undefined && isLoading) {
    return (
      <CWCard className="ThreadPredictionMarketCard skeleton">
        <div className="prediction-market-header">
          <div className="skeleton-badge" />
          <div className="skeleton-prompt" />
        </div>
        <div className="metrics-cards">
          <div className="skeleton-metric" />
          <div className="skeleton-metric" />
        </div>
        <div className="probability-section">
          <div className="skeleton-bar" />
        </div>
      </CWCard>
    );
  }

  if (!market) {
    return (
      <CWCard className="ThreadPredictionMarketCard empty-state">
        <CWText type="b2" className="empty-state-message">
          No prediction market for this thread.
        </CWText>
      </CWCard>
    );
  }

  return (
    <>
      <CWCard className="ThreadPredictionMarketCard">
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
        <div className="prediction-market-header">
          <div className="market-prompt-row">
            <CWText type="b2" className="market-prompt">
              {market.prompt}
            </CWText>
            {(canCancel || canResolve || canCompleteDraft) && (
              <PopoverMenu
                className="prediction-market-actions"
                placement="bottom-end"
                renderTrigger={(handleInteraction) => (
                  <CWIconButton
                    iconName="gear"
                    iconSize="small"
                    onClick={handleInteraction}
                    iconButtonTheme="neutral"
                    aria-label="Market actions"
                  />
                )}
                menuItems={[
                  ...(canCompleteDraft
                    ? [
                        {
                          label: 'Complete deployment',
                          iconLeft: 'trophy' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: (e?: React.MouseEvent<HTMLElement>) => {
                            e?.stopPropagation();
                            setIsDeployModalOpen(true);
                          },
                        },
                      ]
                    : []),
                  ...(canCancel
                    ? [
                        {
                          label: 'Cancel market',
                          iconLeft: 'close' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: (e?: React.MouseEvent<HTMLElement>) => {
                            e?.stopPropagation();
                            handleCancelMarket();
                          },
                        },
                      ]
                    : []),
                  ...(canResolve && canResolveMarket
                    ? [
                        {
                          label: 'Resolve market',
                          iconLeft: 'trophy' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: () => setIsResolveModalOpen(true),
                        },
                      ]
                    : []),
                ]}
              />
            )}
          </div>
          {timeDisplay && (
            <div className="time-remaining">
              <CWIcon iconName="timer" iconSize="small" />
              <CWText type="caption" className="time-text">
                {timeDisplay}
              </CWText>
            </div>
          )}
          <CWTag
            label={getStatusLabel(market.status)}
            type={getStatusTagType(market.status)}
            classNames="status-badge"
          />
        </div>
        <CWDivider />

        <div className="metrics-cards">
          <div className="metric-card">
            <div className="metric-row">
              <CWText type="caption" className="metric-label">
                TOTAL MINTED
              </CWText>
              <CWText type="b1" className="metric-value">
                {marketCollateralOnChain != null
                  ? formatCollateralBalance(
                      marketCollateralOnChain,
                      collateralDisplay?.decimals ?? 18,
                    )
                  : formatCollateral(market.total_collateral ?? '0')}
                &nbsp;
                <CWText type="b2">
                  <span className="metric-symbol">{symbol}</span>
                </CWText>
              </CWText>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-row">
              <CWText type="caption" className="metric-label">
                MARKET VOL.
              </CWText>
              <CWText type="b1" className="metric-value">
                {formatCollateral(marketVolume.toString())}&nbsp;
                <CWText type="b2">
                  <span className="metric-symbol">{symbol}</span>
                </CWText>
              </CWText>
            </div>
          </div>
        </div>

        <div className="collateral-section">
          <div className="collateral-row">
            <CWText type="caption" className="collateral-label">
              Collateral
            </CWText>
            <CWText type="caption" className="collateral-value">
              {symbol}
            </CWText>
          </div>
          <div className="collateral-row">
            <CWText type="caption" className="collateral-label">
              Your balance
            </CWText>
            <CWText type="b2" className="collateral-value">
              {collateralDisplay?.balance ?? '—'} {symbol}
            </CWText>
          </div>
        </div>
        <CWDivider />
        <div className="probability-section">
          <div className="probability-labels">
            <div className="balance-label">
              <CWText type="caption" className="pass-label">
                PASS BALANCE
              </CWText>
              <CWText type="b2" className="pass-value">
                {pBalance}&nbsp;
              </CWText>
            </div>
            <div className="balance-label end">
              <CWText type="caption" className="fail-label">
                FAIL BALANCE
              </CWText>
              <CWText type="b2" className="fail-value">
                {fBalance}&nbsp;
              </CWText>
            </div>
          </div>
          <div className="probability-bar">
            <div
              className="probability-pass"
              style={{ width: `${passProbability * 100}%` }}
            />
            <div
              className="probability-fail"
              style={{ width: `${failProbability * 100}%` }}
            />
          </div>
        </div>

        <div className="action-buttons">
          {canTrade && (
            <CWButton
              buttonHeight="sm"
              buttonType="secondary"
              buttonWidth="full"
              label={market.status === 'resolved' ? 'Redeem' : 'Trade'}
              iconLeft="transfer"
              className="trade-button"
              onClick={(e) => {
                e.preventDefault();
                setIsTradeModalOpen(true);
              }}
            />
          )}
        </div>
      </CWCard>

      <CWModal
        size="medium"
        content={
          <DeployDraftPredictionMarketModal
            thread={thread}
            market={market}
            onClose={() => setIsDeployModalOpen(false)}
            onSuccess={() => setIsDeployModalOpen(false)}
          />
        }
        onClose={() => setIsDeployModalOpen(false)}
        open={isDeployModalOpen}
      />
      <CWModal
        size="medium"
        content={
          <PredictionMarketResolveModal
            thread={thread}
            market={market}
            onClose={() => setIsResolveModalOpen(false)}
            onSuccess={() => setIsResolveModalOpen(false)}
          />
        }
        onClose={() => setIsResolveModalOpen(false)}
        open={isResolveModalOpen}
      />
      <CWModal
        size="medium"
        content={
          <PredictionMarketTradeModal
            market={market}
            threadCommunityId={thread?.communityId ?? ''}
            initialAddress={selectedAddress}
            open={isTradeModalOpen}
            onClose={handleTradeModalClose}
            onSuccess={handleTradeModalSuccess}
          />
        }
        onClose={handleTradeModalClose}
        open={isTradeModalOpen}
      />
    </>
  );
};
