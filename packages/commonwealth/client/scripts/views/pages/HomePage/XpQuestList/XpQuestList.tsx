import { useFlag } from 'client/scripts/hooks/useFlag';
import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { useFetchQuestsQuery } from 'client/scripts/state/api/quest';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import moment from 'moment';
import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';

import XpQuestCard from '../XpQuestCard/XpQuestCard';
import './XpQuestList.scss';

interface XpQuestListProps {
  communityIdFilter?: string;
}

const XpQuestList = ({ communityIdFilter }: XpQuestListProps) => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');

  const { data: questsList, isInitialLoading } = useFetchQuestsQuery({
    cursor: 1,
    limit: 3,
    start_after: moment().startOf('day').toDate(),
    enabled: xpEnabled,
  });

  let quests = (questsList?.pages || []).flatMap((page) => page.results);

  if (communityIdFilter) {
    quests = quests.filter((quest) => quest.community_id === communityIdFilter);
  }

  const handleCTAClick = () => {
    // TODO: navigate to quest details in #10732
  };

  const handleLeaderboardClick = () => {
    navigate('/leaderboard');
  };

  if (!xpEnabled) return <></>;

  return (
    <div className="XpQuestList">
      <div className="heading-container">
        <CWText type="h2">XP Quests</CWText>
        <Link to="/explore">
          <div className="link-right">
            <CWText className="link">See all quests</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <>
        {!isInitialLoading && quests.length === 0 && (
          <CWText type="h2" className="empty-quests">
            No quests found
          </CWText>
        )}
        {isInitialLoading ? (
          <div className="content">
            <>
              <Skeleton height="300px" />
              <Skeleton height="300px" />
            </>
          </div>
        ) : (
          <div className="content">
            {quests.map((quest) => {
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

              return (
                <XpQuestCard
                  key={quest.name}
                  name={quest.name}
                  description={quest.description}
                  community_id={quest.community_id}
                  iconURL={quest.image_url}
                  xpPoints={totalUserXP}
                  startDate={new Date(quest.start_date)}
                  endDate={new Date(quest.end_date)}
                  onCTAClick={handleCTAClick}
                  onLeaderboardClick={handleLeaderboardClick}
                />
              );
            })}
          </div>
        )}
      </>
    </div>
  );
};

export default XpQuestList;
