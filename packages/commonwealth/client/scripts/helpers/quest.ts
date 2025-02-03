import { QuestParticipationPeriod } from '@hicommonwealth/schemas';
import moment from 'moment';

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

  if (isEnded) {
    return `Ended
    ${moment(endDate).format('DD/MM/YYYY')}`;
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
      ? `${startHoursRemaining} hours`
      : `${startDaysRemaining} day${startDaysRemaining > 1 ? 's' : ''}`
  }`;
};

export const questParticipationPeriodToCopyMap = {
  [QuestParticipationPeriod.Daily]: 'day',
  [QuestParticipationPeriod.Weekly]: 'week',
  [QuestParticipationPeriod.Monthly]: 'month',
};
