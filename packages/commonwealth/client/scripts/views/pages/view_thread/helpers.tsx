import { Poll } from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';

export const getPollTimestamp = (
  poll: z.infer<typeof Poll>,
  pollingEnded: boolean,
) => {
  if (!poll.ends_at || !moment(poll.ends_at).isValid()) {
    return 'No end date';
  }
  return pollingEnded
    ? `Ended ${moment(poll.ends_at).format('lll')}`
    : `${moment().from(poll.ends_at).replace(' ago', '')} left`;
};
