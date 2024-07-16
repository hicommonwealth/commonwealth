import { z } from 'zod';
import { Comment } from '../entities/comment.schemas';
import { Tag } from '../entities/tag.schemas';
import { Thread } from '../entities/thread.schemas';
import { Address, UserProfile } from '../entities/user.schemas';

export const GetNewProfileReq = z.object({
  profileId: z.string().optional(),
});

export const GetNewProfileResp = z.object({
  profile: UserProfile,
  totalUpvotes: z.number().int(),
  addresses: z.array(Address),
  threads: z.array(Thread),
  comments: z.array(Comment),
  commentThreads: z.array(Thread),
  isOwner: z.boolean(),
  tags: z.array(Tag),
});
