import { z } from 'zod';
import {
  Address,
  CommentSubscription,
  Community,
  CommunityAlert,
  SubscriptionPreference,
  Thread,
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

export const ThreadSubscriptionRecord = ThreadSubscription.extend({
  Thread: Thread.pick({
    id: true,
    community_id: true,
    address_id: true,
    title: true,
    comment_count: true,
    created_at: true,
    url: true,
  }).merge(
    z.object({
      Community: Community.pick({
        id: true,
        name: true,
        icon_url: true,
      }),
      Address: Address.pick({
        id: true,
        profile_id: true,
        user_id: true,
        address: true,
      }),
    }),
  ),
});

export const GetThreadSubscriptions = {
  input: z.object({}),
  output: ThreadSubscriptionRecord.array(),
};
