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

import { GetLaunchpadTrades } from '@hicommonwealth/schemas';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import { z } from 'zod';
import { CWText } from '../../components/component_kit/cw_text';
import { CWMobileTab } from '../../components/component_kit/new_designs/CWMobileTab';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { AuthModal } from '../../modals/AuthModal';
import { PageNotFound } from '../404';
import './WalletPage.scss';
import { QuestSummaryCard, ReferralCard, WalletCard } from './cards';
import TokenClaimBanner from './components/TokenClaimBanner';
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

type GetLaunchpadTradesOutput = z.infer<typeof GetLaunchpadTrades.output>;

const WalletPage = () => {
  const user = useUserStore();
  const rewardsEnabled = useFlag('rewardsPage');
  const xpEnabled = useFlag('xp');
  const navigate = useCommonNavigate();

  const [mobileTab, setMobileTab] = useState<MobileTabType>(getInitialTab());
  const [tableTab, setTableTab] = useState(tabToTable[getInitialTab()]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  // Fetch launchpad trades data using the original query hook
  const { data: launchpadTradesData, isLoading: isLaunchpadTradesLoading } =
    useGetLaunchpadTradesQuery(
      { token_address: ZERO_ADDRESS },
      {
        enabled: tableTab === TableType.TokenTXHistory,
      },
    );

  // Handle hook return type (can be {}, undefined, or actual data)
  const launchpadTrades: GetLaunchpadTradesOutput | undefined = useMemo(() => {
    // Check if data is an array before returning
    if (Array.isArray(launchpadTradesData)) {
      return launchpadTradesData;
    }
    return undefined; // Return undefined if data is {}, null, or undefined
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
    <CWPageLayout className="WalletPageLayout">
      <section className="WalletPage">
        <CWText type="h2" className="header">
          Wallet
        </CWText>

        {/* visible only on mobile */}
        <div className="wallet-button-tabs">
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

        {/* Token claim banner - full width above cards */}
        <TokenClaimBanner
          onConnectNewAddress={() => setIsAuthModalOpen(true)}
        />

        {/* on mobile show only one card */}
        <div className="wallet-card-container">
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.WalletBalance) && <WalletCard />}
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

          {(!isWindowSmallInclusive || mobileTab === MobileTabType.Quests) &&
            xpEnabled && <QuestSummaryCard />}
        </div>

        <div className="wallet-tab-container">
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

        {tableTab === TableType.TokenTXHistory && (
          <TokenTXHistoryTable
            trades={launchpadTrades}
            isLoading={isLaunchpadTradesLoading}
          />
        )}
        {tableTab === TableType.Referrals && (
          <ReferralTable referrals={referrals} isLoading={isReferralsLoading} />
        )}
        {xpEnabled && tableTab === TableType.XPEarnings && <XPEarningsTable />}
      </section>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </CWPageLayout>
  );
};

export default WalletPage;
