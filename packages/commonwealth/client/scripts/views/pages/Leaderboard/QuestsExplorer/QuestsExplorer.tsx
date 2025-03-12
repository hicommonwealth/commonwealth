import { calculateTotalXPForQuestActions, QuestAction } from 'helpers/quest';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchQuestsQuery } from 'state/api/quest';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import ExploreCard from '../common/ExploreCard';
import './QuestsExplorer.scss';

const QuestsExplorer = () => {
  const navigate = useCommonNavigate();
  const xpEnabled = useFlag('xp');

  const { data: questsList, isInitialLoading } = useFetchQuestsQuery({
    cursor: 1,
    limit: 2,
    end_after: moment().startOf('week').toDate(),
    // dont show system quests in quest lists for communities
    include_system_quests: true,
    enabled: xpEnabled,
  });
  const quests = (questsList?.pages || []).flatMap((page) => page.results);

  const handleCTAClick = (questId: number, communityId?: string) => {
    navigate(`/quests/${questId}`, {}, communityId || null);
  };

  const handleSeeAllClick = () => {
    navigate('/explore');
  };

  return (
    <section className="QuestsExplorer">
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : (
        <>
          <div className="header">
            <CWText type="h4">Quests on Common</CWText>
            <CWButton
              label="See all"
              buttonType="tertiary"
              buttonWidth="narrow"
              buttonHeight="med"
              iconRight="arrowRight"
              type="button"
              onClick={handleSeeAllClick}
            />
          </div>
          {quests.map((quest) => {
            const totalUserXP = calculateTotalXPForQuestActions(
              (quest.action_metas as QuestAction[]) || [],
            );

            return (
              <ExploreCard
                key={quest.name}
                label={quest.name}
                description={quest.description}
                communityId={quest.community_id || ''}
                xpPoints={totalUserXP}
                featuredImgURL={quest.image_url}
                onExploreClick={() =>
                  handleCTAClick(quest.id, quest.community_id || '')
                }
              />
            );
          })}
        </>
      )}
    </section>
  );
};

export default QuestsExplorer;
