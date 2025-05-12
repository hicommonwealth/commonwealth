import { GroupTopicPermissionEnum } from './index.types';

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
