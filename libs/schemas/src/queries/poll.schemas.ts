import z from 'zod';
import { Poll, Vote } from '../entities';
import { PG_INT } from '../utils';

export const VoteView = Vote.omit({ poll: true }).extend({
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
});

export const PollView = Poll.omit({
  Thread: true,
  Community: true,
}).extend({
  ends_at: z.date().or(z.string()).nullish(),
  created_at: z.date().or(z.string()).nullish(),
  updated_at: z.date().or(z.string()).nullish(),
  votes: z.array(VoteView).nullish(),
});

export const GetPolls = {
  input: z
    .object({
      thread_id: PG_INT,
    })
    .describe('Get polls for a thread'),
  output: z.array(PollView),
};

export const GetPollVotes = {
  input: z
    .object({
      poll_id: PG_INT,
    })
    .describe('Get votes for a specific poll'),
  output: z.array(VoteView),
};
