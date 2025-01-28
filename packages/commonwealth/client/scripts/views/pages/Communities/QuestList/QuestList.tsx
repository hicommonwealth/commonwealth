import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import QuestCard from './QuestCard';
import './QuestList.scss';

const QuestList = () => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');

  const {
    data: questsList,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFetchQuestsQuery({
    cursor: 1,
    limit: 8,
    community_id: 'dydx', // TODO: need to change this.
    enabled: xpEnabled,
  });
  const quests = (questsList?.pages || []).flatMap((page) => page.results);

  const handleFetchMoreQuests = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(console.error);
    }
  };

  const handleCTAClick = () => {
    // TODO: navigate to quest details
  };

  const handleLeaderboardClick = () => {
    navigate('/leaderboard');
  };

  if (!xpEnabled) return <></>;

  return (
    <div className="QuestList">
      <CWText type="h2">Quests</CWText>
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : quests.length === 0 ? (
        <div
          className={clsx('empty-placeholder', {
            'my-16': xpEnabled,
          })}
        >
          <CWText type="h2">No quests found</CWText>
        </div>
      ) : (
        <div className="list">
          {(quests || []).map((quest) => {
            const totalXP =
              (quest.action_metas || [])
                ?.map((action) => action.reward_amount)
                .reduce(
                  (accumulator, currentValue) => accumulator + currentValue,
                  0,
                ) || 0;

            return (
              <QuestCard
                key={quest.name}
                name={quest.name}
                description={quest.description}
                // TODO: quests should support images
                iconURL="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4dGWQgdRtlbW5aRFnN5K5pjTRSFsVWuGf7A&s"
                xpPoints={totalXP}
                endDate={new Date(quest.end_date)}
                onCTAClick={handleCTAClick}
                onLeaderboardClick={handleLeaderboardClick}
              />
            );
          })}
        </div>
      )}
      {isFetchingNextPage ? (
        <div className="m-auto">
          <CWCircleMultiplySpinner />
        </div>
      ) : hasNextPage && quests.length > 0 ? (
        <CWButton
          label="See more"
          buttonType="tertiary"
          containerClassName="ml-auto"
          onClick={handleFetchMoreQuests}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default QuestList;
