import z from 'zod';
import { Poll, Vote } from '../entities';
import { PG_INT } from '../utils';

export const VoteView = Vote;
export const PollView = Poll;

export const GetPolls = {
  input: z.object({
    thread_id: PG_INT,
  }),
  output: z.array(PollView),
};

export const GetPollVotes = {
  input: z.object({
    poll_id: PG_INT,
  }),
  output: z.array(VoteView),
};
