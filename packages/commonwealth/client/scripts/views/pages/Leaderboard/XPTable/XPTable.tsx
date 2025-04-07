import { APIOrderDirection } from 'helpers/constants';
import { useFlag } from 'hooks/useFlag';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchQuestsQuery } from 'state/api/quest';
import useGetXPsRanked from 'state/api/user/getXPsRanked';
import { Avatar } from 'views/components/Avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';

import './XPTable.scss';

const USERS_PER_PAGE = 100;

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
    header: `Aura`,
    numeric: true,
    sortable: true,
  },
];

const XPTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuest, setSelectedQuest] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const xpEnabled = useFlag('xp');

  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'rank',
    initialSortDirection: APIOrderDirection.Asc,
  });

  const { data: questsList } = useFetchQuestsQuery({
    limit: 50,
    include_system_quests: true,
    cursor: 1,
    enabled: xpEnabled,
  });

  const quests = (questsList?.pages || []).flatMap((page) => page.results);
  const questOptions = quests.map((quest) => ({
    value: quest.id.toString(),
    label: quest.name,
  }));

  const { data = [], isLoading } = useGetXPsRanked({
    top: currentPage * USERS_PER_PAGE,
    quest_id: selectedQuest ? parseInt(selectedQuest.value) : undefined,
  });

  const rankings = data.map((rank, index) => ({
    rank: index + 1,
    user_id: rank.user_id,
    user_profile: {
      id: rank.user_id,
      name: rank.user_name || '',
      avatar_url: rank.avatar_url || '',
    },
    xp: rank.xp_points,
  }));

  return (
    <section className="XPTable">
      <div className="filters">
        <div className="quest-filter">
          <CWSelectList
            placeholder="Filter by Quest"
            value={selectedQuest}
            onChange={(option) => {
              setSelectedQuest(option as { value: string; label: string });
              setCurrentPage(1);
            }}
            options={questOptions}
            isClearable
            isSearchable
          />
        </div>
      </div>

      {!isLoading && rankings.length === 0 ? (
        <CWText type="h2" className="empty-rankings">
          No Users have earned aura yet{' '}
          {selectedQuest ? `for "${selectedQuest.label}" quest` : ''}
        </CWText>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
};

export default XPTable;
