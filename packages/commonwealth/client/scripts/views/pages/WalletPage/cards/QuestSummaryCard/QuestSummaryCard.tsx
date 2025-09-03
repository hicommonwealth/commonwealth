import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import { Link } from 'node_modules/react-router-dom/dist';
import React, { useState } from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
import useGetXPsRanked from 'state/api/user/getXPsRanked';
import useUserStore from 'state/ui/user';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import RewardsCard from '../../RewardsCard';
import QuestCardCompact from './QuestCardCompact';
import './QuestSummaryCard.scss';

export enum QuestTimeline {
  Active = 'Active',
  Past = 'Past',
}

const QuestSummaryCard = () => {
  const navigate = useCommonNavigate();
  const [activeTab, setActiveTab] = useState<QuestTimeline>(
    QuestTimeline.Active,
  );
  const xpEnabled = useFlag('xp');
  const user = useUserStore();

  // Get user's XP rank
  const { data: userRankData } = useGetXPsRanked({
    user_id: user.id,
    limit: 1,
    enabled: xpEnabled && !!user.id,
  });

  const userRank = userRankData?.pages?.[0]?.results?.[0]?.rank;

  const {
    data: onGoingQuestsList,
    isInitialLoading: isInitialLoadingOnGoingQuestsList,
  } = useFetchQuestsQuery({
    cursor: 1,
    limit: 2,
    end_after: moment().startOf('week').toDate(),
    // only show system quests in non-auth state
    include_system_quests: true,
    enabled: xpEnabled,
  });

  const {
    data: endedQuestsList,
    isInitialLoading: isInitialLoadingEndedQuestsList,
  } = useFetchQuestsQuery({
    cursor: 1,
    limit: 2,
    end_before: moment().startOf('week').toDate(),
    // only show system quests in non-auth state
    include_system_quests: true,
    enabled: xpEnabled,
  });

  const handleSeeAllClick = () => {
    navigate('/explore?tab=quests');
  };

  const handleCTAClick = (questId: number, communityId?: string | null) => {
    navigate(`/quests/${questId}`, {}, communityId);
  };

  const isLoading =
    isInitialLoadingOnGoingQuestsList || isInitialLoadingEndedQuestsList;
  const isShowingActiveQuests = activeTab === QuestTimeline.Active;
  const questList = isShowingActiveQuests
    ? (onGoingQuestsList?.pages || []).flatMap((page) => page.results)
    : (endedQuestsList?.pages || []).flatMap((page) => page.results);

  if (!xpEnabled) return <></>;

  return (
    <RewardsCard
      title="Quests"
      description="Aura and tokens earned from your contests, bounties, and posted threads."
      icon="trophy"
      onSeeAllClick={handleSeeAllClick}
    >
      <div className="QuestSummaryCard">
        <div className="xp-body">
          <CWText type="caption">
            <strong>{`${user.xpPoints || 0}`} Aura</strong>&nbsp;earned from
            quests
          </CWText>
          {userRank && (
            <CWText type="caption">
              You are&nbsp;<strong>{userRank}</strong>&nbsp;on the&nbsp;
              <Link rel="noreferrer" to="/leaderboard">
                leaderboard
              </Link>
            </CWText>
          )}
        </div>
        <CWTabsRow>
          {Object.values(QuestTimeline).map((type) => (
            <CWTab
              key={type}
              label={type}
              isSelected={activeTab === type}
              onClick={() => setActiveTab(type)}
            />
          ))}
        </CWTabsRow>
        {isLoading ? (
          <CWCircleMultiplySpinner />
        ) : (
          <div className="list">
            {questList.map((quest) => {
              return (
                <QuestCardCompact
                  key={quest.id}
                  communityIdOrIsGlobal={quest.community_id || true}
                  endDate={quest.end_date}
                  imageURL={quest.image_url}
                  isActive={isShowingActiveQuests}
                  name={quest.name}
                  onCTAClick={() =>
                    handleCTAClick(quest.id, quest.community_id)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </RewardsCard>
  );
};

export default QuestSummaryCard;
