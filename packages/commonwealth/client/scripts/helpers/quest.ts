import moment from 'moment';

export const calculateQuestTimelineLabel = ({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) => {
  const isStarted = moment().isSameOrAfter(moment(startDate));
  const startHoursRemaining = moment(startDate).diff(moment(), 'hours');
  const startDaysRemaining = moment(startDate).diff(moment(), 'days');
  const endHoursRemaining = moment(endDate).diff(moment(), 'hours');
  const endDaysRemaining = moment(endDate).diff(moment(), 'days');
  const questTimelineLabel = isStarted
    ? `Ends in
            ${
              endHoursRemaining <= 24
                ? `${endHoursRemaining} hours`
                : `${endDaysRemaining} day${endDaysRemaining ? 's' : ''}`
            }`
    : `Starts in ${
        startHoursRemaining <= 24
          ? `${startHoursRemaining} hours`
          : `${startDaysRemaining} day${startDaysRemaining > 1 ? 's' : ''}`
      }`;
  return questTimelineLabel;
};
