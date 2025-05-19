import { PollView } from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';

export const getPollTimestamp = (
  poll: z.infer<typeof PollView> & { custom_duration?: string },
  pollingEnded: boolean,
) => {
  if (
    (!poll.ends_at || !moment(poll.ends_at).isValid()) &&
    (poll.custom_duration === 'Infinite' || !poll.custom_duration)
  ) {
    return 'No end date';
  }
  let end = poll.ends_at ?? poll.custom_duration;
  return pollingEnded
    ? `Ended ${moment(end).format('lll')}`
    : `${moment().from(end).replace(' ago', '')} left`;
};
