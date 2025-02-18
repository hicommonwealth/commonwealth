import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
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

  const {
    data: onGoingQuestsList,
    isInitialLoading: isInitialLoadingOnGoingQuestsList,
  } = useFetchQuestsQuery({
    cursor: 1,
    limit: 2,
    end_after: moment().startOf('week').toDate(),
    enabled: xpEnabled,
  });

  const {
    data: endedQuestsList,
    isInitialLoading: isInitialLoadingEndedQuestsList,
  } = useFetchQuestsQuery({
    cursor: 1,
    limit: 2,
    end_after: moment().startOf('week').toDate(),
    enabled: xpEnabled,
  });

  const handleSeeAllClick = () => {
    navigate('/explore');
  };

  const handleCTAClick = (questId: number, communityId?: string) => {
    navigate(
      `${communityId ? `/${communityId}` : ''}/quest/${questId}`,
      {},
      null,
    );
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
      description="XP and tokens earned from your contests, bounties, and posted threads."
      icon="trophy"
      onSeeAllClick={handleSeeAllClick}
    >
      <div className="QuestSummaryCard">
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
                    handleCTAClick(quest.id, quest.community_id || '')
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
