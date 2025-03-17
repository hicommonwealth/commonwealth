import moment from 'moment/moment';

export const calculateTimeRemaining = (isoDate?: Date): string => {
  console.log(isoDate);
  const now = moment();
  const endTime = isoDate ? moment(isoDate) : moment();

  if (!isoDate || !endTime.isValid()) {
    return 'N/A';
  }

  const duration = moment.duration(endTime.diff(now));
  const totalHours = duration.asHours();

  if (totalHours <= 0) {
    const hoursAgo = Math.abs(Math.floor(totalHours));
    const daysAgo = Math.abs(Math.floor(duration.asDays()));
    if (daysAgo >= 1) {
      return `${daysAgo}d ago`;
    } else {
      return `${hoursAgo}h ago`;
    }
  } else {
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    return `${days} ${days > 1 ? 'days' : 'day'} ${hours}${hours > 1 ? 'hrs' : 'hr'} remaining`;
  }
};
