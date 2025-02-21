import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { useFlag } from 'hooks/useFlag';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useGetQuestByIdQuery } from 'state/api/quest';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from '../404';
import QuestForm from '../CreateQuest/QuestForm';
import { QuestAction } from '../CreateQuest/QuestForm/QuestActionSubForm';
import { buildURLFromContentId } from '../CreateQuest/QuestForm/helpers';
import './UpdateQuest.scss';

const UpdateQuest = ({ id }: { id: number }) => {
  const questId = parseInt(`${id}`) || 0;

  const xpEnabled = useFlag('xp');

  const user = useUserStore();
  const navigate = useCommonNavigate();

  const { data: quest, isLoading: isLoadingQuest } = useGetQuestByIdQuery({
    quest_id: questId,
    enabled: !!(xpEnabled && questId),
  });

  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: quest?.community_id || '',
      enabled: !!quest?.community_id,
    });

  useRunOnceOnCondition({
    callback: () => {
      // it will be defined, adding to avoid ts errors
      if (!quest) return;

      // redirect to community quest update page if on global quest update page
      if (
        quest?.community_id &&
        !window.location.pathname.includes(quest.community_id)
      ) {
        navigate(
          `/${quest.community_id}/quests/${quest.id}/update`,
          { replace: true },
          null,
        );
        return;
      }

      // redirect to global quest update page if on community quest update page
      if (
        !quest?.community_id &&
        window.location.pathname !== `/quests/${quest.id}/update`
      ) {
        navigate(`/quests/${quest.id}/update`, { replace: true }, null);
        return;
      }
    },
    shouldRun: !!quest,
  });

  if (!user.isLoggedIn || !Permissions.isSiteAdmin()) return <PageNotFound />;

  if (isLoadingQuest || (quest?.community_id && isLoadingCommunity))
    return <CWCircleMultiplySpinner />;

  if (!quest || (quest?.community_id && !community)) return <PageNotFound />;

  const isStarted = moment().isSameOrAfter(moment(quest.start_date));
  const isEnded = moment().isSameOrAfter(moment(quest.end_date));

  const actionMeta = quest.action_metas?.[0];

  return (
    <CWPageLayout>
      <div className="UpdateQuest">
        <div className="header">
          <CWText type="h2">Update Quest</CWText>
        </div>
        {isStarted || isEnded ? (
          <>
            <CWText>Updates only allowed in pre-live stage</CWText>
            <CWButton
              label="Explore Quests"
              onClick={() => navigate('/explore')}
            />
          </>
        ) : (
          <QuestForm
            mode="update"
            questId={quest.id}
            initialValues={{
              participation_limit:
                actionMeta?.participation_limit ||
                QuestParticipationLimit.OncePerQuest,
              participation_period:
                actionMeta?.participation_period ||
                QuestParticipationPeriod.Daily,
              participation_times_per_period:
                actionMeta?.participation_times_per_period || 1,
              description: quest.description || '',
              end_date: quest.end_date,
              image: quest.image_url,
              name: quest.name,
              start_date: quest.start_date,
              ...(quest.community_id &&
                community && {
                  community: {
                    label: {
                      imageURL: community?.icon_url || '',
                      name: community.name || '',
                    },
                    value: quest.community_id,
                  },
                }),
              subForms: (quest.action_metas || [])?.map((action) => ({
                action: action.event_name as QuestAction,
                // pass creator xp value (not fractional percentage)
                creatorRewardAmount: `${Math.round(action.creator_reward_weight * action.reward_amount)}`,
                rewardAmount: `${action.reward_amount}`,
                actionLink: action.action_link,
                contentLink: action.content_id
                  ? buildURLFromContentId(
                      action.content_id.split(':')[1],
                      action.content_id.split(':')[0] as 'thread' | 'comment',
                    )
                  : action.content_id,
              })),
            }}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default UpdateQuest;
