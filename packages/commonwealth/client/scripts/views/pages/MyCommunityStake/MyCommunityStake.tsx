import useTransactionHistory from 'client/scripts/hooks/useTransactionHistory';
import { formatAddressShort } from 'helpers';
import { getCommunityStakeSymbol } from 'helpers/stakes';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React, { useState } from 'react';
import app from 'state';
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
  const { isLoggedIn } = useUserLoggedIn();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchText: '',
    selectedAddress: BASE_ADDRESS_FILTER,
  });

  const ADDRESS_FILTERS = [
    BASE_ADDRESS_FILTER,
    ...[...new Set((app?.user?.addresses || []).map((x) => x.address))].map(
      (address) => ({
        label: formatAddressShort(address, 5, 6),
        value: address,
      }),
    ),
  ];

  const possibleAddresses = ADDRESS_FILTERS.filter((a) => a.value !== '').map(
    (a) => a.value,
  );

  // @ts-expect-error <StrictNullChecks/>
  let addressFilter = [filterOptions.selectedAddress.value];
  // @ts-expect-error <StrictNullChecks/>
  if (filterOptions.selectedAddress.value === '') {
    addressFilter = possibleAddresses;
  }

  const data = useTransactionHistory({
    filterOptions,
    addressFilter,
  });
  const updatedData = data.map((info) => {
    info.chain = getCommunityStakeSymbol(
      app.config.chains.getById(info.community.id)?.ChainNode?.name || '',
    );
    return info;
  });

  if (!isLoggedIn) return <PageNotFound />;
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
                    // @ts-expect-error <StrictNullChecks/>
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
              // @ts-expect-error <StrictNullChecks/>
              <Stakes transactions={updatedData} />
            ) : (
              // @ts-expect-error <StrictNullChecks/>
              <Transactions transactions={updatedData} />
            )}
          </>
        )}
      </section>
    </CWPageLayout>
  );
};

export { MyCommunityStake };
