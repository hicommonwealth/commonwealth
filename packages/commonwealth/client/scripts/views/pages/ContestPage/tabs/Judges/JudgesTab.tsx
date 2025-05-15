import { formatAddressShort } from 'helpers';
import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import { useGetMembersQuery } from 'state/api/communities';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWTable,
  CWTableColumnInfo,
} from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { User } from 'views/components/user/user';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import './JudgesTab.scss';

interface JudgesTabProps {
  contestAddress: string;
  judges: string[];
}

const JudgesTab = ({ contestAddress, judges }: JudgesTabProps) => {
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

  const { data: members, isLoading } = useGetMembersQuery({
    community_id: communityId,
    allowedAddresses: judges.join(','),
    apiEnabled: judges.length > 0 && !!communityId,
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

  if (isLoading) {
    return (
      <div className="JudgesTab">
        <CWCard>
          <div className="loading-container">
            <CWCircleMultiplySpinner />
            <CWText type="b1">Loading judges...</CWText>
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
      <CWText type="h3" fontWeight="semiBold">
        Judges
      </CWText>
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
    </div>
  );
};

export default JudgesTab;
