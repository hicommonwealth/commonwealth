import { GatedActionEnum } from '@hicommonwealth/schemas';
import { GroupTopicPermissionEnum, PermissionLabelType } from './index.types';

export const REQUIREMENTS_TO_FULFILL = {
  ALL_REQUIREMENTS: 'ALL',
  N_REQUIREMENTS: 'N',
};

export const TOPIC_PERMISSIONS = {
  [GroupTopicPermissionEnum.UPVOTE]: 'Upvote',
  [GroupTopicPermissionEnum.POST]: 'Post',
  [GroupTopicPermissionEnum.COMMENT]: 'Comment',
  [GroupTopicPermissionEnum.UPVOTE_AND_COMMENT]: 'Upvote & Comment',
  [GroupTopicPermissionEnum.UPVOTE_AND_POST]: 'Upvote & Post',
  [GroupTopicPermissionEnum.POST_AND_COMMENT]: 'Post & Comment',
  [GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST]:
    'Upvote & Comment & Post',
  [GroupTopicPermissionEnum.NONE]: 'No permissions set!',
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

export const Permissions = GatedActionEnum;

export const PermissionLabel = [
  'Create threads',
  'Create Comments',
  'Can react',
  'Use poll',
];

export const togglePermissionMap: Record<
  PermissionLabelType,
  GatedActionEnum[]
> = {
  'Create threads': [GatedActionEnum.CREATE_THREAD],
  'Create Comments': [GatedActionEnum.CREATE_COMMENT],
  'Can react': [
    GatedActionEnum.CREATE_COMMENT_REACTION,
    GatedActionEnum.CREATE_THREAD_REACTION,
  ],
  'Use poll': [GatedActionEnum.UPDATE_POLL],
};
