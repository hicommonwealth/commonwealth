import { ForumActionsEnum } from '@hicommonwealth/schemas';
import app from 'state';
import { UseForumActionGatedResponse } from '../hooks/useForumActionGated';
import Account from '../models/Account';
import Thread from '../models/Thread';
import { userStore } from '../state/ui/user';

const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

const isSiteAdmin = () => {
  return (
    (userStore.getState().activeAccount ||
      userStore.getState().addresses?.length > 0) &&
    userStore.getState().isSiteAdmin
  );
};

const isCommunityMember = (communityId?: string) => {
  return (
    app.roles.getAllRolesInCommunity({
      community: communityId || app.activeChainId(),
    }).length > 0
  );
};

const isCommunityAdmin = (account?: Account, communityId?: string) => {
  return (
    (userStore.getState().activeAccount ||
      userStore.getState().addresses?.length > 0) &&
    app.roles.isRoleOfCommunity({
      role: ROLES.ADMIN,
      community: communityId || app.activeChainId(),
      ...(account && { account }),
    })
  );
};

const isCommunityModerator = (account?: Account, communityId?: string) => {
  return (
    (userStore.getState().activeAccount ||
      userStore.getState().addresses?.length > 0) &&
    app.roles.isRoleOfCommunity({
      role: ROLES.MODERATOR,
      community: communityId || app.activeChainId(),
      ...(account && { account }),
    })
  );
};

const isThreadCollaborator = (thread: Thread) => {
  return (
    // @ts-expect-error StrictNullChecks
    thread?.collaborators?.filter((c) => {
      return (
        c?.address === userStore.getState().activeAccount?.address &&
        c?.community_id === userStore.getState().activeAccount?.community.id
      );
    })?.length > 0
  );
};

const isThreadAuthor = (thread: Thread) => {
  return (
    userStore.getState().activeAccount?.address === thread?.author &&
    userStore.getState().activeAccount?.community.id === thread?.authorCommunity
  );
};

type AllowedPermissions = {
  canCreateThread: boolean;
  canCreateComment: boolean;
  canReactToThread: boolean;
  canReactToComment: boolean;
  canUpdatePoll: boolean;
};

// The idea here is that we pass in the response from useForumActionGated. This returns a map of
// topic_id -> allowed permissions. If the topic_id is not included then all permissions are valid (true)
export const canPerformAction = (
  allowedActions: UseForumActionGatedResponse,
  isAdmin: boolean,
  topicId?: number,
): AllowedPermissions => {
  const allowedActionsForTopic = allowedActions.get(topicId ?? 0);
  if (isAdmin || !topicId || !allowedActionsForTopic) {
    return {
      canCreateThread: true,
      canCreateComment: true,
      canReactToThread: true,
      canReactToComment: true,
      canUpdatePoll: true,
    };
  }

  return {
    canCreateThread: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_THREAD,
    ),
    canCreateComment: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_COMMENT,
    ),
    canReactToThread: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_THREAD_REACTION,
    ),
    canReactToComment: allowedActionsForTopic.includes(
      ForumActionsEnum.CREATE_COMMENT_REACTION,
    ),
    canUpdatePoll: allowedActionsForTopic.includes(
      ForumActionsEnum.UPDATE_POLL,
    ),
  };
};

export default {
  isSiteAdmin,
  isCommunityMember,
  isCommunityAdmin,
  isCommunityModerator,
  isThreadCollaborator,
  isThreadAuthor,
  ROLES,
};
