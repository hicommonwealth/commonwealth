import { z } from 'zod';
import {
  CommentSubscription,
  CommunityAlert,
  SubscriptionPreference,
  ThreadSubscription,
} from '../entities.schemas';
import { PG_INT } from '../utils.schemas';

export const UpdateSubscriptionPreferences = {
  input: z.object({
    email_notifications_enabled: z.boolean().optional(),
    digest_email_enabled: z.boolean().optional(),
    recap_email_enabled: z.boolean().optional(),
    mobile_push_notifications_enabled: z.boolean().optional(),
    mobile_push_discussion_activity_enabled: z.boolean().optional(),
    mobile_push_admin_alerts_enabled: z.boolean().optional(),
  }),
  // TODO: Breaks `command(...)` type in `trpc.router`
  // .refine((data) => {
  //   return Object.values(data).some((value) => value !== undefined);
  // }),
  output: SubscriptionPreference,
};

export const CreateCommunityAlert = {
  input: z.object({
    community_id: z.string(),
  }),
  output: CommunityAlert,
};

export const DeleteCommunityAlert = {
  input: z.object({
    community_ids: z.array(z.string()),
  }),
  output: z
    .number()
    .describe('Number of community alert subscriptions deleted'),
};

export const CreateCommentSubscription = {
  input: z.object({
    comment_id: PG_INT,
  }),
  output: CommentSubscription,
};

export const DeleteCommentSubscription = {
  input: z.object({
    comment_ids: z.array(PG_INT),
  }),
  output: PG_INT.describe('Number of comment subscriptions deleted'),
};

export const DeleteThreadSubscription = {
  input: z.object({
    thread_ids: z.array(PG_INT),
  }),
  output: PG_INT.describe('Number of thread subscriptions deleted'),
};

export const CreateThreadSubscription = {
  input: z.object({
    thread_id: PG_INT,
  }),
  output: ThreadSubscription,
};
