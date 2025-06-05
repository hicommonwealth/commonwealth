import { z } from 'zod/v4';
import {
  CommentSubscription,
  CommunityAlert,
  SubscriptionPreference,
  ThreadSubscription,
} from '../entities';

export const GetSubscriptionPreferences = {
  input: z.object({}),
  output: z.union([SubscriptionPreference, z.object({})]),
};

export const GetCommunityAlerts = {
  input: z.object({}),
  output: CommunityAlert.array(),
};

export const GetCommentSubscriptions = {
  input: z.object({}),
  output: CommentSubscription.array(),
};

export const GetThreadSubscriptions = {
  input: z.object({}),
  output: ThreadSubscription.array(),
};
