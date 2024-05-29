import { z } from 'zod';
import {
  CommentSubscription,
  CommunityAlert,
  SubscriptionPreference,
  ThreadSubscription,
} from '../entities';

export const GetSubscriptionPreferences = {
  input: z.object({}),
  output: SubscriptionPreference,
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
