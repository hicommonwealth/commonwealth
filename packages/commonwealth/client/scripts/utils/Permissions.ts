import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import app from 'state';
import { z } from 'zod';
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

const isCommunityRole = (
  adminOrMod: Role,
  selectedCommunity?: z.infer<typeof ExtendedCommunity>,
) => {
  const communityInfo = selectedCommunity || app.chain?.meta; // selected or active community
  if (!communityInfo) return false;
  return userStore.getState().addresses.some(({ community, address }) => {
    return (
      community.id === communityInfo.id &&
      (communityInfo?.adminsAndMods || []).some(
        (role) => role.address === address && role.role === adminOrMod,
      )
    );
  });
};

const isCommunityAdmin = (
  selectedCommunity?: z.infer<typeof ExtendedCommunity>,
) => {
  return isCommunityRole('admin', selectedCommunity);
};

const isCommunityModerator = (
  selectedCommunity?: z.infer<typeof ExtendedCommunity>,
) => {
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

export default {
  isSiteAdmin,
  isCommunityMember,
  isCommunityAdmin,
  isCommunityModerator,
  isThreadCollaborator,
  isThreadAuthor,
  ROLES,
};
