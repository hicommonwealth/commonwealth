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
  // FIXME this could ALSO be the problem and probbably is the issue...
  input: z.object({}),
  output: CommentSubscription.array(),
};

export const GetThreadSubscriptions = {
  // FIXME: this is probably the issue with GetThreadSubscriptions...
  input: z.object({}),
  output: ThreadSubscription.array(),
};
