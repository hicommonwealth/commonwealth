import { PermissionEnum } from '@hicommonwealth/schemas';
import { GroupTopicPermissionEnum, PermissionLabelType } from './index.types';

export const REQUIREMENTS_TO_FULFILL = {
  ALL_REQUIREMENTS: 'ALL',
  N_REQUIREMENTS: 'N',
};

export const TOPIC_PERMISSIONS = {
  [GroupTopicPermissionEnum.UPVOTE]: 'Upvote',
  [GroupTopicPermissionEnum.COMMENT]: 'Comment',
  [GroupTopicPermissionEnum.UPVOTE_AND_COMMENT]: 'Upvote & Comment',
  [GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST]:
    'Upvote & Comment & Post',
};

export type TopicPermissions =
  (typeof TOPIC_PERMISSIONS)[keyof typeof TOPIC_PERMISSIONS];

type ReversedTopicPermissions = {
  [K in keyof typeof TOPIC_PERMISSIONS as (typeof TOPIC_PERMISSIONS)[K]]: K;
};

export const REVERSED_TOPIC_PERMISSIONS: ReversedTopicPermissions =
  Object.fromEntries(
    Object.entries(TOPIC_PERMISSIONS).map(([key, value]) => [value, key]),
  ) as ReversedTopicPermissions;

export const Permissions = PermissionEnum;

export const PermissionLabel = [
  'Create threads',
  'Create Comments',
  'Can react',
  'Use poll',
];

export const togglePermissionMap: Record<
  PermissionLabelType,
  PermissionEnum[]
> = {
  'Create threads': [PermissionEnum.CREATE_THREAD],
  'Create Comments': [PermissionEnum.CREATE_COMMENT],
  'Can react': [
    PermissionEnum.CREATE_COMMENT_REACTION,
    PermissionEnum.CREATE_THREAD_REACTION,
  ],
  'Use poll': [PermissionEnum.UPDATE_POLL],
};
