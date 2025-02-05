import { EventNames, QuestActionMeta } from '@hicommonwealth/schemas';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { z } from 'zod';
import { QuestAction } from '../../CreateQuest/CreateQuestForm/QuestActionSubForm';
import { doesActionRequireCreatorReward } from '../../CreateQuest/CreateQuestForm/QuestActionSubForm/helpers';
import './QuestActionCard.scss';

const actionCopies = {
  title: {
    [EventNames.SignUpFlowCompleted]: 'Signup on Common',
    [EventNames.CommunityCreated]: 'Create a community',
    [EventNames.CommunityJoined]: 'Join a community',
    [EventNames.ThreadCreated]: 'Create a thread',
    [EventNames.ThreadUpvoted]: 'Upvote a thread',
    [EventNames.CommentCreated]: 'Create a comment',
    [EventNames.CommentUpvoted]: 'Upvote a comment',
    [EventNames.UserMentioned]: 'Mention a user',
  },
  shares: {
    [EventNames.SignUpFlowCompleted]: '',
    [EventNames.CommunityCreated]: 'referrer',
    [EventNames.CommunityJoined]: 'referrer',
    [EventNames.ThreadCreated]: '',
    [EventNames.ThreadUpvoted]: '',
    [EventNames.CommentCreated]: '',
    [EventNames.CommentUpvoted]: 'comment owner',
    [EventNames.UserMentioned]: '',
  },
};

type QuestActionCardProps = {
  isActionCompleted?: boolean;
  onActionStart: (actionType: QuestAction) => void;
  actionNumber: number;
  questAction: z.infer<typeof QuestActionMeta>;
  isActionInEligible?: boolean;
  inEligibilityReason?: string;
  canStartAction?: boolean;
  actionStartBlockedReason?: string;
};

const QuestActionCard = ({
  actionNumber,
  isActionInEligible,
  isActionCompleted,
  onActionStart,
  actionStartBlockedReason,
  canStartAction,
  inEligibilityReason,
  questAction,
}: QuestActionCardProps) => {
  return (
    <div className="QuestActionCard">
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
          {doesActionRequireCreatorReward(questAction.event_name) && (
            <CWText type="caption" className="xp-shares">
              <span className="creator-share">
                {questAction.creator_reward_weight}%
              </span>
              &nbsp; shared with {actionCopies.shares[questAction.event_name]}
            </CWText>
          )}
          <div className="points">
            <CWTag label={`${questAction.reward_amount} XP`} type="proposal" />
            {/* TODO: helper link here */}
          </div>
        </div>
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
              onClick={() => onActionStart(questAction.event_name)}
              disabled={!canStartAction}
            />,
            actionStartBlockedReason || '',
            !canStartAction,
          )
        )}
      </div>
    </div>
  );
};

export default QuestActionCard;
