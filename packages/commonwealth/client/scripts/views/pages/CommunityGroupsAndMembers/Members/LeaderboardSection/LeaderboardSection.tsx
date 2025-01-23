import { smallNumberFormatter } from '@hicommonwealth/shared';
import { APIOrderDirection } from 'helpers/constants';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useDebounce } from 'usehooks-ts';
import { trpc } from 'utils/trpcClient';
import { Avatar } from 'views/components/Avatar';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

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

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'earnings',
    initialSortDirection: APIOrderDirection.Desc,
  });

  const { data: members } = trpc.community.getMembers.useInfiniteQuery(
    {
      limit: 30,
      community_id: communityId || '',
      include_roles: true,
      order_by: 'earnings',
      order_direction: APIOrderDirection.Desc,
      ...(debouncedSearchTerm && {
        search: debouncedSearchTerm,
      }),
    },
    {
      initialCursor: 1,
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
    },
  );

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
        sortValue: member.referral_eth_earnings,
        customElement: (
          <div className="table-cell text-right">
            ETH {smallNumberFormatter.format(member.referral_eth_earnings || 0)}
          </div>
        ),
      },
    })) || [];

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
      <CWTable
        columnInfo={tableState.columns}
        rowData={formattedMembers}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
      />
    </div>
  );
};

export default LeaderboardSection;
