import { PollContext, ThreadContext } from '@hicommonwealth/schemas';
import { DEFAULT_POLL_DURATION } from '@hicommonwealth/shared';
import { z } from 'zod';
import { Poll, Vote } from '../entities/poll.schemas';
import { PG_INT } from '../utils';

export const CreatePoll = {
  input: z.object({
    thread_id: PG_INT,
    prompt: z.string(),
    options: z.array(z.string()),
    duration: PG_INT.min(1).max(31).default(DEFAULT_POLL_DURATION).nullable(), // null means infinite
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
