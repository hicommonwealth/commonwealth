import { GatedActionEnum } from '@hicommonwealth/schemas';
import { TOPIC_PERMISSIONS, TopicPermissions } from './constants';
import { GroupTopicPermissionEnum } from './index.types';

export const convertAccumulatedPermissionsToGranularPermissions = (
  permission: GroupTopicPermissionEnum,
): GatedActionEnum[] => {
  const basePermissions = [
    GatedActionEnum.CREATE_COMMENT_REACTION,
    GatedActionEnum.CREATE_THREAD_REACTION,
  ];

  switch (permission) {
    case GroupTopicPermissionEnum.UPVOTE:
      return basePermissions;
    case GroupTopicPermissionEnum.UPVOTE_AND_COMMENT:
      return [...basePermissions, GatedActionEnum.CREATE_COMMENT];
    case GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST:
      return [
        ...basePermissions,
        GatedActionEnum.CREATE_COMMENT,
        GatedActionEnum.CREATE_THREAD,
      ];
    default:
      return [];
  }
};

export const convertGranularPermissionsToAccumulatedPermissions = (
  permissions: GatedActionEnum[],
): TopicPermissions => {
  const hasThread = permissions.includes(GatedActionEnum.CREATE_THREAD);
  const hasComment = permissions.includes(GatedActionEnum.CREATE_COMMENT);
  const hasThreadReaction = permissions.includes(
    GatedActionEnum.CREATE_THREAD_REACTION,
  );
  const hasCommentReaction = permissions.includes(
    GatedActionEnum.CREATE_COMMENT_REACTION,
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
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.NONE];
  }
};

export const isPermissionGuard = (
  value: GatedActionEnum,
): value is GatedActionEnum => {
  return [
    GatedActionEnum.CREATE_COMMENT_REACTION,
    GatedActionEnum.CREATE_THREAD_REACTION,
    GatedActionEnum.CREATE_COMMENT,
    GatedActionEnum.CREATE_THREAD,
    GatedActionEnum.UPDATE_POLL,
  ].includes(value);
};
