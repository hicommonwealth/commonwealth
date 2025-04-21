import React, { useMemo, useState } from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useGetLaunchpadTradesQuery } from 'state/api/tokens';
import {
  useGetUserReferralFeesQuery,
  useGetUserReferralsQuery,
} from 'state/api/user';
import useUserStore from 'state/ui/user';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { CWMobileTab } from '../../components/component_kit/new_designs/CWMobileTab';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { PageNotFound } from '../404';
import './RewardsPage.scss';
import { QuestSummaryCard, ReferralCard, WalletCard } from './cards';
import { ReferralTable, TokenTXHistoryTable, XPEarningsTable } from './tables';
import { MobileTabType, TableType } from './types';
import {
  calculateReferralTrend,
  calculateTotalEarnings,
  getInitialTab,
  mobileTabParam,
  tabToTable,
  typeToIcon,
} from './utils';

const RewardsPage = () => {
  const user = useUserStore();
  const rewardsEnabled = useFlag('rewardsPage');
  const xpEnabled = useFlag('xp');
  const navigate = useCommonNavigate();

  const [mobileTab, setMobileTab] = useState<MobileTabType>(getInitialTab());
  const [tableTab, setTableTab] = useState(tabToTable[getInitialTab()]);

  const { data: referrals, isLoading: isReferralsLoading } =
    useGetUserReferralsQuery({
      userId: user?.id,
      apiCallEnabled: !!user?.id,
    });

  const { data: referralFees } = useGetUserReferralFeesQuery({
    userId: user?.id,
    apiCallEnabled: !!user?.id,
    distributedTokenAddress: ZERO_ADDRESS,
  });

  // Fetch launchpad trades data using infinite query
  const {
    data: launchpadTradesData,
    isLoading: isLaunchpadTradesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetLaunchpadTradesQuery(
    { token_address: ZERO_ADDRESS },
    {
      enabled: tableTab === TableType.TokenTXHistory, // Only fetch when tab is active
    },
  );

  // Flatten pages into a single list of trades
  const launchpadTrades = useMemo(() => {
    // useQuery returns the data directly, or undefined while loading.
    // Default to an empty array if data is not yet available.
    return launchpadTradesData ?? [];
  }, [launchpadTradesData]);

  const trendValue = calculateReferralTrend(referralFees || []);
  const totalEarnings = calculateTotalEarnings(referralFees || []);

  const handleTabChange = (type: MobileTabType) => {
    setMobileTab(type);
    setTableTab(tabToTable[type]);
    navigate(`?tab=${mobileTabParam[type]}`, { replace: true });
  };

  const { isWindowSmallInclusive } = useBrowserWindow({});

  if (!user.isLoggedIn || !rewardsEnabled) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="RewardsPage">
        <CWText type="h2" className="header">
          Rewards
        </CWText>

        {/* visible only on mobile */}
        <div className="rewards-button-tabs">
          {Object.values(MobileTabType).map((type) => {
            if (type === MobileTabType.Quests && !xpEnabled) return null;
            return (
              <CWMobileTab
                key={type}
                icon={typeToIcon[type] as IconName}
                label={type}
                isActive={mobileTab === type}
                onClick={() => handleTabChange(type)}
              />
            );
          })}
        </div>

        {/* on mobile show only one card */}
        <div className="rewards-card-container">
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.Referrals) && (
            <ReferralCard
              onSeeAllClick={() => handleTabChange(MobileTabType.Referrals)}
              trendValue={trendValue}
              totalEarnings={totalEarnings}
              isLoading={isReferralsLoading}
              isReferralsTabSelected={tableTab === TableType.Referrals}
            />
          )}
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.WalletBalance) && <WalletCard />}
          {(!isWindowSmallInclusive || mobileTab === MobileTabType.Quests) &&
            xpEnabled && <QuestSummaryCard />}
        </div>

        <div className="rewards-tab-container">
          <CWTabsRow>
            {Object.values(TableType).map((type) =>
              type === TableType.XPEarnings && !xpEnabled ? (
                <></>
              ) : (
                <CWTab
                  key={type}
                  label={type}
                  isSelected={tableTab === type}
                  onClick={() => {
                    setTableTab(type);
                  }}
                />
              ),
            )}
          </CWTabsRow>
        </div>

        {tableTab === TableType.Referrals && (
          <ReferralTable referrals={referrals} isLoading={isReferralsLoading} />
        )}
        {tableTab === TableType.TokenTXHistory && (
          <TokenTXHistoryTable
            trades={launchpadTrades}
            isLoading={isLaunchpadTradesLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
        {xpEnabled && tableTab === TableType.XPEarnings && <XPEarningsTable />}
      </section>
    </CWPageLayout>
  );
};

export default RewardsPage;
