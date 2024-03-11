import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWSearchBar } from '../../components/component_kit/new_designs/CWSearchBar';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { PageNotFound } from '../404';
import './MyCommunityStake.scss';
import Stakes from './Stakes';
import Transactions from './Transactions';

const TABS = {
  MY_STAKES: 'My Stakes',
  TRANSACTION_HISTORY: 'Transaction History',
} as const;

const FILTERS = {
  ALL_ADDRESSES: 'All addresses',
} as const;

const MyCommunityStake = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const [activeTab, setActiveTab] = useState<typeof TABS[keyof typeof TABS]>(
    TABS.MY_STAKES,
  );
  const [activeFilter, setActiveFilter] = useState<any>(FILTERS.ALL_ADDRESSES);

  if (!isLoggedIn) return <PageNotFound />;

  return (
    <section className="MyCommunityStake">
      <CWText type="h2" className="header">
        My community stake
      </CWText>

      <section className="filters">
        <CWSearchBar placeholder="Search community name or symbol" />
        <div className="select-list-container">
          <CWText fontWeight="medium">Filter</CWText>
          <CWSelectList
            isSearchable={false}
            isClearable={false}
            options={Object.values(FILTERS).map((filter) => ({
              value: filter,
              label: filter,
            }))}
            value={{ label: activeFilter, value: activeFilter }}
            onChange={(option) => setActiveFilter(option.value)}
          />
        </div>
      </section>

      <CWTabsRow>
        {Object.values(TABS).map((tab, index) => (
          <CWTab
            key={index}
            label={tab}
            isSelected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </CWTabsRow>

      {activeTab === TABS.MY_STAKES ? <Stakes /> : <Transactions />}
    </section>
  );
};

export { MyCommunityStake };
