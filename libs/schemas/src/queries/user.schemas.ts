import { z } from 'zod';
import { Comment } from '../entities/comment.schemas';
import { Tag } from '../entities/tag.schemas';
import { Thread } from '../entities/thread.schemas';
import { Address, UserProfile } from '../entities/user.schemas';

export const GetNewProfileReq = z.object({
  userId: z.string().optional(),
});

export const GetNewProfileResp = z.object({
  userId: z.number(),
  profile: UserProfile,
  totalUpvotes: z.number().int(),
  addresses: z.array(Address),
  threads: z.array(Thread),
  comments: z.array(Comment),
  commentThreads: z.array(Thread),
  isOwner: z.boolean(),
  tags: z.array(Tag),
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
