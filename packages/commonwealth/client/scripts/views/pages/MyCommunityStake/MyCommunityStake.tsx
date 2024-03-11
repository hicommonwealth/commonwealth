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

const TABS = ['My Stakes', 'Transaction History'] as const;

const FILTERS = {
  ALL_ADDRESSES: 'All addresses',
} as const;

const MyCommunityStake = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
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
        {TABS.map((tab, index) => (
          <CWTab
            key={index}
            label={tab}
            isSelected={activeTabIndex === index}
            onClick={() => setActiveTabIndex(index)}
          />
        ))}
      </CWTabsRow>

      {activeTabIndex === 0 ? <Stakes /> : <Transactions />}
    </section>
  );
};

export { MyCommunityStake };
