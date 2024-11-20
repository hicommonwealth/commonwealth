import { PollContext } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { Vote } from '../entities/poll.schemas';
import { PG_INT } from '../utils';

export const CreatePollVote = {
  input: z.object({
    thread_id: PG_INT,
    pollId: z.number(),
    option: z.string(),
  }),
  output: Vote,
  context: PollContext,
};
