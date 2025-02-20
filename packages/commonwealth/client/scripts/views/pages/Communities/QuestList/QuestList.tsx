import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import QuestCard from './QuestCard';
import './QuestList.scss';

type QuestListProps = {
  minQuests?: number;
  questsForCommunityId?: string;
};

const QuestList = ({ minQuests = 8, questsForCommunityId }: QuestListProps) => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');

  const {
    data: questsList,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFetchQuestsQuery({
    ...(questsForCommunityId && {
      community_id: questsForCommunityId,
    }),
    cursor: 1,
    limit: minQuests,
    end_after: moment().startOf('week').toDate(),
    enabled: xpEnabled,
  });
  const quests = (questsList?.pages || []).flatMap((page) => page.results);

  const handleFetchMoreQuests = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(console.error);
    }
  };

  const handleCTAClick = (questId: number, communityId?: string) => {
    navigate(`/quest/${questId}`, {}, communityId);
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
          <CWText type="h5" isCentered>
            No quests found
          </CWText>
        </div>
      ) : (
        <div className="list">
          {(quests || []).map((quest) => {
            const totalUserXP =
              (quest.action_metas || [])
                ?.map(
                  (action) =>
                    action.reward_amount -
                    action.creator_reward_weight * action.reward_amount,
                )
                .reduce(
                  (accumulator, currentValue) => accumulator + currentValue,
                  0,
                ) || 0;

            return (
              <QuestCard
                key={quest.name}
                name={quest.name}
                description={quest.description}
                communityId={quest.community_id || ''}
                iconURL={quest.image_url}
                xpPoints={totalUserXP}
                startDate={new Date(quest.start_date)}
                endDate={new Date(quest.end_date)}
                onCTAClick={() =>
                  handleCTAClick(quest.id, quest.community_id || '')
                }
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
