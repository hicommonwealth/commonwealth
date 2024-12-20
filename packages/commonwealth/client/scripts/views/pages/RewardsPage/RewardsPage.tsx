import React, { useState } from 'react';

import { CWText } from '../../components/component_kit/cw_text';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { PageNotFound } from '../404';
import RewardsCard from './RewardsCard';
import RewardsTab from './RewardsTab';
import { MobileTabType, TableType, tabToTable, typeToIcon } from './utils';

import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import useUserStore from 'state/ui/user';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import './RewardsPage.scss';

const RewardsPage = () => {
  const user = useUserStore();
  const rewardsEnabled = useFlag('rewardsPage');

  const [mobileTab, setMobileTab] = useState<MobileTabType>(
    MobileTabType.Referrals,
  );
  const [tableTab, setTableTab] = useState(TableType.Referrals);

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
          {Object.values(MobileTabType).map((type) => (
            <RewardsTab
              key={type}
              icon={typeToIcon[type] as IconName}
              title={type}
              isActive={mobileTab === type}
              onClick={() => {
                setMobileTab(type);
                setTableTab(tabToTable[type]);
              }}
            />
          ))}
        </div>

        {/* on mobile show only one card */}
        <div className="rewards-card-container">
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.Referrals) && (
            <RewardsCard
              title="Referrals"
              description="Track your referral rewards"
              icon="userSwitch"
              onSeeAllClick={() => console.log('See all clicked')}
            />
          )}
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.WalletBalance) && (
            <RewardsCard title="Wallet Balance" icon="cardholder" />
          )}
          {(!isWindowSmallInclusive || mobileTab === MobileTabType.Quests) && (
            <RewardsCard
              title="Quests"
              description="XP and tokens earned from your contests, bounties, and posted threads"
              icon="trophy"
              onSeeAllClick={() => console.log('See all clicked')}
            />
          )}
        </div>

        <div className="rewards-tab-container">
          <CWTabsRow>
            {Object.values(TableType).map((type) => (
              <CWTab
                key={type}
                label={type}
                isSelected={tableTab === type}
                onClick={() => {
                  setTableTab(type);
                }}
              />
            ))}
          </CWTabsRow>
        </div>

        {tableTab === TableType.Referrals && <div>Referrals table</div>}
        {tableTab === TableType.TokenTXHistory && (
          <div>TokenTXHistory table</div>
        )}
        {tableTab === TableType.XPEarnings && <div>XPEarnings table</div>}
      </section>
    </CWPageLayout>
  );
};

export default RewardsPage;
