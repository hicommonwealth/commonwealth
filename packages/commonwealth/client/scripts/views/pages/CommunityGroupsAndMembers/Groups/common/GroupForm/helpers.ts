import { PermissionEnum } from '@hicommonwealth/schemas';
import { TOPIC_PERMISSIONS, TopicPermissions } from './constants';
import { GroupTopicPermissionEnum } from './index.types';

export const convertAccumulatedPermissionsToGranularPermissions = (
  permission: GroupTopicPermissionEnum,
): PermissionEnum[] => {
  const basePermissions = [
    PermissionEnum.CREATE_COMMENT_REACTION,
    PermissionEnum.CREATE_THREAD_REACTION,
  ];

  switch (permission) {
    case GroupTopicPermissionEnum.UPVOTE:
      return basePermissions;
    case GroupTopicPermissionEnum.UPVOTE_AND_COMMENT:
      return [...basePermissions, PermissionEnum.CREATE_COMMENT];
    case GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST:
      return [
        ...basePermissions,
        PermissionEnum.CREATE_COMMENT,
        PermissionEnum.CREATE_THREAD,
      ];
    default:
      return [];
  }
};

export const convertGranularPermissionsToAccumulatedPermissions = (
  permissions: PermissionEnum[],
): TopicPermissions => {
  const hasThread = permissions.includes(PermissionEnum.CREATE_THREAD);
  const hasComment = permissions.includes(PermissionEnum.CREATE_COMMENT);
  const hasThreadReaction = permissions.includes(
    PermissionEnum.CREATE_THREAD_REACTION,
  );
  const hasCommentReaction = permissions.includes(
    PermissionEnum.CREATE_COMMENT_REACTION,
  );

  const hasUpvote = hasThreadReaction || hasCommentReaction;

  if (hasUpvote && hasThread && hasComment) {
    return TOPIC_PERMISSIONS[
      GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST
    ];
  } else if (hasUpvote && hasThread) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.UPVOTE_AND_POST];
  } else if (hasUpvote && hasComment) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.UPVOTE_AND_COMMENT];
  } else if (hasThread && hasComment) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.POST_AND_COMMENT];
  } else if (hasThread) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.POST];
  } else if (hasComment) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.COMMENT];
  } else if (hasUpvote) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.UPVOTE];
  } else {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.UPVOTE];
  }
};

export const isPermissionGuard = (
  value: PermissionEnum,
): value is PermissionEnum => {
  return [
    PermissionEnum.CREATE_COMMENT_REACTION,
    PermissionEnum.CREATE_THREAD_REACTION,
    PermissionEnum.CREATE_COMMENT,
    PermissionEnum.CREATE_THREAD,
    PermissionEnum.UPDATE_POLL,
  ].includes(value);
};
