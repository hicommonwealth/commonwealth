import moment from 'moment';
import type Poll from '../../../models/Poll';

export const getPollTimestamp = (poll: Poll, pollingEnded: boolean) => {
  if (!poll.endsAt.isValid()) {
    return 'No end date';
  }
  return pollingEnded
    ? `Ended ${poll.endsAt?.format('lll')}`
    : `${moment().from(poll.endsAt).replace(' ago', '')} left`;
};
