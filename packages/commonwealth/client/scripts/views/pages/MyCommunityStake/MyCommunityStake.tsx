import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React, { useState } from 'react';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWSelectList } from '../../components/component_kit/new_designs/CWSelectList';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { PageNotFound } from '../404';
import './MyCommunityStake.scss';
import Stakes from './Stakes';
import Transactions from './Transactions';
import { FilterOptions } from './types';

const TABS = ['My Stakes', 'Transaction History'] as const;

const FILTERS = {
  ALL_ADDRESSES: 'All addresses',
} as const;

const MyCommunityStake = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<any>(FILTERS.ALL_ADDRESSES);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
  });

  if (!isLoggedIn) return <PageNotFound />;

  return (
    <section className="MyCommunityStake">
      <CWText type="h2" className="header">
        My community stake
      </CWText>

      <section className="filters">
        <CWTextInput
          size="large"
          fullWidth
          placeholder="Search community name or symbol"
          containerClassName="search-input-container"
          inputClassName="search-input"
          iconLeft={<CWIcon iconName="search" className="search-icon" />}
          onInput={(e) =>
            setFilterOptions((options) => ({
              ...options,
              searchText: e.target.value?.trim(),
            }))
          }
        />
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

      {activeTabIndex === 0 ? (
        <Stakes />
      ) : (
        <Transactions filterOptions={filterOptions} />
      )}
    </section>
  );
};

export { MyCommunityStake };
