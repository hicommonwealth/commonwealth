import React, { useState } from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import {
  useGetUserReferralFeesQuery,
  useGetUserReferralsQuery,
} from 'state/api/user';
import useUserStore from 'state/ui/user';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { CWText } from '../../components/component_kit/cw_text';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { PageNotFound } from '../404';
import './RewardsPage.scss';
import RewardsTab from './RewardsTab';
import { QuestSummaryCard, ReferralCard, WalletCard } from './cards';
import { ReferralTable, TokenTXHistoryTable, XPEarningsTable } from './tables';
import { MobileTabType, TableType } from './types';
import {
  calculateReferralTrend,
  calculateTotalEarnings,
  getInitialTab,
  tabToTable,
  typeToIcon,
} from './utils';

const RewardsPage = () => {
  const user = useUserStore();
  const rewardsEnabled = useFlag('rewardsPage');
  const xpEnabled = useFlag('xp');

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

  const trendValue = calculateReferralTrend(referralFees || []);
  const totalEarnings = calculateTotalEarnings(referralFees || []);

  const handleTabChange = (type: MobileTabType) => {
    setMobileTab(type);
    setTableTab(tabToTable[type]);
    // TODO we should uncomment it when more tabs will be added
    // navigate(`?tab=${mobileTabParam[type]}`, { replace: true });
  };

  const { isWindowSmallInclusive } = useBrowserWindow({});

  if (!user.isLoggedIn || !rewardsEnabled) {
    return <PageNotFound />;
  }

  const showOtherCards = false;

  return (
    <CWPageLayout>
      <section className="RewardsPage">
        <CWText type="h2" className="header">
          Rewards
        </CWText>

        {/* visible only on mobile */}
        <div className="rewards-button-tabs">
          {Object.values(MobileTabType).map((type) => {
            return (
              type === MobileTabType.Referrals && (
                <RewardsTab
                  key={type}
                  icon={typeToIcon[type] as IconName}
                  title={type}
                  isActive={mobileTab === type}
                  onClick={() => handleTabChange(type)}
                />
              )
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
            />
          )}
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.WalletBalance) && <WalletCard />}
          {(!isWindowSmallInclusive || mobileTab === MobileTabType.Quests) &&
            showOtherCards && <QuestSummaryCard />}
        </div>

        <div className="rewards-tab-container">
          <CWTabsRow>
            {Object.values(TableType).map(
              (type) =>
                type === TableType.Referrals && (
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
        {tableTab === TableType.TokenTXHistory && <TokenTXHistoryTable />}
        {xpEnabled && tableTab === TableType.XPEarnings && <XPEarningsTable />}
      </section>
    </CWPageLayout>
  );
};

export default RewardsPage;
