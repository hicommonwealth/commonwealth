import { Role } from '@hicommonwealth/shared';
import app from 'state';
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

const isCommunityMember = (communityId = app.activeChainId()) => {
  if (!communityId) {
    return false;
  }
  return userStore
    .getState()
    .addresses.some(({ community }) => community.id === communityId);
};

const isCommunityRole = (adminOrMod: Role, communityId?: string) => {
  const chainInfo = communityId
    ? app.config.chains.getById(communityId)
    : app.chain?.meta;
  if (!chainInfo) return false;
  return userStore.getState().addresses.some(({ community, address }) => {
    return (
      community.id === chainInfo.id &&
      chainInfo.adminsAndMods.some(
        (role) => role.address === address && role.role === adminOrMod,
      )
    );
  });
};

const isCommunityAdmin = (communityId?: string) => {
  return isCommunityRole('admin', communityId);
};

const isCommunityModerator = (communityId?: string) => {
  return isCommunityRole('moderator', communityId);
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

export default {
  isSiteAdmin,
  isCommunityMember,
  isCommunityAdmin,
  isCommunityModerator,
  isThreadCollaborator,
  isThreadAuthor,
  ROLES,
};
