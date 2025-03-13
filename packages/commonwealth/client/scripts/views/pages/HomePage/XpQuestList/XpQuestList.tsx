import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Link } from 'react-router-dom';
import { useFetchQuestsQuery } from 'state/api/quest';
import { Skeleton } from 'views/components/Skeleton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';

import { QuestAction, calculateTotalXPForQuestActions } from 'helpers/quest';
import app from 'state';
import useUserStore from 'state/ui/user';
import XpQuestCard from '../XpQuestCard/XpQuestCard';
import './XpQuestList.scss';

interface XpQuestListProps {
  communityIdFilter?: string;
}

const XpQuestList = ({ communityIdFilter }: XpQuestListProps) => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');
  const user = useUserStore();

  const { data: questsList, isInitialLoading } = useFetchQuestsQuery({
    community_id: communityIdFilter,
    cursor: 1,
    limit: 3,
    // dont show system quests in quest lists for communities
    include_system_quests: communityIdFilter ? false : !user.isLoggedIn,
    end_after: moment().startOf('week').toDate(),
    enabled: xpEnabled,
  });

  let quests = (questsList?.pages || []).flatMap((page) => page.results);

  if (communityIdFilter) {
    quests = quests.filter((quest) => quest.community_id === communityIdFilter);
  }

  const handleCTAClick = (questId: number) => {
    navigate(`/quests/${questId}`);
  };

  const handleLeaderboardClick = () => {
    navigate('/leaderboard', {}, null);
  };

  if (!xpEnabled) return <></>;

  return (
    <div className="XpQuestList">
      <div className="heading-container">
        <CWText type="h2">XP Quests</CWText>
        <Link to={`/${app.activeChainId()}/quests`} className="see-all-link">
          <div className="link-right">
            <CWText className="link">See all quests</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <>
        {!isInitialLoading && quests.length === 0 && (
          <CWText type="h2" className="empty-quests" isCentered>
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
              const totalUserXP = calculateTotalXPForQuestActions({
                questActions: (quest.action_metas as QuestAction[]) || [],
                isUserReferred: !!user.referredByAddress,
                questStartDate: new Date(quest.start_date),
                questEndDate: new Date(quest.end_date),
              });
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
                  onCTAClick={() => handleCTAClick(quest.id)}
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
