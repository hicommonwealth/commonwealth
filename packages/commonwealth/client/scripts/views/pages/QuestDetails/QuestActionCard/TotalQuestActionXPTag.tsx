import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import { QuestAction } from 'helpers/quest';
import React from 'react';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

type TotalQuestActionXPTagProps = {
  questAction: QuestAction;
};

const TotalQuestActionXPTag = ({ questAction }: TotalQuestActionXPTagProps) => {
  const rewardAmount = questAction.reward_amount;
  const isRepeatableQuest =
    questAction?.participation_limit === QuestParticipationLimit.OncePerPeriod;

  const label = (() => {
    let temp = '';
    if (rewardAmount > 0) temp += `${rewardAmount}`;
    if (
      questAction.event_name === 'LaunchpadTokenTraded' &&
      questAction?.amount_multiplier
    ) {
      if (rewardAmount > 0) temp += ` Basic + `;
      temp += `${questAction.amount_multiplier}x Trade`;
    }
    temp += ` Aura`;
    if (isRepeatableQuest) temp += ` / attempt`;
    return temp;
  })();

  return <CWTag label={label} type="proposal" />;
};

export default TotalQuestActionXPTag;
