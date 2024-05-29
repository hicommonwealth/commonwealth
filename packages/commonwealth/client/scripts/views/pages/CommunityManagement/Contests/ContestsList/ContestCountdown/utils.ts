import { pluralize } from 'helpers';
import moment from 'moment/moment';

type CountdownStatus = 'normal' | 'warning' | 'critical';

export const calculateTimeLeft = (
  endTime: string,
  isActive: boolean,
): { label: string; status: CountdownStatus } => {
  const currentTime = moment();
  const endMoment = moment(endTime);
  const diff = moment.duration(endMoment.diff(currentTime));

  if (diff.asMilliseconds() < 0 || !isActive) {
    return { label: 'Ended', status: 'normal' };
  }

  const days = diff.days();
  const hours = diff.hours();
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (days > 0) {
    return { label: `${pluralize(days, 'day')}`, status: 'normal' };
  }

  if (hours > 2) {
    return { label: `${pluralize(hours, 'hour')}`, status: 'warning' };
  }

  if (hours > 0) {
    return {
      label: `${pluralize(hours, 'hour')}`,
      status: 'critical',
    };
  }

  if (minutes > 0) {
    return {
      label: `${pluralize(minutes, 'minute')}`,
      status: 'critical',
    };
  }

  if (seconds <= 60) {
    return {
      label: `less than minute`,
      status: 'critical',
    };
  }
};
