import { NotificationCategories } from '@hicommonwealth/shared';
import { z } from 'zod';
import { PG_INT, zDate } from '../utils';
import { Community } from './community.schemas';
import { Thread } from './thread.schemas';
import { Address } from './user.schemas';

export const NotificationCategory = z.object({
  name: z.string().max(255),
  description: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const Subscription = z.object({
  id: PG_INT,
  subscriber_id: PG_INT,
  category_id: z.nativeEnum(NotificationCategories),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
  immediate_email: z.boolean().default(false),
  community_id: z.string().max(255).optional().nullable(),
  thread_id: PG_INT.optional().nullable(),
  comment_id: PG_INT.optional().nullable(),
  snapshot_id: z.string().max(255).optional().nullable(),
});

export const SubscriptionPreference = z.object({
  id: PG_INT,
  user_id: PG_INT,
  email_notifications_enabled: z.boolean().default(false),
  digest_email_enabled: z.boolean().default(false),
  recap_email_enabled: z.boolean().default(false),
  mobile_push_notifications_enabled: z.boolean().default(false),
  mobile_push_discussion_activity_enabled: z.boolean().default(false),
  mobile_push_admin_alerts_enabled: z.boolean().default(false),
  created_at: z.date().default(new Date()),
  updated_at: z.date().default(new Date()),
});

export const ThreadSubscription = z.object({
  id: PG_INT.optional(),
  user_id: PG_INT,
  thread_id: PG_INT,
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  Thread: Thread.pick({
    id: true,
    community_id: true,
    address_id: true,
    title: true,
    comment_count: true,
    created_at: true,
    url: true,
  })
    .merge(
      z.object({
        Community: Community.pick({
          id: true,
          name: true,
          icon_url: true,
        }),
        Address: Address.pick({
          id: true,
          user_id: true,
          address: true,
        }),
      }),
    )
    .optional(),
});

export const CommentSubscription = z.object({
  id: PG_INT.optional(),
  user_id: PG_INT,
  comment_id: PG_INT,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const CommunityAlert = z
  .object({
    user_id: PG_INT,
    community_id: z.string(),
    created_at: zDate.optional(),
    updated_at: zDate.optional(),
  })
  .merge(
    z.object({
      Community: Community.pick({
        id: true,
        name: true,
        icon_url: true,
      }).optional(),
    }),
  );
