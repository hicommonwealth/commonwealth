import { formatAddressShort } from 'helpers';
import useTransactionHistory from 'hooks/useTransactionHistory';
import React, { useState } from 'react';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
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
import NoTransactionHistory from './NoTransactionHistory';
import Stakes from './Stakes';
import Transactions from './Transactions';
import { FilterOptions } from './types';

const TABS = ['My stake', 'Transaction history'] as const;
const BASE_ADDRESS_FILTER = {
  label: 'All addresses',
  value: '',
};

const MyCommunityStake = () => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    selectedAddress: BASE_ADDRESS_FILTER,
  });
  const user = useUserStore();

  const ADDRESS_FILTERS = [
    BASE_ADDRESS_FILTER,
    ...[...new Set(user.addresses.map((x) => x.address))].map((address) => ({
      label: formatAddressShort(address, 5, 6),
      value: address,
    })),
  ];

  const possibleAddresses = ADDRESS_FILTERS.filter((a) => a.value !== '').map(
    (a) => a.value,
  );

  let addressFilter = [filterOptions.selectedAddress.value];

  if (filterOptions.selectedAddress.value === '') {
    addressFilter = possibleAddresses;
  }

  const data = useTransactionHistory({
    filterOptions,
    addressFilter,
  });

  if (!user.isLoggedIn) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <section className="MyCommunityStake">
        <CWText type="h2" className="header">
          My Community Stake
        </CWText>

        {!(data?.length > 0) ? (
          <NoTransactionHistory />
        ) : (
          <>
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
                  options={ADDRESS_FILTERS}
                  value={filterOptions.selectedAddress}
                  onChange={(option) =>
                    setFilterOptions((filters) => ({
                      ...filters,
                      selectedAddress: option,
                    }))
                  }
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
              <Stakes transactions={data || []} />
            ) : (
              <Transactions transactions={data || []} />
            )}
          </>
        )}
      </section>
    </CWPageLayout>
  );
};

export { MyCommunityStake };
