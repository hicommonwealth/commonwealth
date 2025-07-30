import { z } from 'zod';
import {
  CommentSubscription,
  CommunityAlert,
  SubscriptionPreference,
  ThreadSubscription,
  TopicSubscription,
} from '../entities';
import { PG_INT } from '../utils';

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

export const GetTopicSubscriptions = {
  input: z.object({}),
  output: TopicSubscription.array(),
};

export const GetSubscribableTopics = {
  input: z.object({}),
  output: z
    .object({
      id: PG_INT,
      name: z.string(),
      community_id: z.string(),
    })
    .array(),
};

export const GetThreadSubscriptions = {
  input: z.object({}),
  output: ThreadSubscription.array(),
};
