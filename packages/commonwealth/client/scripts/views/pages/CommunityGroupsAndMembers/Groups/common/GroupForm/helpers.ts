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
  if (
    permissions.includes(PermissionEnum.CREATE_COMMENT) &&
    permissions.includes(PermissionEnum.CREATE_COMMENT_REACTION) &&
    permissions.includes(PermissionEnum.CREATE_THREAD_REACTION) &&
    permissions.includes(PermissionEnum.CREATE_THREAD)
  ) {
    return TOPIC_PERMISSIONS[
      GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST
    ];
  }

  if (
    permissions.includes(PermissionEnum.CREATE_COMMENT) &&
    permissions.includes(PermissionEnum.CREATE_COMMENT_REACTION) &&
    permissions.includes(PermissionEnum.CREATE_THREAD_REACTION)
  ) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.UPVOTE_AND_COMMENT];
  }

  if (
    permissions.includes(PermissionEnum.CREATE_COMMENT_REACTION) &&
    permissions.includes(PermissionEnum.CREATE_THREAD_REACTION)
  ) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.UPVOTE];
  }

  if (permissions.includes(PermissionEnum.CREATE_COMMENT)) {
    return TOPIC_PERMISSIONS[GroupTopicPermissionEnum.COMMENT];
  }

  return TOPIC_PERMISSIONS.UPVOTE_AND_COMMENT_AND_POST;
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
