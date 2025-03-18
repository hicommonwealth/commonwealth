import { z } from 'zod';
import { VerifiedContext } from '../context';
import {
  CommentSubscription,
  CommunityAlert,
  SubscriptionPreference,
  ThreadSubscription,
} from '../entities';
import { PG_INT } from '../utils';

export const UpdateSubscriptionPreferences = {
  input: z.object({
    id: z.number(),
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
  context: VerifiedContext,
};

export const CreateCommunityAlert = {
  input: z.object({
    id: z.number(),
    community_id: z.string(),
  }),
  output: CommunityAlert,
  context: VerifiedContext,
};

export const DeleteCommunityAlert = {
  input: z.object({
    id: z.number(),
    community_ids: z.array(z.string()),
  }),
  output: z
    .number()
    .describe('Number of community alert subscriptions deleted'),
  context: VerifiedContext,
};

export const CreateCommentSubscription = {
  input: z.object({
    id: z.number(),
    comment_id: PG_INT,
  }),
  output: CommentSubscription,
  context: VerifiedContext,
};

export const DeleteCommentSubscription = {
  input: z.object({
    id: z.number(),
    comment_ids: z.array(PG_INT),
  }),
  output: PG_INT.describe('Number of comment subscriptions deleted'),
  context: VerifiedContext,
};

export const DeleteThreadSubscription = {
  input: z.object({
    id: z.number(),
    thread_ids: z.array(PG_INT),
  }),
  output: PG_INT.describe('Number of thread subscriptions deleted'),
  context: VerifiedContext,
};

export const CreateThreadSubscription = {
  input: z.object({
    id: z.number(),
    thread_id: PG_INT,
  }),
  output: ThreadSubscription,
  context: VerifiedContext,
};

export const RegisterClientRegistrationToken = {
  input: z.object({
    id: z.number(),
    token: z.string(),
    channelType: z.enum(['APNS', 'FCM']),
  }),
  output: z.object({}),
  context: VerifiedContext,
};

export const UnregisterClientRegistrationToken = {
  input: z.object({
    id: z.number(),
    token: z.string(),
    channelType: z.enum(['APNS', 'FCM']),
  }),
  output: z.object({}),
  context: VerifiedContext,
};

export const UnsubscribeEmail = {
  input: z.object({
    user_uuid: z.string().uuid(),
    email_notifications_enabled: z.boolean(),
  }),
  output: SubscriptionPreference,
  context: VerifiedContext,
};
