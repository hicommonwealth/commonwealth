import z from 'zod';
import { PG_INT } from '../utils';

export const Poll = z.object({
  id: PG_INT.optional(),
  community_id: z.string(),
  thread_id: z.number(),
  prompt: z.string(),
  options: z.string(),
  ends_at: z.date().nullish(),
  created_at: z.date(),
  updated_at: z.date().nullish(),
});

export const Vote = z.object({
  id: PG_INT.optional(),
  option: z.string(),
  address: z.string(),
  author_community_id: z.string().nullish(),
  community_id: z.string(),
  created_at: z.date(),
  update_at: z.date(),
  poll_id: z.number(),
});

export const GetPoll = {
  input: z.object({
    thread_id: z.number(),
  }),
  output: Poll.array(),
};

export const CreatePoll = {
  input: z.object({
    thread_id: z.number(),
    address: z.string(),
    prompt: z.string(),
    options: z.string().array(),
    custom_duration: z.string().optional(),
  }),
  output: Poll,
};

export const DeletePoll = {
  input: z.object({
    poll_id: z.number(),
  }),
  output: z.object({}),
};

export const GetPollVote = {
  input: z.object({
    poll_id: z.number(),
  }),
  output: Vote.array(),
};

export const UpdatePollVote = {
  input: z.object({
    poll_id: z.number(),
    address: z.string(),
    option: z.string(),
  }),
  output: Vote,
};
