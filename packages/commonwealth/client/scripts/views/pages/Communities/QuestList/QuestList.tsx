import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import QuestCard from './QuestCard';
import './QuestList.scss';

const QuestList = () => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');
  const user = useUserStore();

  const {
    data: questsList,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFetchQuestsQuery({
    cursor: 1,
    limit: 8,
    end_after: moment().startOf('week').toDate(),
    enabled: xpEnabled,
  });
  const quests = (questsList?.pages || []).flatMap((page) => page.results);

  const { data: xpProgressions = [], isLoading: isLoadingXPProgression } =
    useGetXPs({
      user_id: user.id,
      from: moment().startOf('week').toDate(),
      to: moment().endOf('week').toDate(),
      enabled: user.isLoggedIn && xpEnabled,
    });

  const handleFetchMoreQuests = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(console.error);
    }
  };

  const handleCTAClick = (questId: number) => {
    navigate(`/quest/${questId}`, {}, null);
  };

  const handleLeaderboardClick = () => {
    navigate('/leaderboard');
  };

  if (!xpEnabled || isLoadingXPProgression) return <></>;

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
            const totalUserXP =
              (quest.action_metas || [])
                ?.map(
                  (action) =>
                    action.reward_amount - action.creator_reward_weight * 100,
                )
                .reduce(
                  (accumulator, currentValue) => accumulator + currentValue,
                  0,
                ) || 0;
            const actionMetaIds = (quest.action_metas || []).map((a) => a.id);

            return (
              <QuestCard
                key={quest.name}
                name={quest.name}
                description={quest.description}
                iconURL={quest.image_url}
                xpPoints={totalUserXP}
                tasks={{
                  total: quest.action_metas?.length || 0,
                  completed: xpProgressions.filter((p) =>
                    actionMetaIds.includes(p.quest_action_meta_id),
                  ).length,
                }}
                startDate={new Date(quest.start_date)}
                endDate={new Date(quest.end_date)}
                onCTAClick={() => handleCTAClick(quest.id)}
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
