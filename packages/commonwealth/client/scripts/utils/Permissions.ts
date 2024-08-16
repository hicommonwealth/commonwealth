import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import app from 'state';
import { z } from 'zod';
import { UseForumActionGatedResponse } from '../hooks/useForumActionGated';
import Thread from '../models/Thread';
import { userStore } from '../state/ui/user';

type SelectedCommunity = Pick<
  z.infer<typeof ExtendedCommunity>,
  'adminsAndMods' | 'id'
>;

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

const isCommunityMember = (communityId = app.activeChainId()) => {
  if (!communityId) {
    return false;
  }
  return userStore
    .getState()
    .addresses.some(({ community }) => community.id === communityId);
};

const isCommunityRole = (
  adminOrMod: Role,
  selectedCommunity?: SelectedCommunity,
) => {
  const adminAndMods =
    selectedCommunity?.adminsAndMods || app.chain?.meta?.adminsAndMods; // selected or active community mods
  const communityId = selectedCommunity?.id || app.chain?.meta?.id; // selected or active community id
  if (!adminAndMods || !communityId) return false;
  return userStore.getState().addresses.some(({ community, address }) => {
    return (
      community.id === communityId &&
      (adminAndMods || []).some(
        (role) => role.address === address && role.role === adminOrMod,
      )
    );
  });
};

const isCommunityAdmin = (selectedCommunity?: SelectedCommunity) => {
  return isCommunityRole('admin', selectedCommunity);
};

const isCommunityModerator = (selectedCommunity?: SelectedCommunity) => {
  return isCommunityRole('moderator', selectedCommunity);
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
