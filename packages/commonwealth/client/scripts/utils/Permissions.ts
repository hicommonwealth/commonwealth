import app from 'state';
import Account from '../models/Account';
import Thread from '../models/Thread';

const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

const isSiteAdmin = () => {
  return app.user.activeAccount && app.user.isSiteAdmin;
};

const isCommunityMember = (communityId?: string) => {
  return (
    app.roles.getAllRolesInCommunity({
      community: communityId || app.activeChainId(),
    }).length > 0
  );
};

const isCommunityAdmin = (account?: Account) => {
  return (
    app.user.activeAccount &&
    app.roles.isRoleOfCommunity({
      role: ROLES.ADMIN,
      community: app.activeChainId(),
      ...(account && { account }),
    })
  );
};

const isCommunityModerator = (account?: Account) => {
  return (
    app.user.activeAccount &&
    app.roles.isRoleOfCommunity({
      role: ROLES.MODERATOR,
      community: app.activeChainId(),
      ...(account && { account }),
    })
  );
};

const isThreadCollaborator = (thread: Thread) => {
  return (
    thread.collaborators?.filter((c) => {
      return (
        c.address === app.user.activeAccount?.address &&
        c.community_id === app.user.activeAccount?.community.id
      );
    }).length > 0
  );
};

const isThreadAuthor = (thread: Thread) => {
  return (
    app.user.activeAccount?.address === thread.author &&
    app.user.activeAccount?.community.id === thread.authorChain
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
