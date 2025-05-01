import { ChainBase } from '@hicommonwealth/shared';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import { useTokenPricing } from 'hooks/useTokenPricing';
import moment from 'moment'; // Import moment for ordinal numbers
import React, { useState } from 'react';
import { useInviteLinkModal } from 'state/ui/modals';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import FractionalValue from 'views/components/FractionalValue';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import { Skeleton } from 'views/components/Skeleton';
import MarketCapProgress from 'views/components/TokenCard/MarketCapProgress';
import TradeTokenModal, {
  TradingConfig,
  TradingMode,
} from 'views/modals/TradeTokenModel';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import './PotentialContestCard.scss';

const PRIZE_POOL_PERCENTAGE = 0.0015;
const PRIZE_POOL_DISPLAY_PERCENTAGE = '0.15%';
const PRIZE_DISTRIBUTION_PERCENTAGES = [0.5, 0.35, 0.15];

export const PotentialContestCard = ({
  currency = SupportedCurrencies.USD,
}: {
  currency?: SupportedCurrencies;
}) => {
  const currencySymbol = currencyNameToSymbolMap[currency];
  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();
  const { pricing: tokenPricing, isLoading: isLoadingPricing } =
    useTokenPricing({
      token: communityToken as LaunchpadToken,
    });

  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: TradingConfig;
  }>({ isOpen: false, tradeConfig: undefined });

  const isLoading = isLoadingToken || isLoadingPricing;
  const isLaunchpadToken = communityToken && !isPinnedToken;
  const launchpadToken = communityToken as LaunchpadToken;
  const isLaunched = launchpadToken?.liquidity_transferred;
  const isGoalReached = tokenPricing?.isMarketCapGoalReached;

  if (
    isLoading ||
    !isLaunchpadToken ||
    isLaunched ||
    isGoalReached === undefined ||
    isGoalReached
  ) {
    if (isLoading) {
      return (
        <CWCard className="PotentialContestCard PotentialContestCard--Skeleton">
          <Skeleton height="250px" width="100%" />
        </CWCard>
      );
    }
    return null;
  }

  const projectedTotalPrizePool =
    (tokenPricing?.marketCapCurrent || 0) * PRIZE_POOL_PERCENTAGE;

  const projectedPrizes = PRIZE_DISTRIBUTION_PERCENTAGES.map(
    (percentage) => projectedTotalPrizePool * percentage,
  );

  const handleCTAClick = (mode: TradingMode) => {
    setTokenLaunchModalConfig({
      isOpen: true,
      tradeConfig: {
        mode,
        token: communityToken,
        addressType: ChainBase.Ethereum,
      } as TradingConfig,
    });
  };

  return (
    <CWCard className="PotentialContestCard">
      <div className="contest-body">
        <div className="header-row">
          <CWText type="h4">Projected Weekly Prizes</CWText>
          <CWIcon
            iconName="trophy"
            iconSize="small"
            className="header-trophy-icon"
          />
        </div>

        <div className="prizes prizes--projected">
          {projectedPrizes.map((prizeValue, index) => (
            <div className={`prize-row prize-row-${index + 1}`} key={index}>
              <CWText className="label" fontWeight="bold">
                {moment.localeData().ordinal(index + 1)} Prize
              </CWText>
              <CWText fontWeight="bold">
                {currencySymbol}
                <FractionalValue fontWeight="bold" value={prizeValue} />
              </CWText>
            </div>
          ))}
        </div>

        <CWText type="b2" className="prize-explanation font-size-small">
          {PRIZE_POOL_DISPLAY_PERCENTAGE} of token supply awarded weekly once
          launched.
        </CWText>

        <CWDivider className="divider" />

        <MarketCapProgress
          marketCap={{
            current: tokenPricing?.marketCapCurrent ?? 0,
            goal: tokenPricing?.marketCapGoal ?? 0,
            isCapped: tokenPricing?.isMarketCapGoalReached ?? false,
          }}
          currency={currency}
        />

        <CWText type="b2" className="progress-explanation font-size-small">
          Help reach the goal to launch the token to active rewards!
        </CWText>

        <div className="actions">
          <CWButton
            label="Swap Token"
            iconLeft="transfer"
            buttonType="primary"
            buttonHeight="sm"
            onClick={() => handleCTAClick(TradingMode.Buy)}
            className="action-button"
          />
          <CWButton
            label="Share"
            iconLeft="share"
            buttonType="secondary"
            buttonHeight="sm"
            onClick={() => setIsInviteLinkModalOpen(true)}
            className="action-button"
          />
        </div>
      </div>
      {tokenLaunchModalConfig.tradeConfig && (
        <TradeTokenModal
          isOpen={tokenLaunchModalConfig.isOpen}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
    </CWCard>
  );
};
