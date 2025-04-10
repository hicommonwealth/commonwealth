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
import TrustLevelRole from 'views/components/TrustLevelRole';

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
];

export type QuestOption = {
  value: string;
  label: string;
};

interface XPTableProps {
  hideHeader?: boolean;
  selectedQuest?: QuestOption | null;
  onQuestChange?: (quest: QuestOption | null) => void;
  searchTerm?: string;
}

const XPTable: React.FC<XPTableProps> = ({
  hideHeader = false,
  selectedQuest: externalSelectedQuest = null,
  onQuestChange,
  searchTerm = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [internalSelectedQuest, setInternalSelectedQuest] =
    useState<QuestOption | null>(null);

  // Use external or internal quest selection based on whether onQuestChange is provided
  const selectedQuest = onQuestChange
    ? externalSelectedQuest
    : internalSelectedQuest;
  const handleQuestChange = (quest: QuestOption | null) => {
    if (onQuestChange) {
      onQuestChange(quest);
    } else {
      setInternalSelectedQuest(quest);
    }
    setCurrentPage(1);
  };

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

  // Filter rankings by search term if provided
  const rankings = data
    .map((rank, index) => ({
      rank: index + 1,
      user_id: rank.user_id,
      user_profile: {
        id: rank.user_id,
        name: rank.user_name || '',
        avatar_url: rank.avatar_url || '',
        tier: rank.tier,
      },
      xp: rank.xp_points,
    }))
    .filter(
      (rank) =>
        !searchTerm ||
        rank.user_profile.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <section className="XPTable">
      {!hideHeader && (
        <div className="filters">
          <div className="quest-filter">
            <CWSelectList
              placeholder="Filter by Quest"
              value={selectedQuest}
              onChange={(option) => {
                handleQuestChange(option as QuestOption);
              }}
              options={questOptions}
              isClearable
              isSearchable
            />
          </div>
        </div>
      )}

      {!isLoading && rankings.length === 0 ? (
        <CWText type="h2" className="empty-rankings">
          No Users have earned aura yet{' '}
          {selectedQuest ? `for "${selectedQuest.label}" quest` : ''}
          {searchTerm ? ` matching "${searchTerm}"` : ''}
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
                      <p>
                        {rank.user_profile.name}
                        <TrustLevelRole
                          type="user"
                          level={rank.user_profile.tier}
                        />
                      </p>
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
