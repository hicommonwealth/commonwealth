import { calculateTotalXPForQuestActions, QuestAction } from 'helpers/quest';
import { useFlag } from 'hooks/useFlag';
import React from 'react';
import { useGetXPs } from 'state/api/user';
import useUserStore from 'state/ui/user';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

type TotalQuestXPTagProps = {
  questId: number;
  questStartDate: Date;
  questEndDate: Date;
  questActions: QuestAction[];
  hideGainedXp?: boolean;
};

const TotalQuestXPTag = ({
  questId,
  questActions,
  questEndDate,
  questStartDate,
  hideGainedXp = false,
}: TotalQuestXPTagProps) => {
  const user = useUserStore();
  const xpEnabled = useFlag('xp');

  const { data: xpProgressions = [] } = useGetXPs({
    user_id: user.id,
    quest_id: questId,
    enabled: user.isLoggedIn && xpEnabled && !hideGainedXp,
  });

  const gainedXP =
    xpProgressions
      .filter((p) => p.quest_id === questId)
      .map((p) => p.xp_points)
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) ||
    0;

  const isUserReferred = !!user.referredByAddress;
  // this only includes end user xp gain, creator/referrer xp is not included in this
  const { totalXpFixed, launchpadTokenTradedMultiplerAura } =
    calculateTotalXPForQuestActions({
      isUserReferred,
      questStartDate,
      questEndDate,
      questActions,
    });

  const label = (() => {
    let temp = '';
    if (!hideGainedXp && gainedXP > 0) temp += `${gainedXP} / `;
    if (totalXpFixed > 0) temp += `${totalXpFixed}`;
    if ((launchpadTokenTradedMultiplerAura || 0) > 0) {
      if (totalXpFixed > 0) temp += ` Basic + `;
      temp += `${launchpadTokenTradedMultiplerAura}x Trade`;
    }
    temp += ` Aura`;
    return temp;
  })();

  // TODO 11884: update this to hover and how what trade multipler means

  return <CWTag label={label} type="proposal" />;
};

export default TotalQuestXPTag;
