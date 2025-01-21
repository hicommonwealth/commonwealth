import React, { useState } from 'react';

import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import useUserStore from 'state/ui/user';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

import { CWText } from '../../components/component_kit/cw_text';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { PageNotFound } from '../404';
import RewardsTab from './RewardsTab';
import { QuestCard, ReferralCard, WalletCard } from './cards';
import { QuestTable, ReferralTable, WalletTable } from './tables';
import { MobileTabType, TableType } from './types';
import { getInitialTab, mobileTabParam, tabToTable, typeToIcon } from './utils';

import './RewardsPage.scss';

const RewardsPage = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const rewardsEnabled = useFlag('rewardsPage');

  const [mobileTab, setMobileTab] = useState<MobileTabType>(getInitialTab());
  const [tableTab, setTableTab] = useState(tabToTable[getInitialTab()]);

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
          {Object.values(MobileTabType).map((type) => (
            <RewardsTab
              key={type}
              icon={typeToIcon[type] as IconName}
              title={type}
              isActive={mobileTab === type}
              onClick={() => handleTabChange(type)}
            />
          ))}
        </div>

        {/* on mobile show only one card */}
        <div className="rewards-card-container">
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.Referrals) && (
            <ReferralCard
              onSeeAllClick={() => handleTabChange(MobileTabType.Referrals)}
            />
          )}
          {(!isWindowSmallInclusive ||
            mobileTab === MobileTabType.WalletBalance) && <WalletCard />}
          {(!isWindowSmallInclusive || mobileTab === MobileTabType.Quests) && (
            <QuestCard
              onSeeAllClick={() => handleTabChange(MobileTabType.Quests)}
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

        {tableTab === TableType.Referrals && <ReferralTable />}
        {tableTab === TableType.TokenTXHistory && <QuestTable />}
        {tableTab === TableType.XPEarnings && <WalletTable />}
      </section>
    </CWPageLayout>
  );
};

export default RewardsPage;
