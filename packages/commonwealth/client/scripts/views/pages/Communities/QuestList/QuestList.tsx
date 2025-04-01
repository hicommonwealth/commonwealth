import clsx from 'clsx';
import {
  calculateTotalXPForQuestActions,
  isQuestActionComplete,
  QuestAction,
  XPLog,
} from 'helpers/quest';
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

type QuestListProps = {
  minQuests?: number;
  questsForCommunityId?: string;
  hideHeader?: boolean;
};

const QuestList = ({
  minQuests = 8,
  questsForCommunityId,
  hideHeader,
}: QuestListProps) => {
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
    ...(questsForCommunityId && {
      community_id: questsForCommunityId,
    }),
    cursor: 1,
    limit: minQuests,
    end_after: moment().startOf('week').toDate(),
    // dont show system quests in quest lists for communities
    include_system_quests: questsForCommunityId ? false : !user.isLoggedIn,
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

  const handleCTAClick = (questId: number, communityId?: string) => {
    navigate(`/quests/${questId}`, {}, communityId || null);
  };

  const handleLeaderboardClick = () => {
    navigate('/leaderboard', {}, null);
  };

  if (!xpEnabled || (isLoadingXPProgression && user.isLoggedIn)) return <></>;

  return (
    <div className="QuestList">
      {!hideHeader && <CWText type="h2">Quests</CWText>}
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : quests.length === 0 ? (
        <div
          className={clsx('empty-placeholder', {
            'my-16': xpEnabled,
          })}
        >
          <CWText type="h2" className="empty-quests" isCentered>
            No quests found
          </CWText>
        </div>
      ) : (
        <div className="list">
          {(quests || []).map((quest) => {
            const totalUserXP = calculateTotalXPForQuestActions({
              questActions: (quest.action_metas as QuestAction[]) || [],
              isUserReferred: !!user.referredByAddress,
              questStartDate: new Date(quest.start_date),
              questEndDate: new Date(quest.end_date),
            });

            return (
              <QuestCard
                key={quest.name}
                name={quest.name}
                description={quest.description}
                communityId={quest.community_id || ''}
                iconURL={quest.image_url}
                xpPoints={totalUserXP}
                tasks={{
                  total: quest.action_metas?.length || 0,
                  completed: (quest.action_metas || [])
                    .map((action) =>
                      isQuestActionComplete(
                        action as QuestAction,
                        xpProgressions as unknown as XPLog[],
                      ),
                    )
                    .filter(Boolean).length,
                }}
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
