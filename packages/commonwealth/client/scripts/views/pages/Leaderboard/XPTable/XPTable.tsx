import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import { Link } from 'react-router-dom';
import { useGetXPs } from 'state/api/user';
import { Avatar } from 'views/components/Avatar';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import './XPTable.scss';

const columns: CWTableColumnInfo[] = [
  {
    key: 'rank',
    header: 'Rank',
    numeric: false,
    sortable: true,
  },
  {
    key: 'username',
    header: 'Username',
    numeric: false,
    sortable: true,
  },
  {
    key: 'xp',
    header: () => (
      <CWText className="table-header">
        <CWIcon iconName="help" iconSize="regular" /> XP
      </CWText>
    ),
    numeric: true,
    sortable: true,
  },
];

type RankProfile = {
  user_id: number;
  user_profile: {
    id: number;
    name: string;
    avatar_url: string;
  };
  xp: number;
  rank: number;
};

const XPTable = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'rank',
    initialSortDirection: APIOrderDirection.Asc,
  });

  const { data = [] } = useGetXPs({});

  const rankings = [...data]
    .map((rank) => ({
      user_id: rank.user_id || 0,
      user_profile: { id: rank.user_id || 0, ...rank.user_profile },
      xp: rank.xp_points || 0,
      rank: 0,
    }))
    .reduce((acc: RankProfile[], curr) => {
      const user = acc.find((u) => u.user_id === curr.user_id);
      if (user) {
        user.xp += curr.xp;
      } else {
        acc.push({ ...curr } as RankProfile);
      }
      return acc;
    }, []);
  rankings.sort((a, b) => b.xp - a.xp);
  rankings.forEach((user, index) => {
    user.rank = index + 1;
  });

  return (
    <section className="XPTable">
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={rankings.map((rank) => ({
          ...rank,
          username: {
            sortValue: rank.user_profile.name,
            customElement: (
              <div className="table-cell">
                <Link
                  to={`/profile/id/${rank.user_profile.id}`}
                  className="user-info"
                >
                  <Avatar
                    url={rank.user_profile.avatar_url ?? ''}
                    size={24}
                    address={rank.user_profile.id}
                  />
                  <p>{rank.user_profile.name}</p>
                </Link>
              </div>
            ),
          },
        }))}
      />
    </section>
  );
};

export default XPTable;
