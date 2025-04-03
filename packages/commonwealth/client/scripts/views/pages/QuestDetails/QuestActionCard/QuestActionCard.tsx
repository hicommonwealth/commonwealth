import {
  QuestActionMeta,
  QuestParticipationLimit,
} from '@hicommonwealth/schemas';
import clsx from 'clsx';
import { roundDecimalsOrReturnWhole } from 'helpers/number';
import {
  doesActionRequireRewardShare,
  doesActionRewardShareForReferrer,
} from 'helpers/quest';
import React from 'react';
import useUserStore from 'state/ui/user';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { z } from 'zod';
import { QuestAction } from '../../CreateQuest/QuestForm/QuestActionSubForm';
import './QuestActionCard.scss';

const actionCopies = {
  title: {
    ['SignUpFlowCompleted']: 'Sign in to Common',
    ['CommunityCreated']: 'Create a community',
    ['CommunityJoined']: 'Join a community',
    ['ThreadCreated']: 'Create a thread',
    ['ThreadUpvoted']: 'Upvote a thread',
    ['CommentCreated']: 'Create a comment',
    ['CommentUpvoted']: 'Upvote a comment',
    ['WalletLinked']: 'Link a new wallet',
    ['SSOLinked']: 'Link a new social (SSO)',
  },
  shares: {
    ['CommunityCreated']: 'referrer',
    ['CommunityJoined']: 'referrer',
    ['ThreadCreated']: '',
    ['ThreadUpvoted']: '',
    ['CommentCreated']: '',
    ['CommentUpvoted']: 'comment creator',
    ['UserMentioned']: '',
  },
};

type QuestActionCardProps = {
  isActionCompleted?: boolean;
  onActionStart: (actionType: QuestAction, actionContentId?: string) => void;
  actionNumber: number;
  questAction: z.infer<typeof QuestActionMeta>;
  isActionInEligible?: boolean;
  xpLogsForActions?: { id: number; createdAt: Date }[];
  inEligibilityReason?: string;
  canStartAction?: boolean;
  actionStartBlockedReason?: string;
};

const QuestActionCard = ({
  actionNumber,
  isActionInEligible,
  isActionCompleted,
  xpLogsForActions,
  onActionStart,
  actionStartBlockedReason,
  canStartAction,
  inEligibilityReason,
  questAction,
}: QuestActionCardProps) => {
  const creatorXP = {
    percentage: roundDecimalsOrReturnWhole(
      questAction.creator_reward_weight * 100,
      2,
    ),
    value: questAction.creator_reward_weight * questAction.reward_amount,
  };

  const user = useUserStore();
  const isUserReferred = !!user.referredByAddress;
  const hideShareSplit =
    doesActionRewardShareForReferrer(questAction.event_name) && !isUserReferred;

  const isRepeatableQuest =
    questAction?.participation_limit === QuestParticipationLimit.OncePerPeriod;
  const questRepeatitionCycle = questAction?.participation_period;
  const questParticipationLimitPerCycle =
    questAction?.participation_times_per_period || 0;
  const attemptsLeft =
    questParticipationLimitPerCycle - (xpLogsForActions || []).length;

  return (
    <div className="QuestActionCard">
      {isRepeatableQuest && (
        <div className="header">
          <CWText type="monospace2">
            - Repeats
            {questParticipationLimitPerCycle === 1
              ? ` `
              : ` ${questParticipationLimitPerCycle} time${questParticipationLimitPerCycle > 1 ? 's ' : ''}`}
            {questRepeatitionCycle} -
          </CWText>
        </div>
      )}
      <div
        className={clsx(
          'content-container',
          isRepeatableQuest && 'isRepeatableQuest',
        )}
      >
        <div className="counter">
          <CWText type="b1" fontWeight="semiBold">
            #{actionNumber}
          </CWText>
        </div>
        <div className="content">
          <div className="left">
            <CWText type="b1" fontWeight="semiBold">
              {actionCopies.title[questAction.event_name]}
            </CWText>
            {!hideShareSplit &&
              doesActionRequireRewardShare(questAction.event_name) &&
              creatorXP.percentage > 0 && (
                <CWText type="caption" className="xp-shares">
                  <span className="creator-share">
                    {creatorXP.percentage}% (
                    {roundDecimalsOrReturnWhole(creatorXP.value, 2)} Aura)
                  </span>
                  &nbsp; shared with{' '}
                  {actionCopies.shares[questAction.event_name]}. Your share ={' '}
                  {Math.abs(questAction.reward_amount - creatorXP.value)} Aura
                  {isRepeatableQuest ? ` / attempt` : ''}
                </CWText>
              )}
            <div className="points-row">
              <CWTag
                label={`${questAction.reward_amount} Aura${isRepeatableQuest ? ` / attempt` : ''}`}
                type="proposal"
              />
              {isRepeatableQuest &&
                attemptsLeft !== 0 &&
                attemptsLeft !== questParticipationLimitPerCycle && (
                  <CWTag
                    type="group"
                    label={`${attemptsLeft}x attempt${attemptsLeft > 1 ? 's' : ''} left`}
                  />
                )}
              {questAction.instructions_link && (
                <a
                  target="_blank"
                  href={questAction.instructions_link}
                  rel="noreferrer"
                  className="action-link"
                >
                  Instructions{' '}
                  <CWIcon
                    iconName="externalLink"
                    iconSize="small"
                    weight="bold"
                  />
                </a>
              )}
            </div>
          </div>
          <div className="right">
            {isActionInEligible ? (
              withTooltip(
                <CWTag label="Not eligible" type="address" />,
                inEligibilityReason || '',
                isActionInEligible,
              )
            ) : isActionCompleted ? (
              <CWTag label="Completed" type="address" />
            ) : (
              withTooltip(
                <CWButton
                  buttonType="secondary"
                  buttonAlt="green"
                  label="Start"
                  buttonHeight="sm"
                  buttonWidth="narrow"
                  iconRight="arrowRightPhosphor"
                  onClick={() =>
                    onActionStart(
                      questAction.event_name,
                      questAction?.content_id || undefined,
                    )
                  }
                  disabled={!canStartAction}
                />,
                actionStartBlockedReason || '',
                !canStartAction,
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestActionCard;
