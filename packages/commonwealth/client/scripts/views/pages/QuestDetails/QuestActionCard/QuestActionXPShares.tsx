import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import { roundDecimalsOrReturnWhole } from 'client/scripts/helpers/number';
import useUserStore from 'client/scripts/state/ui/user';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import {
  doesActionRequireRewardShare,
  doesActionRewardShareForReferrer,
  QuestAction,
} from 'helpers/quest';
import React from 'react';
import { actionCopies } from './helpers';

type QuestActionXpSharesProps = {
  questAction: QuestAction;
};

const QuestActionXpShares = ({ questAction }: QuestActionXpSharesProps) => {
  const rewardAmount = questAction.reward_amount;
  const isRepeatableQuest =
    questAction?.participation_limit === QuestParticipationLimit.OncePerPeriod;

  const creatorXP = {
    percentage: roundDecimalsOrReturnWhole(
      questAction.creator_reward_weight * 100,
      2,
    ),
    value: questAction.creator_reward_weight * rewardAmount,
  };

  const user = useUserStore();
  const isUserReferred = !!user.referredByAddress;

  const hideShareSplit =
    doesActionRewardShareForReferrer(questAction.event_name) && !isUserReferred;
  const hasCreatorShare = doesActionRequireRewardShare(questAction.event_name);

  if (hideShareSplit) return <></>;

  return (
    hasCreatorShare &&
    creatorXP.percentage > 0 && (
      <CWText type="caption" className="xp-shares">
        <span className="creator-share">
          {creatorXP.percentage}% (
          {roundDecimalsOrReturnWhole(creatorXP.value, 2)} Aura)
        </span>
        &nbsp; shared with {actionCopies.shares[questAction.event_name]}. Your
        share = {Math.abs(rewardAmount - creatorXP.value)} Aura
        {isRepeatableQuest ? ` / attempt` : ''}
      </CWText>
    )
  );
};

export default QuestActionXpShares;
