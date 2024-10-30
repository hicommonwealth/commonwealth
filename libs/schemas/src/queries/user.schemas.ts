import { z } from 'zod';
import { Community } from '../entities';
import { Comment } from '../entities/comment.schemas';
import { Tags } from '../entities/tag.schemas';
import { Address, UserProfile } from '../entities/user.schemas';
import { ThreadView } from './thread.schemas';

export const GetNewProfileReq = z.object({
  userId: z.string().optional(),
});

export const GetNewProfileResp = z.object({
  userId: z.number(),
  profile: UserProfile,
  totalUpvotes: z.number().int(),
  addresses: z.array(
    Address.extend({
      Community: Community.pick({
        id: true,
        base: true,
        ss58_prefix: true,
      }),
    }),
  ),
  threads: z.array(ThreadView),
  comments: z.array(Comment),
  commentThreads: z.array(ThreadView),
  isOwner: z.boolean(),
  tags: z.array(Tags),
});

export const GetAddressProfileReq = z.object({
  addresses: z.array(z.string()),
  communities: z.array(z.string()),
});

export const GetAddressProfileResp = z.object({
  userId: z.number(),
  name: z.string(),
  address: z.string(),
  lastActive: z.date(),
  avatarUrl: z.string().optional(),
});
