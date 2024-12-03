import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { APIOrderDirection } from 'helpers/constants';
import { Avatar } from 'views/components/Avatar';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import './LeaderboardSection.scss';

const fakeData = [
  {
    rank: 1,
    user: {
      name: 'cambell',
      avatarUrl:
        'https://assets.commonwealth.im/794bb7a3-17d7-407a-b52e-2987501221b5.png',
      userId: '128606',
      address: 'address1',
    },
    referrals: 30,
    earnings: '0.0003',
    referredBy: {
      name: 'adam',
      avatarUrl:
        'https://assets.commonwealth.im/0847e7f5-4d96-4406-8f30-c3082fa2f27c.png',
      userId: '135099',
      address: 'address2',
    },
  },
  {
    rank: 2,
    user: {
      name: 'adam',
      avatarUrl:
        'https://assets.commonwealth.im/0847e7f5-4d96-4406-8f30-c3082fa2f27c.png',
      userId: '135099',
      address: 'address2',
    },
    referrals: 20,
    earnings: '0.0002',
    referredBy: {
      name: 'cambell',
      avatarUrl:
        'https://assets.commonwealth.im/794bb7a3-17d7-407a-b52e-2987501221b5.png',
      userId: '128606',
      address: 'address1',
    },
  },
  {
    rank: 3,
    user: {
      name: 'mike',
      avatarUrl:
        'https://assets.commonwealth.im/181e25ad-ce08-427d-8d3a-d290af3be44b.png',
      userId: '158139',
      address: 'address3',
    },
    referrals: 10,
    earnings: '0.0001',
    referredBy: {},
  },
];

const columns: CWTableColumnInfo[] = [
  {
    key: 'rank',
    header: 'Rank',
    numeric: true,
    sortable: true,
  },
  {
    key: 'member',
    header: 'Member',
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
    numeric: false,
    sortable: true,
  },
  {
    key: 'referredBy',
    header: 'Referred By',
    numeric: false,
    sortable: false,
  },
];

const LeaderboardSection = () => {
  const [searchText, setSearchText] = useState('');

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'rank',
    initialSortDirection: APIOrderDirection.Asc,
  });

  const filteredData = fakeData.filter((item) =>
    item.user.name.toLowerCase().includes(searchText.toLowerCase()),
  );

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
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={filteredData.map((item) => ({
          ...item,
          member: {
            sortValue: item.user.name.toLowerCase(),
            customElement: (
              <div className="table-cell">
                <Link
                  to={`/profile/id/${item.user.userId}`}
                  className="user-info"
                >
                  <Avatar
                    url={item.user.avatarUrl ?? ''}
                    size={24}
                    address={+item.user.address}
                  />
                  <p>{item.user.name}</p>
                </Link>
              </div>
            ),
          },
          earnings: {
            sortValue: item.earnings,
            customElement: (
              <div className="table-cell">ETH {item.earnings}</div>
            ),
          },
          referredBy: {
            customElement: (
              <div className="table-cell">
                <Link
                  to={`/profile/id/${item.referredBy.userId}`}
                  className="user-info"
                >
                  <Avatar
                    url={item?.referredBy?.avatarUrl ?? ''}
                    size={24}
                    address={+(item?.referredBy?.address ?? 0)}
                  />
                  <p>{item?.referredBy?.name}</p>
                </Link>
              </div>
            ),
          },
        }))}
      />
    </div>
  );
};

export default LeaderboardSection;
