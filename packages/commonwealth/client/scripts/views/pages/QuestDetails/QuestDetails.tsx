import {
  QuestActionMeta,
  QuestParticipationLimit,
} from '@hicommonwealth/schemas';
import { questParticipationPeriodToCopyMap } from 'helpers/quest';
import { useFlag } from 'hooks/useFlag';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useGetQuestByIdQuery } from 'state/api/quest';
import { useGetRandomResourceIds, useGetXPs } from 'state/api/user';
import { useAuthModalStore } from 'state/ui/modals';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { AuthModalType } from 'views/modals/AuthModal';
import { z } from 'zod';
import { PageNotFound } from '../404';
import { QuestAction } from '../CreateQuest/QuestForm/QuestActionSubForm';
import { buildURLFromContentId } from '../CreateQuest/QuestForm/helpers';
import QuestActionCard from './QuestActionCard';
import './QuestDetails.scss';

const QuestDetails = ({ id }: { id: number }) => {
  const questId = parseInt(`${id}`) || 0;
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const xpEnabled = useFlag('xp');

  const { data: quest, isLoading } = useGetQuestByIdQuery({
    quest_id: questId,
    enabled: !!(xpEnabled && questId),
  });

  const { data: xpProgressions = [] } = useGetXPs({
    user_id: user.id,
    quest_id: questId,
    enabled: user.isLoggedIn && xpEnabled,
  });

  const { data: randomResourceIds, isLoading: isLoadingRandomResourceIds } =
    useGetRandomResourceIds({
      limit: 1,
      cursor: 1,
      enabled: true,
    });
  const randomResourceId = randomResourceIds?.results?.[0];

  const { setAuthModalType } = useAuthModalStore();

  useRunOnceOnCondition({
    callback: () => {
      if (
        quest?.community_id &&
        !window.location.pathname.includes(quest.community_id)
      ) {
        navigate(`/${quest.community_id}/quest/${quest.id}`);
      }
    },
    shouldRun: !!quest?.community_id,
  });

  if (!xpEnabled || !questId) {
    return <PageNotFound />;
  }

  if (isLoading || isLoadingRandomResourceIds) {
    return <CWCircleMultiplySpinner />;
  }

  if (!quest) {
    return <PageNotFound />;
  }

  const gainedXP =
    xpProgressions
      .filter((p) => p.quest_id === quest.id)
      .map((p) => p.xp_points)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) ||
    0;

  // this only includes end user xp gain, creator/referrer xp is not included in this
  const totalUserXP =
    (quest.action_metas || [])
      ?.map(
        (action) =>
          action.reward_amount -
          action.creator_reward_weight * action.reward_amount,
      )
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) ||
    0;

  const isCompleted = gainedXP === totalUserXP;

  const handleActionStart = (
    actionName: QuestAction,
    actionContentId?: string,
  ) => {
    switch (actionName) {
      case 'SignUpFlowCompleted': {
        !user?.isLoggedIn && setAuthModalType(AuthModalType.CreateAccount);
        break;
      }
      case 'CommunityCreated': {
        navigate(`/createCommunity`, {}, null);
        break;
      }
      case 'ThreadCreated': {
        navigate(
          `/new/discussion`,
          {},
          quest?.community_id || randomResourceId?.community_id,
        );
        break;
      }
      case 'CommunityJoined': {
        navigate(
          quest?.community_id ? '' : `/explore`,
          {},
          quest?.community_id,
        );
        break;
      }
      case 'ThreadUpvoted':
      case 'CommentCreated': {
        navigate(
          actionContentId
            ? buildURLFromContentId(
                actionContentId.split(':')[1],
                'thread',
              ).split(window.location.origin)[1]
            : `/discussion/${`${randomResourceId?.thread_id}`}`,
          {},
          null,
        );
        break;
      }
      case 'CommentUpvoted': {
        navigate(
          actionContentId
            ? buildURLFromContentId(
                actionContentId.split(':')[1],
                'comment',
              ).split(window.location.origin)[1]
            : `/discussion/${
                randomResourceId?.thread_id
              }?comment=${randomResourceId?.comment_id}`,
          {},
          null,
        );
        break;
      }
      case 'UserMentioned': {
        // TODO: user mention is not implemented in app
        break;
      }
      default:
        return;
    }
  };
  const isStarted = moment().isSameOrAfter(moment(quest.start_date));
  const isEnded = moment().isSameOrAfter(moment(quest.end_date));

  const isRepeatableQuest =
    quest.action_metas?.[0]?.participation_limit ===
    QuestParticipationLimit.OncePerPeriod;
  const questRepeatitionCycle = quest.action_metas?.[0]?.participation_period;
  const questParticipationLimitPerCycle =
    quest.action_metas?.[0]?.participation_times_per_period || 0;

  const isSiteAdmin = Permissions.isSiteAdmin();

  return (
    <CWPageLayout>
      <section className="QuestDetails">
        <CWText type="h2" className="header">
          Quest Details
        </CWText>
        <CWDivider />
        <div className="content">
          <div className="header">
            <img
              className="featured-img"
              src={quest.image_url}
              alt="featured-image"
            />
            <div className="quest-meta">
              <CWText type="h3">
                {quest.name}{' '}
                {isCompleted && <CWTag type="active" label="Completed" />}
              </CWText>
              <CWText type="b1">{quest.description}</CWText>
              <CWText className="timeline">
                From&ensp;
                {withTooltip(
                  <CWTag
                    type="group"
                    label={moment(quest.start_date).format('DD/MM/YYYY')}
                    classNames="cursor-pointer"
                  />,
                  moment(quest.start_date).toLocaleString(),
                  true,
                )}
                &ensp;to&ensp;
                {withTooltip(
                  <CWTag
                    type="group"
                    label={moment(quest.end_date).format('DD/MM/YYYY')}
                    classNames="cursor-pointer"
                  />,
                  moment(quest.end_date).toLocaleString(),
                  true,
                )}
              </CWText>
              {isRepeatableQuest && (
                <CWText className="timeline">
                  Users can participate&ensp;
                  <CWTag
                    type="group"
                    label={`${questParticipationLimitPerCycle}`}
                  />
                  &ensp;time{questParticipationLimitPerCycle > 1 ? 's' : ''}{' '}
                  every&ensp;
                  <CWTag
                    type="group"
                    label={
                      questParticipationPeriodToCopyMap[
                        questRepeatitionCycle || ''
                      ]
                    }
                  />
                </CWText>
              )}
              {isSiteAdmin && (
                <>
                  <CWDivider />
                  <div className="w-fit">
                    {withTooltip(
                      <CWButton
                        label="Update"
                        onClick={() => navigate(`/quest/${quest.id}/update`)}
                        buttonType="primary"
                        iconLeft="notePencil"
                        disabled={isStarted || isEnded}
                      />,
                      'Updates only allowed in pre-live stage',
                      isStarted || isEnded,
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <CWDivider />
          <div className="quest-actions">
            <div className="header">
              <CWText type="h4" fontWeight="semiBold">
                Complete tasks to earn XP
              </CWText>
              <CWTag
                label={`${gainedXP > 0 ? `${gainedXP} / ` : ''}${totalUserXP} XP`}
                type="proposal"
              />
            </div>
            <CWDivider />
            <div className="list">
              {(quest.action_metas || [])?.map((action, index) => (
                <QuestActionCard
                  key={action.id}
                  actionNumber={index + 1}
                  onActionStart={handleActionStart}
                  questAction={action as z.infer<typeof QuestActionMeta>}
                  isActionCompleted={
                    !!xpProgressions.find((p) => p.action_meta_id === action.id)
                  }
                  {...(user?.isLoggedIn &&
                    action.event_name === 'SignUpFlowCompleted' && {
                      isActionInEligible: true,
                      inEligibilityReason:
                        'You are already signed up with Common',
                    })}
                  canStartAction={isStarted && !isEnded}
                  {...((!isStarted || isEnded) && {
                    actionStartBlockedReason: !isStarted
                      ? 'Only available when quest starts'
                      : 'Unavailable, quest has ended',
                  })}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </CWPageLayout>
  );
};

export default QuestDetails;
