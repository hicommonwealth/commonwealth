import { QuestActionMeta } from '@hicommonwealth/schemas';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useFetchQuestsQuery } from 'state/api/quest';
import { Skeleton } from 'views/components/Skeleton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { z } from 'zod/v4';
import TotalQuestXPTag from '../../QuestDetails/TotalQuestXPTag';
import XpQuestCard from '../XpQuestCard/XpQuestCard';
import './XpQuestList.scss';

interface XpQuestListProps {
  communityIdFilter?: string;
}

const XpQuestList = ({ communityIdFilter }: XpQuestListProps) => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');

  const { data: questsList, isInitialLoading } = useFetchQuestsQuery({
    community_id: communityIdFilter,
    cursor: 1,
    limit: 3,
    // dont show system quests in quest lists for communities
    include_system_quests: communityIdFilter ? false : true,
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
        <CWText type="h2">Quests</CWText>
        <Link
          to={`${app.activeChainId() ? `/${app.activeChainId()}/quests` : '/explore?tab=quests'}`}
          className="see-all-link"
        >
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
              return (
                <XpQuestCard
                  key={quest.name}
                  name={quest.name}
                  description={quest.description}
                  community_id={quest.community_id}
                  iconURL={quest.image_url}
                  xpPointsElement={
                    <TotalQuestXPTag
                      questId={quest.id}
                      questStartDate={new Date(quest.start_date)}
                      questEndDate={new Date(quest.end_date)}
                      questActions={
                        (quest.action_metas as z.infer<
                          typeof QuestActionMeta
                        >[]) || []
                      }
                      hideGainedXp
                    />
                  }
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
