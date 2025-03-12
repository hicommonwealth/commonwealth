import {
  QuestActionMeta,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';

export type QuestAction = z.infer<typeof QuestActionMeta>;

export const calculateQuestTimelineLabel = ({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) => {
  const isStarted = moment().isSameOrAfter(moment(startDate));
  const isEnded = moment().isSameOrAfter(moment(endDate));
  const startHoursRemaining = moment(startDate).diff(moment(), 'hours');
  const startDaysRemaining = moment(startDate).diff(moment(), 'days');
  const endHoursRemaining = moment(endDate).diff(moment(), 'hours');
  const endDaysRemaining = moment(endDate).diff(moment(), 'days');
  const endYearsRemaining = moment(endDate).diff(moment(), 'years');

  if (isEnded) {
    return `Ended
    ${moment(endDate).format('DD/MM/YYYY')}`;
  }

  if (endYearsRemaining > 10) {
    return `Ongoing`;
  }

  if (isStarted) {
    return `Ends in
            ${
              endHoursRemaining <= 24
                ? `${endHoursRemaining} hours`
                : `${endDaysRemaining} day${endDaysRemaining ? 's' : ''}`
            }`;
  }

  // else it yet to start
  return `Starts in ${
    startHoursRemaining <= 24
      ? `${startHoursRemaining} hour${startHoursRemaining > 1 ? 's' : ''}`
      : `${startDaysRemaining} day${startDaysRemaining > 1 ? 's' : ''}`
  }`;
};

export const calculateTotalXPForQuestActions = (
  questActions: QuestAction[],
) => {
  return (
    questActions
      ?.map(
        (action) =>
          action.reward_amount -
          action.creator_reward_weight * action.reward_amount,
      )
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) || 0
  );
};

export const questParticipationPeriodToCopyMap = {
  [QuestParticipationPeriod.Daily]: 'day',
  [QuestParticipationPeriod.Weekly]: 'week',
  [QuestParticipationPeriod.Monthly]: 'month',
};
