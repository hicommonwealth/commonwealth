import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import React, { useState } from 'react';
import { useGetMembersQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import { CWAvatar } from 'views/components/component_kit/cw_avatar';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWResponsiveDialog } from 'views/components/component_kit/new_designs/CWResponsiveDialog';
import {
  CWTable,
  CWTableColumnInfo,
} from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { User } from 'views/components/user/user';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import AddJudges from './AddJudges';

import './JudgesTab.scss';

interface JudgesTabProps {
  contestAddress: string;
  judges: string[];
}

const JudgesTab = ({ contestAddress, judges }: JudgesTabProps) => {
  console.log({ judges });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  const { getContestByAddress } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const communityId = contest?.community_id || '';

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

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'name',
    initialSortDirection: APIOrderDirection.Asc,
  });

  // Query for existing judges
  const { data: members, isLoading } = useGetMembersQuery({
    community_id: communityId,
    allowedAddresses: judges.join(','),
    apiEnabled: judges.length > 0 && !!communityId,
    memberships: 'allow-specified-addresses',
  });

  console.log({ members });

  const { data: searchResults, isLoading: isSearchLoading } =
    useGetMembersQuery({
      community_id: communityId,
      search: debouncedSearchTerm,
      limit: 5,
      apiEnabled: !!communityId && debouncedSearchTerm.length > 2,
    });

  const judgeData = (members?.pages[0]?.results || []).map((member) => {
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
      (member) => !judges.includes(member.addresses[0].address),
    ) || [];

  const handleAddJudges = (newJudges: string[]) => {
    // This function would typically update the judges list via an API call
    console.log('Adding judges:', newJudges);
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
        {judges.length ? (
          <CWText type="h3" fontWeight="semiBold">
            Judges
          </CWText>
        ) : (
          <CWText>No judges nominated for this contest yet</CWText>
        )}
        <CWButton
          containerClassName="add-judge-button"
          label="Add judge"
          iconLeft="plus"
          onClick={() => setIsDialogOpen(true)}
        />
      </div>

      <CWText type="b2" className="description">
        The following judges have been nominated to vote on entries in this
        contest.
      </CWText>

      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={judgeData}
      />

      <div className="search-section">
        <CWText type="h4" fontWeight="semiBold" className="search-title">
          Search for members to add as judges
        </CWText>

        <div className="search-container">
          <CWTextInput
            fullWidth
            size="large"
            placeholder="Search members by name or address"
            iconLeft={<CWIcon iconName="search" />}
            onInput={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>

        {debouncedSearchTerm.length > 2 && (
          <div className="search-results">
            {isSearchLoading ? (
              <div className="loading-container">
                <CWCircleMultiplySpinner />
              </div>
            ) : filteredSearchResults.length > 0 ? (
              <>
                <CWText type="b2" fontWeight="medium" className="results-title">
                  Search Results
                </CWText>
                <div className="users-list">
                  {filteredSearchResults.map((member) => {
                    const address = member.addresses[0]?.address || '';

                    return (
                      <div
                        key={address}
                        className="user-item"
                        onClick={() => handleAddJudges([address])}
                      >
                        <div className="user-avatar">
                          <CWAvatar
                            size={36}
                            avatarUrl={member.avatar_url || ''}
                          />
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            <CWText>
                              {member.profile_name || 'Anonymous'}
                            </CWText>
                          </div>
                          <div className="user-address">
                            <CWText type="b2">
                              {formatAddressShort(address)}
                            </CWText>
                          </div>
                        </div>
                        <CWButton
                          label="Add"
                          buttonType="secondary"
                          buttonHeight="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="no-results">
                <CWText>No matching members found</CWText>
              </div>
            )}
          </div>
        )}
      </div>

      <CWResponsiveDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      >
        <AddJudges
          onClose={() => setIsDialogOpen(false)}
          onAddJudges={handleAddJudges}
          communityId={communityId}
          currentJudges={judges}
        />
      </CWResponsiveDialog>
    </div>
  );
};

export default JudgesTab;
