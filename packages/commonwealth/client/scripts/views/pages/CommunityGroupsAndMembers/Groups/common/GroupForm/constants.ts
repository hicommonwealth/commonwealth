import { GroupTopicPermissionEnum } from '@hicommonwealth/schemas';

export const REQUIREMENTS_TO_FULFILL = {
  ALL_REQUIREMENTS: 'ALL',
  N_REQUIREMENTS: 'N',
};

export const TOPIC_PERMISSIONS = {
  [GroupTopicPermissionEnum.UPVOTE]: 'Upvote',
  [GroupTopicPermissionEnum.UPVOTE_AND_COMMENT]: 'Upvote & Comment',
  [GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST]:
    'Upvote & Comment & Post',
};

type ReversedTopicPermissions = {
  [K in keyof typeof TOPIC_PERMISSIONS as (typeof TOPIC_PERMISSIONS)[K]]: K;
};

export const REVERSED_TOPIC_PERMISSIONS: ReversedTopicPermissions =
  Object.fromEntries(
    Object.entries(TOPIC_PERMISSIONS).map(([key, value]) => [value, key]),
  ) as ReversedTopicPermissions;
