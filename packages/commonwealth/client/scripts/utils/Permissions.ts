import { ExtendedCommunity } from '@hicommonwealth/schemas';
import {
  ActionGroups,
  canUserPerformGatedAction,
  GatedActionEnum,
  getMustJoinGroupNames,
  Role,
  UserFriendlyActionMap,
} from '@hicommonwealth/shared';
import app from 'state';
import { z } from 'zod';
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

function formatGatedTooltip(
  action: GatedActionEnum,
  actionGroups: ActionGroups,
) {
  const gatingGroupNames = getMustJoinGroupNames(actionGroups, action);
  if (gatingGroupNames.length === 1) {
    return `Join ${gatingGroupNames[0]} to ${UserFriendlyActionMap[action]}`;
  } else if (gatingGroupNames.length === 2) {
    return `Join ${gatingGroupNames[0]} or ${gatingGroupNames[1]} to ${UserFriendlyActionMap[action]}`;
  } else {
    return `Join a group to unlock gated actions`;
  }
}

const allowedReturn = { allowed: true, tooltip: '' };

function checkMembershipAndAdmin(community?: SelectedCommunity) {
  // check community membership
  if (!isCommunityMember())
    return {
      allowed: false,
      tooltip: 'Join the community to create a thread',
    };

  // check admin status
  const isAdmin = isCommunityAdmin(community) || isSiteAdmin();
  if (isAdmin) return allowedReturn;
}

function checkGating(
  actionGroups: ActionGroups,
  action: GatedActionEnum,
  bypassGating = false,
) {
  // group gating checks
  if (!canUserPerformGatedAction(actionGroups, action, bypassGating))
    return {
      allowed: false,
      tooltip: formatGatedTooltip(action, actionGroups),
    };
}

function checkThreadProperties(thread: Thread) {
  if (thread.lockedAt)
    return {
      allowed: false,
      tooltip: 'Thread is locked',
    };

  if (thread.archivedAt)
    return {
      allowed: false,
      tooltip: 'Thread is archived',
    };

  if (isThreadAuthor(thread)) return allowedReturn;
}

const getCreateThreadPermission = ({
  community,
  actionGroups,
  bypassGating,
}: {
  community?: SelectedCommunity;
  actionGroups: ActionGroups;
  bypassGating: boolean;
}) => {
  const membershipAndAdminCheck = checkMembershipAndAdmin(community);
  if (membershipAndAdminCheck) return membershipAndAdminCheck;

  const gatingCheck = checkGating(
    actionGroups,
    GatedActionEnum.CREATE_THREAD,
    bypassGating,
  );
  if (gatingCheck) return gatingCheck;

  return allowedReturn;
};

const getGeneralActionPermission = ({
  action,
  thread,
  community,
  actionGroups,
  bypassGating,
}: {
  action: Exclude<GatedActionEnum, GatedActionEnum.CREATE_THREAD>;
  thread: Thread;
  community?: SelectedCommunity;
  actionGroups: ActionGroups;
  bypassGating: boolean;
}) => {
  const membershipAndAdminCheck = checkMembershipAndAdmin(community);
  if (membershipAndAdminCheck) return membershipAndAdminCheck;

  const threadPropertiesCheck = checkThreadProperties(thread);
  if (threadPropertiesCheck) return threadPropertiesCheck;

  const gatingCheck = checkGating(actionGroups, action, bypassGating);
  if (gatingCheck) return gatingCheck;

  return allowedReturn;
};

const getMultipleActionsPermission = <
  T extends readonly Exclude<GatedActionEnum, GatedActionEnum.CREATE_THREAD>[],
>({
  actions,
  thread,
  community,
  actionGroups,
  bypassGating,
}: {
  actions: T;
  thread: Thread;
  community?: SelectedCommunity;
  actionGroups: ActionGroups;
  bypassGating: boolean;
}): { [K in T[number]]: ReturnType<typeof getGeneralActionPermission> } => {
  return actions.reduce(
    (acc, action) => {
      return {
        ...acc,
        [action]: getGeneralActionPermission({
          action,
          thread,
          community,
          actionGroups,
          bypassGating,
        }),
      };
    },
    {} as { [K in T[number]]: ReturnType<typeof getGeneralActionPermission> },
  );
};

export default {
  isSiteAdmin,
  isCommunityMember,
  isCommunityAdmin,
  isCommunityModerator,
  isThreadCollaborator,
  isThreadAuthor,
  ROLES,
  getCreateThreadPermission,
  getGeneralActionPermission,
  getMultipleActionsPermission,
};
