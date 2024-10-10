import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import useTopicGating from 'hooks/useTopicGating';
import React, { useMemo, useState } from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import { useDebounce } from 'usehooks-ts';
import { OptionConfig, Select } from 'views/components/Select';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPagination from 'views/components/component_kit/new_designs/CWPagination';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import MembersSection, {
  Member,
} from '../../../../Members/MembersSection/MembersSection';
import { useMemberData } from '../../../../common/useMemberData';
import { getTotalPages } from '../../helpers/index';
import './Allowlist.scss';
import {
  AllowListGroupFilters,
  AllowListProps,
  AllowListSearchFilters,
} from './index.types';

const tableColumns: (isStakedCommunity: boolean) => CWTableColumnInfo[] = (
  isStakedCommunity,
) => [
  {
    key: 'name',
    header: 'Users',
    hasCustomSortValue: true,
    numeric: false,
    sortable: true,
  },
  {
    key: 'address',
    header: 'Address',
    hasCustomSortValue: true,
    numeric: false,
    sortable: true,
  },
  {
    key: 'stakeBalance',
    header: 'Stake',
    hasCustomSortValue: true,
    numeric: true,
    sortable: true,
    hidden: !isStakedCommunity,
  },
  {
    key: 'groups',
    header: 'Groups',
    hasCustomSortValue: true,
    numeric: false,
    sortable: false,
  },
];

const baseFilterOptions = [
  { type: 'header', label: 'Filters' },
  { label: 'All community', value: 'all-community' },
  { label: 'Allowlisted', value: 'allow-specified-addresses' },
  { label: 'Not allowlisted', value: 'not-allow-specified-addresses' },
  { type: 'header-divider', label: 'Groups' },
  { label: 'All groups', value: 'in-group' },
  { label: 'Ungrouped', value: 'not-in-group' },
];

const MEMBERS_PER_PAGE = 10;

const Allowlist = ({
  allowedAddresses,
  setAllowedAddresses,
}: AllowListProps) => {
  const user = useUserStore();
  const [searchFilters, setSearchFilters] = useState<AllowListSearchFilters>({
    searchText: '',
    groupFilter: 'all-community',
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const communityId = app.activeChainId() || '';
  const { memberships } = useTopicGating({
    communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address,
  });

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });
  const isStakedCommunity = !!community?.namespace;

  const tableState = useCWTableState({
    columns: tableColumns(isStakedCommunity),
    initialSortDirection: APIOrderDirection.Desc,
  });

  const debouncedSearchTerm = useDebounce<string | undefined>(
    searchFilters.searchText,
    500,
  );

  const memoizedAddresses = useMemo(() => {
    return allowedAddresses;
    // we disable the exhaustive-deps because we don't want to refresh on changed allowedAddresses because it will
    // update the displayed list while the boxes are being checked which is a bit jarring from a UI perspective
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters]);

  const { groups, isLoadingMembers, members } = useMemberData({
    tableState,
    groupFilter: searchFilters.groupFilter,
    debouncedSearchTerm,
    memberships,
    membersPerPage: MEMBERS_PER_PAGE,
    page: currentPage,
    allowedAddresses: memoizedAddresses,
    isStakedEnabled: isStakedCommunity,
  });

  const handlePageChange = (_e, page: number) => {
    setCurrentPage(page);
  };
  const formattedMembers: Member[] = useMemo(() => {
    return (
      (members?.results?.map((p) => ({
        userId: p.user_id,
        avatarUrl: p.avatar_url,
        name: p.profile_name || DEFAULT_NAME,
        role: p.addresses[0].role,
        groups: (p.group_ids || [])
          .map(
            (groupId) =>
              (groups || []).find((group) => group.id === groupId)?.name,
          )
          .filter(Boolean)
          // @ts-expect-error StrictNullChecks
          .sort((a, b) => a.localeCompare(b)),
        stakeBalance: p.addresses[0].stake_balance,
        address: p.addresses[0].address,
      })) as Member[]) || []
    );
  }, [groups, members?.results]);

  const handleCheckboxChange = (address: string) => {
    if (allowedAddresses.includes(address)) {
      setAllowedAddresses((prevItems) =>
        prevItems.filter((item) => item !== address),
      );
    } else {
      setAllowedAddresses((prevItems) => [...prevItems, address]);
    }
  };

  const extraColumns = (member: Member) => {
    return {
      address: {
        sortValue: member.address,
        customElement: (
          <div className="table-cell">
            {/*@ts-expect-error StrictNullChecks*/}
            {formatAddressShort(member.address, 5, 6)}
          </div>
        ),
      },
    };
  };

  return (
    <section className="Allowlist">
      <div className="header-row">
        <CWText type="h4" fontWeight="semiBold">
          Allow List
        </CWText>
        <CWText type="b2">
          You can bypass the conditions and add members directly to the group
          using the table below
        </CWText>
      </div>
      <div className="header-column">
        <CWText type="h5" fontWeight="semiBold">
          Filter & Search
        </CWText>
        <Select
          options={[
            ...baseFilterOptions,
            ...(groups || []).map((group) => {
              return {
                label: group.name,
                value: group.id,
              };
            }),
          ]}
          placeholder={baseFilterOptions[1].label}
          onSelect={(option: OptionConfig) => {
            handlePageChange(null, 1);
            setSearchFilters((g) => ({
              ...g,
              groupFilter: option.value as AllowListGroupFilters,
            }));
          }}
          selected={(searchFilters.groupFilter || '').toString()}
        />
        <CWTextInput
          fullWidth={true}
          placeholder="Search members"
          iconLeft={<MagnifyingGlass size={24} weight="regular" />}
          onInput={(e) => {
            handlePageChange(null, 1);
            setSearchFilters((g) => ({
              ...g,
              searchText: e.target.value?.trim(),
            }));
          }}
        />
      </div>
      {!isLoadingMembers && formattedMembers.length === 0 ? (
        <div className="inline">
          <CWText type="b2">No search results found matching</CWText>
          &nbsp;
          <CWText type="b2" fontWeight="bold">
            {searchFilters.searchText}
          </CWText>
        </div>
      ) : (
        <>
          <MembersSection
            filteredMembers={formattedMembers}
            isLoadingMoreMembers={isLoadingMembers}
            tableState={tableState}
            extraColumns={extraColumns}
            selectedAccounts={allowedAddresses}
            handleCheckboxChange={handleCheckboxChange}
          />
          <div className="pagination-buttons">
            <CWPagination
              selectedPageProp={currentPage}
              totalCount={getTotalPages(
                members,
                allowedAddresses,
                searchFilters.groupFilter,
                MEMBERS_PER_PAGE,
              )}
              onChange={handlePageChange}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default Allowlist;
