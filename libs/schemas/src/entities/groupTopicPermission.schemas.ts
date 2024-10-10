import { z } from 'zod';
import { PG_INT } from '../utils';

export enum GroupTopicPermissionEnum {
  UPVOTE = 'UPVOTE',
  UPVOTE_AND_COMMENT = 'UPVOTE_AND_COMMENT',
  UPVOTE_AND_COMMENT_AND_POST = 'UPVOTE_AND_COMMENT_AND_POST',
}

export type GroupTopicPermissionAction = keyof typeof GroupTopicPermissionEnum;

export const GroupTopicPermission = z.object({
  group_id: PG_INT,
  topic_id: PG_INT,
  allowed_actions: z.nativeEnum(GroupTopicPermissionEnum),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
