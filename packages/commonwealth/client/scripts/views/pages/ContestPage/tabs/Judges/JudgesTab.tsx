import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import React, { useState } from 'react';
import { useGetMembersQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import Permissions from 'utils/Permissions';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import {
  CWTable,
  CWTableColumnInfo,
} from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { User } from 'views/components/user/user';
import { ManageOnchainModal } from 'views/pages/CommunityGroupsAndMembers/Members/MembersSection/ManageOnchainModal';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { isContestActive } from 'views/pages/CommunityManagement/Contests/utils';

import './JudgesTab.scss';

interface JudgesTabProps {
  contestAddress: string;
  judges: string[];
}

const JudgesTab = ({ contestAddress, judges }: JudgesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedAddressInfo, setSelectedAddressInfo] =
    useState<any>(undefined);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [optimisticJudges, setOptimisticJudges] = useState<string[]>(judges);
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  const { getContestByAddress } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const communityId = contest?.community_id || '';

  const isAdmin = Permissions.isCommunityAdmin() || Permissions.isSiteAdmin();
  const contestIsActive = contest
    ? isContestActive({
        contest: contest as unknown as Contest,
      })
    : false;

  const columns: CWTableColumnInfo[] = [
    {
      key: 'name',
      header: 'Judge',
      numeric: false,
      sortable: true,
    },
    {
      key: 'address',
      header: 'Address',
      numeric: false,
      sortable: true,
    },
  ];

  const searchResultColumns: CWTableColumnInfo[] = [
    {
      key: 'name',
      header: 'Username',
      numeric: false,
      sortable: true,
    },
    {
      key: 'address',
      header: 'Address',
      numeric: false,
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      numeric: false,
      sortable: false,
    },
  ];

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'name',
    initialSortDirection: APIOrderDirection.Asc,
  });

  const searchTableState = useCWTableState({
    columns: searchResultColumns,
    initialSortColumn: 'name',
    initialSortDirection: APIOrderDirection.Asc,
  });

  const { data: members, isLoading } = useGetMembersQuery({
    community_id: communityId,
    allowedAddresses: optimisticJudges.join(','),
    apiEnabled: optimisticJudges.length > 0 && !!communityId,
    memberships: 'allow-specified-addresses',
  });

  const { data: searchResults, isLoading: isSearchLoading } =
    useGetMembersQuery({
      community_id: communityId,
      search: debouncedSearchTerm,
      limit: 5,
      apiEnabled:
        !!communityId && debouncedSearchTerm.length > 2 && isSearchVisible,
    });

  const judgeData = (members?.pages[0]?.results || [])
    .filter((member) => optimisticJudges.includes(member.addresses[0]?.address))
    .map((member) => {
      const address = member.addresses[0]?.address || '';

      return {
        name: {
          customElement: (
            <User
              userAddress={address}
              userCommunityId={communityId}
              shouldLinkProfile={true}
              shouldShowRole={false}
              avatarSize={24}
            />
          ),
          sortValue: member.profile_name || address,
        },
        address: {
          customElement: (
            <CWTag
              label={formatAddressShort(address)}
              type="address"
              iconName="ethereum"
            />
          ),
          sortValue: address,
        },
      };
    });

  const filteredSearchResults =
    searchResults?.pages[0]?.results?.filter(
      (member) => !optimisticJudges.includes(member.addresses[0].address),
    ) || [];

  const searchResultsData = filteredSearchResults.map((member) => {
    const address = member.addresses[0]?.address || '';
    const addressInfo = member.addresses.map((addr) => ({
      id: addr.id || 0,
      community_id: communityId,
      address: addr.address,
      stake_balance: 0,
      role: 'member',
    }));

    return {
      name: {
        customElement: (
          <User
            userAddress={address}
            userCommunityId={communityId}
            shouldLinkProfile={true}
            shouldShowRole={false}
            avatarSize={24}
          />
        ),
        sortValue: member.profile_name || address,
      },
      address: {
        customElement: (
          <CWTag
            label={formatAddressShort(address)}
            type="address"
            iconName="ethereum"
          />
        ),
        sortValue: address,
      },
      action: {
        customElement: (
          <CWButton
            label="Add as judge"
            buttonType="secondary"
            buttonHeight="sm"
            onClick={() => {
              setSelectedAddressInfo(addressInfo);
              setIsRoleModalOpen(true);
            }}
          />
        ),
        sortValue: '',
      },
    };
  });

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    // Clear search when hiding
    if (isSearchVisible) {
      setSearchTerm('');
    }
  };

  if (isLoading) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="loading-container">
            <CWCircleMultiplySpinner />
          </div>
        </CWCard>
      </div>
    );
  }

  if (!judges.length) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="empty-state">
            <CWText type="h3">No Judges</CWText>
            <CWText type="b1">
              This contest does not have any judges assigned yet.
            </CWText>
          </div>
        </CWCard>
      </div>
    );
  }

  return (
    <div className="JudgesTab">
      <div className="filter-section">
        <CWText type="h3" fontWeight="semiBold">
          Judges
        </CWText>
        {isAdmin && contestIsActive && (
          <CWButton
            containerClassName="ad
            n"
            label="Add judges"
            iconLeft="plus"
            onClick={toggleSearch}
            buttonType="primary"
          />
        )}
      </div>

      {isSearchVisible && (
        <div className="search-section">
          <div className="search-container">
            <CWTextInput
              fullWidth
              size="large"
              placeholder="Search members by name or address"
              iconLeft={<CWIcon iconName="search" />}
              onInput={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              autoFocus
            />
          </div>

          <div className="search-results">
            {searchTerm.length > 0 && searchTerm.length < 3 ? (
              <div className="no-results">
                <CWText>Search term must be at least 3 characters</CWText>
              </div>
            ) : debouncedSearchTerm.length > 2 ? (
              isSearchLoading ? (
                <div className="loading-container">
                  <CWCircleMultiplySpinner />
                </div>
              ) : filteredSearchResults.length > 0 ? (
                <CWTable
                  columnInfo={searchTableState.columns}
                  sortingState={searchTableState.sorting}
                  setSortingState={searchTableState.setSorting}
                  rowData={searchResultsData}
                />
              ) : (
                <div className="no-results">
                  <CWText>No matching members found</CWText>
                </div>
              )
            ) : null}
          </div>
        </div>
      )}

      <CWText type="b2">Active judges</CWText>

      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={judgeData}
      />

      <CWModal
        size="small"
        content={
          <ManageOnchainModal
            onClose={() => {
              setIsRoleModalOpen(false);
            }}
            Addresses={selectedAddressInfo}
            refetch={() => {
              if (selectedAddressInfo && selectedAddressInfo.length > 0) {
                const newAddresses = selectedAddressInfo
                  .map((info: any) => info.address)
                  .filter((addr: string) => !optimisticJudges.includes(addr));
                if (newAddresses.length > 0) {
                  setOptimisticJudges((prev) => [...prev, ...newAddresses]);
                }
              }
              setIsRoleModalOpen(false);
              setSearchTerm('');
            }}
            chainId={communityId}
            forceJudgeTab
            contestAddress={contestAddress}
          />
        }
        onClose={() => {
          setIsRoleModalOpen(false);
        }}
        open={isRoleModalOpen}
      />
    </div>
  );
};

export default JudgesTab;

// make search by address possible
// make sure it looks good on mobile
// Refetch data after changes
