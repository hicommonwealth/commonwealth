import { useGetMembersQuery } from 'client/scripts/state/api/communities';
import { APIOrderDirection } from 'helpers/constants';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useInviteLinkModal } from 'state/ui/modals';
import { useDebounce } from 'usehooks-ts';
import { Avatar } from 'views/components/Avatar';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { fromWei } from 'web3-utils';
import { MemberResultsOrderBy } from '../index.types';

import './LeaderboardSection.scss';

const columns = [
  {
    key: 'rank',
    header: 'Rank',
    numeric: false,
    sortable: false,
  },
  {
    key: 'username',
    header: 'Username',
    numeric: false,
    sortable: true,
  },
  {
    key: 'referrals',
    header: 'Referrals',
    numeric: true,
    sortable: true,
  },
  {
    key: 'earnings',
    header: 'Earnings',
    numeric: true,
    sortable: true,
  },
];

const LeaderboardSection = () => {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchTerm = useDebounce<string>(searchText, 500);
  const communityId = app.activeChainId();
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'earnings',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const { data: members } = useGetMembersQuery({
    limit: 30,
    community_id: communityId || '',
    include_roles: true,
    order_by: 'earnings' as MemberResultsOrderBy,
    order_direction: APIOrderDirection.Desc,
    ...(debouncedSearchTerm && {
      search: debouncedSearchTerm,
    }),
  });

  const formattedMembers =
    members?.pages?.[0]?.results.map((member, index) => ({
      ...member,
      rank: {
        sortValue: index + 1,
        customElement: <div className="table-cell">{index + 1}</div>,
      },
      username: {
        sortValue: member.profile_name?.toLowerCase(),
        customElement: (
          <div className="table-cell">
            <Link to={`/profile/id/${member.user_id}`} className="user-info">
              <Avatar
                url={member.avatar_url ?? ''}
                size={24}
                address={+member.addresses[0].address}
              />
              <p>{member.profile_name}</p>
            </Link>
          </div>
        ),
      },
      referrals: {
        sortValue: member.referral_count,
        customElement: (
          <div className="table-cell text-right">{member.referral_count}</div>
        ),
      },
      earnings: {
        sortValue: Number(member.referral_eth_earnings),
        customElement: (
          <div className="table-cell text-right">
            ETH {Number(fromWei(member.referral_eth_earnings || 0, 'ether'))}
          </div>
        ),
      },
    })) || [];

  const showReferralButton = formattedMembers.length < 5;
  const hasNoMembers = formattedMembers.length === 0;

  return (
    <div className="LeaderboardSection">
      <CWTextInput
        size="large"
        fullWidth
        placeholder="Search members"
        containerClassName="search-input-container"
        inputClassName="search-input"
        iconLeft={<CWIcon iconName="search" className="search-icon" />}
        onInput={(e) => setSearchText(e.target.value?.trim())}
      />
      {hasNoMembers ? (
        <div className="empty-state">
          <CWText type="b1" className="empty-state-text">
            No referrals in this community yet. Be the first to invite new
            members!
          </CWText>
          <CWButton
            label="Share Referral Link"
            buttonHeight="sm"
            onClick={() => setIsInviteLinkModalOpen(true)}
          />
        </div>
      ) : (
        <>
          <CWTable
            columnInfo={tableState.columns}
            rowData={formattedMembers}
            sortingState={tableState.sorting}
            setSortingState={tableState.setSorting}
          />
          {showReferralButton && (
            <div className="referral-button-container">
              <CWButton
                label="Share Referral Link"
                buttonHeight="sm"
                onClick={() => setIsInviteLinkModalOpen(true)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardSection;
