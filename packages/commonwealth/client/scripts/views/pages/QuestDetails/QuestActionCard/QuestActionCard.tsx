import { QuestActionMeta } from '@hicommonwealth/schemas';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { z } from 'zod';
import { QuestAction } from '../../CreateQuest/CreateQuestForm/QuestActionSubForm';
import { doesActionRequireCreatorReward } from '../../CreateQuest/CreateQuestForm/QuestActionSubForm/helpers';
import './QuestActionCard.scss';

// TODO: fix types with schemas.Events keys
const actionCopies = {
  title: {
    ['SignUpFlowCompleted']: 'Signup on Common',
    ['CommunityCreated']: 'Create a community',
    ['CommunityJoined']: 'Join a community',
    ['ThreadCreated']: 'Create a thread',
    ['ThreadUpvoted']: 'Upvote a thread',
    ['CommentCreated']: 'Create a comment',
    ['CommentUpvoted']: 'Upvote a comment',
    ['UserMentioned']: 'Mention a user',
  },
  shares: {
    ['SignUpFlowCompleted']: '',
    ['CommunityCreated']: 'referrer',
    ['CommunityJoined']: 'referrer',
    ['ThreadCreated']: '',
    ['ThreadUpvoted']: '',
    ['CommentCreated']: '',
    ['CommentUpvoted']: 'comment owner',
    ['UserMentioned']: '',
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
  const creatorXP = questAction.creator_reward_weight * 100;

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
                {creatorXP}% ({creatorXP} XP)
              </span>
              &nbsp; shared with {actionCopies.shares[questAction.event_name]}.
              Your share = {Math.abs(questAction.reward_amount - creatorXP)} XP
            </CWText>
          )}
          <div className="points-row">
            <CWTag label={`${questAction.reward_amount} XP`} type="proposal" />
            {questAction.action_link && (
              <a
                target="_blank"
                href={questAction.action_link}
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
