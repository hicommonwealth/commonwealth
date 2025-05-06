import { PollContext, ThreadContext } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { Poll, Vote } from '../entities/poll.schemas';
import { PG_INT } from '../utils';

export const CreatePoll = {
  input: z.object({
    thread_id: PG_INT,
    prompt: z.string(),
    options: z.array(z.string()),
    custom_duration: z
      .union([PG_INT.min(0).max(31), z.literal('Infinite')])
      .optional(),
  }),
  output: Poll,
  context: ThreadContext,
};

export const DeletePoll = {
  input: z.object({
    thread_id: PG_INT,
    poll_id: PG_INT,
  }),
  output: z.boolean(),
  context: ThreadContext,
};

export const CreatePollVote = {
  input: z.object({
    thread_id: PG_INT,
    poll_id: PG_INT,
    option: z.string(),
  }),
  output: Vote,
  context: PollContext,
};
